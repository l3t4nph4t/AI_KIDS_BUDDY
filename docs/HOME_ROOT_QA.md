# Home/Root QA Guide

## How to Open Root Page

1. Open `web/index.html` directly in browser
2. Or start backend server:
   ```bash
   cd C:\AI_KIDS_BUDDY
   python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```
3. Open http://localhost:8000

## What to Compare Against Master

Compare against: `C:\AI_KIDS_BUDDY\asset\reference\be22120f-f118-4e67-8995-4b677cbd9177.png`

The root page should match the study room's home screen design with:
- Room scene with cropped decoration assets
- Top status bar with avatar, name, and stats pills
- Mission card with greeting and action buttons
- Subject rail with book cards
- Study activity cards (6 cards in 3x2 grid)
- Guidance bubble
- Bottom navigation

## Cropped Assets Used

The following cropped assets from `asset/crop/crops/` are used:

### Top Bar
- `avatar_profile_badge.png` - Avatar image
- `icon_star_glow.png` - Star counter icon
- `top_streak_counter.png` - Streak counter icon
- `top_level_progress.png` - Level progress icon

### Room Scene Decorations
- `window_pink.png` - Window decoration
- `bookshelf_small.png` - Bookshelf decoration
- `lamp_pink.png` - Desk lamp decoration
- `plant_pot_green.png` - Plant decoration
- `rug_round_star.png` - Floor rug decoration
- `teddy_bear.png` - Teddy bear decoration
- `alarm_clock_pink.png` - Clock decoration
- `icon_star_glow.png` - Decorative stars

### Room Background
- `assets/vyvy/backgrounds/home-study-room.png` - Room background image

### Subject Books
- `book_math.png` - Math book cover
- `book_tieng_viet.png` - Vietnamese book cover
- `book_music.png` - Music book cover
- `book_drawing.png` - Art book cover

### Section Icons
- `bookmark_pink.png` - Subject section header

### VyVy Character
- `assets/vyvy/derived/vyvy_idle.png` - VyVy idle pose

## What Buttons to Click

1. **"Bắt đầu học"** → Should navigate to ./study-room/
2. **"Xem góc học"** → Should navigate to ./study-room/
3. **"+10 Sao"** → Should add 10 stars and show toast
4. **Subject books** → Should navigate to ./study-room/
5. **Study activity cards** → Should navigate to ./study-room/
6. **Bottom nav items** → Should navigate to ./study-room/

## What Should Visually Appear

### Room Scene (with cropped assets)
- Background image of study room
- Window decoration (window_pink.png)
- Bookshelf decoration (bookshelf_small.png)
- Desk lamp decoration (lamp_pink.png)
- Plant decoration (plant_pot_green.png)
- Floor rug decoration (rug_round_star.png)
- Teddy bear decoration (teddy_bear.png)
- Clock decoration (alarm_clock_pink.png)
- Decorative stars (icon_star_glow.png)
- VyVy character (vyvy_idle.png)
- Speech bubble with greeting

### Top Status Bar
- Avatar image (avatar_profile_badge.png)
- "VyVy" name
- "bạn của [name]" subtitle
- Star count pill (icon_star_glow.png)
- Streak pill (top_streak_counter.png)
- Level pill (top_level_progress.png)

### Mission Card
- "Chào [name]!" greeting
- "Hôm nay mình học gì nè?" question
- Progress bar
- "Bắt đầu học" button
- "Xem góc học" button
- "+10 Sao" button

### Subject Rail
- "Môn học" section header with bookmark_pink.png
- Book cards for each subject with cropped book covers

### Study Activity Cards
- 6 cards in 3x2 grid
- Each card has icon, label, and prompt text

### Guidance Bubble
- VyVy avatar (avatar_profile_badge.png)
- Random guidance text

### Bottom Navigation
- 5 nav items: Nhà, Học, Luyện, Chơi, Trang trí

## Known Limitations

1. CSS is loaded from study-room/css/study-room.css (shared design system)
2. Some study room features require the full study-room JS
3. Visual verification requires browser testing
