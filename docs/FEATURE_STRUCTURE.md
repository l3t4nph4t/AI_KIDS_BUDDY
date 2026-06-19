# VyVy — AI Kids Buddy: Feature Structure
**Version:** 2.0.0  
**Last Updated:** 2026-06-08

---

## Project Overview

VyVy is an AI-powered learning companion for Vietnamese children (ages 5-12). It combines curriculum-based learning with interactive games, creative tools, and conversational AI.

**Tech Stack:**
- **Backend:** Python (FastAPI), MIMO AI client
- **Frontend:** Vanilla JS, HTML5, CSS3 (PWA-ready)
- **Data:** JSON-based curriculum, localStorage for progress
- **TTS:** Edge TTS (Vietnamese voices)

---

## 1. LEARNING SYSTEM (Học bài)

### 1.1 Curriculum Structure
```
Grade 1-5
├── Books (Sách giáo khoa)
│   ├── Lessons (Bài học)
│   │   └── Daily Units (Bài học hàng ngày)
│   └── Subjects (Môn học)
└── Lesson Content (Nội dung AI-generated)
```

### 1.2 Supported Grades & Subjects

| Grade | Subjects |
|-------|----------|
| Lớp 1 | Toán, Tiếng Việt, Tự nhiên & Xã hội, Âm nhạc, GĐTC, Hoạt động trải nghiệm |
| Lớp 2 | Toán, Tiếng Việt, Âm nhạc, Mĩ thuật, GĐTC, Hoạt động trải nghiệm |
| Lớp 3 | Toán, Tiếng Việt, Tiếng Anh, Tự nhiên & Xã hội, Tin học, Âm nhạc, Mĩ thuật, GĐTC, Hoạt động trải nghiệm |
| Lớp 4 | Toán, Tiếng Việt, Lịch sử & Địa lí, Khoa học, Âm nhạc |
| Lớp 5 | Toán, Tiếng Việt, Tiếng Anh, Lịch sử & Địa lí, Công nghệ, Đạo đức, Âm nhạc |

### 1.3 Learning Session Flow
```
┌─────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐    ┌──────┐
│  READ   │───▶│ PRACTICE  │───▶│  CHECK   │───▶│ FEEDBACK │───▶│ DONE │
│ (Đọc)   │    │ (Luyện)   │    │ (Kiểm tra)│    │ (Nhận xét)│    │      │
└─────────┘    └───────────┘    └──────────┘    └──────────┘    └──────┘
```

#### Step Details:
1. **READ Phase**
   - Objective (Mục tiêu)
   - Explanation (Giải thích)
   - Examples (Ví dụ)
   - Remember (Ghi nhớ)
   - Parent Note (Ghi chú cho phụ huynh)
   - PDF viewer for SGK pages
   - Audio playback (TTS)

2. **PRACTICE Phase**
   - 3-6 exercises per session
   - Multiple choice for Math (auto-generated)
   - Text input for other subjects
   - Immediate feedback (correct/wrong)
   - Star rewards (⭐)

3. **CHECK Phase**
   - Final assessment question
   - Difficulty: 3 (highest)

4. **FEEDBACK Phase**
   - Parent feedback summary
   - Total stars earned
   - Performance detail

### 1.4 API Endpoints (Learning)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/curriculum/grades` | GET | List all grades with stats |
| `/curriculum/subjects?grade={g}` | GET | Subjects for a grade |
| `/curriculum/books?grade={g}` | GET | Books for a grade |
| `/curriculum/lessons-grouped?grade={g}&subject={s}` | GET | Lessons grouped by book |
| `/curriculum/daily-unit?grade={g}&subject={s}` | GET | Random uncompleted unit |
| `/curriculum/adjacent-units?unit_id={id}&subject={s}&grade={g}` | GET | Prev/next navigation |
| `/curriculum/lesson-content?unit_id={id}` | GET | AI-generated content |
| `/curriculum/content-stats` | GET | Content coverage stats |
| `/curriculum/progress?grade={g}` | GET | Progress for grade |
| `/curriculum/next-unit?grade={g}&subject={s}` | GET | Next uncompleted unit |
| `/curriculum/history?grade={g}` | GET | Learning history |
| `/curriculum/weekly-report?grade={g}` | GET | Weekly summary |
| `/curriculum/session/start` | POST | Start learning session |
| `/curriculum/session/respond` | POST | Submit answer |
| `/curriculum/complete` | POST | Mark unit complete |
| `/curriculum/active-grade` | POST | Set active grade |
| `/curriculum/reset` | POST | Reset progress |
| `/curriculum/lesson-pdf/{lesson_id}` | GET | PDF for lesson |
| `/curriculum/lesson-audio?unit_id={id}` | GET | TTS audio for lesson |

### 1.5 Data Files
```
backend/data/curriculum/
├── grades.json              # Grade metadata
├── subjects.json            # Subject catalog + grade-subject mapping
├── grade_1/
│   ├── books.json           # 8 books
│   ├── lessons.json         # 131 lessons
│   ├── daily_learning_units.json  # 131 units
│   └── lesson_content.json  # 131 AI-generated contents
├── grade_2/
│   ├── books.json           # 8 books
│   ├── lessons.json         # 203 lessons
│   ├── daily_learning_units.json  # 198 units
│   └── lesson_content.json  # 198 AI-generated contents
├── grade_3/
│   ├── books.json           # 12 books
│   ├── lessons.json         # 225 lessons
│   ├── daily_learning_units.json  # 225 units
│   └── lesson_content.json  # 225 AI-generated contents
├── grade_4/
│   ├── books.json           # 7 books
│   ├── lessons.json         # 148 lessons
│   ├── daily_learning_units.json  # 148 units
│   └── lesson_content.json  # 148 AI-generated contents
└── grade_5/
    ├── books.json           # 10 books
    ├── lessons.json         # 195 lessons
    ├── daily_learning_units.json  # 195 units
    └── lesson_content.json  # 195 AI-generated contents
```

---

## 2. CHAT SYSTEM (Trò chuyện)

### 2.1 Chat Modes

| Mode | Description |
|------|-------------|
| `free_chat` | Open conversation |
| `story` | Story telling |
| `quiz` | Quiz/riddles |
| `english` | English learning |
| `math` | Math practice |
| `imagination` | Creative imagination |
| `feelings` | Emotional support |
| `bedtime` | Relaxation |
| `live_call` | Voice call |
| `ptt` | Push-to-talk |
| `hold` | Hold-to-talk |

### 2.2 Voice Features

| Feature | Description |
|---------|-------------|
| **Speech Recognition (STT)** | Web Speech API, Vietnamese |
| **Speech Synthesis (TTS)** | Browser TTS + Edge TTS fallback |
| **Voice Presets** | Bạn nhỏ, Vui tươi, Bình thường |
| **Voice Gender** | Male/Female selection |
| **Live Call** | Continuous voice conversation |
| **Push-to-Talk** | Press button to speak |
| **Hold-to-Talk** | Hold button to speak |

### 2.3 Safety System

| Check | Action |
|-------|--------|
| Phone number detection | Soft redirect |
| Address keywords | Soft redirect |
| School name keywords | Soft redirect |
| Password keywords | Soft redirect |
| Danger keywords | Hard block |

### 2.4 API Endpoints (Chat)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat` | POST | Send message, get AI reply |
| `/tts` | POST | Generate TTS audio |
| `/tts/status` | GET | TTS availability |

---

## 3. GAMES SYSTEM (Chơi game)

### 3.1 Available Games

| Game | ID | Description |
|------|-----|-------------|
| **Catch** | `catch` | Catch falling balls with paddle |
| **Memory** | `memory` | Match emoji pairs |
| **Count** | `count` | Counting game |
| **Color** | `color` | Color matching |
| **Puzzle** | `puzzle` | Jigsaw puzzle |
| **Whack** | `whack` | Whack-a-mole |
| **Word Scramble** | `wordscramble` | Unscramble words |

### 3.2 Game Features
- Timer countdown
- Score tracking
- High score persistence (localStorage)
- Sound effects
- Celebration animations

---

## 4. MUSIC SYSTEM (Nghe nhạc)

### 4.1 Features
- Song library (backend API)
- Note-based playback (Web Audio API)
- Music visualizer
- Play/Pause/Stop controls
- Auto-play next song
- Volume control

### 4.2 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/music/songs` | GET | List available songs |

---

## 5. DRAWING SYSTEM (Vẽ tranh)

### 5.1 Tools

| Tool | Description |
|------|-------------|
| **Pen** | Freehand drawing |
| **Eraser** | Erase strokes |
| **Fill** | Fill canvas with color |
| **Stamp** | Emoji stamps |

### 5.2 Features
- Color palette (10+ colors)
- Brush size selector
- Undo/Redo history (30 steps)
- Save to gallery (localStorage)
- Download as PNG
- Touch support (mobile)

---

## 6. STUDY ROOM (Góc học tập)

### 6.1 Features
- Virtual room decoration
- Decoration catalog
- Star-based economy
- Equip/Unequip items
- Scene backgrounds

### 6.2 Data Files
```
web/study-room/
├── js/study-room-app.js     # Main app logic
├── data/
│   ├── decorationCatalog.js # Decoration items
│   ├── vyvyCatalog.js       # VyVy character items
│   ├── sceneCatalog.js      # Scene backgrounds
│   └── subjectCatalog.js    # Subject themes
└── css/study-room.css       # Styles
```

---

## 7. AVATAR SYSTEM (Nhân vật)

### 7.1 Features
- Default avatar (Robot VyVy)
- Avatar shop (star-based)
- Avatar preview
- Purchased avatars list
- Avatar persistence

### 7.2 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/curriculum/avatar` | GET | Get current avatar |
| `/curriculum/avatar` | POST | Set avatar |

---

## 8. PROGRESS TRACKING (Tiến độ)

### 8.1 Tracked Metrics

| Metric | Description |
|--------|-------------|
| `completed_units` | List of completed unit IDs |
| `unit_scores` | Score per unit (grade, subject, score, stars, timestamp) |
| `grade_progress` | Per-grade completion count |
| `subject_progress` | Per-subject completion count |
| `streak` | Consecutive days learning |
| `sessions` | Learning history (last 50) |
| `cumulative_stars` | Total stars earned |

### 8.2 Features
- Multi-grade support
- Per-grade filtering
- Atomic file writes (thread-safe)
- Auto-detect grade from unit ID

---

## 9. PARENT CONTROLS (Phụ huynh)

### 9.1 Features
- PIN protection (SHA-256 hashed)
- PIN lockout (5 attempts, 30s lock)
- Settings panel
  - Nickname
  - Age
  - Learning mode
  - Goal
- Daily message limit (200)
- Daily time limit (60 min default)
- Memory reset
- Progress reset (per grade or all)
- Theme toggle (Light/Dark/Auto)

### 9.2 Settings Storage (localStorage)

| Key | Description |
|-----|-------------|
| `vyvy_pin` | Hashed PIN |
| `vyvy_nickname` | Child's nickname |
| `vyvy_age` | Child's age |
| `vyvy_grade` | Active grade |
| `vyvy_mode` | Learning mode |
| `vyvy_goal` | Learning goal |
| `vyvy_theme` | UI theme |
| `vyvy_voice_gender` | Voice preference |
| `vyvy_time_limit` | Daily time limit |
| `vyvy_memory` | Conversation memory |

---

## 10. UI/UX FEATURES

### 10.1 Views/Screens

| View | Description |
|------|-------------|
| **Home** | Main screen with room scene |
| **Learning** | Grade/Subject selection + Session |
| **Games** | Game menu + Game area |
| **Music** | Song list + Player |
| **Drawing** | Canvas + Tools |
| **Chat** | Conversation area |
| **Settings** | Parent panel |
| **Welcome** | First-time onboarding |
| **Avatar Shop** | Buy/equip avatars |

### 10.2 UI Components
- Toast notifications
- Celebration animations (particles)
- Star burst effects
- Typing indicator
- Progress bar
- Multiple choice buttons
- PDF viewer overlay
- Voice status display

### 10.3 Responsive Design
- Mobile-first layout
- Touch-friendly controls
- PWA manifest
- Service worker (offline support)

---

## 11. BACKEND ARCHITECTURE

### 11.1 Core Modules

| Module | File | Responsibility |
|--------|------|----------------|
| **Main** | `main.py` | FastAPI app, routes, endpoints |
| **Curriculum** | `curriculum.py` | Data loading, grade/subject/unit lookups |
| **Lesson Content** | `lesson_content.py` | AI-generated content loading |
| **Learning Session** | `learning_session.py` | Session generation, answer evaluation |
| **Learning Progress** | `learning_progress.py` | Progress tracking, persistence |
| **Prompts** | `prompts.py` | AI prompt building |
| **Safety** | `safety_alpha.py` | Content safety checks |
| **MIMO Client** | `mimo_client.py` | AI model API client |
| **TTS Service** | `tts_service.py` | Text-to-speech generation |
| **Music Data** | `music_data.py` | Song data |

### 11.2 Data Flow
```
Frontend ──HTTP──▶ FastAPI ──▶ Curriculum Loader ──▶ JSON Files
                         │
                         ├──▶ Session Generator ──▶ Content DB
                         │
                         ├──▶ Progress Tracker ──▶ progress.json
                         │
                         └──▶ MIMO Client ──▶ AI Model
```

---

## 12. FILE STRUCTURE

```
AI_KIDS_BUDDY/
├── backend/
│   ├── main.py              # FastAPI app + all endpoints
│   ├── curriculum.py        # Grade-aware curriculum loader
│   ├── lesson_content.py    # AI content loader
│   ├── learning_session.py  # Session generator + evaluator
│   ├── learning_progress.py # Progress tracker
│   ├── prompts.py           # AI prompt builder
│   ├── safety_alpha.py      # Safety guardrails
│   ├── mimo_client.py       # MIMO AI client
│   ├── tts_service.py       # TTS service
│   ├── music_data.py        # Song data
│   └── data/
│       ├── curriculum/      # Grade 1-5 data
│       ├── learning_progress.json
│       └── bot_config.json
├── web/
│   ├── index.html           # Main HTML
│   ├── script.js            # Main JS (6000+ lines)
│   ├── style.css            # Main styles
│   ├── vyvy-ui.css          # UI components
│   ├── theme.css            # Theme variables
│   ├── content.js           # Content data
│   ├── decor.js             # Decoration system
│   ├── vyvyAssets.js        # Asset paths
│   ├── sw.js                # Service worker
│   ├── manifest.json        # PWA manifest
│   ├── js/
│   │   └── localStorageState.js
│   ├── css/
│   ├── icons/
│   ├── assets/
│   └── study-room/
│       ├── js/study-room-app.js
│       ├── css/study-room.css
│       └── data/
├── tests/
│   ├── test_curriculum.py
│   ├── test_learning_session.py
│   ├── test_progress.py
│   ├── backtest_e2e.py
│   └── validate_p05.py
├── scripts/
├── docs/
├── asset/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── package.json
```

---

## 13. STATISTICS

| Metric | Value |
|--------|-------|
| Total Books | 45 |
| Total Lessons | 902 |
| Total Daily Units | 902 |
| Units with AI Content | 902 (100%) |
| Total Subjects | 13 |
| Total API Endpoints | 25+ |
| Total Games | 7 |
| Frontend Lines | 6000+ |
| Backend Lines | 3000+ |
| Test Cases | 48 |
