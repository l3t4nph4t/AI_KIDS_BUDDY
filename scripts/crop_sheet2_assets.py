"""
crop_sheet2_assets.py — Tách từng item từ Numbered Asset Sheet (ảnh 2, có số 1-23)
Cách dùng:
    python scripts/crop_sheet2_assets.py "đường_dẫn/asset_sheet.png"
Output: web/assets/vyvy/ (vào đúng thư mục theo loại)
"""

import sys
import os
from PIL import Image

# ─── Map số thứ tự → (tên file, thư mục output, tọa độ x, y, w, h) ───────────
# Tọa độ tham chiếu trên ảnh ~1320x2200px (9 columns x nhiều rows)
# Layout: 3 cols x 8 rows với spacing đều nhau

ITEMS = {
    # ── Hàng 1: Background images (3 cột, tall) ─────
    1:  ("bg_home_study",       "backgrounds",  15,   55, 415, 310),
    2:  ("bg_learn_open_book",  "backgrounds",  450,  55, 415, 310),
    3:  ("bg_practice_notebook","backgrounds",  885,  55, 415, 310),

    # ── Hàng 2: Backgrounds + VyVy poses ────────────
    4:  ("bg_games_play_corner","backgrounds",  15,  390, 615, 310),
    5:  ("bg_reading_bedtime",  "backgrounds",  650, 390, 310, 310),
    6:  ("vyvy_waving",         "derived",      975, 380, 170, 330),
    7:  ("vyvy_clapping",       "derived",     1155, 380, 150, 330),

    # ── Hàng 3: VyVy poses ───────────────────────────
    8:  ("vyvy_thinking",       "derived",      15,  730, 300, 320),
    9:  ("vyvy_explaining",     "derived",      330, 730, 300, 320),
    10: ("vyvy_celebrate",      "derived",      645, 730, 300, 320),
    11: ("vyvy_reading_sit",    "derived",      960, 730, 300, 320),

    # ── Hàng 4: Room decoration items ───────────────
    12: ("decor_desk_lamp",     "derived",      15,  1080,240, 230),
    13: ("decor_plant",         "derived",      275, 1080,240, 230),
    14: ("decor_rug",           "derived",      535, 1080,240, 230),
    15: ("decor_bookshelf",     "derived",      790, 1080,240, 230),
    16: ("decor_frame_picture", "derived",     1050, 1080,240, 230),

    # ── Hàng 5: Pets + achievement items ────────────
    17: ("decor_puppy",         "derived",      15,  1335,240, 220),
    18: ("reward_trophy",       "derived",      275, 1335,240, 220),
    19: ("reward_treasure_chest","derived",     535, 1335,240, 220),
    20: ("reward_star_coin",    "derived",      790, 1335,240, 220),
    21: ("reward_streak_fire",  "derived",     1050, 1335,240, 220),

    # ── Hàng 6: Badge + reward ──────────────────────
    22: ("reward_shield_badge", "derived",      15,  1580,280, 270),
    23: ("reward_gift_explosion","derived",     310, 1580,280, 270),
}

def crop_sheet(input_path, base_output_dir):
    if not os.path.isfile(input_path):
        print(f"❌ Không tìm thấy file: {input_path}")
        return

    img = Image.open(input_path).convert("RGBA")
    W, H = img.size
    print(f"📐 Ảnh gốc: {W}x{H}px")

    # Auto-scale nếu ảnh khác kích thước tham chiếu (1320x1880)
    sx = W / 1320.0
    sy = H / 1880.0

    count = 0
    for num, (name, subdir, x, y, w, h) in ITEMS.items():
        output_dir = os.path.join(base_output_dir, subdir)
        os.makedirs(output_dir, exist_ok=True)

        cx = int(x * sx)
        cy = int(y * sy)
        cw = int(w * sx)
        ch = int(h * sy)
        cx = max(0, min(cx, W - 1))
        cy = max(0, min(cy, H - 1))
        cw = min(cw, W - cx)
        ch = min(ch, H - cy)
        if cw < 10 or ch < 10:
            print(f"  ⚠ [{num:02d}] Bỏ qua {name}")
            continue
        crop = img.crop((cx, cy, cx + cw, cy + ch))
        out_path = os.path.join(output_dir, f"{name}.png")
        crop.save(out_path)
        count += 1
        print(f"  ✅ [{num:02d}] {name}.png → {subdir}/ ({cw}x{ch}px)")

    print(f"\n🎉 Xong! Đã tách {count}/23 items → {base_output_dir}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Cách dùng: python scripts/crop_sheet2_assets.py <đường_dẫn_sheet.png>")
        sys.exit(1)
    input_file = sys.argv[1]
    output_dir = os.path.join(os.path.dirname(__file__), "..", "web", "assets", "vyvy")
    crop_sheet(input_file, output_dir)
