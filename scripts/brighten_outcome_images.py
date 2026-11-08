#!/usr/bin/env python3
"""Regenerate the outcome-card PNG/WebP images from preserved original PNGs.

Requires Pillow: python -m pip install Pillow
Run from any directory:
    python scripts/brighten_outcome_images.py
    python scripts/brighten_outcome_images.py --gamma 0.85

Gamma is the exponent in output = 255 * (input / 255) ** gamma.
Values below 1 brighten shadows and midtones while preserving black and white.
The default 0.80 applies equally to all initial/outcome images and both platforms.
Use --gamma 1 to restore original pixel values. Originals are never overwritten;
repeated runs do not compound the adjustment. No cropping or resizing is applied.
"""

import argparse
import math
from pathlib import Path

from PIL import Image

IMAGE_DIR = Path(__file__).resolve().parents[1] / "images" / "outcome-tasks"
ORIGINAL_DIR = IMAGE_DIR / "originals"
IMAGE_NAMES = (
    "clearing-sofa-initial",
    "clearing-sofa-outcome",
    "ordering-table-initial",
    "ordering-table-outcome",
    "cityscape-table-initial",
    "cityscape-table-outcome",
    "relocation-counter-initial",
    "relocation-counter-outcome",
    "relocation-tvstand-initial",
    "relocation-tvstand-outcome",
)


def gamma_correct(image, gamma):
    """Apply one fixed, monotonic RGB tone curve without changing alpha."""
    if not math.isfinite(gamma) or gamma <= 0:
        raise ValueError("Gamma must be a finite positive number.")
    lut = [round(255 * (value / 255) ** gamma) for value in range(256)]
    result = image.convert("RGB").point(lut * 3)
    if "A" in image.getbands():
        result.putalpha(image.getchannel("A"))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--gamma", type=float, default=0.80,
                        help="Tone-curve exponent: below 1 brightens; 1 restores (default: 0.80).")
    parser.add_argument("--quality", type=int, default=88,
                        help="WebP quality, 1–100 (default: 88).")
    args = parser.parse_args()
    if not math.isfinite(args.gamma) or args.gamma <= 0:
        parser.error("--gamma must be a finite positive number")
    if not 1 <= args.quality <= 100:
        parser.error("--quality must be between 1 and 100")

    # Check the whole source set before writing any output. Never fall back to
    # the display images, which may already have been brightened.
    missing = [name for name in IMAGE_NAMES if not (ORIGINAL_DIR / f"{name}.png").is_file()]
    if missing:
        parser.error(f"Missing preserved originals in {ORIGINAL_DIR}: {', '.join(missing)}")

    for name in IMAGE_NAMES:
        with Image.open(ORIGINAL_DIR / f"{name}.png") as source:
            adjusted = gamma_correct(source, args.gamma)
            adjusted.save(IMAGE_DIR / f"{name}.png", optimize=True)
            adjusted.save(IMAGE_DIR / f"{name}.webp", quality=args.quality, method=6)
        print(f"Updated {name}.png / .webp (gamma={args.gamma:.2f})")


if __name__ == "__main__":
    main()
