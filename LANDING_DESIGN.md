# Pawppy landing design

The landing page presents Pawppy as a Pet Parent Operating System through daily routines, organised records, and shared care. Its visual direction combines warm ivory, deep plum, oversized typography with italic serif accents, a custom pet portrait, and gently floating care cards.

The interactive sample supports completing and undoing tasks, filtering pets, and resetting the demo. It uses fictional pets and does not save care. The page also includes feature illustrations, an existing product screenshot, setup steps, and accessible FAQ accordions. Motion respects `prefers-reduced-motion`; the stylesheet is scoped to the landing page.

Implementation: `src/components/Landing/Landing.jsx` and `Landing.css`.

## Hero image

- Mode: built-in imagegen, single new image.
- Saved project asset: `src/assets/landing/pawppy-companions-v2.webp`.
- Delivery: imported through Vite so the build includes the image and generates a content-hashed URL for cache invalidation.
- Resolution: 1254 × 1254; approximately 121 KB, converted from the generated PNG to WebP for delivery.
- The portrait is generated artwork, not a customer photograph. Interface decorations are implemented in React/CSS.

Exact generation prompt:

> Use case: photorealistic-natural. Asset type: premium pet-care website hero portrait, square image. Create an elegant editorial studio photograph of a joyful golden retriever and a small cream-and-ginger cat sitting closely together. The golden retriever sits behind and slightly left, chest and face visible; the cat sits upright in front on the right. Both look toward the camera, calm and charming, naturally proportioned. Warm golden fur, beautifully detailed whiskers, a simple muted plum fabric collar on the dog. Seamless warm light beige studio backdrop and floor, soft sunlight from upper left, gentle grounded shadows, subtle film-like texture, restrained luxury pet-lifestyle campaign aesthetic. Animals fill the central 75% of the square, ears and heads fully visible with breathing room above, paws visible near the bottom. No people, no lettering, no logo, no watermark, no UI elements, no props, no cartoon or plastic appearance.

## Verification

Responsive review covers 320, 390, 768, 1024, and 1440 pixel widths, plus reduced motion. Existing browser tests cover landing navigation, the sample care interaction, and authenticated Today/shared-care regressions. Production build and browser test results are reported separately when run.

This visual redesign does not introduce an AI runtime or guarantee retention improvements. Evaluate signup conversion and repeat care use after release.
