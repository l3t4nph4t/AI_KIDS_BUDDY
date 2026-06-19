"""
crop_sheet1_ui.py — Tách từng icon/component từ UI Component Sheet (ảnh 1)
Cách dùng:
    python scripts/crop_sheet1_ui.py "đường_dẫn/ui_sheet.png"
Output: web/assets/vyvy/ui/ (tạo thư mục tự động)
"""

import sys
import os
from PIL import Image

# ─── Đặt tên & tọa độ crop (x, y, w, h) trên ảnh gốc ~1400x900px ───
# Điều chỉnh nếu kích thước ảnh gốc khác
# Đơn vị: pixel, tính từ góc trên trái (0,0)

SCALE = 1.0  # Tự điều chỉnh nếu ảnh nhỏ/lớn hơn

ITEMS = {
    # ── ROW 1: Stats pills ─────────────────────────
    "star_pill":          (30,   20,  210,  80),
    "streak_pill":        (260,  20,  210,  80),
    "level_badge":        (490,  15,  250,  90),
    "avatar_circle":      (760,  10,  100, 100),
    "icon_gift":          (900,  20,   80,  80),
    "icon_mail":          (995,  20,   80,  80),
    "icon_bell":          (1090, 20,   80,  80),
    "icon_settings":      (1185, 20,   80,  80),

    # ── ROW 2: Subject books + Bottom nav ──────────
    "book_toan":          (30,  130,  160, 130),
    "book_tieng_viet":    (205, 130,  160, 130),
    "book_nhac":          (380, 130,  160, 130),
    "book_ve":            (555, 130,  160, 130),
    "bottom_nav_bar":     (720, 145,  540,  95),

    # ── ROW 3: Buttons + nav icons ─────────────────
    "btn_nhan_thuong":    (30,  290,  230,  70),
    "btn_tiep_tuc":       (280, 290,  180,  70),
    "btn_xong":           (475, 290,  160,  70),
    "btn_sound":          (650, 290,   80,  70),
    "nav_back":           (755, 290,   72,  72),
    "nav_forward":        (840, 290,   72,  72),
    "nav_close":          (925, 290,   72,  72),
    "nav_reload":         (1010,290,   72,  72),
    "nav_menu":           (1095,290,   72,  72),

    # ── ROW 4: Status icons ────────────────────────
    "icon_check":         (30,  395,   80,  80),
    "icon_wrong":         (125, 395,   80,  80),
    "icon_warning":       (220, 395,   80,  80),
    "icon_star_gold":     (315, 395,   90,  90),
    "progress_dots":      (420, 400,  280,  70),
    "icon_hint":          (725, 395,   80,  80),
    "icon_heart":         (820, 395,   80,  80),

    # ── ROW 5: VyVy sprites ────────────────────────
    "vyvy_teaching":      (30,  510,  150, 200),
    "vyvy_happy":         (200, 510,  150, 200),
    "vyvy_thinking":      (375, 510,  150, 200),
    "vyvy_detective":     (545, 510,  150, 200),
    "vyvy_reading":       (715, 510,  150, 200),
    "trophy":             (900, 530,  110, 160),
    "medal":              (1025,540,   90, 150),
    "treasure_chest":     (1130,530,  110, 160),

    # ── ROW 6: Room decorations ────────────────────
    "decor_lamp":         (30,  745,  100, 120),
    "decor_bookshelf":    (150, 745,  110, 120),
    "decor_armchair":     (280, 745,  100, 120),
    "decor_plant":        (395, 745,  100, 120),
    "decor_bed":          (510, 745,  120, 120),
    "decor_rug":          (650, 760,  110, 100),
    "decor_window":       (775, 745,  100, 120),
    "decor_bear":         (890, 745,  100, 120),
    "decor_clock":        (1000,745,  100, 120),
    "decor_frame":        (1115,745,  100, 120),

    # ── ROW 7: Controls + misc ─────────────────────
    "ctrl_rewind":        (30,  900,   60,  60),
    "ctrl_play":          (105, 898,   70,  70),
    "ctrl_forward":       (188, 900,   60,  60),
    "progress_bar_audio": (270, 910,  200,  45),
    "icon_bookmark":      (495, 900,   60,  60),
    "icon_pencil":        (575, 900,   60,  60),
    "icon_mic":           (655, 900,   60,  60),
    "icon_camera":        (730, 900,   60,  60),
    "icon_dice":          (808, 900,   60,  60),
    "icon_confetti":      (885, 900,   60,  60),
    "icon_shield":        (960, 900,   60,  60),
    "icon_lock":          (1038,900,   60,  60),
    "icon_question":      (1115,900,   60,  60),
}

def crop_sheet(input_path, output_dir):
    if not os.path.isfile(input_path):
        print(f"❌ Không tìm thấy file: {input_path}")
        return

    os.makedirs(output_dir, exist_ok=True)
    img = Image.open(input_path).convert("RGBA")
    W, H = img.size
    print(f"📐 Ảnh gốc: {W}x{H}px")

    # Auto-scale nếu ảnh khác kích thước tham chiếu (1400x960)
    sx = W / 1400.0
    sy = H / 960.0

    count = 0
    for name, (x, y, w, h) in ITEMS.items():
        cx = int(x * sx)
        cy = int(y * sy)
        cw = int(w * sx)
        ch = int(h * sy)
        # Clamp to image bounds
        cx = max(0, min(cx, W - 1))
        cy = max(0, min(cy, H - 1))
        cw = min(cw, W - cx)
        ch = min(ch, H - cy)
        if cw < 10 or ch < 10:
            print(f"  ⚠ Bỏ qua {name} (kích thước quá nhỏ)")
            continue
        crop = img.crop((cx, cy, cx + cw, cy + ch))
        out_path = os.path.join(output_dir, f"{name}.png")
        crop.save(out_path)
        count += 1
        print(f"  ✅ {name}.png ({cw}x{ch}px)")

    print(f"\n🎉 Xong! Đã tách {count}/{len(ITEMS)} items → {output_dir}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Cách dùng: python scripts/crop_sheet1_ui.py <đường_dẫn_sheet.png>")
        sys.exit(1)
    input_file = sys.argv[1]
    output_dir = os.path.join(os.path.dirname(__file__), "..", "web", "assets", "vyvy", "ui")
    crop_sheet(input_file, output_dir)
