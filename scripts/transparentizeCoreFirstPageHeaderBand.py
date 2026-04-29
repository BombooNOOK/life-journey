#!/usr/bin/env python3
"""
コアナンバー本文1枚目の背景 PNG について、上端帯の明るい地色を透明化し、
PdfPageFrame の帯ヘッダーが画像に隠れないようにする。

使い方:
  python3 scripts/transparentizeCoreFirstPageHeaderBand.py path/to.png
  python3 scripts/transparentizeCoreFirstPageHeaderBand.py in.png out.png
  python3 scripts/transparentizeCoreFirstPageHeaderBand.py in.png --band 0.12 --threshold 228
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def transparentize(
    in_path: Path,
    out_path: Path,
    *,
    band_ratio: float,
    threshold: int,
    min_band_px: int,
) -> tuple[int, int]:
    img = Image.open(in_path).convert("RGBA")
    w, h = img.size
    band = max(min_band_px, int(h * band_ratio))
    px = img.load()
    for y in range(min(band, h)):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                px[x, y] = (r, g, b, 0)
    img.save(out_path, "PNG")
    return band, h


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("input", type=Path, nargs="?", help="入力 PNG（省略時は必ず --out と併用しない）")
    p.add_argument("output", type=Path, nargs="?", help="出力 PNG（省略時は入力を上書き）")
    p.add_argument("--band", type=float, default=0.12, help="上端からの対象帯の高さの画像比率（既定 0.12）")
    p.add_argument("--threshold", type=int, default=232, help="この RGB 以上を地として透明化（既定 232）")
    p.add_argument("--min-band", type=int, default=120, help="帯の最小ピクセル高（既定 120）")
    args = p.parse_args()

    if args.input is None:
        p.error("入力 PNG のパスを指定してください。")

    in_path = args.input.resolve()
    out_path = (args.output or args.input).resolve()

    band, h = transparentize(
        in_path,
        out_path,
        band_ratio=args.band,
        threshold=args.threshold,
        min_band_px=args.min_band,
    )
    print(f"Wrote {out_path} (top {band}px / height {h}px, RGB>={args.threshold})")


if __name__ == "__main__":
    main()
