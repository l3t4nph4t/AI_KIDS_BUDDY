"""
crop_auto_detect.py — Tự động tìm & tách từng phần trên nền trắng/trong suốt
Hoạt động tốt nhất với sheet có nền trắng thuần, các item tách rời nhau.

Cách dùng:
    python scripts/crop_auto_detect.py <sheet.png> <output_folder> [--prefix tên]
    python scripts/crop_auto_detect.py ui_sheet.png web/assets/vyvy/ui --prefix ui
    python scripts/crop_auto_detect.py asset_sheet.png web/assets/vyvy/items --prefix item

Tùy chọn:
    --min-size N   Bỏ qua vùng nhỏ hơn NxN pixel (mặc định 40)
    --padding N    Thêm N pixel padding quanh mỗi item (mặc định 8)
    --prefix tên   Prefix cho tên file output
    --preview      Tạo ảnh preview với bounding boxes để kiểm tra trước khi crop
"""

import sys
import os
import argparse
import numpy as np
from PIL import Image, ImageDraw

def find_content_regions(img_array, bg_threshold=250, min_size=40):
    """
    Tìm các vùng có nội dung trên nền trắng/trong suốt.
    Trả về list các (x1, y1, x2, y2).
    """
    H, W = img_array.shape[:2]

    # Tạo mask: pixel nào KHÔNG phải nền trắng/trong suốt
    if img_array.shape[2] == 4:
        # RGBA: pixel trong suốt (alpha < 30) = nền
        alpha = img_array[:, :, 3]
        rgb = img_array[:, :, :3]
        # Pixel có nội dung = alpha > 30 HOẶC không phải trắng
        content_mask = (alpha > 30) & ~(
            (rgb[:,:,0] > bg_threshold) &
            (rgb[:,:,1] > bg_threshold) &
            (rgb[:,:,2] > bg_threshold)
        )
    else:
        # RGB: pixel sáng gần trắng = nền
        r, g, b = img_array[:,:,0], img_array[:,:,1], img_array[:,:,2]
        content_mask = ~(
            (r > bg_threshold) & (g > bg_threshold) & (b > bg_threshold)
        )

    # Dùng connected components đơn giản (row/col projection)
    # Tìm hàng và cột có nội dung
    row_has_content = content_mask.any(axis=1)
    col_has_content = content_mask.any(axis=0)

    # Tìm horizontal bands (tách theo khoảng trống giữa các rows)
    def find_bands(has_content, min_gap=15):
        bands = []
        in_band = False
        start = 0
        gap_count = 0
        for i, v in enumerate(has_content):
            if v and not in_band:
                in_band = True
                start = i
                gap_count = 0
            elif v and in_band:
                gap_count = 0
            elif not v and in_band:
                gap_count += 1
                if gap_count > min_gap:
                    bands.append((start, i - gap_count))
                    in_band = False
        if in_band:
            bands.append((start, len(has_content) - 1))
        return bands

    row_bands = find_bands(row_has_content, min_gap=20)

    regions = []
    for (r1, r2) in row_bands:
        if r2 - r1 < min_size:
            continue
        # Trong mỗi horizontal band, tìm vertical bands
        row_slice = content_mask[r1:r2+1, :]
        col_content = row_slice.any(axis=0)
        col_bands = find_bands(col_content, min_gap=15)
        for (c1, c2) in col_bands:
            if c2 - c1 < min_size:
                continue
            regions.append((c1, r1, c2, r2))

    return regions


def crop_regions(input_path, output_dir, prefix="item", min_size=40,
                 padding=8, preview=False):
    if not os.path.isfile(input_path):
        print(f"❌ Không tìm thấy file: {input_path}")
        return []

    os.makedirs(output_dir, exist_ok=True)
    img = Image.open(input_path).convert("RGBA")
    W, H = img.size
    arr = np.array(img)
    print(f"📐 Ảnh gốc: {W}x{H}px")

    regions = find_content_regions(arr, min_size=min_size)
    print(f"🔍 Tìm thấy {len(regions)} vùng nội dung")

    if preview:
        preview_img = img.copy().convert("RGB")
        draw = ImageDraw.Draw(preview_img)
        for i, (x1, y1, x2, y2) in enumerate(regions):
            draw.rectangle([x1-2, y1-2, x2+2, y2+2], outline="red", width=2)
            draw.text((x1+2, y1+2), str(i+1), fill="red")
        preview_path = os.path.join(output_dir, "_preview.png")
        preview_img.save(preview_path)
        print(f"👁 Preview: {preview_path}")

    saved = []
    for i, (x1, y1, x2, y2) in enumerate(regions):
        # Thêm padding
        px1 = max(0, x1 - padding)
        py1 = max(0, y1 - padding)
        px2 = min(W, x2 + padding)
        py2 = min(H, y2 + padding)
        crop = img.crop((px1, py1, px2, py2))
        name = f"{prefix}_{i+1:02d}.png"
        out_path = os.path.join(output_dir, name)
        crop.save(out_path)
        saved.append(name)
        print(f"  ✅ {name} ({px2-px1}x{py2-py1}px)")

    print(f"\n🎉 Đã lưu {len(saved)} files → {output_dir}")
    return saved


def main():
    p = argparse.ArgumentParser(description="Auto-crop elements from a sprite sheet")
    p.add_argument("input",  help="Đường dẫn tới ảnh sheet gốc")
    p.add_argument("output", help="Thư mục output")
    p.add_argument("--prefix",   default="item", help="Prefix tên file (mặc định: item)")
    p.add_argument("--min-size", type=int, default=40, help="Kích thước tối thiểu (mặc định: 40)")
    p.add_argument("--padding",  type=int, default=8,  help="Padding quanh item (mặc định: 8)")
    p.add_argument("--preview",  action="store_true", help="Tạo ảnh preview bounding boxes")
    args = p.parse_args()

    crop_regions(
        input_path=args.input,
        output_dir=args.output,
        prefix=args.prefix,
        min_size=args.min_size,
        padding=args.padding,
        preview=args.preview,
    )

if __name__ == "__main__":
    main()
