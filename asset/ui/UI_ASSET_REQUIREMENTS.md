# UI Asset Requirements - Home Bottom UI

Use PNG files with transparent background. Keep all important pixels inside the canvas with 8-12% safe padding. Do not bake full-screen backgrounds into these assets.

## Folders

- `asset/ui/home/`
- `asset/ui/nav/`
- `asset/ui/subject/`

## Bottom Nav

The bottom nav has 5 main buttons, ordered left to right:

1. `Bàn học` - current home/study-corner room.
2. `Giải trí` - future entertainment/other rooms.
3. `Học tập` - main learning experience, default focus.
4. `Đổi quà` - exchange stars for room decoration rewards.
5. `Cài đặt` - settings.

Nav bar:

- `asset/ui/nav/nav_bar_mobile.png` - `1440x184`
- `asset/ui/nav/nav_bar_tablet.png` - `1400x172`
- `asset/ui/nav/nav_bar_pc.png` - `1720x164`

Nav button states:

- `asset/ui/nav/nav_study_corner_active.png`
- `asset/ui/nav/nav_study_corner_idle.png`
- `asset/ui/nav/nav_entertainment_active.png`
- `asset/ui/nav/nav_entertainment_idle.png`
- `asset/ui/nav/nav_learning_active.png`
- `asset/ui/nav/nav_learning_idle.png`
- `asset/ui/nav/nav_achievement_active.png`
- `asset/ui/nav/nav_achievement_idle.png`
- `asset/ui/nav/nav_settings_active.png`
- `asset/ui/nav/nav_settings_idle.png`

Normal button design canvas:

- Mobile: `236x144`
- Tablet: `200x132`
- PC: `256x124`

Learning focus button design canvas:

- Mobile: `270x160`
- Tablet: `230x148`
- PC: `292x140`

Use icon plus Vietnamese label baked into each button:

- Study corner: `Bàn học`
- Entertainment: `Giải trí`
- Learning: `Học tập`
- Achievement: `Đổi quà`
- Settings: `Cài đặt`

Icon direction:

- `Bàn học`: desk or study table.
- `Giải trí`: game, media, play room, or playful controller.
- `Học tập`: open book, pencil, sparkle, or backpack. This should have the largest icon.
- `Đổi quà`: trophy, medal, star exchange, gift box, or reward badge.
- `Cài đặt`: gear.

Learning focus rules:

- `nav_learning_active.png` should be the clearest visual focus.
- Learning icon should be 15-25% larger than normal nav icons.
- Active state may use stronger glow, brighter color, or a slightly raised button.
- Keep the focus effect inside the PNG canvas; do not rely on CSS overflow.

## Subject Cards

Slot targets:

- Mobile: `132x150`
- Tablet: `150x170`
- PC: `190x145`

Create one PNG per subject and mode:

- `asset/ui/subject/subject_math_mobile.png`
- `asset/ui/subject/subject_math_tablet.png`
- `asset/ui/subject/subject_math_pc.png`
- `asset/ui/subject/subject_vietnamese_mobile.png`
- `asset/ui/subject/subject_vietnamese_tablet.png`
- `asset/ui/subject/subject_vietnamese_pc.png`
- `asset/ui/subject/subject_music_mobile.png`
- `asset/ui/subject/subject_music_tablet.png`
- `asset/ui/subject/subject_music_pc.png`
- `asset/ui/subject/subject_art_mobile.png`
- `asset/ui/subject/subject_art_tablet.png`
- `asset/ui/subject/subject_art_pc.png`

Short labels:

- Math: `Toán`
- Vietnamese: `TV`
- Music: `Nhạc`
- Art: `Vẽ`

Progress bars may be baked into these assets for now.

## Mission And CTA

- `asset/ui/home/mission_panel_mobile.png`
- `asset/ui/home/mission_panel_tablet.png`
- `asset/ui/home/mission_panel_pc.png`
- `asset/ui/home/primary_cta_mobile.png`
- `asset/ui/home/primary_cta_tablet.png`
- `asset/ui/home/primary_cta_pc.png`

CTA short label: `Học ngay`.

