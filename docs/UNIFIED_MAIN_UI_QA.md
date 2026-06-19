# Unified Main UI QA Guide

## How to Open Final Page

1. Start the backend server:
   ```bash
   cd C:\AI_KIDS_BUDDY
   python backend/main.py
   ```

2. Open in browser:
   - Main page: `http://localhost:8000/`
   - Study Room (secondary): `http://localhost:8000/study-room/`

## Master Image to Compare Against

Compare the final page against:
`C:\AI_KIDS_BUDDY\asset\reference\be22120f-f118-4e67-8995-4b677cbd9177.png`

Key elements to verify:
- Room scene with cozy background
- VyVy character visible and prominent
- Study activity cards
- Warm pastel colors
- Child-friendly rounded shapes
- One-screen mobile layout

## What Buttons/Cards to Click

### Study Activity Cards
1. Tap "Tiếng Anh nhẹ" → Should navigate to Study Room
2. Tap "Toán vui" → Should navigate to Study Room
3. Tap "Kể chuyện" → Should navigate to Study Room
4. Tap "Đố vui" → Should navigate to Study Room
5. Tap "Cảm xúc hôm nay" → Should navigate to Study Room
6. Tap "Đọc hiểu" → Should navigate to Study Room

### Mission Card
- Tap "Bắt đầu học" → Should navigate to Study Room
- Tap "Xem góc học" → Should navigate to Study Room
- Tap "+10 Sao" → Should add 10 stars, show reward burst

### Subject Rail
- Tap any book → Should navigate to Study Room

### Bottom Navigation
- Tap "Nhà" → Should stay on main page
- Tap "Học" → Should navigate to Study Room
- Tap "Luyện" → Should navigate to Study Room
- Tap "Chơi" → Should navigate to Study Room
- Tap "Trang trí" → Should navigate to Study Room

## Expected Visual Behavior

1. **Room Scene**: Real background image visible with cozy study room; VyVy character visible with idle floating animation
2. **Guidance Bubble**: Shows rotating friendly messages from VyVy with avatar
3. **Study Cards**: 6 cards in 3x2 grid with colored accent bars; each has icon, label, and mini prompt
4. **Today Plan**: Card with 3 suggested activities (3 từ tiếng Anh, 2 câu toán vui, 1 câu chuyện nhỏ)
5. **Mission Card**: Greeting, progress bar, and action buttons
6. **Subject Rail**: 5 subject books with progress bars
7. **Bottom Nav**: 5 tabs with active state highlighting

## Expected Mobile Behavior

1. **One-screen feel**: Main content visible without excessive scrolling
2. **Touch-friendly**: All buttons/cards have adequate tap targets (44px+)
3. **No horizontal overflow**: Content fits within screen width
4. **Responsive**: Works on 360px-430px width screens
5. **Smooth animations**: Tap feedback, idle floating

## Known Limitations

1. **Room Background**: The CSS path for the room background may need verification in all environments. If the background doesn't show, check that `web/assets/vyvy/backgrounds/home-study-room.png` exists.

2. **Study Card Overlays**: Unlike Study Room which has inline overlays, the main page navigates to Study Room when tapping study cards. This is a design trade-off for simplicity.

3. **Today Plan Tracking**: Today plan items don't have persistent completion tracking. They're visual suggestions only.

4. **Secondary Pages**: Games, Music, Drawing, and other features are accessible through Study Room, not directly from the main page.

## File Structure

```
web/
├── index.html              # FINAL UNIFIED MAIN PAGE
├── vyvy-ui.css             # Shared design tokens
├── study-room/
│   ├── index.html          # Secondary page (Study Room)
│   ├── css/
│   │   └── study-room.css  # Study Room styles (also used by main page)
│   ├── js/
│   │   └── study-room-app.js # Study Room JS
│   └── data/               # Data files
└── assets/
    └── vyvy/
        ├── backgrounds/
        │   └── home-study-room.png # Room background
        └── derived/
            ├── vyvy_idle.png       # VyVy idle pose
            └── ...                 # Other VyVy poses
```

## Encoding Check

All files use UTF-8 encoding. Vietnamese text displays correctly:
- "VyVy — bạn học nhỏ của bé" ✓
- "Tiếng Anh nhẹ" ✓
- "Toán vui" ✓
- "Kể chuyện" ✓
- "Đố vui" ✓
- "Cảm xúc hôm nay" ✓
- "Đọc hiểu" ✓
- "Chào bạn, mình là VyVy!" ✓
