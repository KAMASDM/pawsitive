#!/usr/bin/env python3
"""Generate Pawppy app icons from paw-marker-green.svg."""

import os
import io
import cairosvg
from PIL import Image, ImageDraw

SVG_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "paw-marker-green.svg")
PUBLIC   = os.path.join(os.path.dirname(__file__), "..", "public")


def render_svg(size):
    """Render the SVG at 1024px then resize to target size for quality."""
    render_size = max(size, 1024)
    png_data = cairosvg.svg2png(
        url=SVG_PATH,
        output_width=render_size,
        output_height=render_size,
    )
    img = Image.open(io.BytesIO(png_data)).convert("RGBA")
    if render_size != size:
        img = img.resize((size, size), Image.LANCZOS)
    return img


def gradient_background(size):
    """Diagonal violet→indigo gradient."""
    img = Image.new("RGBA", (size, size))
    draw = ImageDraw.Draw(img)
    c1 = (124, 58, 237)   # #7c3aed violet
    c2 = (49,  46, 129)   # #312e81 indigo
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            r = int(c1[0] + (c2[0] - c1[0]) * t)
            g = int(c1[1] + (c2[1] - c1[1]) * t)
            b = int(c1[2] + (c2[2] - c1[2]) * t)
            draw.point((x, y), fill=(r, g, b, 255))
    return img


def rounded_mask(size, radius_frac=0.22):
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size - 1, size - 1], radius=int(size * radius_frac), fill=255
    )
    return mask


def generate_icon(size, out_path):
    # 1. Gradient background
    bg = gradient_background(size)

    # 2. Render SVG — give it 80% of the icon area, centred
    paw_size = int(size * 0.82)
    paw = render_svg(paw_size)

    # 3. Paste paw centred on gradient
    offset = (size - paw_size) // 2
    bg.paste(paw, (offset, offset), paw)

    # 4. Rounded corners
    bg.putalpha(rounded_mask(size))
    bg.save(out_path, "PNG", optimize=True)
    print(f"  Saved {out_path} ({size}x{size})")


if __name__ == "__main__":
    print("Generating Pawppy app icons from paw-marker-green.svg...")
    generate_icon(512, os.path.join(PUBLIC, "icon-512.png"))
    generate_icon(192, os.path.join(PUBLIC, "icon-192.png"))

    import shutil
    shutil.copy(os.path.join(PUBLIC, "icon-192.png"), os.path.join(PUBLIC, "favicon.png"))
    print("  Copied icon-192.png → favicon.png")
    print("Done!")
