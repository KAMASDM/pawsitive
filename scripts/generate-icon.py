#!/usr/bin/env python3
"""Generate Pawppy app icons at 192x192 and 512x512."""

from PIL import Image, ImageDraw, ImageFont
import os

def draw_paw(draw, cx, cy, size, color):
    """Draw a realistic paw print (4 toes in arc + large central pad)."""
    # ── Central metacarpal pad ──────────────────────────────────────────
    pw = size * 0.48
    ph = size * 0.40
    r  = size * 0.14
    px = cx - pw / 2
    py = cy + size * 0.06
    draw.rounded_rectangle([px, py, px + pw, py + ph], radius=r, fill=color)

    # ── Toe pads — 4 in a natural arc ───────────────────────────────────
    # Sizes: inner two slightly bigger, outer two a touch smaller + lower
    toes = [
        # (dx from cx, dy from cy, rx, ry)  — ellipses
        (-size * 0.255, -size * 0.095, size * 0.088, size * 0.075),   # far-left
        (-size * 0.090, -size * 0.215, size * 0.100, size * 0.085),   # mid-left
        ( size * 0.090, -size * 0.215, size * 0.100, size * 0.085),   # mid-right
        ( size * 0.255, -size * 0.095, size * 0.088, size * 0.075),   # far-right
    ]
    for dx, dy, rx, ry in toes:
        tx = cx + dx
        ty = cy + dy
        draw.ellipse([tx - rx, ty - ry, tx + rx, ty + ry], fill=color)


def gradient_background(size):
    """Diagonal linear gradient: violet → deep indigo."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # #7c3aed (vibrant violet) → #312e81 (deep indigo)
    c1 = (124, 58, 237)
    c2 = (49,  46, 129)

    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            r = int(c1[0] + (c2[0] - c1[0]) * t)
            g = int(c1[1] + (c2[1] - c1[1]) * t)
            b = int(c1[2] + (c2[2] - c1[2]) * t)
            draw.point((x, y), fill=(r, g, b, 255))
    return img


def rounded_mask(size, radius_frac=0.22):
    """iOS-style squircle-ish rounded rectangle mask."""
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    r = int(size * radius_frac)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=255)
    return mask


def generate_icon(size, out_path):
    img = gradient_background(size)
    draw = ImageDraw.Draw(img)

    # ── Paw print — white, centred slightly above middle ────────────────
    paw_size = size * 0.54
    cx = size * 0.50
    cy = size * 0.42
    draw_paw(draw, cx, cy, paw_size, (255, 255, 255, 255))

    # ── "pawppy" wordmark ────────────────────────────────────────────────
    font_size = int(size * 0.115)
    font = None
    for path in [
        "/System/Library/Fonts/Supplemental/Futura.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/SFNSRounded.ttf",
    ]:
        if os.path.exists(path):
            try:
                font = ImageFont.truetype(path, font_size, index=0)
                break
            except Exception:
                continue
    if font is None:
        font = ImageFont.load_default()

    text = "pawppy"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    tx = (size - tw) / 2 - bbox[0]
    # Place text below paw + some padding
    ty = cy + paw_size * 0.30 + size * 0.015

    # Soft drop shadow
    draw.text((tx + 1, ty + 1), text, font=font, fill=(0, 0, 0, 55))
    draw.text((tx, ty), text, font=font, fill=(255, 255, 255, 255))

    # ── Apply rounded-corner mask ────────────────────────────────────────
    img.putalpha(rounded_mask(size, 0.22))
    img.save(out_path, "PNG", optimize=True)
    print(f"  Saved {out_path} ({size}x{size})")


if __name__ == "__main__":
    public = os.path.join(os.path.dirname(__file__), "..", "public")
    os.makedirs(public, exist_ok=True)

    print("Generating Pawppy app icons...")
    generate_icon(512, os.path.join(public, "icon-512.png"))
    generate_icon(192, os.path.join(public, "icon-192.png"))

    import shutil
    shutil.copy(os.path.join(public, "icon-192.png"), os.path.join(public, "favicon.png"))
    print("  Copied icon-192.png → favicon.png")
    print("Done!")
