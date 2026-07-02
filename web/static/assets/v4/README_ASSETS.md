# AI Kids Buddy Assets v4

Approved master export for AI Kids Buddy.

## Scope

- Clean Home room base backgrounds.
- Empty room spaces for later decoration.
- VyVy in warm school-uniform style.
- 3D main menu UI assets.
- Study/PDF reader assets.
- Decor objects, study props, and UI effects as separate transparent PNGs.

## Runtime rule

Use these PNG files as master source. After final integration approval, convert copies to WebP for production loading. Do not replace the PNG master source.

## Folder structure

- `00_preview/`: preview sheets only; previews may contain labels.
- `01_home_backgrounds/`: clean full-screen Home backgrounds.
- `02_room_spaces_clean/`: empty full-screen room spaces.
- `03_vyvy_characters/`: VyVy transparent PNGs.
- `04_main_menu_ui/`: 3D menu assets, transparent PNGs, no baked text.
- `05_study_pdf_assets/`: study/PDF reader support assets.
- `06_decor_objects/`: decoration objects children can place later.
- `07_study_props/`: extra study props.
- `08_ui_effects/`: transparent UI effect layers.

## Counts

- Runtime PNG assets: 52
- Preview PNG assets: 3

## Notes

The clean rooms intentionally do not contain toys, books, instruments, stickers, or major decor. Those are separate assets so the child can decorate the room later. Runtime UI text should be rendered by the app using HTML/CSS, not baked into images.
