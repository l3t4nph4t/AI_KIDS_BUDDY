# Study House QA Guide

## How to Run Local Web

1. Start the backend server:
   ```bash
   cd C:\AI_KIDS_BUDDY
   python backend/main.py
   ```

2. Open in browser:
   - Main app: `http://localhost:8000/`
   - Study House: `http://localhost:8000/study-room/`
   - Study House preview: `http://localhost:8000/study-room/?preview=1`

## How to Open Study House

1. Navigate to `http://localhost:8000/study-room/`
2. The page loads with the Study House home screen
3. On mobile, the page fills the screen with no browser chrome (if added to home screen)

## What to Visually Check

### Room Scene
- [ ] Real background image visible (cozy study room)
- [ ] VyVy character visible in the room
- [ ] Speech bubble with friendly Vietnamese text
- [ ] Soft sunlight glow effect

### Study Activity Cards
- [ ] 6 cards visible in 3x2 grid
- [ ] Each card has icon, label, and mini prompt
- [ ] Cards have colored accent bar at top
- [ ] Cards respond to tap with scale animation

### VyVy Guidance Bubble
- [ ] Avatar image visible
- [ ] Friendly message in Vietnamese
- [ ] Rounded bubble design

### Today Plan Card
- [ ] "Hôm nay học gì?" header
- [ ] 3 items: 3 từ tiếng Anh, 2 câu toán vui, 1 câu chuyện nhỏ
- [ ] Each item has icon, text, and check circle

### Mission Card
- [ ] "Chào [name]!" greeting
- [ ] Mini progress bar showing lessons completed
- [ ] "Bắt đầu học" primary button
- [ ] "Xem góc học" secondary button
- [ ] "+10 Sao" earn button

### Subject Rail
- [ ] 5 subject books visible: Toán, Tiếng Việt, Âm nhạc, Mĩ thuật, Đọc sách
- [ ] Each book has cover image, label, and progress bar
- [ ] Horizontal scroll works

### Bottom Navigation
- [ ] 5 tabs: Góc học, Học bài, Luyện tập, Cửa hàng, Phụ huynh
- [ ] Active tab highlighted in pink
- [ ] Tapping tabs switches screens

## What Buttons/Cards to Click

### Study Activity Cards
1. Tap "Tiếng Anh nhẹ" → Overlay shows English word with meaning
2. Tap "Toán vui" → Overlay shows math question
3. Tap "Đọc hiểu" → Overlay shows reading passage
4. Tap "Kể chuyện" → Overlay shows story prompt
5. Tap "Đố vui" → Overlay shows quiz question
6. Tap "Cảm xúc hôm nay" → Overlay shows feeling prompt

### Overlay Actions
- Tap "Để sau" → Closes overlay
- Tap "Bắt đầu" → Navigates to Learn or Practice screen

### Today Plan Items
- Tap any item → Opens corresponding subject overlay

### Mission Card
- Tap "Bắt đầu học" → Navigates to Learn screen
- Tap "Xem góc học" → Shows toast message
- Tap "+10 Sao" → Adds 10 stars, shows reward burst

### Subject Rail
- Tap any book → Navigates to Learn screen

### Bottom Navigation
- Tap each tab → Switches to corresponding screen

## Expected Study House Behavior

1. **Home Screen**: One-screen experience with room scene, study cards, guidance, today plan, mission card, subject rail, and bottom nav
2. **Study Cards**: Tapping opens a bottom sheet overlay with VyVy and subject-specific content
3. **Guidance Bubble**: Shows rotating friendly messages from VyVy
4. **Today Plan**: Shows 3 suggested activities for the day
5. **Mission Card**: Shows greeting, progress, and action buttons
6. **Subject Rail**: Shows 5 subjects with book-style cards
7. **Navigation**: Bottom nav switches between 5 screens
8. **Animations**: Tap scale, card entrance, panel slide-up, VyVy idle floating

## Known Limitations

1. **Background Image**: The current background (home-study-room.png) may need a final illustrated version for production quality
2. **Per-Subject Screens**: Study cards navigate to existing Learn/Practice screens, not custom per-subject screens
3. **Progress Tracking**: Today plan items don't have persistent completion tracking yet
4. **Content Variety**: Micro-content arrays could have more items for variety
5. **Sound Effects**: No sound effects for card taps or interactions yet

## File Structure

```
web/study-room/
├── index.html              # Entry point
├── css/
│   └── study-room.css      # All styles
├── js/
│   └── study-room-app.js   # All JavaScript
├── data/
│   ├── subjectCatalog.js   # Subject definitions
│   ├── decorationCatalog.js # Decoration items
│   ├── sceneCatalog.js     # Scene definitions
│   └── vyvyCatalog.js      # VyVy character data
└── assets/
    └── vyvy_ui_atlas_pack_v2/
        └── crops/          # UI element images

web/assets/vyvy/
├── backgrounds/
│   └── home-study-room.png # Room background
├── derived/
│   ├── vyvy_idle.png       # VyVy idle pose
│   ├── vyvy_supportive.png # VyVy supportive pose
│   └── ...                 # Other VyVy poses and items
└── reference/
    └── ref-ui-light-*.png  # Reference UI designs
```

## Encoding Check

All files use UTF-8 encoding. Vietnamese text displays correctly:
- "Phòng học của VyVy" ✓
- "Tiếng Anh nhẹ" ✓
- "Toán vui" ✓
- "Đọc hiểu" ✓
- "Kể chuyện" ✓
- "Đố vui" ✓
- "Cảm xúc hôm nay" ✓
