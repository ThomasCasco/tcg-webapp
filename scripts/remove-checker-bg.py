"""
Remove the gray checker pattern that ChatGPT bakes into "transparent" PNG
exports. Detects near-grayscale pixels and converts them to actual alpha,
preserving colored or near-white content (line art and logo strokes).

Flags:
    --invert-dark   Flip dark grayscale pixels to white (use for dark-theme
                    logos where the original black stroke would disappear).
    --out <path>    Write to a different file (default: in-place).

Usage:
    python scripts/remove-checker-bg.py public/img/empty-states/*.png
    python scripts/remove-checker-bg.py --invert-dark --out public/img/logo-dark.png src.png
    python scripts/remove-checker-bg.py --out public/img/logo-light.png src.png
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def process(src: Path, dst: Path, invert_dark: bool) -> None:
    """Remove the ChatGPT-baked gray checker.

    Strategy: detect background = the most common luminance bucket among low-chroma
    pixels in the image corners. Any pixel close to that bg lum (and grayscale) →
    transparent. Anything significantly brighter or colored → keep, snap to pure
    white where appropriate to fight the dotted line-art artefact.
    """
    im = Image.open(src).convert("RGBA")
    arr = np.array(im).astype(np.int16)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    chroma = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    lum = (r + g + b) // 3

    # Sample the four corners to find the bg luminance range.
    H, W = lum.shape
    edge = 30
    samples = np.concatenate([
        lum[:edge, :edge].ravel(),
        lum[:edge, -edge:].ravel(),
        lum[-edge:, :edge].ravel(),
        lum[-edge:, -edge:].ravel(),
    ])
    bg_lum = int(np.median(samples))
    bg_lo, bg_hi = bg_lum - 35, bg_lum + 35

    is_bg = (chroma < 18) & (lum >= bg_lo) & (lum <= bg_hi)
    has_color = chroma >= 18

    # Line-art = grayscale pixels significantly *lighter* than bg
    is_white_line = (~is_bg) & (~has_color) & (lum > bg_hi + 20)
    # Letter-art = grayscale pixels significantly *darker* than bg (logo case)
    is_dark_line = (~is_bg) & (~has_color) & (lum < bg_lo - 20)

    new = np.zeros_like(arr, dtype=np.uint8)
    new[:, :, 3] = 0  # default transparent
    new[is_white_line] = [255, 255, 255, 255]
    dark_replacement = [255, 255, 255, 255] if invert_dark else [0, 0, 0, 255]
    new[is_dark_line] = dark_replacement
    # Colored: keep original RGB, opaque
    colored_mask = has_color
    new[colored_mask, :3] = arr[colored_mask, :3].astype(np.uint8)
    new[colored_mask, 3] = 255

    Image.fromarray(new, "RGBA").save(dst, optimize=True)
    print(f"  {src.name} -> {dst.name}: {im.size[0]}x{im.size[1]} (bg_lum={bg_lum}, invert={invert_dark})")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--invert-dark", action="store_true")
    parser.add_argument("--out", type=Path, default=None)
    parser.add_argument("paths", nargs="+", type=Path)
    args = parser.parse_args()

    if args.out and len(args.paths) > 1:
        print("--out requires exactly one source path", file=sys.stderr)
        sys.exit(1)

    for src in args.paths:
        if not src.exists():
            print(f"  skip {src}: not found", file=sys.stderr)
            continue
        dst = args.out if args.out else src
        process(src, dst, args.invert_dark)


if __name__ == "__main__":
    main()
