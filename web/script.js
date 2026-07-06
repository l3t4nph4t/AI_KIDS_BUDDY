/* VyVy — bạn AI của bạn: Main Script */
/* Vietnamese default, age-appropriate, parent-supervised */
/* No API keys in frontend */

'use strict';

(function () {
  /* ── Feature Flags ─────────────────────── */
  var FEATURE_FLAGS = {
    learningToday: true,
    readLesson: true,
    practice: true,
    basicChat: true,
    games: true,
    music: true,
    drawing: true,
    quiz: true,
    edgeTts: false,
    starExchange: false,
    debugPanel: false,
    rawCurriculumBrowser: false,
    unfinishedVoiceOptions: false,
    experimentalLiveCall: false,
    unsupportedGrades: false,
    parentDangerZone: false,
    devTools: false,
    feelings: false,
    english: false,
    story: false
  };

  /* ── Navigation State ─────────────────── */
  var currentView = 'home';
  var viewStack = [];

  /* ── Room Carousel State ──────────────── */
  var activeRoom = 'entertainment';

  /* ── Voice Presets ─────────────────────── */
  var VOICE_PRESETS = {
    'ban-nho':     { label: 'Bạn nhỏ',    pitch: '+50Hz', rate: '+10%', wsPitch: 1.6, wsRate: 1.1, desc: 'Giọng cao, nhanh nhẹn như bạn nhỏ.' },
    'vui-tuoi':    { label: 'Vui tươi',   pitch: '+75Hz', rate: '+20%', wsPitch: 1.8, wsRate: 1.2, desc: 'Giọng rất cao, nhanh, vui nhộn.' },
    'binh-thuong': { label: 'Bình thường', pitch: '+25Hz', rate: '+0%',  wsPitch: 1.3, wsRate: 1.0, desc: 'Giọng nhẹ nhàng, dễ nghe.' }
  };
  var currentVoicePreset = 'ban-nho';

  /* ── TTS Status ───────────────────────── */
  var ttsAvailable = false;

  /* ── API Base (same-origin: works locally AND on Dokploy) ── */
  var API_BASE = window.location.protocol + '//' + window.location.host;
  var CHAT_ENDPOINT = API_BASE + '/chat';
  var HEALTH_ENDPOINT = API_BASE + '/health';

  window.VYVY_CATALOG = window.VYVY_CATALOG || {
    basePath: '/static/assets/vyvy/',
    states: {
      idle:       { asset: 'vyvy_idle.webp' },
      default:    { asset: 'vyvy_idle.webp' },
      reading:    { asset: 'vyvy_reading.webp' },
      explaining: { asset: 'vyvy_explaining.webp' },
      listening:  { asset: 'vyvy_listening.webp' },
      thinking:   { asset: 'vyvy_thinking.webp' },
      happy:      { asset: 'vyvy_cheering.webp' },
      cheering:   { asset: 'vyvy_cheering.webp' }
    }
  };

  function getVyvyAssetUrl(stateName) {
    var catalog = window.VYVY_CATALOG || {};
    var states = catalog.states || {};
    var pose = states[stateName] || states.default || states.idle || {};
    var basePath = catalog.basePath || '/static/assets/vyvy/';
    return basePath + (pose.asset || 'vyvy_idle.webp');
  }

  /* ── Storage Keys ──────────────────────── */
  var SK = {
    PIN: 'vyvy_pin',
    PIN_FAILS: 'vyvy_pin_fails',
    PIN_LOCK: 'vyvy_pin_lock',
    NICKNAME: 'vyvy_nickname',
    BOT_NAME: 'vyvy_bot_name',
    AGE: 'vyvy_age',
    GRADE: 'vyvy_grade',
    MODE: 'vyvy_mode',
    GOAL: 'vyvy_goal',
    SETTINGS_DONE: 'vyvy_settings_done',
    MEMORY: 'vyvy_memory',
    DAILY_COUNT: 'vyvy_daily_count',
    DAILY_DATE: 'vyvy_daily_date',
    VOICE_GENDER: 'vyvy_voice_gender',
    VOICE_RATE: 'vyvy_voice_rate',
    MIC_MODE: 'vyvy_mic_mode',
    THEME: 'vyvy_theme',
    HIGH_SCORES: 'vyvy_high_scores',
    DRAWING_GALLERY: 'vyvy_drawing_gallery',
    SESSION_START: 'vyvy_session_start',
    DAILY_TIME: 'vyvy_daily_time',
    DAILY_TIME_DATE: 'vyvy_daily_time_date',
    TIME_LIMIT: 'vyvy_time_limit',
    STARS: 'vyvy_stars',
    DECOR_OWNED: 'vyvy_decor_owned',
    DECOR_PLACED: 'vyvy_decor_placed'
  };

  var MAX_PIN_ATTEMPTS = 5;
  var PIN_LOCK_MS = 30000;
  var MAX_DAILY_MSG = 200;

  /* ── Quick action → prompt + session_mode ── */
  var ACTION_MAP = {
    talk:        { prompt: 'Mình muốn nói chuyện vui với bạn!', mode: 'free_chat' },
    story:       { prompt: 'Bạn kể cho mình một câu chuyện nhé!', mode: 'story' },
    quiz:        { prompt: 'Bạn đố vui mình một câu nhé!', mode: 'quiz' },
    english:     { prompt: 'Dạy mình một từ tiếng Anh dễ nhé!', mode: 'english' },
    math:        { prompt: 'Cho mình một câu toán vui nhé!', mode: 'math' },
    imagination: { prompt: 'Tụi mình cùng tưởng tượng nhé!', mode: 'imagination' },
    feelings:    { prompt: 'Hôm nay bạn thấy sao?', mode: 'feelings' },
    games:       { prompt: null, mode: 'games', special: 'games' },
    music:       { prompt: null, mode: 'music', special: 'music' },
    drawing:     { prompt: null, mode: 'drawing', special: 'drawing' },
    learn:       { prompt: null, mode: 'learn', special: 'learn' }
  };

  /* ── Topic tags for memory ──────────────── */
  var TOPIC_KEYWORDS = {
    'khủng long': 'dinosaur', 'dinosaur': 'dinosaur',
    'chuyện': 'story', 'kể chuyện': 'story', 'truyện': 'story',
    'toán': 'math', 'số': 'math', 'cộng': 'math', 'trừ': 'math',
    'tiếng anh': 'english', 'english': 'english',
    'mèo': 'cat', 'chó': 'dog', 'cá': 'fish', 'chim': 'bird',
    'bạn': 'friend', 'bạn thân': 'friend',
    'buồn': 'sad', 'vui': 'happy', 'giận': 'angry', 'sợ': 'scared',
    'trò chơi': 'game', 'chơi': 'game',
    'gia đình': 'family', 'bố': 'family', 'mẹ': 'family',
    'trường': 'school', 'lớp': 'school', 'cô giáo': 'school',
    'ăn': 'food', 'bánh': 'food', 'kẹo': 'food', 'trái cây': 'food',
    'vẽ': 'drawing', 'tranh': 'drawing',
    'robot': 'robot', 'siêu nhân': 'superhero', 'công chúa': 'princess',
    'không gian': 'space', 'mặt trăng': 'space', 'sao': 'space',
    'biển': 'ocean', 'cá heo': 'ocean', 'đại dương': 'ocean'
  };

  /* ── State ──────────────────────────────── */
  var state = {
    mode: 'idle',
    isProcessing: false,
    liveCallActive: false,
    pttActive: false,
    holdActive: false,
    micMode: 'ptt',
    silenceTimer: null,
    silenceTimeout: null,
    recognition: null,
    synthesis: window.speechSynthesis || null,
    currentUtterance: null,
    vyvyVoice: null,
    conversationHistory: [],
    sessionMode: 'free_chat',
    settings: {
      nickname: 'Bé',
      age: 8,
      mode: 'balanced',
      goal: 'vui vẻ và học hỏi',
      bot_name: 'VyVy',
      voice_gender: 'female'
    },
    memory: {
      favorite_topics: [],
      disliked_topics: [],
      preferred_activity: '',
      recent_topics: [],
      recent_mood: '',
      known_english: [],
      conversation_count: 0,
      daily_summary: ''
    },
    pinLockTimer: null
  };

  /* ── TTS Audio State Machine ────────────── */
  var ttsState = {
    currentAudio: null,
    state: 'idle', // idle | loading | playing | error
    requestId: 0
  };

  function stopCurrentAudio() {
    if (ttsState.currentAudio) {
      try {
        ttsState.currentAudio.pause();
        ttsState.currentAudio.currentTime = 0;
      } catch (e) {}
      ttsState.currentAudio = null;
    }
    ttsState.state = 'idle';
  }

  function setTtsButtonState(btnState) {
    var testBtn = document.getElementById('test-voice-btn');
    if (!testBtn) return;
    if (btnState === 'loading') {
      testBtn.disabled = true;
      testBtn.textContent = '⏳ Đang tải...';
    } else if (btnState === 'playing') {
      testBtn.disabled = true;
      testBtn.textContent = '🔊 Đang phát...';
    } else {
      testBtn.disabled = false;
      testBtn.textContent = 'Test giọng nói';
    }
  }

  /* ── DOM refs ───────────────────────────── */
  var DOM = {};

  function cacheDom() {
    DOM = {
      chatArea: document.getElementById('chat-area'),
      chatMessages: document.getElementById('chat-messages'),
      chatInput: document.getElementById('chat-input'),
      chatVoiceFeedback: document.getElementById('chat-voice-feedback'),
      sendBtn: document.getElementById('send-btn'),
      liveCallBtn: document.getElementById('live-call-btn'),
      endCallBtn: document.getElementById('end-call-btn'),
      liveCallStatus: document.getElementById('live-call-status'),
      callStatusText: document.getElementById('call-status-text'),
      stopCallBtn: document.getElementById('stop-call-btn'),
      vyvyAvatar: document.getElementById('vyvy-avatar'),
      vyvyStatus: document.getElementById('vyvy-status'),
      homeWelcomeBubble: document.getElementById('home-welcome-bubble'),
      homeGradeBadge: document.getElementById('home-grade-badge'),
      starBalance: document.getElementById('star-balance'),
      vyvyParticles: document.getElementById('vyvy-particles'),
      vyvyMouth: document.getElementById('vyvy-mouth'),
      quickButtons: document.querySelectorAll('.quick-btn'),
      bottomNav: document.getElementById('bottom-nav'),
      bottomNavItems: document.querySelectorAll('[data-bottom-nav]'),
      parentBtn: document.getElementById('parent-settings-btn'),
      parentOverlay: document.getElementById('parent-overlay'),
      parentPanel: document.getElementById('parent-panel'),
      pinGate: document.getElementById('pin-gate'),
      pinInput: document.getElementById('pin-input'),
      pinSubmit: document.getElementById('pin-submit'),
      pinError: document.getElementById('pin-error'),
      settingsContent: document.getElementById('settings-content'),
      nicknameInput: document.getElementById('setting-nickname'),
      ageSelect: document.getElementById('setting-age'),
      goalInput: document.getElementById('setting-goal'),
      modeBtns: document.querySelectorAll('.mode-btn'),
      closeBtn: document.getElementById('close-settings'),
      saveBtn: document.getElementById('save-settings-btn'),
      resetMemoryBtn: document.getElementById('reset-memory-btn'),
      dailySummaryBtn: document.getElementById('daily-summary-btn'),
      summaryDisplay: document.getElementById('summary-display')
    };
  }

  /* ── localStorage helpers ───────────────── */
  function lsGet(key, fallback) {
    try { var v = localStorage.getItem(key); return v !== null ? v : fallback; }
    catch (e) { return fallback; }
  }
  function lsSet(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (e) {}
  }
  function lsGetJSON(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function lsSetJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  /* ── Toast Notifications ─────────────── */
  function showToast(msg, type, duration) {
    type = type || 'info';
    duration = duration || 3000;
    var container = document.getElementById('toast-container');
    if (!container) return;
    var el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(function() {
      el.classList.add('toast-out');
      setTimeout(function() { el.remove(); }, 300);
    }, duration);
  }

  /* ── Dark Mode ────────────────────────── */
  function applyTheme(theme) {
    var root = document.documentElement;
    root.classList.remove('dark');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'auto') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      }
    }
  }

  function loadTheme() {
    var theme = lsGet(SK.THEME, 'light');
    applyTheme(theme);
    return theme;
  }

  function setupThemeToggle() {
    var lightBtn = document.getElementById('theme-light-btn');
    var darkBtn = document.getElementById('theme-dark-btn');
    var autoBtn = document.getElementById('theme-auto-btn');
    if (!lightBtn || !darkBtn || !autoBtn) return;

    var currentTheme = lsGet(SK.THEME, 'light');

    function setActive(t) {
      lightBtn.classList.toggle('active', t === 'light');
      darkBtn.classList.toggle('active', t === 'dark');
      autoBtn.classList.toggle('active', t === 'auto');
    }

    setActive(currentTheme);

    lightBtn.onclick = function() { lsSet(SK.THEME, 'light'); applyTheme('light'); setActive('light'); };
    darkBtn.onclick = function() { lsSet(SK.THEME, 'dark'); applyTheme('dark'); setActive('dark'); };
    autoBtn.onclick = function() { lsSet(SK.THEME, 'auto'); applyTheme('auto'); setActive('auto'); };

    // Listen for system theme changes in auto mode
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
        if (lsGet(SK.THEME, 'light') === 'auto') applyTheme('auto');
      });
    }
  }

  /* ── High Scores ──────────────────────── */
  function getHighScores() {
    return lsGetJSON(SK.HIGH_SCORES, {});
  }

  function saveHighScore(gameId, score) {
    var scores = getHighScores();
    var prev = scores[gameId] || 0;
    if (score > prev) {
      scores[gameId] = score;
      lsSetJSON(SK.HIGH_SCORES, scores);
      return true;
    }
    return false;
  }

  /* ── Memory System ──────────────────────── */
  function loadMemory() {
    var saved = lsGetJSON(SK.MEMORY, null);
    if (saved) {
      state.memory = Object.assign(state.memory, saved);
    }
  }

  function saveMemory() {
    lsSetJSON(SK.MEMORY, state.memory);
  }

  function inferTopics(text) {
    var lower = text.toLowerCase();
    var tags = [];
    for (var keyword in TOPIC_KEYWORDS) {
      if (lower.indexOf(keyword) !== -1) {
        tags.push(TOPIC_KEYWORDS[keyword]);
      }
    }
    return tags;
  }

  function updateMemory(userText) {
    var topics = inferTopics(userText);
    state.memory.conversation_count++;

    for (var i = 0; i < topics.length; i++) {
      var t = topics[i];
      if (state.memory.favorite_topics.indexOf(t) === -1) {
        state.memory.favorite_topics.push(t);
      }
      if (state.memory.recent_topics.indexOf(t) === -1) {
        state.memory.recent_topics.push(t);
      }
    }

    // Keep recent_topics to last 10
    if (state.memory.recent_topics.length > 10) {
      state.memory.recent_topics = state.memory.recent_topics.slice(-10);
    }

    // Keep favorite_topics to last 15
    if (state.memory.favorite_topics.length > 15) {
      state.memory.favorite_topics = state.memory.favorite_topics.slice(-15);
    }

    // Simple mood detection
    var lower = userText.toLowerCase();
    if (lower.indexOf('vui') !== -1 || lower.indexOf('thích') !== -1 || lower.indexOf('hay') !== -1) {
      state.memory.recent_mood = 'vui vẻ';
    } else if (lower.indexOf('buồn') !== -1 || lower.indexOf('khóc') !== -1) {
      state.memory.recent_mood = 'buồn';
    } else if (lower.indexOf('giận') !== -1 || lower.indexOf('tức') !== -1) {
      state.memory.recent_mood = 'giận';
    }

    // English word detection
    var engWords = ['hello', 'cat', 'dog', 'red', 'blue', 'green', 'yellow', 'one', 'two', 'three',
                    'mother', 'father', 'apple', 'book', 'happy', 'sad', 'love', 'friend', 'school',
                    'teacher', 'water', 'milk', 'toy', 'sun', 'moon', 'star', 'tree', 'flower'];
    for (var j = 0; j < engWords.length; j++) {
      if (lower.indexOf(engWords[j]) !== -1 && state.memory.known_english.indexOf(engWords[j]) === -1) {
        state.memory.known_english.push(engWords[j]);
      }
    }
    if (state.memory.known_english.length > 20) {
      state.memory.known_english = state.memory.known_english.slice(-20);
    }

    saveMemory();
  }

  function resetMemory() {
    state.memory = {
      favorite_topics: [],
      disliked_topics: [],
      preferred_activity: '',
      recent_topics: [],
      recent_mood: '',
      known_english: [],
      conversation_count: 0,
      daily_summary: ''
    };
    state.conversationHistory = [];
    saveMemory();
  }

  /* ── PIN (SHA-256) ─────────────────────── */
  function hashPin(pin) {
    if (window.crypto && window.crypto.subtle) {
      var enc = new TextEncoder();
      return window.crypto.subtle.digest('SHA-256', enc.encode(pin)).then(function (buf) {
        var arr = new Uint8Array(buf);
        var hex = '';
        for (var i = 0; i < arr.length; i++) {
          var h = arr[i].toString(16);
          hex += h.length < 2 ? '0' + h : h;
        }
        return hex;
      });
    }
    // Simple fallback
    var hash = 0;
    for (var i = 0; i < pin.length; i++) {
      hash = ((hash << 5) - hash + pin.charCodeAt(i)) | 0;
    }
    var hex = '';
    for (var j = 0; j < 8; j++) {
      var v = ((hash >> (j * 4)) & 0xf).toString(16);
      hex += v;
    }
    // Pad to 64 chars
    while (hex.length < 64) hex += hex;
    return Promise.resolve(hex.substring(0, 64));
  }

  function verifyPin(input) {
    var stored = lsGet(SK.PIN, '');
    if (!stored) {
      return hashPin(input).then(function (h) { lsSet(SK.PIN, h); return true; });
    }
    return hashPin(input).then(function (h) { return h === stored; });
  }

  /* ── PIN Lockout ────────────────────────── */
  function getPinFails() { return parseInt(lsGet(SK.PIN_FAILS, '0'), 10) || 0; }
  function setPinFails(n) { lsSet(SK.PIN_FAILS, String(n)); }
  function getPinLock() { return parseInt(lsGet(SK.PIN_LOCK, '0'), 10) || 0; }
  function setPinLock(ts) { lsSet(SK.PIN_LOCK, String(ts)); }
  function isPinLocked() {
    var until = getPinLock();
    if (until > 0 && Date.now() < until) return true;
    if (until > 0 && Date.now() >= until) { setPinLock(0); setPinFails(0); }
    return false;
  }

  /* ── Settings ───────────────────────────── */
  function loadSettings() {
    state.settings.nickname = lsGet(SK.NICKNAME, 'Bé');
    state.settings.age = parseInt(lsGet(SK.AGE, '8'), 10) || 8;
    state.settings.mode = lsGet(SK.MODE, 'balanced');
    state.settings.goal = lsGet(SK.GOAL, 'vui vẻ và học hỏi');
    state.settings.bot_name = lsGet(SK.BOT_NAME, 'VyVy') || 'VyVy';
    state.settings.voice_gender = lsGet(SK.VOICE_GENDER, 'female');
  }

  function saveSettings() {
    lsSet(SK.NICKNAME, state.settings.nickname);
    lsSet(SK.AGE, state.settings.age);
    lsSet(SK.MODE, state.settings.mode);
    lsSet(SK.GOAL, state.settings.goal);
    lsSet(SK.BOT_NAME, state.settings.bot_name);
    lsSet(SK.SETTINGS_DONE, 'true');
    lsSet(SK.VOICE_GENDER, state.settings.voice_gender);
  }

  function isSettingsDone() {
    return lsGet(SK.SETTINGS_DONE, 'false') === 'true';
  }

  function deriveAgeFromGrade(grade) {
    var g = Math.max(1, Math.min(5, parseInt(grade, 10) || 3));
    return g + 5;
  }

  function getSavedGrade(defaultGrade) {
    var savedGrade = parseInt(lsGet(SK.GRADE, String(defaultGrade || 3)), 10);
    if (savedGrade >= 1 && savedGrade <= 5) return savedGrade;
    return defaultGrade || 3;
  }

  function updateHomeProfileBadges() {
    var grade = getSavedGrade(3);
    var gradeBadge = document.getElementById('home-grade-badge');
    if (gradeBadge) {
      gradeBadge.textContent = 'Lớp ' + grade;
      gradeBadge.classList.remove('hidden');
    }

    var starWrap = document.getElementById('star-balance');
    var starCount = document.getElementById('star-count');
    var stars = parseInt(localStorage.getItem(SK.STARS) || '0', 10) || 0;
    if (starCount) starCount.textContent = String(stars);
    if (starWrap) starWrap.classList.toggle('is-zero-stars', stars <= 0);
    updateHomeHudStats({ stars: stars });
    if (DOM.vyvyStatus && stars <= 0) {
      DOM.vyvyStatus.textContent = 'Học bài đầu tiên để nhận sao nhé!';
    }
  }

  /* ── Daily counter ──────────────────────── */
  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function getDailyCount() {
    if (lsGet(SK.DAILY_DATE, '') !== todayStr()) {
      lsSet(SK.DAILY_DATE, todayStr());
      lsSet(SK.DAILY_COUNT, '0');
      return 0;
    }
    return parseInt(lsGet(SK.DAILY_COUNT, '0'), 10) || 0;
  }
  function incDailyCount() {
    var c = getDailyCount() + 1;
    lsSet(SK.DAILY_COUNT, String(c));
    lsSet(SK.DAILY_DATE, todayStr());
    return c;
  }
  function isDailyLimit() { return getDailyCount() >= MAX_DAILY_MSG; }

  /* ── Time Tracking ──────────────────────── */
  function isFinitePositiveNumber(value) {
    return typeof value === 'number' && isFinite(value) && value > 0;
  }

  function getSessionStartMs() {
    var raw = parseInt(lsGet(SK.SESSION_START, '0'), 10);
    var now = Date.now();
    var today = todayStr();
    if (!isFinite(raw) || raw <= 0 || raw > now || new Date(raw).toISOString().slice(0, 10) !== today) {
      raw = now;
      lsSet(SK.SESSION_START, String(raw));
    }
    return raw;
  }

  function repairDailyTimeState() {
    var today = todayStr();
    var storedDate = lsGet(SK.DAILY_TIME_DATE, '');
    var rawUsed = parseInt(lsGet(SK.DAILY_TIME, '0'), 10);
    if (storedDate !== today || !isFinite(rawUsed) || rawUsed < 0 || rawUsed > 1440) {
      lsSet(SK.DAILY_TIME_DATE, today);
      lsSet(SK.DAILY_TIME, '0');
      return 0;
    }
    return rawUsed;
  }

  function getDailyTime() {
    return repairDailyTimeState();
  }

  function addDailyTime(minutes) {
    minutes = Math.floor(Number(minutes) || 0);
    if (!isFinite(minutes) || minutes <= 0 || minutes > 24 * 60) return getDailyTime();
    var t = Math.min(1440, getDailyTime() + minutes);
    lsSet(SK.DAILY_TIME, String(t));
    lsSet(SK.DAILY_TIME_DATE, todayStr());
    return t;
  }

  function getTimeLimit() {
    var limit = parseInt(lsGet(SK.TIME_LIMIT, '60'), 10);
    if (!isFinite(limit) || limit < 5 || limit > 240) {
      limit = 60;
      lsSet(SK.TIME_LIMIT, String(limit));
    }
    return limit;
  }

  function checkTimeLimit() {
    var limit = getTimeLimit();
    var used = getDailyTime();
    var sessionStart = getSessionStartMs();
    var elapsedMs = Date.now() - sessionStart;
    if (!isFinitePositiveNumber(limit) || !isFinite(used) || used < 0 || !isFinite(elapsedMs) || elapsedMs < 0) return false;
    if (used >= limit && elapsedMs >= limit * 60 * 1000) {
      showToast('Hết thời gian sử dụng hôm nay (' + limit + ' phút). Mai mình tiếp tục nhé!', 'warning', 5000);
      return true;
    }
    if (used >= limit - 10 && used < limit - 9) {
      showToast('Còn ' + (limit - used) + ' phút nữa hết giờ!', 'warning', 4000);
    }
    return false;
  }

  // Track session time every minute
  (function trackTime() {
    repairDailyTimeState();
    var start = getSessionStartMs();
    setInterval(function() {
      var now = Date.now();
      if (document.hidden) {
        start = now;
        lsSet(SK.SESSION_START, String(now));
        return;
      }
      var elapsedMs = now - start;
      if (!isFinite(elapsedMs) || elapsedMs < 0) {
        start = now;
        lsSet(SK.SESSION_START, String(now));
        return;
      }
      var elapsed = Math.floor(elapsedMs / 60000);
      if (elapsed > 0) {
        addDailyTime(elapsed);
        start = now;
        checkTimeLimit();
      }
    }, 60000);
  })();

  /* ── Avatar State ───────────────────────── */
  function setAvatarState(newState) {
    state.mode = newState;
    if (DOM.vyvyAvatar) {
      DOM.vyvyAvatar.className = 'vyvy-avatar ' + newState;
    }
    if (DOM.vyvyStatus) {
      var bn = state.settings.bot_name || 'VyVy';
      var labels = {
        idle: 'Học 1 bài để nhận sao nhé!',
        listening: bn + ' đang nghe...',
        thinking: bn + ' đang nghĩ...',
        speaking: bn + ' đang nói...',
        happy: bn + ' vui quá!',
        sleepy: bn + ' buồn ngủ...'
      };
      DOM.vyvyStatus.textContent = labels[newState] || labels.idle;
    }
    // Disable input during non-idle states
    if (DOM.chatInput) DOM.chatInput.disabled = newState !== 'idle';
    if (DOM.sendBtn) DOM.sendBtn.disabled = newState !== 'idle';
  }

  /* ── VyVy Outfit Switching ──────────────── */
  function setVyvyOutfit(outfit) {
    var avatar = document.getElementById('vyvy-avatar');
    if (avatar) avatar.setAttribute('data-outfit', outfit || 'uniform');
  }

  function spawnParticle(emoji) {
    if (!DOM.vyvyParticles) return;
    var el = document.createElement('span');
    el.className = 'star';
    el.textContent = emoji;
    el.style.left = (20 + Math.random() * 60) + '%';
    el.style.top = (20 + Math.random() * 60) + '%';
    DOM.vyvyParticles.appendChild(el);
    setTimeout(function () { el.remove(); }, 1000);
  }

  function showHappy() {
    setAvatarState('happy');
    spawnParticle('⭐');
    spawnParticle('✨');
    spawnParticle('💖');
    setTimeout(function () { setAvatarState('idle'); }, 1500);
  }

  /* ── Markdown Renderer (safe, minimal) ──── */
  function renderMarkdown(text) {
    if (!text) return '';
    var s = text;
    // Escape HTML entities first (prevent XSS)
    s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Bold: **text** or __text__
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // Italic: *text* or _text_ (but not inside words with underscores)
    s = s.replace(/(?<!\w)\*(.+?)\*(?!\w)/g, '<em>$1</em>');
    // Inline code: `code`
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Unordered list: - item or • item
    s = s.replace(/(?:^|\n)[\-\•]\s*(.+?)(?=\n|$)/g, function(m, item) {
      return '<br>• ' + item;
    });
    // Newlines → <br>
    s = s.replace(/\n/g, '<br>');
    return s;
  }

  /* ── Chat Rendering ──── */
  function appendMessage(text, sender) {
    if (!DOM.chatMessages || !text) return;
    var row = document.createElement('div');
    row.className = 'message message-' + sender;
    var bubble = document.createElement('div');
    bubble.className = 'bubble';
    if (sender === 'bot') {
      bubble.innerHTML = renderMarkdown(text);
    } else {
      bubble.textContent = text;
    }
    row.appendChild(bubble);
    DOM.chatMessages.appendChild(row);
    scrollToBottom();
  }

  function scrollToBottom() {
    if (!DOM.chatArea) return;
    requestAnimationFrame(function() {
      DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
    });
  }

  function showTyping() {
    if (!DOM.chatMessages) return;
    hideTyping();
    var row = document.createElement('div');
    row.className = 'message message-bot typing-message';
    row.id = 'typing-indicator';
    var bubble = document.createElement('div');
    bubble.className = 'bubble typing-bubble';
    var avatar = document.createElement('img');
    avatar.className = 'typing-avatar';
    avatar.src = getVyvyAssetUrl('thinking');
    avatar.alt = '';
    avatar.setAttribute('aria-hidden', 'true');
    var content = document.createElement('div');
    content.className = 'typing-content';
    var label = document.createElement('div');
    label.className = 'typing-label';
    label.textContent = 'VyVy đang nghĩ...';
    var dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 3; i++) {
      var dot = document.createElement('div');
      dot.className = 'typing-dot';
      dots.appendChild(dot);
    }
    content.appendChild(label);
    content.appendChild(dots);
    bubble.appendChild(avatar);
    bubble.appendChild(content);
    row.appendChild(bubble);
    DOM.chatMessages.appendChild(row);
    scrollToBottom();
  }

  function hideTyping() {
    var el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  function hasUserChatMessage() {
    return !!(DOM.chatMessages && DOM.chatMessages.querySelector('.message-user'));
  }

  function setHomeChatSuggestionsVisible(visible) {
    var quick = document.getElementById('quick-buttons');
    var app = document.getElementById('app');
    if (!quick || !app) return;
    var shouldShow = visible &&
      currentView === 'home' &&
      app.classList.contains('home-chat-drawer-open') &&
      !hasUserChatMessage();
    quick.classList.toggle('hidden', !shouldShow);
  }

  function hideHomeChatSuggestions() {
    setHomeChatSuggestionsVisible(false);
  }

  function setChatVoiceFeedback(message, tone) {
    if (!DOM.chatVoiceFeedback) return;
    var hasMessage = !!(message && message.trim());
    DOM.chatVoiceFeedback.textContent = hasMessage ? message.trim() : '';
    DOM.chatVoiceFeedback.classList.toggle('hidden', !hasMessage);
    DOM.chatVoiceFeedback.classList.toggle('is-listening', tone === 'listening');
    DOM.chatVoiceFeedback.classList.toggle('is-error', tone === 'error');
  }

  /* ── Voice Selection (Vietnamese priority) ── */
  function getAvailableVoices() {
    if (!state.synthesis) return [];
    return state.synthesis.getVoices();
  }

  function isVietnameseVoice(v) {
    if (!v) return false;
    var lang = (v.lang || '').toLowerCase();
    var name = (v.name || '').toLowerCase();
    return lang.indexOf('vi') === 0 ||
           name.indexOf('vietnamese') !== -1 ||
           name.indexOf('vietnam') !== -1 ||
           name.indexOf('việt') !== -1 ||
           name.indexOf('hoai') !== -1 ||
           name.indexOf('namminh') !== -1 ||
           name.indexOf('viet') !== -1;
  }

  function voiceMatchesGender(v, gender) {
    var name = (v.name || '').toLowerCase();
    if (gender === 'male') {
      return name.indexOf('male') !== -1 || name.indexOf(' nam') !== -1 ||
             name.indexOf('man') !== -1 || name.indexOf('boy') !== -1 ||
             name.indexOf('david') !== -1 || name.indexOf('mark') !== -1;
    }
    if (gender === 'female') {
      return name.indexOf('female') !== -1 || name.indexOf('nữ') !== -1 ||
             name.indexOf('nu') !== -1 || name.indexOf('woman') !== -1 ||
             name.indexOf('girl') !== -1 || name.indexOf('linh') !== -1 ||
             name.indexOf('mai') !== -1 || name.indexOf('an') !== -1 ||
             name.indexOf('hoa') !== -1 || name.indexOf('hằng') !== -1;
    }
    return false;
  }

  function selectVietnameseVoice(preferredGender) {
    var voices = getAvailableVoices();
    if (voices.length === 0) return null;

    var gender = preferredGender || state.settings.voice_gender || 'female';
    var viExactGender = [];
    var viExact = [];
    var viPrefixGender = [];
    var viPrefix = [];
    var nameMatchGender = [];
    var nameMatch = [];

    for (var i = 0; i < voices.length; i++) {
      var v = voices[i];
      var lang = (v.lang || '').toLowerCase();
      var name = (v.name || '').toLowerCase();
      var isVi = false;
      var isViExact = lang === 'vi-vn';
      var isViPrefix = lang.indexOf('vi') === 0;
      var isNameVi = name.indexOf('vietnamese') !== -1 ||
                     name.indexOf('vietnam') !== -1 ||
                     name.indexOf('việt') !== -1;

      if (isViExact || isViPrefix || isNameVi) {
        isVi = true;
        var genderMatch = voiceMatchesGender(v, gender);

        if (isViExact && genderMatch) viExactGender.push(v);
        else if (isViExact) viExact.push(v);
        else if (isViPrefix && genderMatch) viPrefixGender.push(v);
        else if (isViPrefix) viPrefix.push(v);
        else if (isNameVi && genderMatch) nameMatchGender.push(v);
        else if (isNameVi) nameMatch.push(v);
      }
    }

    // Priority order
    if (viExactGender.length > 0) return viExactGender[0];
    if (viPrefixGender.length > 0) return viPrefixGender[0];
    if (viExact.length > 0) return viExact[0];
    if (viPrefix.length > 0) return viPrefix[0];
    if (nameMatchGender.length > 0) return nameMatchGender[0];
    if (nameMatch.length > 0) return nameMatch[0];

    return null;
  }

  function hasVietnameseVoice() {
    return selectVietnameseVoice('female') !== null || selectVietnameseVoice('male') !== null;
  }

  function hasMaleVietnameseVoice() {
    return selectVietnameseVoice('male') !== null;
  }

  function renderVoiceStatus() {
    var nameEl = document.getElementById('voice-name-display');
    var langEl = document.getElementById('voice-lang-display');
    var viEl = document.getElementById('voice-vi-status');
    var maleEl = document.getElementById('voice-male-status');

    var voice = state.vyvyVoice;
    if (nameEl) nameEl.textContent = voice ? voice.name : '(giọng từ server)';
    if (langEl) langEl.textContent = voice ? voice.lang : 'vi-VN (server)';

    var viAvail = hasVietnameseVoice();
    if (viEl) {
      viEl.textContent = viAvail ? 'Có (trình duyệt)' : 'Dùng giọng server (edge-tts)';
      viEl.style.color = viAvail ? '#2E7D32' : '#C62828';
    }

    var maleAvail = hasMaleVietnameseVoice();
    if (maleEl) {
      if (state.settings.voice_gender === 'male') {
        maleEl.textContent = maleAvail ? 'Có' : 'Không có (dùng giọng nữ)';
        maleEl.style.color = maleAvail ? '#2E7D32' : '#E65100';
      } else {
        maleEl.textContent = maleAvail ? 'Có' : 'Không';
        maleEl.style.color = maleAvail ? '#2E7D32' : '#A1887F';
      }
    }

    // Render full voice debug list
    var allVoices = getAvailableVoices();
    var countEl = document.getElementById('voice-count');
    var listEl = document.getElementById('voice-debug-list');
    if (countEl) countEl.textContent = allVoices.length;
    if (listEl) {
      listEl.innerHTML = '';
      if (allVoices.length === 0) {
        listEl.innerHTML = '<div class="voice-debug-item">Không có giọng nào. Nhấn "Tải lại danh sách giọng".</div>';
      } else {
        for (var i = 0; i < allVoices.length; i++) {
          var v = allVoices[i];
          var item = document.createElement('div');
          item.className = 'voice-debug-item' + (isVietnameseVoice(v) ? ' vi-voice' : '');
          var viTag = isVietnameseVoice(v) ? ' ✓ Tiếng Việt' : '';
          var selectedTag = (voice && v.name === voice.name && v.lang === voice.lang) ? ' ★ ĐANG DÙNG' : '';
          item.textContent = v.name + ' [' + v.lang + ']' + viTag + selectedTag;
          listEl.appendChild(item);
        }
      }
    }

    console.log('[VyVy Voice] Selected:', voice ? voice.name + ' (' + voice.lang + ')' : 'NONE');
    console.log('[VyVy Voice] Total voices:', allVoices.length);
    console.log('[VyVy Voice] Vietnamese available:', viAvail);
  }

  function loadVoices() {
    if (!state.synthesis) {
      console.log('[VyVy Voice] speechSynthesis not available');
      return;
    }
    // Initial load attempt
    var voices = state.synthesis.getVoices();
    console.log('[VyVy Voice] Initial voice count:', voices.length);

    // Async voice loading handler
    state.synthesis.onvoiceschanged = function () {
      var v = state.synthesis.getVoices();
      console.log('[VyVy Voice] voiceschanged fired, count:', v.length);
      state.vyvyVoice = selectVietnameseVoice(state.settings.voice_gender);
      renderVoiceStatus();
    };

    // First selection
    state.vyvyVoice = selectVietnameseVoice(state.settings.voice_gender);

    // Multiple retry attempts for async voice loading
    var retryDelays = [200, 500, 1000, 2000];
    retryDelays.forEach(function(delay) {
      setTimeout(function() {
        var v = state.synthesis.getVoices();
        if (v.length > 0 && !state.vyvyVoice) {
          state.vyvyVoice = selectVietnameseVoice(state.settings.voice_gender);
          console.log('[VyVy Voice] Retry at ' + delay + 'ms, voices:', v.length, 'selected:', state.vyvyVoice ? state.vyvyVoice.name : 'NONE');
        }
      }, delay);
    });
  }

  /* ── TTS (Speech Synthesis) ─────────────── */
  var _backendTtsAvailable = true;

  function speakViaBackend(text, onEnd) {
    if (!_backendTtsAvailable) {
      if (onEnd) onEnd();
      return;
    }
    stopCurrentAudio();
    var requestId = ++ttsState.requestId;
    ttsState.state = 'loading';
    setAvatarState('speaking');

    var gender = state.settings.voice_gender || 'female';
    var preset = currentVoicePreset || 'ban-nho';
    fetch(API_BASE + '/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ text: text, voice: gender, preset: preset })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('TTS backend error');
        return res.blob();
      })
      .then(function (blob) {
        if (requestId !== ttsState.requestId) return;
        var url = URL.createObjectURL(blob);
        var audio = new Audio(url);
        ttsState.currentAudio = audio;
        ttsState.state = 'playing';

        audio.onended = function () {
          if (requestId !== ttsState.requestId) return;
          URL.revokeObjectURL(url);
          ttsState.currentAudio = null;
          ttsState.state = 'idle';
          setAvatarState('idle');
          if (onEnd) onEnd();
        };
        audio.onerror = function () {
          if (requestId !== ttsState.requestId) return;
          URL.revokeObjectURL(url);
          ttsState.currentAudio = null;
          ttsState.state = 'idle';
          setAvatarState('idle');
          if (onEnd) onEnd();
        };
        audio.play();
      })
      .catch(function () {
        if (requestId !== ttsState.requestId) return;
        ttsState.state = 'idle';
        _backendTtsAvailable = false;
        setAvatarState('idle');
        if (onEnd) onEnd();
      });
  }

  function speak(text, onEnd) {
    if (!state.synthesis) {
      speakViaBackend(text, onEnd);
      return;
    }
    stopCurrentAudio();
    state.synthesis.cancel();

    // Re-select voice if null (async voices may have loaded)
    if (!state.vyvyVoice) {
      state.vyvyVoice = selectVietnameseVoice(state.settings.voice_gender);
    }

    // If no Vietnamese voice in browser, use backend TTS
    if (!state.vyvyVoice) {
      speakViaBackend(text, onEnd);
      return;
    }

    var utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'vi-VN';
    var preset = VOICE_PRESETS[currentVoicePreset] || VOICE_PRESETS['ban-nho'];
    utt.pitch = preset.wsPitch || 1.6;
    utt.rate  = preset.wsRate  || 1.1;
    utt.volume = 1;
    utt.voice = state.vyvyVoice;

    utt.onend = function () {
      setAvatarState('idle');
      if (onEnd) onEnd();
    };
    utt.onerror = function () {
      setAvatarState('idle');
      if (onEnd) onEnd();
    };

    state.currentUtterance = utt;
    setAvatarState('speaking');
    state.synthesis.speak(utt);
  }

  /* ── Chat API ───────────────────────────── */
  function sendMessage(text, sessionMode) {
    if (!text || !text.trim()) return;
    if (state.isProcessing) return;
    hideHomeChatSuggestions();
    if (isDailyLimit()) {
      appendMessage('Hôm nay bạn nói chuyện nhiều rồi, mai mình tiếp tục nhé! VyVy yêu bạn!', 'bot');
      return;
    }

    state.isProcessing = true;
    setAvatarState('thinking');
    showTyping();

    var mode = sessionMode || state.sessionMode || 'free_chat';

    var payload = {
      text: text.trim(),
      child_age: state.settings.age,
      mode: state.settings.mode,
      nickname: state.settings.nickname,
      goal: state.settings.goal,
      session_mode: mode,
      learning_goal: state.settings.goal,
      profile_memory: state.memory,
      history: state.conversationHistory.slice(-10)
    };

    fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Server error: ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var reply = data.reply || data.message || 'Xin lỗi, VyVy chưa hiểu lắm. Bạn nói lại nhé!';
        hideTyping();
        state.conversationHistory.push({ role: 'user', content: text.trim() });
        state.conversationHistory.push({ role: 'assistant', content: reply });
        if (state.conversationHistory.length > 20) {
          state.conversationHistory = state.conversationHistory.slice(-20);
        }
        incDailyCount();
        updateMemory(text.trim());
        appendMessage(reply, 'bot');

        // In live call mode, speak and auto-listen
        if (state.liveCallActive) {
          speak(reply, function () {
            if (state.liveCallActive) startListening();
          });
        } else if (state.micMode === 'ptt' || state.micMode === 'hold') {
          speak(reply);
          resetMicUI();
        } else {
          speak(reply);
        }
      })
      .catch(function () {
        hideTyping();
        setAvatarState('idle');
        appendMessage('VyVy đang mất kết nối một chút. Mình vẫn có thể thử lại nha.', 'bot');
      })
      .finally(function () {
        state.isProcessing = false;
      });
  }

  /* ── STT (Speech Recognition) ───────────── */
  function initSpeechRecognition() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setChatVoiceFeedback('Máy này chưa hỗ trợ micro giọng nói. Bạn nhắn chữ cho VyVy nhé.', 'error');
      if (DOM.liveCallBtn) {
        DOM.liveCallBtn.title = 'Máy này chưa hỗ trợ gọi giọng nói';
        DOM.liveCallBtn.style.opacity = '0.5';
        DOM.liveCallBtn.disabled = true;
      }
      return;
    }

    var rec = new SR();
    rec.lang = 'vi-VN';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = true;

    rec.onstart = function () {
      setAvatarState('listening');
      setChatVoiceFeedback('VyVy đang nghe...', 'listening');
      if (DOM.callStatusText) DOM.callStatusText.textContent = 'VyVy đang nghe...';
    };

    rec.onresult = function (event) {
      var transcript = '';
      var isFinal = false;
      var confidence = 0;
      if (event.results && event.results.length > 0) {
        var lastResult = event.results[event.results.length - 1];
        transcript = lastResult[0].transcript || '';
        confidence = lastResult[0].confidence || 0;
        isFinal = lastResult.isFinal;
      }

      clearTimeout(state.silenceTimer);
      clearTimeout(state.silenceTimeout);

      if (transcript.trim() && isFinal) {
        setChatVoiceFeedback('', '');
        if (confidence > 0 && confidence < 0.4) {
          showToast('Bạn nói lại được không? VyVy nghe chưa rõ', 'info', 3000);
          if (state.liveCallActive) {
            setTimeout(function () { startListening(); }, 500);
          }
          return;
        }
        if (confidence >= 0.4 && confidence < 0.6) {
          showToast('VyVy nghe hơi mơ hồ, bạn nói rõ hơn nhé!', 'info', 2000);
        }
        appendMessage(transcript.trim(), 'user');
        sendMessage(transcript.trim());
      } else if (transcript.trim()) {
        setChatVoiceFeedback('VyVy nghe được: ' + transcript.trim(), 'listening');
      } else if (!transcript.trim() && isFinal) {
        setChatVoiceFeedback('', '');
        if (state.liveCallActive) {
          setTimeout(function () { startListening(); }, 500);
        } else if (state.pttActive || state.holdActive) {
          setAvatarState('idle');
        } else {
          setAvatarState('idle');
        }
      }

      if ((state.pttActive || state.holdActive) && isFinal && transcript.trim()) {
        state.pttActive = false;
        state.holdActive = false;
        resetMicUI();
      }
    };

    rec.onerror = function (event) {
      console.log('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setChatVoiceFeedback('Bạn cho phép micro để nói với VyVy nhé.', 'error');
        appendMessage('Cho phép micro để nói chuyện với VyVy nhé! Nhấn vào biểu tượng micro trên thanh địa chỉ.', 'bot');
        if (state.liveCallActive) stopLiveCall();
        if (state.pttActive || state.holdActive) resetMicUI();
        setAvatarState('idle');
        return;
      }
      if (event.error === 'network') {
        setChatVoiceFeedback('Mạng yếu quá, bạn thử lại nhé!', 'error');
        showToast('Mạng yếu quá, bạn thử lại nhé!', 'warning', 3000);
        if (state.pttActive || state.holdActive) resetMicUI();
        setAvatarState('idle');
        return;
      }
      if (event.error === 'no-speech' || event.error === 'aborted') {
        if (state.liveCallActive) {
          setTimeout(function () {
            if (state.liveCallActive && !state.isProcessing) startListening();
          }, 500);
        } else if (state.pttActive) {
          setChatVoiceFeedback('VyVy chưa nghe thấy gì. Bạn bấm mic nói lại nhé!', 'error');
          showToast('VyVy không nghe thấy gì. Bạn bấm mic nói lại nhé!', 'info', 3000);
          resetMicUI();
        } else if (state.holdActive) {
          resetMicUI();
        } else {
          setAvatarState('idle');
        }
        return;
      }
      if (state.liveCallActive) {
        setTimeout(function () {
          if (state.liveCallActive && !state.isProcessing) startListening();
        }, 1000);
      } else {
        if (state.pttActive || state.holdActive) resetMicUI();
        setAvatarState('idle');
      }
    };

    rec.onend = function () {
      if (!state.liveCallActive && !state.pttActive && !state.holdActive) {
        setChatVoiceFeedback('', '');
      }
      if (state.liveCallActive && !state.isProcessing) {
        setTimeout(function () {
          if (state.liveCallActive && !state.isProcessing) {
            try { rec.start(); } catch (e) {}
          }
        }, 200);
      } else if (state.mode === 'listening') {
        setAvatarState('idle');
      }
    };

    state.recognition = rec;
  }

  function startListening() {
    if (!state.recognition) return;
    if (state.isProcessing) return;
    stopCurrentAudio();
    try {
      if (state.synthesis) state.synthesis.cancel();
      state.recognition.start();
    } catch (e) {
      // Already started, stop and restart
      try {
        state.recognition.stop();
        setTimeout(function() {
          try { state.recognition.start(); } catch (e2) {}
        }, 100);
      } catch (e2) {}
    }
  }

  function stopListening() {
    if (state.recognition) {
      try { state.recognition.stop(); } catch (e) {}
    }
  }

  /* ── Live Call Lite ─────────────────────── */
  function startLiveCall() {
    if (!state.recognition) {
      appendMessage('Máy này chưa hỗ trợ gọi giọng nói. Bạn nhắn chữ cho VyVy nhé.', 'bot');
      return;
    }
    state.liveCallActive = true;
    state.sessionMode = 'live_call';

    // Update UI
    if (DOM.liveCallBtn) DOM.liveCallBtn.classList.add('hidden');
    if (DOM.endCallBtn) DOM.endCallBtn.classList.remove('hidden');
    if (DOM.liveCallStatus) DOM.liveCallStatus.classList.remove('hidden');
    if (DOM.callStatusText) DOM.callStatusText.textContent = 'VyVy đang nghe...';

    appendMessage('Bắt đầu gọi với VyVy! Bạn nói đi nhé!', 'bot');
    startListening();
  }

  function stopLiveCall() {
    state.liveCallActive = false;
    state.sessionMode = 'free_chat';

    stopListening();
    stopCurrentAudio();
    if (state.synthesis) state.synthesis.cancel();

    setAvatarState('idle');

    if (DOM.liveCallBtn) DOM.liveCallBtn.classList.remove('hidden');
    if (DOM.endCallBtn) DOM.endCallBtn.classList.add('hidden');
    if (DOM.liveCallStatus) DOM.liveCallStatus.classList.add('hidden');

    appendMessage('Đã kết thúc cuộc gọi với VyVy. Bạn tiếp tục nhắn chữ nhé!', 'bot');
  }

  /* ── Push-to-Talk (PTT) ────────────────── */
  function startPTT() {
    if (!state.recognition) {
      appendMessage('Máy này chưa hỗ trợ giọng nói. Bạn nhắn chữ cho VyVy nhé.', 'bot');
      return;
    }
    if (state.pttActive || state.isProcessing) return;
    stopCurrentAudio();
    if (state.synthesis) state.synthesis.cancel();

    state.pttActive = true;
    state.sessionMode = 'ptt';
    playSound('mic_on');
    setAvatarState('listening');

    if (DOM.liveCallBtn) {
      DOM.liveCallBtn.classList.add('listening');
      DOM.liveCallBtn.title = 'Đang nghe... Bấm để dừng';
    }

    try {
      state.recognition.continuous = false;
      state.recognition.start();
    } catch (e) {
      try {
        state.recognition.stop();
        setTimeout(function () {
          try { state.recognition.start(); } catch (e2) { resetMicUI(); }
        }, 100);
      } catch (e2) { resetMicUI(); }
    }

    clearTimeout(state.silenceTimer);
    state.silenceTimer = setTimeout(function () {
      if (state.pttActive && !state.isProcessing) {
        showToast('Bạn còn muốn nói gì không?', 'info', 3000);
        state.silenceTimeout = setTimeout(function () {
          if (state.pttActive && !state.isProcessing) stopPTT();
        }, 5000);
      }
    }, 12000);
  }

  function stopPTT() {
    if (!state.pttActive && !state.holdActive) return;
    state.pttActive = false;
    state.holdActive = false;
    clearTimeout(state.silenceTimer);
    clearTimeout(state.silenceTimeout);

    try { if (state.recognition) state.recognition.stop(); } catch (e) {}
    playSound('mic_off');
    resetMicUI();
  }

  function resetMicUI() {
    state.pttActive = false;
    state.holdActive = false;
    setAvatarState('idle');
    if (DOM.liveCallBtn) {
      DOM.liveCallBtn.classList.remove('listening');
      DOM.liveCallBtn.title = getMicTitle();
    }
    if (DOM.endCallBtn) DOM.endCallBtn.classList.add('hidden');
    if (DOM.liveCallStatus) DOM.liveCallStatus.classList.add('hidden');
  }

  /* ── Hold-to-Talk ──────────────────────── */
  function startHoldToTalk() {
    if (!state.recognition) {
      appendMessage('Máy này chưa hỗ trợ giọng nói. Bạn nhắn chữ cho VyVy nhé.', 'bot');
      return;
    }
    if (state.holdActive || state.isProcessing) return;
    stopCurrentAudio();
    if (state.synthesis) state.synthesis.cancel();

    state.holdActive = true;
    state.sessionMode = 'hold';
    playSound('mic_on');
    setAvatarState('listening');

    if (DOM.liveCallBtn) {
      DOM.liveCallBtn.classList.add('listening');
      DOM.liveCallBtn.title = 'Đang nghe... Thả ra để gửi';
    }

    try {
      state.recognition.continuous = true;
      state.recognition.start();
    } catch (e) {
      try {
        state.recognition.stop();
        setTimeout(function () {
          try { state.recognition.start(); } catch (e2) { resetMicUI(); }
        }, 100);
      } catch (e2) { resetMicUI(); }
    }
  }

  function stopHoldToTalk() {
    if (!state.holdActive) return;
    state.holdActive = false;
    try { if (state.recognition) state.recognition.stop(); } catch (e) {}
    playSound('mic_off');
    resetMicUI();
  }

  /* ── Mic Mode Management ──────────────── */
  function getMicTitle() {
    switch (state.micMode) {
      case 'ptt': return 'Bấm để nói';
      case 'hold': return 'Giữ để nói';
      case 'live_call': return 'Gọi VyVy';
      default: return 'Gọi VyVy';
    }
  }

  function loadMicMode() {
    state.micMode = lsGet(SK.MIC_MODE, 'ptt');
  }

  function applyMicMode(mode) {
    state.micMode = mode;
    lsSet(SK.MIC_MODE, mode);
    if (DOM.liveCallBtn) DOM.liveCallBtn.title = getMicTitle();
    teardownMicListeners();
    setupMicListeners();
  }

  var _micHandlers = null;

  function teardownMicListeners() {
    if (!_micHandlers) return;
    if (DOM.liveCallBtn) {
      DOM.liveCallBtn.removeEventListener('click', _micHandlers.click);
      DOM.liveCallBtn.removeEventListener('mousedown', _micHandlers.mousedown);
      DOM.liveCallBtn.removeEventListener('touchstart', _micHandlers.touchstart);
      DOM.liveCallBtn.removeEventListener('mouseup', _micHandlers.mouseup);
      DOM.liveCallBtn.removeEventListener('touchend', _micHandlers.touchend);
      DOM.liveCallBtn.removeEventListener('touchcancel', _micHandlers.touchcancel);
      DOM.liveCallBtn.removeEventListener('contextmenu', _micHandlers.contextmenu);
    }
    _micHandlers = null;
  }

  function setupMicListeners() {
    if (!DOM.liveCallBtn) return;

    _micHandlers = {
      click: function () {
        if (state.micMode === 'ptt') {
          if (state.pttActive) stopPTT(); else startPTT();
        } else if (state.micMode === 'live_call') {
          startLiveCall();
        }
      },
      mousedown: function (e) {
        if (state.micMode === 'hold') { e.preventDefault(); startHoldToTalk(); }
      },
      touchstart: function (e) {
        if (state.micMode === 'hold') { e.preventDefault(); startHoldToTalk(); }
      },
      mouseup: function () {
        if (state.micMode === 'hold') stopHoldToTalk();
      },
      touchend: function () {
        if (state.micMode === 'hold') stopHoldToTalk();
      },
      touchcancel: function () {
        if (state.micMode === 'hold') stopHoldToTalk();
      },
      contextmenu: function (e) {
        if (state.micMode === 'hold') e.preventDefault();
      }
    };

    DOM.liveCallBtn.addEventListener('click', _micHandlers.click);
    DOM.liveCallBtn.addEventListener('mousedown', _micHandlers.mousedown);
    DOM.liveCallBtn.addEventListener('touchstart', _micHandlers.touchstart, { passive: false });
    DOM.liveCallBtn.addEventListener('mouseup', _micHandlers.mouseup);
    DOM.liveCallBtn.addEventListener('touchend', _micHandlers.touchend);
    DOM.liveCallBtn.addEventListener('touchcancel', _micHandlers.touchcancel);
    DOM.liveCallBtn.addEventListener('contextmenu', _micHandlers.contextmenu);
  }

  /* ── Sound Effects System ──────────────── */
  var audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playSound(type) {
    try {
      var ctx = getAudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      switch(type) {
        case 'click':
          osc.frequency.value = 800;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.1);
          break;
        case 'success':
          osc.frequency.value = 523;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.4);
          setTimeout(function() {
            var osc2 = ctx.createOscillator();
            var gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.frequency.value = 659;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.2, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.3);
          }, 150);
          setTimeout(function() {
            var osc3 = ctx.createOscillator();
            var gain3 = ctx.createGain();
            osc3.connect(gain3);
            gain3.connect(ctx.destination);
            osc3.frequency.value = 784;
            osc3.type = 'sine';
            gain3.gain.setValueAtTime(0.2, ctx.currentTime);
            gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc3.start(ctx.currentTime);
            osc3.stop(ctx.currentTime + 0.5);
          }, 300);
          break;
        case 'wrong':
          osc.frequency.value = 200;
          osc.type = 'sawtooth';
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
          break;
        case 'pop':
          osc.frequency.value = 400;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.08);
          break;
        case 'levelup':
          var notes = [523, 659, 784, 1047];
          notes.forEach(function(freq, i) {
            setTimeout(function() {
              var o = ctx.createOscillator();
              var g = ctx.createGain();
              o.connect(g); g.connect(ctx.destination);
              o.frequency.value = freq;
              o.type = 'sine';
              g.gain.setValueAtTime(0.15, ctx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
              o.start(ctx.currentTime);
              o.stop(ctx.currentTime + 0.3);
            }, i * 120);
          });
          return;
        case 'draw':
          osc.frequency.value = 600 + Math.random() * 200;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.05);
          break;
        case 'mic_on':
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.18, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.15);
          break;
        case 'mic_off':
          osc.frequency.setValueAtTime(660, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.15);
          break;
      }
    } catch(e) {}
  }

  function spawnCelebration(emojis, x, y) {
    var container = document.createElement('div');
    container.className = 'celebration';
    container.style.left = x + 'px';
    container.style.top = y + 'px';
    document.body.appendChild(container);

    for (var i = 0; i < 12; i++) {
      var particle = document.createElement('span');
      particle.className = 'celebration-particle';
      particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      particle.style.left = (Math.random() * 100 - 50) + 'px';
      particle.style.animationDelay = (Math.random() * 0.3) + 's';
      container.appendChild(particle);
    }

    setTimeout(function() { container.remove(); }, 2000);
  }

  function showStarBurst(x, y) {
    var el = document.createElement('div');
    el.className = 'star-burst';
    el.textContent = '⭐';
    el.style.left = (x - 50) + 'px';
    el.style.top = (y - 50) + 'px';
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 600);
  }

  /* ── Button Sound Effects ──────────────── */
  /* ── Learning Panel System ──────────── */
  var learnState = {
    currentSession: null,
    currentStep: null,
    itemIndex: 0,
    totalStars: 0,
    totalItems: 0,
    subject: '',
    unitId: '',
    activeGrade: 2,
    grades: [],
    currentOptions: null,
    explanationCache: {},
    selectedGrade: 2,
    selectedSubject: '',
    selectedSubjectLabel: '',
    selectedLesson: null,
    selectedLessonUnitId: '',
    selectedLessonTitle: '',
    selectedLessonMeta: null,
    selectedLessonElement: null,
    selectedPdfId: '',
    selectedPdfUrl: '',
    selectedPage: null,
    readerSubjects: [],
    readerLessons: [],
    readerDropdownSerial: 0
  };

  var STUDY_ASSET_BASE = '/static/assets/study/';
  var STUDY_SUBJECT_ASSETS = {
    toan: 'subject_toan.webp',
    math: 'subject_toan.webp',
    tieng_viet: 'subject_tieng_viet.webp',
    tiengviet: 'subject_tieng_viet.webp',
    van: 'subject_tieng_viet.webp',
    tu_nhien_xa_hoi: 'subject_tu_nhien_xa_hoi.webp',
    tu_nhien: 'subject_tu_nhien_xa_hoi.webp',
    khoa_hoc: 'subject_tu_nhien_xa_hoi.webp',
    hoat_dong_trai_nghiem: 'subject_hoat_dong_trai_nghiem.webp',
    am_nhac: 'subject_am_nhac.webp',
    music: 'subject_am_nhac.webp',
    giao_duc_the_chat: 'subject_giao_duc_the_chat.webp',
    the_duc: 'subject_giao_duc_the_chat.webp',
    mi_thuat: 'subject_mi_thuat.webp',
    my_thuat: 'subject_mi_thuat.webp',
    art: 'subject_mi_thuat.webp',
    tin_hoc: 'subject_tin_hoc.webp',
    cong_nghe: 'subject_cong_nghe.webp',
    dao_duc: 'subject_dao_duc.webp'
  };

  function normalizeStudyAssetKey(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function studyAssetUrl(fileName) {
    return STUDY_ASSET_BASE + fileName;
  }

  function getGradeAssetUrl(grade) {
    return studyAssetUrl('grade_' + grade + '_badge.webp');
  }

  function getSubjectAssetUrl(subject, label) {
    var key = normalizeStudyAssetKey(subject);
    var labelKey = normalizeStudyAssetKey(label);
    var fileName = STUDY_SUBJECT_ASSETS[key] || STUDY_SUBJECT_ASSETS[labelKey] || '';
    return fileName ? studyAssetUrl(fileName) : '';
  }

  function getAssetImgHtml(src, className, alt, fallbackText) {
    if (!src) return fallbackText || '';
    return '<span class="' + className + '" aria-hidden="true"><img src="' + src + '" alt="" loading="lazy" onerror="this.parentNode.classList.add(&quot;asset-error&quot;)"><span class="study-asset-fallback">' + (fallbackText || '') + '</span></span>';
  }

  function showLearningPanel() {
    openLearningPicker();
  }

  function openLearningPicker() {
    if (window.VyvyDecor) window.VyvyDecor.setBg('learn');
    showView('learning');
    backToPickerPreserveSelection();
  }

  function getStudyStars() {
    var raw = lsGet(SK.STARS, '0');
    var value = parseInt(raw, 10);
    return isNaN(value) ? 0 : value;
  }

  function updateStudyHud() {
    var stars = String(getStudyStars());
    var pickerStars = document.getElementById('study-hud-stars');
    var readerStars = document.getElementById('reader-hud-stars');
    if (pickerStars) pickerStars.textContent = stars;
    if (readerStars) readerStars.textContent = stars;
    updateHomeHudStats({ stars: stars });
  }

  function getHomeLessonGrade() {
    var grade = getSavedGrade(3);
    if (grade >= 1 && grade <= 5) return grade;
    return 3;
  }

  function updateHomeHudStats(data) {
    data = data || {};
    var stars = data.stars;
    if (stars == null && data.cumulative_stars) stars = data.cumulative_stars.total_stars;
    if (stars == null) stars = getStudyStars();
    stars = parseInt(stars, 10) || 0;

    var starCountEl = document.getElementById('star-count');
    if (starCountEl) starCountEl.textContent = String(stars);

    var streak = data.streak;
    if (streak == null && window.VyvyDecor && typeof window.VyvyDecor.getExerciseStats === 'function') {
      try {
        var exerciseStats = window.VyvyDecor.getExerciseStats();
        streak = exerciseStats && exerciseStats.streak;
      } catch (e) {}
    }
    var streakEl = document.getElementById('home-streak-count');
    if (streakEl) streakEl.textContent = String(parseInt(streak, 10) || 0);

    var level = 1;
    if (window.VyvyDecor && typeof window.VyvyDecor.getVyvyLevel === 'function') {
      try { level = window.VyvyDecor.getVyvyLevel(); } catch (e2) { level = 1; }
    }
    var levelEl = document.getElementById('home-level-count');
    if (levelEl) levelEl.textContent = String(parseInt(level, 10) || 1);
  }

  function setLearningStage(stage) {
    var panel = document.getElementById('learn-panel');
    var picker = document.getElementById('study-picker-hero');
    if (panel) panel.dataset.studyStage = stage || 'picker';
    if (picker) picker.classList.toggle('hidden', stage !== 'picker');
  }

  function getSubjectLabel(subject) {
    var card = document.querySelector('.subject-card[data-subject="' + subject + '"] .subject-name');
    if (card) return card.textContent || subject;
    var map = {
      toan: 'Toán',
      math: 'Toán',
      tieng_viet: 'Tiếng Việt',
      tiengviet: 'Tiếng Việt',
      van: 'Tiếng Việt',
      tieng_anh: 'Tiếng Anh',
      english: 'Tiếng Anh',
      am_nhac: 'Âm nhạc',
      music: 'Âm nhạc',
      my_thuat: 'Mỹ thuật',
      art: 'Mỹ thuật',
      tu_nhien: 'Tự nhiên / Khoa học',
      khoa_hoc: 'Tự nhiên / Khoa học'
    };
    return map[(subject || '').toLowerCase()] || subject || 'Môn học';
  }

  function resetSelectedLesson() {
    learnState.selectedLesson = null;
    learnState.selectedLessonUnitId = '';
    learnState.selectedLessonTitle = '';
    learnState.selectedLessonMeta = null;
    learnState.selectedLessonElement = null;
    learnState.selectedPdfId = '';
    learnState.selectedPdfUrl = '';
    learnState.selectedPage = null;
    updateStudyStartButton();
  }

  function updateStudyStartButton() {
    var btn = document.getElementById('study-start-selected');
    if (!btn) return;
    var ready = !!(learnState.activeGrade && learnState.selectedSubject && learnState.selectedLessonUnitId);
    btn.disabled = !ready;
    btn.onclick = ready ? startSelectedLesson : null;
  }

  function selectLessonForStudy(lessonData) {
    learnState.selectedLesson = lessonData || null;
    learnState.selectedLessonUnitId = (lessonData && lessonData.unitId) || '';
    learnState.selectedLessonTitle = (lessonData && lessonData.title) || '';
    learnState.selectedLessonMeta = lessonData ? {
      completedCount: lessonData.completedCount || 0,
      unitCount: lessonData.unitCount || 0,
      status: lessonData.status || '',
      subject: lessonData.subject || learnState.selectedSubject || learnState.subject || ''
    } : null;
    learnState.selectedLessonElement = null;
    learnState.selectedPdfId = (lessonData && lessonData.pdfId) || '';
    learnState.selectedPage = (lessonData && lessonData.pageStart) || null;

    var rows = document.querySelectorAll('.study-lesson-row');
    for (var i = 0; i < rows.length; i++) {
      var isSelected = rows[i].dataset.unitId === learnState.selectedLessonUnitId;
      rows[i].classList.toggle('selected', isSelected);
      rows[i].classList.toggle('is-selected', isSelected);
      rows[i].setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      if (isSelected) learnState.selectedLessonElement = rows[i];
    }
    updateStudyStartButton();
  }

  function selectLesson(lessonData) {
    selectLessonForStudy(lessonData);
  }

  function startSelectedLesson() {
    if (!learnState.selectedLessonUnitId) {
      showToast('Chọn một bài học trước nhé!', 'info', 2500);
      return;
    }
    startSpecificLesson(learnState.selectedLessonUnitId, learnState.selectedSubject || learnState.subject);
  }

  function backToPickerPreserveSelection() {
    var subjectsDiv = document.getElementById('learn-subjects');
    var sessionDiv = document.getElementById('learn-session');
    var readingDiv = document.getElementById('learn-reading');
    var lessonListDiv = document.getElementById('learn-lesson-list');
    var lessonListContent = document.getElementById('lesson-list-content');
    var subjectToRender = learnState.selectedSubject || learnState.subject;
    var existingRows = lessonListContent ? lessonListContent.querySelectorAll('.study-lesson-row') : [];
    var firstRowSubject = existingRows.length ? existingRows[0].dataset.subject : '';
    var needsReload = !lessonListContent ||
      existingRows.length === 0 ||
      (subjectToRender && firstRowSubject && firstRowSubject !== subjectToRender);
    setLearningStage('picker');
    if (readingDiv) readingDiv.classList.add('hidden');
    if (sessionDiv) sessionDiv.classList.add('hidden');
    if (subjectToRender) {
      learnState.subject = subjectToRender;
      learnState.selectedSubject = subjectToRender;
      learnState.selectedSubjectLabel = getSubjectLabel(subjectToRender);
      if (subjectsDiv) subjectsDiv.classList.add('hidden');
      if (lessonListDiv) lessonListDiv.classList.remove('hidden');
      if (needsReload) {
        loadLessonList(subjectToRender);
      } else if (learnState.selectedLessonUnitId) {
        selectLessonForStudy({
          unitId: learnState.selectedLessonUnitId,
          subject: subjectToRender,
          title: learnState.selectedLessonTitle,
          completedCount: learnState.selectedLessonMeta ? learnState.selectedLessonMeta.completedCount : 0,
          unitCount: learnState.selectedLessonMeta ? learnState.selectedLessonMeta.unitCount : 0,
          status: learnState.selectedLessonMeta ? learnState.selectedLessonMeta.status : ''
        });
      }
    } else {
      if (subjectsDiv) subjectsDiv.classList.remove('hidden');
      if (lessonListDiv) lessonListDiv.classList.add('hidden');
    }
    updateStudyStartButton();
  }

  function hideLearningPanel() {
    clearReadingPdfFrame();
    if (currentView === 'learning') goBack();
    learnState.currentSession = null;
    learnState.currentStep = null;
  }

  function loadGrades() {
    var container = document.getElementById('learn-grade-buttons');
    if (!container) return;
    container.innerHTML = '';

    console.log('[VyVy Learn] Loading grades from:', API_BASE + '/curriculum/grades');

    fetch(API_BASE + '/curriculum/grades')
      .then(function(res) {
        console.log('[VyVy Learn] Grades status:', res.status);
        return res.json();
      })
      .then(function(data) {
        learnState.grades = data.grades || [];
        console.log('[VyVy Learn] Grades loaded:', learnState.grades.length);
        return fetch(API_BASE + '/curriculum/progress');
      })
      .then(function(res) { return res.json(); })
      .then(function(pData) {
        var savedGrade = parseInt(lsGet(SK.GRADE, '0'), 10);
        learnState.activeGrade = savedGrade > 0 ? savedGrade : (pData.active_grade || 2);
        learnState.selectedGrade = learnState.activeGrade;
        console.log('[VyVy Learn] Active grade:', learnState.activeGrade);
        updateStudyHud();
        renderGradeButtons();
        loadSubjectCards();
        loadProgressDisplay();
      })
      .catch(function(err) {
        console.error('[VyVy Learn] Load grades error:', err);
        var savedGrade = parseInt(lsGet(SK.GRADE, '0'), 10);
        learnState.activeGrade = savedGrade > 0 ? savedGrade : 2;
        learnState.selectedGrade = learnState.activeGrade;
        updateStudyHud();
        renderGradeButtons();
        loadSubjectCards();
        loadProgressDisplay();
      });
  }

  function renderGradeButtons() {
    var container = document.getElementById('learn-grade-buttons');
    if (!container) return;
    container.innerHTML = '';

    var panelTitle = document.getElementById('learn-panel-title');
    if (panelTitle) panelTitle.textContent = '📚 Học tập';

    var intro = document.getElementById('learn-intro');
    if (intro) intro.textContent = 'Hôm nay bạn muốn học môn gì?';

    for (var i = 0; i < learnState.grades.length; i++) {
      var g = learnState.grades[i];
      var isReady = g.data_status === 'IMPORTED';
      var btn = document.createElement('button');
      btn.className = 'grade-btn' + (g.grade === learnState.activeGrade ? ' active' : '');
      if (!isReady && !FEATURE_FLAGS.unsupportedGrades) {
        btn.className += ' preparing';
      }
      btn.dataset.grade = g.grade;
      var statusText = isReady ? '' : 'Đang chuẩn bị';
      btn.innerHTML =
        getAssetImgHtml(getGradeAssetUrl(g.grade), 'grade-asset', 'Lớp ' + g.grade, '🎒') +
        '<span class="grade-label">Lớp ' + g.grade + '</span>' +
        '<span class="grade-status">' + statusText + '</span>' +
        '<span class="study-check">✓</span>';
      if (!isReady && !FEATURE_FLAGS.unsupportedGrades) {
        btn.onclick = function() {
          showToast('Lớp này đang được chuẩn bị nội dung. Con học Lớp 2 nhé!', 'info', 3000);
        };
      } else {
        btn.onclick = (function(grade) {
          return function() { selectGrade(grade); };
        })(g.grade);
      }
      container.appendChild(btn);
    }
  }

  function selectGrade(grade) {
    learnState.activeGrade = grade;
    learnState.selectedGrade = grade;
    learnState.selectedSubject = '';
    learnState.selectedSubjectLabel = '';
    resetSelectedLesson();
    lsSet(SK.GRADE, String(grade));

    // Update active button
    var btns = document.querySelectorAll('.grade-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', parseInt(btns[i].dataset.grade) === grade);
    }

    // Set active grade on server
    fetch(API_BASE + '/curriculum/active-grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade: grade })
    }).catch(function() {});

    loadSubjectCards();
    var lessonListDiv = document.getElementById('learn-lesson-list');
    var subjectsDiv   = document.getElementById('learn-subjects');
    if (lessonListDiv) lessonListDiv.classList.add('hidden');
    if (subjectsDiv)   subjectsDiv.classList.remove('hidden');
    loadProgressDisplay();
  }

  function loadSubjectCards() {
    var container = document.getElementById('subject-cards');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center;color:var(--text-hint)">Đang tải...</p>';

    var url = API_BASE + '/curriculum/subjects?grade=' + learnState.activeGrade;
    console.log('[VyVy Learn] Loading subjects:', url);

    fetch(url)
      .then(function(res) {
        console.log('[VyVy Learn] Subjects response status:', res.status);
        return res.json();
      })
      .then(function(data) {
        console.log('[VyVy Learn] Subjects data:', data);
        container.innerHTML = '';
        var subjects = data.subjects || [];

        if (subjects.length === 0) {
          container.innerHTML = '<div class="learn-no-data"><div class="learn-no-data-icon">📚</div><div class="learn-no-data-msg">Lớp ' + learnState.activeGrade + ' chưa có dữ liệu bài học chi tiết.<br>Phụ huynh có thể thêm TOC sau nhé!</div></div>';
          return;
        }

        for (var i = 0; i < subjects.length; i++) {
          var s = subjects[i];
          var card = document.createElement('button');
          card.className = 'subject-card';
          if (s.subject === learnState.selectedSubject) card.className += ' active';
          card.dataset.subject = s.subject;
          var countText = s.unit_count > 0 ? s.unit_count + ' bài SGK' : s.book_count + ' sách';
          var subjectAsset = getSubjectAssetUrl(s.subject, s.label);
          card.innerHTML =
            getAssetImgHtml(subjectAsset, 'subject-asset', s.label || '', s.emoji || '📚') +
            '<span class="subject-copy">' +
              '<span class="subject-name">' + s.label + '</span>' +
              '<span class="subject-count">' + countText + '</span>' +
              '<span class="subject-status">Sẵn sàng học cùng VyVy</span>' +
            '</span>' +
            '<span class="subject-go" aria-hidden="true">›</span>' +
            '<span class="study-check">✓</span>';
          card.onclick = (function(subj) {
            return function() {
              console.log('[VyVy Learn] Subject clicked:', subj);
              startLearningForSubject(subj);
            };
          })(s.subject);
          container.appendChild(card);
        }
        if (subjects.length > 0) {
          var firstCard = container.querySelector('.subject-card');
          if (firstCard) {
            firstCard.classList.add('suggested');
            var status = firstCard.querySelector('.subject-status');
            if (status) status.textContent = 'Gợi ý học trước';
          }
        }
      })
      .catch(function(err) {
        console.error('[VyVy Learn] Load subjects error:', err);
        container.innerHTML = '<p style="text-align:center;color:var(--text-hint)">Không tải được danh sách môn. Lỗi: ' + (err.message || err) + '</p>';
      });
  }

  function startLearningForSubject(subject) {
    learnState.subject = subject;
    learnState.selectedSubject = subject;
    learnState.selectedSubjectLabel = getSubjectLabel(subject);
    resetSelectedLesson();
    learnState.totalStars = 0;
    learnState.itemIndex = 0;
    // Set outfit based on subject
    var subjectOutfitMap = {
      'toan': 'math', 'math': 'math',
      'tieng_viet': 'reading', 'tiengviet': 'reading', 'van': 'reading',
      'tieng_anh': 'reading', 'english': 'reading',
      'am_nhac': 'music', 'music': 'music',
      'my_thuat': 'art', 'art': 'art'
    };
    var subjectLower = (subject || '').toLowerCase().replace(/\s+/g, '_');
    var outfit = subjectOutfitMap[subjectLower] || 'uniform';
    setVyvyOutfit(outfit);

    var subjectsDiv = document.getElementById('learn-subjects');
    var sessionDiv = document.getElementById('learn-session');
    var readingDiv = document.getElementById('learn-reading');
    var lessonListDiv = document.getElementById('learn-lesson-list');
    clearReadingPdfFrame();
    setLearningStage('picker');
    if (subjectsDiv) subjectsDiv.classList.add('hidden');
    if (sessionDiv) sessionDiv.classList.add('hidden');
    if (readingDiv) readingDiv.classList.add('hidden');
    if (lessonListDiv) lessonListDiv.classList.remove('hidden');
    var subjectCards = document.querySelectorAll('.subject-card');
    for (var i = 0; i < subjectCards.length; i++) {
      subjectCards[i].classList.toggle('active', subjectCards[i].dataset.subject === subject);
    }

    // Load lesson list
    loadLessonList(subject);
  }

  function selectSubject(subject) {
    startLearningForSubject(subject);
  }

  function loadLessonList(subject) {
    var content = document.getElementById('lesson-list-content');
    var titleEl = document.getElementById('lesson-list-title');
    if (titleEl) titleEl.textContent = '📖 Chọn bài học';
    if (content) content.innerHTML = '<p style="text-align:center;color:var(--text-hint)">Đang tải...</p>';

    fetch(API_BASE + '/curriculum/lessons-grouped?subject=' + subject + '&grade=' + learnState.activeGrade)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.error) {
          if (content) content.innerHTML = '<p style="text-align:center;color:var(--text-hint)">' + data.error + '</p>';
          return;
        }
        renderLessonList(data.books || [], subject);
      })
      .catch(function() {
        if (content) content.innerHTML = '<p style="text-align:center;color:var(--text-hint)">Lỗi tải dữ liệu</p>';
      });
  }

  function renderLessonList(books, subject) {
    var content = document.getElementById('lesson-list-content');
    if (!content) return;
    content.innerHTML = '';

    if (books.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'learn-inline-message';
      empty.textContent = 'Chưa có bài học cho môn này';
      content.appendChild(empty);
      return;
    }

    var flow = document.createElement('div');
    flow.className = 'lesson-flow-strip';
    var flowSteps = ['1. Chọn bài', '2. Xem SGK', '3. VyVy đọc', '4. Luyện tập'];
    for (var fs = 0; fs < flowSteps.length; fs++) {
      var flowStep = document.createElement('span');
      flowStep.textContent = flowSteps[fs];
      flow.appendChild(flowStep);
    }
    content.appendChild(flow);

    for (var b = 0; b < books.length; b++) {
      var book = books[b];
      var bookDiv = document.createElement('div');
      bookDiv.className = 'lesson-book';

      var bookTitle = document.createElement('div');
      bookTitle.className = 'lesson-book-title';
      var bookEmoji = document.createElement('span');
      bookEmoji.className = 'book-emoji';
      bookEmoji.textContent = '📖';
      bookTitle.appendChild(bookEmoji);
      bookTitle.appendChild(document.createTextNode(' ' + (book.title || 'Sách học')));
      var bookCount = document.createElement('span');
      bookCount.className = 'lesson-book-count';
      bookCount.textContent = ' (' + (book.lesson_count || 0) + ' bài)';
      bookTitle.appendChild(bookCount);
      bookDiv.appendChild(bookTitle);

      var lessons = book.lessons || [];
      for (var l = 0; l < lessons.length; l++) {
        var lesson = lessons[l];
        var units = lesson.units || [];
        var completedCount = 0;
        for (var u = 0; u < units.length; u++) {
          if (units[u].completed) completedCount++;
        }
        var allDone = completedCount === units.length && units.length > 0;
        var firstUnitId = units.length > 0 ? units[0].daily_unit_id : '';

        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'lesson-card study-lesson-row' + (allDone ? ' completed' : '') + (!firstUnitId ? ' locked' : '');
        card.disabled = !firstUnitId;
        card.dataset.unitId = firstUnitId;
        card.dataset.subject = subject;
        card.setAttribute('aria-pressed', 'false');
        card.onclick = (function(unitId, subj, lessonTitle, lessonObj, doneCount, unitCount) {
          return function() {
            if (!unitId) return;
            selectLessonForStudy({
              unitId: unitId,
              subject: subj,
              title: lessonTitle,
              lesson: lessonObj,
              completedCount: doneCount,
              unitCount: unitCount,
              status: doneCount === unitCount && unitCount > 0 ? 'Đã học' : (doneCount > 0 ? 'Đang học' : 'Chưa học')
            });
          };
        })(firstUnitId, subject, lesson.title, lesson, completedCount, units.length);

        var thumbSpan = document.createElement('span');
        thumbSpan.className = 'lesson-card-thumb';
        thumbSpan.innerHTML = '<img src="' + studyAssetUrl('study_book_open.webp') + '" alt="" loading="lazy">';
        card.appendChild(thumbSpan);

        var statusSpan = document.createElement('span');
        statusSpan.className = 'lesson-card-status';
        statusSpan.textContent = !firstUnitId ? 'Khóa' : (allDone ? 'Đã học' : (completedCount > 0 ? 'Đang học' : 'Chưa học'));
        card.appendChild(statusSpan);

        var infoDiv = document.createElement('div');
        infoDiv.className = 'lesson-card-info';
        var titleSpan = document.createElement('div');
        titleSpan.className = 'lesson-card-title';
        titleSpan.textContent = lesson.title;
        infoDiv.appendChild(titleSpan);
        var metaSpan = document.createElement('div');
        metaSpan.className = 'lesson-card-meta';
        metaSpan.textContent = completedCount + '/' + units.length + ' bài hoàn thành';
        infoDiv.appendChild(metaSpan);
        card.appendChild(infoDiv);

        var arrowSpan = document.createElement('span');
        arrowSpan.className = 'lesson-card-arrow';
        arrowSpan.textContent = '▶';
        card.appendChild(arrowSpan);

        bookDiv.appendChild(card);
      }
      content.appendChild(bookDiv);
    }
    if (learnState.selectedLessonUnitId) {
      selectLessonForStudy({
        unitId: learnState.selectedLessonUnitId,
        subject: learnState.selectedSubject || subject,
        title: learnState.selectedLessonTitle,
        completedCount: learnState.selectedLessonMeta ? learnState.selectedLessonMeta.completedCount : 0,
        unitCount: learnState.selectedLessonMeta ? learnState.selectedLessonMeta.unitCount : 0,
        status: learnState.selectedLessonMeta ? learnState.selectedLessonMeta.status : ''
      });
    } else {
      updateStudyStartButton();
    }
  }

  function startRandomLesson(subject) {
    var sessionUrl = API_BASE + '/curriculum/session/start';
    return fetch(sessionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        subject: subject,
        grade: learnState.activeGrade,
        child_age: state.settings.age,
        nickname: state.settings.nickname
      })
    })
      .then(function(res) { return res.json(); })
      .then(function(data) { handleSessionStart(data); })
      .catch(function() {});
  }

  function startSpecificLesson(unitId, subject) {
    learnState.selectedSubject = subject || learnState.selectedSubject;
    learnState.selectedSubjectLabel = getSubjectLabel(learnState.selectedSubject);
    learnState.selectedLessonUnitId = unitId || learnState.selectedLessonUnitId;
    prepareReadingSessionSwitch();
    var sessionUrl = API_BASE + '/curriculum/session/start';
    return fetch(sessionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        unit_id: unitId,
        subject: subject,
        grade: learnState.activeGrade,
        child_age: state.settings.age,
        nickname: state.settings.nickname
      })
    })
      .then(function(res) { return res.json(); })
      .then(function(data) { handleSessionStart(data); })
      .catch(function() {});
  }

  function setTodayLessonLoading(isLoading) {
    var btn = document.getElementById('mission-begin-btn');
    if (!btn) return;
    if (!btn.dataset.readyText) btn.dataset.readyText = btn.textContent || 'Học cùng VyVy';
    btn.disabled = !!isLoading;
    btn.textContent = isLoading ? 'Đang mở bài...' : btn.dataset.readyText;
  }

  function openTodayLessonFromHome() {
    closeHomeChatDrawer();
    setVyvyOutfit('uniform');
    var grade = getHomeLessonGrade();
    learnState.activeGrade = grade;
    learnState.selectedGrade = grade;
    setTodayLessonLoading(true);
    return fetch(API_BASE + '/curriculum/next-unit?grade=' + encodeURIComponent(grade))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var unit = data && data.unit;
        var unitId = unit && unit.daily_unit_id;
        var subject = (data && data.subject) || (unit && unit.subject) || learnState.selectedSubject || learnState.subject;
        if (!unitId || !subject) {
          showToast('VyVy chưa tìm được bài tiếp theo, mình chọn bài nhé.', 'info', 2600);
          openLearningPicker();
          return null;
        }
        learnState.subject = subject;
        learnState.selectedSubject = subject;
        learnState.selectedSubjectLabel = (data && data.subject_label) || getSubjectLabel(subject);
        learnState.selectedLessonTitle = unit.title || '';
        if (window.VyvyDecor) window.VyvyDecor.setBg('learn');
        showView('learning');
        return startSpecificLesson(unitId, subject);
      })
      .catch(function() {
        showToast('VyVy chưa tìm được bài tiếp theo, mình chọn bài nhé.', 'info', 2600);
        openLearningPicker();
      })
      .finally(function() {
        setTodayLessonLoading(false);
      });
  }

  function handleSessionStart(data) {
    var sessionDiv = document.getElementById('learn-session');
    var readingDiv = document.getElementById('learn-reading');
    var lessonListDiv = document.getElementById('learn-lesson-list');
    var titleEl = document.getElementById('learn-session-title');
    var msgEl = document.getElementById('learn-message');

    if (lessonListDiv) lessonListDiv.classList.add('hidden');

    if (data.error) {
      setLearningStage('session');
      if (msgEl) msgEl.textContent = 'Có lỗi: ' + data.error;
      if (sessionDiv) sessionDiv.classList.remove('hidden');
      return;
    }
    learnState.currentSession = data.session;
    learnState.currentStep = data.current_step;
    learnState.unitId = data.unit_id || '';
    learnState.totalStars = 0;
    learnState.itemIndex = 0;
    learnState.totalItems = (data.session.steps.practice.items || []).length;
    learnState.currentOptions = null;

    if (data.current_step === 'read' && data.session.has_content) {
      showLessonReading(data.session.steps.read, data.session);
    } else {
      setLearningStage('session');
      var items = (data.session.steps.practice || {}).items || [];
      if (items.length > 0 && items[0].options) {
        learnState.currentOptions = items[0].options;
      }
      if (titleEl) titleEl.textContent = data.session.subject_emoji + ' ' + data.session.title;
      if (msgEl) msgEl.textContent = data.message;
      if (sessionDiv) sessionDiv.classList.remove('hidden');
      showLearnInput();
      updateStarsDisplay();
      updateProgressBar();
    }
  }

  function firstNonEmpty() {
    for (var i = 0; i < arguments.length; i++) {
      var value = arguments[i];
      if (value == null) continue;
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value !== 'string' && value) return String(value);
    }
    return '';
  }

  function buildReaderPreviewText(readStep, session) {
    readStep = readStep || {};
    session = session || {};
    var cached = learnState.explanationCache[getCurrentReadingUnitId(session)];
    var cachedContent = cached && cached.content ? cached.content : cached;
    var preview = firstNonEmpty(
      cachedContent && cachedContent.keywords,
      cachedContent && cachedContent.explanation,
      readStep.keywords,
      readStep.explanation,
      readStep.remember,
      readStep.objective
    );
    if (Array.isArray(preview)) preview = preview.join(', ');
    if (!preview) return 'Bấm Giải thích để VyVy mở phần hỗ trợ nhanh.';
    preview = String(preview).replace(/\s+/g, ' ').trim();
    return preview.length > 120 ? preview.slice(0, 117) + '...' : preview;
  }

  function flattenReaderLessons(books, subject) {
    var rows = [];
    books = books || [];
    for (var b = 0; b < books.length; b++) {
      var book = books[b] || {};
      var lessons = book.lessons || [];
      for (var l = 0; l < lessons.length; l++) {
        var lesson = lessons[l] || {};
        var units = lesson.units || [];
        if (!units.length || !units[0].daily_unit_id) continue;
        var completedCount = Number(lesson.completed_count || 0);
        var unitCount = units.length;
        rows.push({
          unitId: units[0].daily_unit_id,
          subject: subject,
          title: lesson.title || 'Bài học',
          bookTitle: book.title || '',
          completedCount: completedCount,
          unitCount: unitCount,
          status: completedCount === unitCount && unitCount > 0 ? 'Đã học' : (completedCount > 0 ? 'Đang học' : 'Chưa học')
        });
      }
    }
    return rows;
  }

  function setReaderDropdownDisabled(select, label) {
    if (!select) return;
    select.innerHTML = '';
    var opt = document.createElement('option');
    opt.value = '';
    opt.textContent = label;
    select.appendChild(opt);
    select.disabled = true;
  }

  function populateReadingSubjectDropdown(currentSubject) {
    var select = document.getElementById('reading-subject-chip');
    if (!select) return Promise.resolve([]);
    select.disabled = true;
    return fetch(API_BASE + '/curriculum/subjects?grade=' + encodeURIComponent(learnState.activeGrade))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var subjects = data.subjects || [];
        learnState.readerSubjects = subjects;
        select.innerHTML = '';
        if (!subjects.length) {
          setReaderDropdownDisabled(select, 'Không có môn học');
          return subjects;
        }
        var foundCurrent = false;
        for (var i = 0; i < subjects.length; i++) {
          var subject = subjects[i] || {};
          var value = subject.subject || '';
          if (!value) continue;
          var opt = document.createElement('option');
          opt.value = value;
          opt.textContent = subject.label || getSubjectLabel(value);
          select.appendChild(opt);
          if (value === currentSubject) foundCurrent = true;
        }
        if (currentSubject && !foundCurrent) {
          var fallback = document.createElement('option');
          fallback.value = currentSubject;
          fallback.textContent = getSubjectLabel(currentSubject);
          select.appendChild(fallback);
        }
        select.value = currentSubject || (subjects[0] && subjects[0].subject) || '';
        select.disabled = false;
        select.onchange = function() {
          var subject = select.value;
          if (!subject) return;
          learnState.selectedSubject = subject;
          learnState.subject = subject;
          learnState.selectedSubjectLabel = getSubjectLabel(subject);
          populateReadingLessonDropdown(subject, '').then(function(lessons) {
            if (lessons && lessons.length) {
              startSpecificLesson(lessons[0].unitId, subject);
            } else {
              showToast('Môn này chưa có bài học để mở.', 'info', 2500);
            }
          });
        };
        return subjects;
      })
      .catch(function() {
        setReaderDropdownDisabled(select, 'Lỗi tải môn học');
        return [];
      });
  }

  function populateReadingLessonDropdown(subject, currentUnitId) {
    var select = document.getElementById('reading-lesson-chip');
    if (!select) return Promise.resolve([]);
    var serial = ++learnState.readerDropdownSerial;
    setReaderDropdownDisabled(select, 'Đang tải bài...');
    return fetch(API_BASE + '/curriculum/lessons-grouped?subject=' + encodeURIComponent(subject || '') + '&grade=' + encodeURIComponent(learnState.activeGrade))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (serial !== learnState.readerDropdownSerial) return learnState.readerLessons || [];
        if (data.error) throw new Error(data.error);
        var lessons = flattenReaderLessons(data.books || [], subject);
        learnState.readerLessons = lessons;
        select.innerHTML = '';
        if (!lessons.length) {
          setReaderDropdownDisabled(select, 'Không có bài học');
          return lessons;
        }
        for (var i = 0; i < lessons.length; i++) {
          var lesson = lessons[i];
          var opt = document.createElement('option');
          opt.value = lesson.unitId;
          opt.textContent = lesson.title;
          if (lesson.bookTitle) opt.title = lesson.bookTitle;
          select.appendChild(opt);
        }
        select.value = currentUnitId || lessons[0].unitId;
        if (currentUnitId && select.value !== currentUnitId) {
          var current = document.createElement('option');
          current.value = currentUnitId;
          current.textContent = learnState.selectedLessonTitle || 'Bài học hiện tại';
          select.appendChild(current);
          select.value = currentUnitId;
        }
        select.disabled = false;
        select.onchange = function() {
          var unitId = select.value;
          if (!unitId) return;
          var picked = null;
          for (var j = 0; j < learnState.readerLessons.length; j++) {
            if (learnState.readerLessons[j].unitId === unitId) {
              picked = learnState.readerLessons[j];
              break;
            }
          }
          if (picked) {
            selectLessonForStudy({
              unitId: picked.unitId,
              subject: picked.subject,
              title: picked.title,
              completedCount: picked.completedCount,
              unitCount: picked.unitCount,
              status: picked.status
            });
          }
          startSpecificLesson(unitId, subject || learnState.selectedSubject || learnState.subject);
        };
        return lessons;
      })
      .catch(function() {
        setReaderDropdownDisabled(select, 'Lỗi tải bài học');
        return [];
      });
  }

  function updateReadingTopbarDropdowns(readStep, session) {
    session = session || {};
    var subject = session.subject || learnState.selectedSubject || learnState.subject || '';
    var unitId = session.unit_id || learnState.unitId || learnState.selectedLessonUnitId || '';
    populateReadingSubjectDropdown(subject);
    populateReadingLessonDropdown(subject, unitId);
  }

  function prepareReadingSessionSwitch() {
    var readingDiv = document.getElementById('learn-reading');
    if (!readingDiv || readingDiv.classList.contains('hidden')) return;
    _pa1_stopReadingAudio();
    clearReadingPdfFrame();
    setPdfReaderStatus('Đang chuyển bài...');
  }

  function updateReaderStudyShell(readStep, session) {
    readStep = readStep || {};
    session = session || {};

    var subjectLabel = firstNonEmpty(
      learnState.selectedSubjectLabel,
      getSubjectLabel(session.subject || learnState.subject || learnState.selectedSubject),
      'Môn học'
    );
    var lessonTitle = firstNonEmpty(learnState.selectedLessonTitle, session.title, 'Bài học');
    var lessonChipText = lessonTitle;
    var pageText = readStep.pdf_page ? ('Trang ' + readStep.pdf_page) : 'Trang SGK';
    var unitCount = learnState.selectedLessonMeta && learnState.selectedLessonMeta.unitCount;
    var completedCount = learnState.selectedLessonMeta && learnState.selectedLessonMeta.completedCount;
    var progressText = unitCount
      ? (completedCount + '/' + unitCount + ' bài hoàn thành • Đọc SGK • Giải thích • Luyện tập')
      : 'Đọc SGK • Giải thích • Luyện tập';

    var subjectChip = document.getElementById('reading-subject-chip');
    if (subjectChip && subjectChip.tagName !== 'SELECT') subjectChip.textContent = subjectLabel || 'Môn học';

    var lessonChip = document.getElementById('reading-lesson-chip');
    if (lessonChip && lessonChip.tagName !== 'SELECT') lessonChip.textContent = lessonChipText || 'Bài học';

    var titleEl = document.getElementById('reading-title');
    if (titleEl) titleEl.textContent = firstNonEmpty(session.subject_emoji, '📚') + ' ' + lessonTitle;

    var pageCounter = document.getElementById('study-page-counter');
    if (pageCounter) pageCounter.textContent = pageText;

    var progress = document.getElementById('study-reader-progress');
    if (progress) progress.textContent = progressText;

    var glossary = document.getElementById('study-glossary-preview');
    if (glossary) glossary.textContent = buildReaderPreviewText(readStep, session);

    updateStudyHud();
    updateReadingTopbarDropdowns(readStep, session);
  }

  function showLessonReading(readStep, session) {
    readStep = readStep || {};
    session = session || {};
    exitReadingPdfMode();
    resetReadingExplanation();
    var readingDiv = document.getElementById('learn-reading');
    var sessionDiv = document.getElementById('learn-session');
    var subjectsDiv = document.getElementById('learn-subjects');
    var lessonListDiv = document.getElementById('learn-lesson-list');
    setLearningStage('reading');
    if (subjectsDiv) subjectsDiv.classList.add('hidden');
    if (sessionDiv) sessionDiv.classList.add('hidden');
    if (lessonListDiv) lessonListDiv.classList.add('hidden');
    if (readingDiv) readingDiv.classList.remove('hidden');

    var bn = state.settings.bot_name || 'VyVy';
    var sessionTitle = session.title || learnState.selectedLessonTitle || 'Bài học';
    learnState.selectedLessonTitle = sessionTitle;
    learnState.selectedPdfId = getReadingPdfId(readStep, session) || learnState.selectedPdfId;
    updateReaderStudyShell(readStep, session);

    var expLabel = document.getElementById('reading-explanation-label');
    if (expLabel) expLabel.textContent = bn + ' giải thích';

    var listenBtn = document.getElementById('reading-listen-btn');
    if (listenBtn) listenBtn.textContent = '🔊 Nghe ' + bn + ' đọc';

    var objText = document.getElementById('reading-objective-text');
    if (objText) objText.textContent = readStep.objective || '';

    var expText = document.getElementById('reading-explanation-text');
    if (expText) expText.textContent = readStep.explanation || '';

    var exList = document.getElementById('reading-examples-list');
    if (exList) {
      exList.innerHTML = '';
      var examples = readStep.examples || [];
      if (examples.length > 0) {
        var ol = document.createElement('ol');
        for (var i = 0; i < examples.length; i++) {
          var li = document.createElement('li');
          li.textContent = examples[i];
          ol.appendChild(li);
        }
        exList.appendChild(ol);
      }
    }

    var remText = document.getElementById('reading-remember-text');
    if (remText) remText.textContent = readStep.remember || '';

    var parentText = document.getElementById('reading-parent-text');
    if (parentText) parentText.textContent = readStep.parent_note || '';

    var pdfBtn = document.getElementById('reading-pdf-btn');
    if (pdfBtn) {
      if (readStep.pdf_lesson_id || readStep.pdf_file) {
        pdfBtn.classList.remove('hidden');
        pdfBtn.onclick = function() { openLessonPdfViewer(readStep.pdf_lesson_id, readStep.book_id, readStep.pdf_page, readStep.pdf_file); };
      } else {
        pdfBtn.classList.add('hidden');
      }
    }

    var listenBtn = document.getElementById('reading-listen-btn');
    if (listenBtn) {
      listenBtn.classList.remove('playing');
      listenBtn.onclick = function() { playLessonAudio(listenBtn); };
    }

    var startBtn = document.getElementById('reading-start-practice');
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.textContent = 'Luyện tập →';
      startBtn.title = 'Nghe hoặc xem xong để luyện tập';
      startBtn.onclick = function() { startPracticeFromReading(); };
    }

    setupReadingExplanation(session);

    // Load adjacent units for navigation
    var unitId = session.unit_id || learnState.unitId;
    var subject = session.subject || learnState.subject;
    if (unitId && subject) {
      fetch(API_BASE + '/curriculum/adjacent-units?unit_id=' + unitId + '&subject=' + subject + '&grade=' + learnState.activeGrade)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          var prevBtn = document.getElementById('reading-prev-btn');
          var nextBtn = document.getElementById('reading-next-btn');
          if (data.prev && prevBtn) {
            prevBtn.classList.remove('hidden');
            prevBtn.textContent = '← ' + data.prev.title;
            prevBtn.onclick = function() { startSpecificLesson(data.prev.daily_unit_id, subject); };
          } else if (prevBtn) {
            prevBtn.classList.add('hidden');
          }
          if (data.next && nextBtn) {
            nextBtn.classList.remove('hidden');
            nextBtn.textContent = data.next.title + ' →';
            nextBtn.onclick = function() { startSpecificLesson(data.next.daily_unit_id, subject); };
          } else if (nextBtn) {
            nextBtn.classList.add('hidden');
          }
        })
        .catch(function() {
          var prevBtn = document.getElementById('reading-prev-btn');
          var nextBtn = document.getElementById('reading-next-btn');
          if (prevBtn) prevBtn.classList.add('hidden');
          if (nextBtn) nextBtn.classList.add('hidden');
        });
    }
    // PA1A: PDF anchor + VyVy voice reading experience
    _pa1_initReadingView(session);
  }

  function renderReadingDetail(readStep, session) {
    showLessonReading(readStep, session);
  }

  // ──────────────────────────────────────────────────
  // PA1A — Reading Experience: PDF inline + VyVy Voice
  // ──────────────────────────────────────────────────

  function getReadingPdfId(readStep, session) {
    readStep = readStep || {};
    session = session || {};
    var sessionRead = (session.steps && session.steps.read) || {};
    return readStep.pdf_lesson_id ||
      sessionRead.pdf_lesson_id ||
      session.lesson_id ||
      readStep.pdf_file ||
      sessionRead.pdf_file ||
      '';
  }

  function buildReadingPdfUrl(pdfId, readStep) {
    if (!pdfId) return '';
    readStep = readStep || {};
    if (readStep.pdf_file && pdfId === readStep.pdf_file && !readStep.pdf_lesson_id) {
      return API_BASE + '/curriculum/pdf/' + encodeURIComponent(learnState.activeGrade) + '/' + encodeURIComponent(pdfId);
    }
    return API_BASE + '/curriculum/lesson-pdf/' + encodeURIComponent(pdfId);
  }

  var PDFJS_MODULE_URL = '/static/vendor/pdfjs/pdf.mjs';
  var PDFJS_WORKER_URL = '/static/vendor/pdfjs/pdf.worker.mjs';
  var PDF_READER_MAX_DPR = 2;
  var PDF_READER_MAX_PIXELS = 16000000;
  var PDF_READER_CACHE_LIMIT = 6;
  var PDF_READER_RESIZE_DELAY = 200;
  var PDF_READER_LOAD_TIMEOUT_MS = 8000;
  var PDF_CROP_PROFILES = {
    'kntt_g1_vietnamese_t1': { top: 0, right: 0, bottom: 0.0154, left: 0 },
    'kntt_g1_tnxh': { top: 0, right: 0, bottom: 0.0199, left: 0 },
    'kntt_g1_experiential': { top: 0.0578, right: 0.0405, bottom: 0.0103, left: 0 },
    'kntt_g2_art': { top: 0, right: 0.0426, bottom: 0.0281, left: 0 },
    'kntt_g3_english_t1': { top: 0, right: 0.0819, bottom: 0, left: 0.0707 },
    'kntt_g4_math_t1': { top: 0.0087, right: 0.0577, bottom: 0.0155, left: 0.0192 },
    'kntt_g4_math_t2': { top: 0.0087, right: 0.0577, bottom: 0.0155, left: 0.0192 },
    'kntt_g4_vietnamese_t2': { top: 0, right: 0, bottom: 0.0254, left: 0 },
    'kntt_g4_science': { top: 0.0087, right: 0.0577, bottom: 0.0155, left: 0.0192 },
    'kntt_g4_history_geo': { top: 0.0087, right: 0.0577, bottom: 0.0155, left: 0.0192 },
    'kntt_g4_music': { top: 0.0087, right: 0.0577, bottom: 0.0155, left: 0.0192 },
    'kntt_g5_history_geo': { top: 0.048, right: 0.062, bottom: 0.0184, left: 0.0599 },
    'kntt_g5_technology': { top: 0, right: 0, bottom: 0.0295, left: 0 },
    'kntt_g5_ethics': { top: 0.0377, right: 0.062, bottom: 0.0288, left: 0.0765 }
  };
  var pdfJsLibPromise = null;
  var pdfReaderResizeTimer = null;
  var pdfReaderPreloadTimer = null;
  var pdfReaderPreloadIdleId = null;
  var pdfReaderRenderSerial = 0;
  var pdfReaderState = {
    pdfDoc: null,
    pdfUrl: '',
    pdfKey: '',
    pdfId: '',
    readStep: null,
    currentPage: 1,
    totalPages: 0,
    pagesPerSpread: 1,
    zoom: 1,
    fitMode: 'page',
    cropMode: 'off',
    cropProfile: null,
    renderTasks: {},
    pageCache: new Map(),
    loadingTask: null,
    lastFallbackReason: '',
    rendering: false,
    pendingRender: false,
    activeRenderPromise: null,
    lastRenderSignature: '',
    renderSizeKey: ''
  };

  function isPdfDebugEnabled() {
    return new URLSearchParams(location.search).has('debug') || lsGet('vyvy_pdf_debug', '') === '1';
  }

  function logPdfDebug(label, payload, level) {
    if (!isPdfDebugEnabled() && level !== 'warn' && level !== 'error') return;
    var method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info';
    try { console[method]('[VyVy PDF] ' + label, payload || {}); }
    catch (err) { console.log('[VyVy PDF] ' + label, payload || {}); }
  }

  function getPdfLoadContext(lessonId, readStep, pdfUrl) {
    var session = learnState.currentSession || {};
    return {
      grade: learnState.activeGrade,
      subject: learnState.selectedSubject || learnState.subject || session.subject || '',
      unitId: learnState.selectedLessonUnitId || learnState.unitId || session.unit_id || '',
      sessionId: session.session_id || session.id || '',
      readStep: readStep || {},
      pdfId: lessonId || '',
      pdfUrl: pdfUrl || ''
    };
  }

  function probePdfHttp(pdfUrl) {
    if (!pdfUrl || typeof fetch !== 'function') return Promise.resolve(null);
    return fetch(pdfUrl, { method: 'GET', headers: { Range: 'bytes=0-0' }, cache: 'no-store' })
      .then(function(res) {
        return {
          ok: res.ok,
          status: res.status,
          contentType: res.headers.get('content-type') || '',
          contentLength: res.headers.get('content-length') || ''
        };
      })
      .catch(function(err) {
        return { ok: false, error: err && err.message ? err.message : String(err || 'fetch failed') };
      });
  }

  function getPdfReaderElements() {
    return {
      canvasReader: document.getElementById('study-pdf-canvas-reader'),
      spread: document.getElementById('study-pdf-spread'),
      status: document.getElementById('study-pdf-reader-status'),
      wrap: document.getElementById('reading-pdf-wrap'),
      frame: document.getElementById('reading-pdf-frame'),
      text: document.getElementById('reading-text-fallback'),
      prev: document.getElementById('study-pdf-prev'),
      next: document.getElementById('study-pdf-next'),
      zoomIn: document.getElementById('study-pdf-zoom-in'),
      zoomOut: document.getElementById('study-pdf-zoom-out'),
      zoomLabel: document.getElementById('study-pdf-zoom-label'),
      cropToggle: document.getElementById('study-pdf-crop-toggle'),
      focusToggle: document.getElementById('study-pdf-focus-toggle'),
      pageCounter: document.getElementById('study-page-counter')
    };
  }

  function setPdfReaderStatus(message) {
    var status = document.getElementById('study-pdf-reader-status');
    if (status) status.textContent = message || '';
  }

  function cancelPdfRenderTasks() {
    var tasks = pdfReaderState.renderTasks || {};
    Object.keys(tasks).forEach(function(key) {
      try {
        if (tasks[key] && typeof tasks[key].cancel === 'function') tasks[key].cancel();
      } catch (err) {}
    });
    pdfReaderState.renderTasks = {};
  }

  function cancelPdfPreload() {
    if (pdfReaderPreloadTimer) {
      clearTimeout(pdfReaderPreloadTimer);
      pdfReaderPreloadTimer = null;
    }
    if (pdfReaderPreloadIdleId && window.cancelIdleCallback) {
      try { window.cancelIdleCallback(pdfReaderPreloadIdleId); } catch (err) {}
    }
    pdfReaderPreloadIdleId = null;
  }

  function clearPdfReaderCache() {
    if (!pdfReaderState.pageCache) {
      pdfReaderState.pageCache = new Map();
      return;
    }
    pdfReaderState.pageCache.clear();
  }

  function resetPdfReaderState() {
    pdfReaderRenderSerial++;
    cancelPdfPreload();
    cancelPdfRenderTasks();
    if (pdfReaderState.loadingTask && typeof pdfReaderState.loadingTask.destroy === 'function') {
      try { pdfReaderState.loadingTask.destroy(); } catch (err) {}
    }
    if (pdfReaderResizeTimer) {
      clearTimeout(pdfReaderResizeTimer);
      pdfReaderResizeTimer = null;
    }
    clearPdfReaderCache();
    if (pdfReaderState.pdfDoc && typeof pdfReaderState.pdfDoc.destroy === 'function') {
      try { pdfReaderState.pdfDoc.destroy(); } catch (err) {}
    }
    pdfReaderState.pdfDoc = null;
    pdfReaderState.pdfUrl = '';
    pdfReaderState.pdfKey = '';
    pdfReaderState.pdfId = '';
    pdfReaderState.readStep = null;
    pdfReaderState.currentPage = 1;
    pdfReaderState.totalPages = 0;
    pdfReaderState.pagesPerSpread = 1;
    pdfReaderState.zoom = 1;
    pdfReaderState.fitMode = 'page';
    pdfReaderState.cropMode = 'off';
    pdfReaderState.cropProfile = null;
    pdfReaderState.loadingTask = null;
    pdfReaderState.lastFallbackReason = '';
    pdfReaderState.rendering = false;
    pdfReaderState.pendingRender = false;
    pdfReaderState.activeRenderPromise = null;
    pdfReaderState.lastRenderSignature = '';
    pdfReaderState.renderSizeKey = '';
    var els = getPdfReaderElements();
    if (els.spread) {
      while (els.spread.firstChild) els.spread.removeChild(els.spread.firstChild);
    }
    if (els.canvasReader) els.canvasReader.hidden = true;
    document.body.classList.remove('pdfjs-reader-active');
    setPdfReaderStatus('');
    updatePdfReaderControls();
  }

  function loadPdfJs() {
    if (pdfJsLibPromise) return pdfJsLibPromise;
    logPdfDebug('import:start', { moduleUrl: PDFJS_MODULE_URL, workerUrl: PDFJS_WORKER_URL });
    pdfJsLibPromise = import(PDFJS_MODULE_URL).then(function(mod) {
      var lib = mod && (mod.getDocument ? mod : mod.default);
      if (!lib || typeof lib.getDocument !== 'function') {
        throw new Error('PDF.js module loaded without getDocument().');
      }
      if (!lib.GlobalWorkerOptions) {
        throw new Error('PDF.js module loaded without GlobalWorkerOptions.');
      }
      lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      logPdfDebug('import:ok', { moduleUrl: PDFJS_MODULE_URL, workerUrl: PDFJS_WORKER_URL });
      return lib;
    }).catch(function(err) {
      pdfJsLibPromise = null;
      logPdfDebug('import:error', { message: err && err.message ? err.message : String(err || 'import failed') }, 'warn');
      throw err;
    });
    return pdfJsLibPromise;
  }

  function withPdfTimeout(promise, message) {
    var timer = null;
    var timeout = new Promise(function(_resolve, reject) {
      timer = setTimeout(function() {
        reject(new Error(message || 'PDF.js timed out.'));
      }, PDF_READER_LOAD_TIMEOUT_MS);
    });
    return Promise.race([promise, timeout]).then(function(value) {
      if (timer) clearTimeout(timer);
      return value;
    }).catch(function(err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  }

  function getInitialPdfPage(readStep) {
    readStep = readStep || {};
    var raw = readStep.pdf_page || readStep.page || readStep.page_start || learnState.selectedPage;
    if (Array.isArray(raw)) raw = raw[0];
    var match = String(raw || '').match(/\d+/);
    var page = match ? parseInt(match[0], 10) : 1;
    return isNaN(page) || page < 1 ? 1 : page;
  }

  function getPdfUrlFilename(pdfUrl) {
    try {
      var path = new URL(pdfUrl, window.location.href).pathname;
      return decodeURIComponent(path.split('/').filter(Boolean).pop() || '');
    } catch (err) {
      var clean = String(pdfUrl || '').split('?')[0].split('#')[0];
      return decodeURIComponent(clean.split('/').pop() || '');
    }
  }

  function normalizePdfKey(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getPdfFingerprint(pdfDoc) {
    if (!pdfDoc) return '';
    if (Array.isArray(pdfDoc.fingerprints) && pdfDoc.fingerprints[0]) return pdfDoc.fingerprints[0];
    return pdfDoc.fingerprint || '';
  }

  function resolvePdfKey(pdfDoc, pdfId, readStep, pdfUrl) {
    var candidates = [
      getPdfFingerprint(pdfDoc),
      pdfId,
      readStep && readStep.pdf_file,
      getPdfUrlFilename(pdfUrl)
    ];
    for (var i = 0; i < candidates.length; i++) {
      var key = normalizePdfKey(candidates[i]);
      if (key) return key;
    }
    return 'unknown-pdf';
  }

  function getCropProfileHash(profile) {
    if (!profile) return 'none';
    return [
      Number(profile.top || 0).toFixed(4),
      Number(profile.right || 0).toFixed(4),
      Number(profile.bottom || 0).toFixed(4),
      Number(profile.left || 0).toFixed(4)
    ].join(',');
  }

  function getCropProfileForPdf(pdfDoc, pdfId, readStep, pdfUrl) {
    var keys = [
      getPdfFingerprint(pdfDoc),
      pdfId,
      readStep && readStep.pdf_file,
      getPdfUrlFilename(pdfUrl)
    ];
    for (var i = 0; i < keys.length; i++) {
      var key = normalizePdfKey(keys[i]);
      if (key && PDF_CROP_PROFILES[key]) return PDF_CROP_PROFILES[key];
      var profile = getCropProfileByBookPrefix(key);
      if (profile) return profile;
    }
    return null;
  }

  function getCropProfileByBookPrefix(key) {
    if (!key) return null;
    var best = '';
    Object.keys(PDF_CROP_PROFILES).forEach(function(prefix) {
      if (key.indexOf(prefix) === 0 && prefix.length > best.length) best = prefix;
    });
    return best ? PDF_CROP_PROFILES[best] : null;
  }

  function sanitizeCropProfile(profile) {
    if (!profile) return null;
    var safe = {
      top: Math.min(Math.max(Number(profile.top) || 0, 0), 0.18),
      right: Math.min(Math.max(Number(profile.right) || 0, 0), 0.18),
      bottom: Math.min(Math.max(Number(profile.bottom) || 0, 0), 0.18),
      left: Math.min(Math.max(Number(profile.left) || 0, 0), 0.18)
    };
    if (safe.top + safe.bottom > 0.3 || safe.left + safe.right > 0.34) return null;
    return safe;
  }

  function getPdfPagesPerSpread() {
    var spread = document.getElementById('study-pdf-spread');
    var width = spread && spread.clientWidth ? spread.clientWidth : window.innerWidth;
    return width >= 620 && window.innerWidth >= 820 ? 2 : 1;
  }

  function buildPdfRenderCacheKey(pageNumber, dpr) {
    return [
      pdfReaderState.pdfKey,
      pageNumber,
      pdfReaderState.zoom.toFixed(2),
      pdfReaderState.fitMode,
      pdfReaderState.cropMode,
      getCropProfileHash(pdfReaderState.cropProfile),
      pdfReaderState.renderSizeKey || '',
      dpr.toFixed(2)
    ].join('|');
  }

  function buildPdfRenderSignature(els) {
    var spread = els && els.spread;
    var width = spread ? Math.round(spread.clientWidth || 0) : 0;
    var height = spread ? Math.round(spread.clientHeight || 0) : 0;
    return [
      pdfReaderState.pdfUrl,
      pdfReaderState.currentPage,
      getPdfPagesPerSpread(),
      pdfReaderState.zoom.toFixed(2),
      pdfReaderState.fitMode,
      pdfReaderState.cropMode,
      getCropProfileHash(pdfReaderState.cropProfile),
      Math.min(window.devicePixelRatio || 1, PDF_READER_MAX_DPR).toFixed(2),
      width,
      height
    ].join('|');
  }

  function trimPdfReaderCache() {
    var cache = pdfReaderState.pageCache;
    if (!cache) return;
    while (cache.size > PDF_READER_CACHE_LIMIT) {
      var firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
  }

  function showPdfCanvasReader() {
    var els = getPdfReaderElements();
    if (els.canvasReader) els.canvasReader.hidden = false;
    if (els.wrap) els.wrap.style.display = 'none';
    if (els.frame) els.frame.src = 'about:blank';
    if (els.text) els.text.style.display = 'none';
    document.body.classList.add('reading-pdf-mode');
    document.body.classList.add('pdfjs-reader-active');
  }

  function showPdfIframeFallback(lessonId, readStep, reason) {
    var els = getPdfReaderElements();
    pdfReaderState.lastFallbackReason = reason || '';
    if (els.canvasReader) els.canvasReader.hidden = true;
    if (els.spread) {
      while (els.spread.firstChild) els.spread.removeChild(els.spread.firstChild);
    }
    document.body.classList.remove('pdfjs-reader-active');
    if (els.wrap) {
      els.wrap.hidden = false;
      els.wrap.style.display = 'block';
    }
    if (els.frame) {
      els.frame.hidden = false;
      els.frame.style.display = 'block';
    }
    if (els.text) els.text.style.display = 'none';
    if (!enterReadingPdfMode(lessonId, readStep)) {
      _pa1_showTextFallback(lessonId, readStep, reason);
      return false;
    }
    if (reason) logPdfDebug('fallback:iframe', getPdfLoadContext(lessonId, readStep, buildReadingPdfUrl(lessonId, readStep)), 'warn');
    return true;
  }

  function updatePdfReaderControls() {
    var els = getPdfReaderElements();
    var hasDoc = !!pdfReaderState.pdfDoc;
    var lastVisiblePage = Math.min(pdfReaderState.currentPage + pdfReaderState.pagesPerSpread - 1, pdfReaderState.totalPages || 1);
    if (els.prev) els.prev.disabled = !hasDoc || pdfReaderState.currentPage <= 1;
    if (els.next) els.next.disabled = !hasDoc || lastVisiblePage >= pdfReaderState.totalPages;
    if (els.zoomIn) els.zoomIn.disabled = !hasDoc || pdfReaderState.zoom >= 1.6;
    if (els.zoomOut) els.zoomOut.disabled = !hasDoc || pdfReaderState.zoom <= 0.8;
    if (els.zoomLabel) els.zoomLabel.textContent = Math.round(pdfReaderState.zoom * 100) + '%';
    if (els.cropToggle) {
      var hasProfile = !!pdfReaderState.cropProfile;
      els.cropToggle.disabled = !hasDoc || !hasProfile;
      els.cropToggle.setAttribute('aria-pressed', pdfReaderState.cropMode === 'on' ? 'true' : 'false');
      els.cropToggle.textContent = pdfReaderState.cropMode === 'on' ? 'Cắt lề: Bật' : 'Cắt lề: Tắt';
      els.cropToggle.title = hasProfile ? 'Bật hoặc tắt cắt lề SGK' : 'SGK này chưa có hồ sơ cắt lề an toàn';
    }
    if (els.focusToggle) {
      var isFocusMode = document.body.classList.contains('reading-pdf-focus-mode');
      var canFocus = document.body.classList.contains('reading-pdf-mode');
      els.focusToggle.disabled = !canFocus;
      els.focusToggle.setAttribute('aria-pressed', isFocusMode ? 'true' : 'false');
      els.focusToggle.textContent = isFocusMode ? 'Thoát toàn màn hình sách' : 'Toàn màn hình sách';
      els.focusToggle.title = 'Ẩn phần phụ để đọc SGK rộng hơn trong app';
    }
    if (els.pageCounter && hasDoc) {
      els.pageCounter.textContent = pdfReaderState.pagesPerSpread > 1 && lastVisiblePage !== pdfReaderState.currentPage
        ? ('Trang ' + pdfReaderState.currentPage + '-' + lastVisiblePage + '/' + pdfReaderState.totalPages)
        : ('Trang ' + pdfReaderState.currentPage + '/' + pdfReaderState.totalPages);
    }
  }

  function setPdfReaderFocusMode(isFocusMode) {
    document.body.classList.toggle('reading-pdf-focus-mode', !!isFocusMode);
    updatePdfReaderControls();
    if (!pdfReaderState.pdfDoc) return;
    setTimeout(function() {
      renderPdfSpread(true).catch(function(err) {
        fallbackToIframePdf(pdfReaderState.pdfId, pdfReaderState.readStep, 'PDF.js render failed after focus mode toggle: ' + (err && err.message ? err.message : err));
      });
    }, 80);
  }

  function togglePdfReaderFocusMode() {
    setPdfReaderFocusMode(!document.body.classList.contains('reading-pdf-focus-mode'));
  }

  function createPdfPageSlot(pageNumber) {
    var slot = document.createElement('div');
    slot.className = 'study-pdf-page-slot';
    slot.dataset.pageNumber = String(pageNumber);
    var label = document.createElement('span');
    label.className = 'study-pdf-page-label';
    label.textContent = 'Trang ' + pageNumber;
    slot.appendChild(label);
    return slot;
  }

  function appendCanvasWithCrop(slot, canvas, cssWidth, cssHeight) {
    var profile = pdfReaderState.cropMode === 'on' ? sanitizeCropProfile(pdfReaderState.cropProfile) : null;
    var clip = document.createElement('div');
    clip.className = 'study-pdf-page-clip';
    if (profile) {
      var left = cssWidth * profile.left;
      var top = cssHeight * profile.top;
      var visibleWidth = Math.max(1, cssWidth * (1 - profile.left - profile.right));
      var visibleHeight = Math.max(1, cssHeight * (1 - profile.top - profile.bottom));
      clip.style.width = visibleWidth + 'px';
      clip.style.height = visibleHeight + 'px';
      canvas.style.marginLeft = (-left) + 'px';
      canvas.style.marginTop = (-top) + 'px';
    } else {
      clip.style.width = cssWidth + 'px';
      clip.style.height = cssHeight + 'px';
      canvas.style.marginLeft = '0';
      canvas.style.marginTop = '0';
    }
    clip.appendChild(canvas);
    slot.appendChild(clip);
  }

  function renderPdfPage(pageNumber, slot, serial) {
    if (!pdfReaderState.pdfDoc || !slot) return Promise.resolve();
    var spread = document.getElementById('study-pdf-spread');
    if (!spread) return Promise.resolve();
    var dpr = Math.min(window.devicePixelRatio || 1, PDF_READER_MAX_DPR);
    var cacheKey = buildPdfRenderCacheKey(pageNumber, dpr);
    var cached = pdfReaderState.pageCache.get(cacheKey);
    if (cached) {
      appendCanvasWithCrop(slot, cached.canvas, cached.cssWidth, cached.cssHeight);
      return Promise.resolve();
    }
    return pdfReaderState.pdfDoc.getPage(pageNumber).then(function(page) {
      if (serial !== pdfReaderRenderSerial) return;
      var baseViewport = page.getViewport({ scale: 1 });
      var spreadWidth = Math.max(1, spread.clientWidth || 320);
      var spreadHeight = Math.max(1, spread.clientHeight || 420);
      var profile = pdfReaderState.cropMode === 'on' ? sanitizeCropProfile(pdfReaderState.cropProfile) : null;
      var visibleRatioWidth = profile ? Math.max(0.72, 1 - profile.left - profile.right) : 1;
      var visibleRatioHeight = profile ? Math.max(0.72, 1 - profile.top - profile.bottom) : 1;
      var targetWidth = Math.max(1, (spreadWidth / pdfReaderState.pagesPerSpread) - (pdfReaderState.pagesPerSpread > 1 ? 0 : 12));
      var targetHeight = Math.max(1, spreadHeight - 12);
      var fitScale = Math.min(
        targetWidth / (baseViewport.width * visibleRatioWidth),
        targetHeight / (baseViewport.height * visibleRatioHeight)
      );
      if (!isFinite(fitScale) || fitScale <= 0) fitScale = 1;
      var cssScale = fitScale * pdfReaderState.zoom;
      var cssWidth = Math.max(1, Math.floor(baseViewport.width * cssScale));
      var cssHeight = Math.max(1, Math.floor(baseViewport.height * cssScale));
      var renderScale = cssScale * dpr;
      var pixelCount = baseViewport.width * renderScale * baseViewport.height * renderScale;
      if (pixelCount > PDF_READER_MAX_PIXELS) {
        renderScale = Math.sqrt(PDF_READER_MAX_PIXELS / (baseViewport.width * baseViewport.height));
        cssScale = renderScale / dpr;
        cssWidth = Math.max(1, Math.floor(baseViewport.width * cssScale));
        cssHeight = Math.max(1, Math.floor(baseViewport.height * cssScale));
      }
      var viewport = page.getViewport({ scale: renderScale });
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d', { alpha: false });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = cssWidth + 'px';
      canvas.style.height = cssHeight + 'px';
      canvas.setAttribute('aria-label', 'Trang ' + pageNumber);
      var task = page.render({ canvasContext: ctx, viewport: viewport });
      pdfReaderState.renderTasks[pageNumber] = task;
      return task.promise.then(function() {
        delete pdfReaderState.renderTasks[pageNumber];
        if (serial !== pdfReaderRenderSerial) return;
        pdfReaderState.pageCache.set(cacheKey, {
          canvas: canvas,
          cssWidth: cssWidth,
          cssHeight: cssHeight
        });
        trimPdfReaderCache();
        appendCanvasWithCrop(slot, canvas, cssWidth, cssHeight);
      }).catch(function(err) {
        delete pdfReaderState.renderTasks[pageNumber];
        if (err && err.name === 'RenderingCancelledException') return;
        throw err;
      });
    });
  }

  function renderPdfSpread(force) {
    if (!pdfReaderState.pdfDoc) return Promise.resolve();
    var els = getPdfReaderElements();
    if (!els.spread) return Promise.resolve();
    if (document.hidden) {
      cancelPdfRenderTasks();
      return Promise.resolve();
    }
    var signature = buildPdfRenderSignature(els);
    if (!force && pdfReaderState.lastRenderSignature === signature && els.spread.children.length > 0) {
      updatePdfReaderControls();
      return Promise.resolve();
    }
    if (pdfReaderState.rendering) {
      pdfReaderState.pendingRender = true;
      return pdfReaderState.activeRenderPromise || Promise.resolve();
    }
    pdfReaderState.rendering = true;
    pdfReaderState.pendingRender = false;
    pdfReaderState.lastRenderSignature = signature;
    pdfReaderRenderSerial++;
    var serial = pdfReaderRenderSerial;
    cancelPdfPreload();
    cancelPdfRenderTasks();
    pdfReaderState.pagesPerSpread = Math.min(getPdfPagesPerSpread(), pdfReaderState.totalPages || 1);
    if (pdfReaderState.pagesPerSpread > 1 && pdfReaderState.currentPage % 2 === 0) {
      pdfReaderState.currentPage = Math.max(1, pdfReaderState.currentPage - 1);
    }
    pdfReaderState.renderSizeKey = [
      Math.round(els.spread.clientWidth || 0),
      Math.round(els.spread.clientHeight || 0),
      pdfReaderState.pagesPerSpread
    ].join('x');
    while (els.spread.firstChild) els.spread.removeChild(els.spread.firstChild);
    els.spread.classList.toggle('is-two-page', pdfReaderState.pagesPerSpread > 1);
    setPdfReaderStatus('Đang vẽ trang sách...');
    var pages = [];
    for (var i = 0; i < pdfReaderState.pagesPerSpread; i++) {
      var pageNumber = pdfReaderState.currentPage + i;
      if (pageNumber <= pdfReaderState.totalPages) {
        var slot = createPdfPageSlot(pageNumber);
        els.spread.appendChild(slot);
        pages.push(renderPdfPage(pageNumber, slot, serial));
      }
    }
    updatePdfReaderControls();
    pdfReaderState.activeRenderPromise = Promise.all(pages).then(function() {
      if (serial === pdfReaderRenderSerial) setPdfReaderStatus('');
      schedulePdfPreload();
      pdfReaderState.rendering = false;
      pdfReaderState.activeRenderPromise = null;
      if (pdfReaderState.pendingRender) {
        pdfReaderState.pendingRender = false;
        return renderPdfSpread(true);
      }
    }).catch(function(err) {
      pdfReaderState.rendering = false;
      pdfReaderState.activeRenderPromise = null;
      if (serial !== pdfReaderRenderSerial) return;
      throw err;
    });
    return pdfReaderState.activeRenderPromise;
  }

  function schedulePdfPreload() {
    cancelPdfPreload();
    if (!pdfReaderState.pdfDoc || document.hidden) return;
    var preload = function() {
      pdfReaderPreloadTimer = null;
      pdfReaderPreloadIdleId = null;
      if (!pdfReaderState.pdfDoc || document.hidden) return;
      var nextPage = pdfReaderState.currentPage + pdfReaderState.pagesPerSpread;
      if (nextPage <= pdfReaderState.totalPages) {
        pdfReaderState.pdfDoc.getPage(nextPage).catch(function() {});
      }
    };
    if (window.requestIdleCallback) pdfReaderPreloadIdleId = window.requestIdleCallback(preload, { timeout: 1200 });
    else pdfReaderPreloadTimer = setTimeout(preload, 600);
  }

  function loadPdfDocumentCanvas(lessonId, readStep, pdfUrl) {
    var serial = ++pdfReaderRenderSerial;
    pdfReaderState.pdfId = lessonId || '';
    pdfReaderState.pdfUrl = pdfUrl || '';
    pdfReaderState.readStep = readStep || {};
    logPdfDebug('load:start', getPdfLoadContext(lessonId, readStep, pdfUrl));
    showPdfCanvasReader();
    setPdfReaderStatus('Đang tải PDF.js...');
    return loadPdfJs().then(function(pdfjsLib) {
      if (serial !== pdfReaderRenderSerial) return null;
      setPdfReaderStatus('Đang kiểm tra SGK...');
      logPdfDebug('getDocument:start', { pdfUrl: pdfUrl, workerUrl: PDFJS_WORKER_URL });
      var loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
      pdfReaderState.loadingTask = loadingTask;
      return withPdfTimeout(loadingTask.promise, 'PDF.js did not finish loading the document.');
    }).then(function(pdfDoc) {
      if (!pdfDoc || serial !== pdfReaderRenderSerial) return false;
      logPdfDebug('getDocument:ok', { pages: pdfDoc.numPages || 0, fingerprint: getPdfFingerprint(pdfDoc) });
      pdfReaderState.pdfDoc = pdfDoc;
      pdfReaderState.pdfUrl = pdfUrl;
      pdfReaderState.pdfId = lessonId || '';
      pdfReaderState.readStep = readStep || {};
      pdfReaderState.totalPages = pdfDoc.numPages || 0;
      pdfReaderState.currentPage = Math.min(getInitialPdfPage(readStep), pdfReaderState.totalPages || 1);
      pdfReaderState.pdfKey = resolvePdfKey(pdfDoc, lessonId, readStep, pdfUrl);
      pdfReaderState.cropProfile = sanitizeCropProfile(getCropProfileForPdf(pdfDoc, lessonId, readStep, pdfUrl));
      pdfReaderState.cropMode = pdfReaderState.cropProfile ? 'on' : 'off';
      clearPdfReaderCache();
      return renderPdfSpread().then(function() {
        updatePdfReaderControls();
        return true;
      });
    }).catch(function(err) {
      logPdfDebug('getDocument:error', {
        context: getPdfLoadContext(lessonId, readStep, pdfUrl),
        message: err && err.message ? err.message : String(err || 'PDF load failed')
      }, 'warn');
      throw err;
    });
  }

  function fallbackToIframePdf(lessonId, readStep, reason) {
    cancelPdfRenderTasks();
    cancelPdfPreload();
    var ok = showPdfIframeFallback(lessonId, readStep, reason);
    updatePdfReaderControls();
    if (ok) _pa1_showPdfModal(lessonId, readStep);
  }

  function goPdfPage(delta) {
    if (!pdfReaderState.pdfDoc) return;
    var step = pdfReaderState.pagesPerSpread || 1;
    var next = pdfReaderState.currentPage + (delta * step);
    next = Math.max(1, Math.min(next, pdfReaderState.totalPages || 1));
    if (next === pdfReaderState.currentPage) return;
    pdfReaderState.currentPage = next;
    renderPdfSpread().catch(function(err) {
      fallbackToIframePdf(pdfReaderState.pdfId, pdfReaderState.readStep, 'PDF.js render failed during page navigation: ' + (err && err.message ? err.message : err));
    });
  }

  function setPdfZoom(delta) {
    if (!pdfReaderState.pdfDoc) return;
    var nextZoom = Math.max(0.8, Math.min(1.6, pdfReaderState.zoom + delta));
    if (Math.abs(nextZoom - pdfReaderState.zoom) < 0.01) return;
    pdfReaderState.zoom = nextZoom;
    renderPdfSpread().catch(function(err) {
      fallbackToIframePdf(pdfReaderState.pdfId, pdfReaderState.readStep, 'PDF.js render failed during zoom: ' + (err && err.message ? err.message : err));
    });
  }

  function togglePdfCrop() {
    if (!pdfReaderState.pdfDoc || !pdfReaderState.cropProfile) return;
    pdfReaderState.cropMode = pdfReaderState.cropMode === 'on' ? 'off' : 'on';
    renderPdfSpread().catch(function(err) {
      fallbackToIframePdf(pdfReaderState.pdfId, pdfReaderState.readStep, 'PDF.js render failed during crop toggle: ' + (err && err.message ? err.message : err));
    });
  }

  function handlePdfReaderResize() {
    if (!pdfReaderState.pdfDoc) return;
    if (pdfReaderResizeTimer) clearTimeout(pdfReaderResizeTimer);
    pdfReaderResizeTimer = setTimeout(function() {
      pdfReaderResizeTimer = null;
      var nextPagesPerSpread = getPdfPagesPerSpread();
      if (nextPagesPerSpread !== pdfReaderState.pagesPerSpread) clearPdfReaderCache();
      renderPdfSpread().catch(function(err) {
        fallbackToIframePdf(pdfReaderState.pdfId, pdfReaderState.readStep, 'PDF.js render failed after resize: ' + (err && err.message ? err.message : err));
      });
    }, PDF_READER_RESIZE_DELAY);
  }

  function bindPdfReaderControls() {
    var els = getPdfReaderElements();
    if (els.prev) els.prev.onclick = function() { goPdfPage(-1); };
    if (els.next) els.next.onclick = function() { goPdfPage(1); };
    if (els.zoomIn) els.zoomIn.onclick = function() { setPdfZoom(0.1); };
    if (els.zoomOut) els.zoomOut.onclick = function() { setPdfZoom(-0.1); };
    if (els.cropToggle) els.cropToggle.onclick = togglePdfCrop;
    if (els.focusToggle) els.focusToggle.onclick = togglePdfReaderFocusMode;
  }

  window.addEventListener('resize', handlePdfReaderResize);
  document.addEventListener('keydown', function(ev) {
    if (ev.key === 'Escape' && document.body.classList.contains('reading-pdf-focus-mode')) {
      setPdfReaderFocusMode(false);
    }
  });
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      cancelPdfPreload();
      cancelPdfRenderTasks();
      pdfReaderState.rendering = false;
      pdfReaderState.pendingRender = false;
      pdfReaderState.activeRenderPromise = null;
      return;
    }
    if (pdfReaderState.pdfDoc && document.body.classList.contains('pdfjs-reader-active')) {
      if (pdfReaderResizeTimer) clearTimeout(pdfReaderResizeTimer);
      pdfReaderResizeTimer = setTimeout(function() {
        pdfReaderResizeTimer = null;
        renderPdfSpread(true).catch(function(err) {
          fallbackToIframePdf(pdfReaderState.pdfId, pdfReaderState.readStep, 'PDF.js render failed after tab restore: ' + (err && err.message ? err.message : err));
        });
      }, PDF_READER_RESIZE_DELAY);
    }
  });

  function enterReadingPdfMode(pdfId, readStep) {
    var frame = document.getElementById('reading-pdf-frame');
    var url = buildReadingPdfUrl(pdfId, readStep);
    if (!frame || !url) return false;
    frame.src = url;
    document.body.classList.add('reading-pdf-mode');
    return true;
  }

  function exitReadingPdfMode() {
    document.body.classList.remove('reading-pdf-mode');
    document.body.classList.remove('pdfjs-reader-active');
    document.body.classList.remove('reading-pdf-focus-mode');
    var frame = document.getElementById('reading-pdf-frame');
    if (frame && (!frame.src || frame.src === 'undefined' || frame.src === 'null')) {
      frame.src = 'about:blank';
    }
  }

  function clearReadingPdfFrame() {
    exitReadingPdfMode();
    resetReadingExplanation();
    resetPdfReaderState();
    var pdfFrame = document.getElementById('reading-pdf-frame');
    if (pdfFrame) pdfFrame.src = 'about:blank';
  }

  function getCurrentReadingUnitId(session) {
    return (session && session.unit_id) || learnState.unitId || '';
  }

  function getReadingExplanationButton() {
    return document.getElementById('reading-explanation-btn') ||
      document.getElementById('reading-explanation-toggle');
  }

  function resetReadingExplanation() {
    var toggle = getReadingExplanationButton();
    var panel = document.getElementById('reading-explanation-panel');
    var content = document.getElementById('reading-explanation-content');
    if (toggle) {
      toggle.classList.add('hidden');
      toggle.disabled = false;
      toggle.textContent = 'Giải thích';
      toggle.setAttribute('aria-expanded', 'false');
    }
    if (panel) panel.classList.add('hidden');
    if (content) content.innerHTML = '';
  }

  function setReadingExplanationOpen(isOpen) {
    var toggle = getReadingExplanationButton();
    var panel = document.getElementById('reading-explanation-panel');
    if (panel) panel.classList.toggle('hidden', !isOpen);
    if (toggle) {
      toggle.textContent = isOpen ? 'Ẩn giải thích' : 'Giải thích';
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.classList.toggle('active', isOpen);
    }
  }

  function appendExplanationSection(parent, title, value, asList) {
    if (!parent || value == null || value === '') return;
    var section = document.createElement('div');
    section.className = 'reading-section';
    section.style.marginBottom = '10px';
    section.style.padding = '12px';

    var heading = document.createElement('h3');
    heading.textContent = title;
    section.appendChild(heading);

    if (asList && Array.isArray(value)) {
      var list = document.createElement('ul');
      for (var i = 0; i < value.length; i++) {
        var item = document.createElement('li');
        item.textContent = value[i];
        list.appendChild(item);
      }
      section.appendChild(list);
    } else {
      var body = document.createElement('p');
      body.textContent = Array.isArray(value) ? value.join(' ') : String(value);
      section.appendChild(body);
    }

    parent.appendChild(section);
  }

  function renderReadingExplanation(contentData) {
    var content = document.getElementById('reading-explanation-content');
    if (!content) return;
    content.innerHTML = '';
    // API wraps lesson fields one level deeper: {daily_unit_id, content: {objective,...}, ...}
    var lesson = (contentData && contentData.content) ? contentData.content : contentData;
    var glossary = document.getElementById('study-glossary-preview');
    if (glossary) glossary.textContent = buildReaderPreviewText(lesson || {}, learnState.currentSession || {});
    var source = document.createElement('div');
    source.className = 'reading-explanation-source';
    source.textContent = 'AI biên soạn để trẻ dễ hiểu hơn; SGK gốc vẫn hiển thị phía trên.';
    content.appendChild(source);
    appendExplanationSection(content, 'Mục tiêu', lesson.objective, false);
    appendExplanationSection(content, 'VyVy giải thích', lesson.explanation, false);
    appendExplanationSection(content, 'Ví dụ', lesson.examples, true);
    appendExplanationSection(content, 'Ghi nhớ', lesson.remember, false);
  }

  function setupReadingExplanation(session) {
    var unitId = getCurrentReadingUnitId(session);
    var toggle = getReadingExplanationButton();
    if (!toggle || !unitId) {
      resetReadingExplanation();
      return;
    }

    function activate(contentData) {
      if (!contentData) {
        resetReadingExplanation();
        return;
      }
      renderReadingExplanation(contentData);
      toggle.classList.remove('hidden');
      toggle.disabled = false;
      toggle.textContent = 'Giải thích';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.onclick = function() {
        var panel = document.getElementById('reading-explanation-panel');
        var isOpen = !!(panel && !panel.classList.contains('hidden'));
        setReadingExplanationOpen(!isOpen);
      };
    }

    toggle.disabled = true;
    toggle.textContent = 'Đang tải...';
    if (learnState.explanationCache[unitId]) {
      activate(learnState.explanationCache[unitId]);
      return;
    }

    fetch(API_BASE + '/curriculum/lesson-explanation?unit_id=' + encodeURIComponent(unitId))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data || data.has_content === false || !data.content) {
          resetReadingExplanation();
          return;
        }
        learnState.explanationCache[unitId] = data.content;
        activate(data.content);
      })
      .catch(function() {
        resetReadingExplanation();
      });
  }

  function _pa1_initReadingView(session) {
    var readStep = (session && session.steps && session.steps.read) || {};
    var lessonId = getReadingPdfId(readStep, session) || learnState.selectedPdfId || learnState.lessonId;
    var unitId   = learnState.unitId;

    _pa1_stopReadingAudio();

    _pa1_loadPdf(lessonId, readStep);
    _pa1_initAudio(unitId);
    _pa1_setReadingVyvy('explaining', 'Mình đọc bài cho bạn nhé! 📖');

    if (new URLSearchParams(location.search).has('debug')) {
      console.log('[PA1 curriculum]', {
        grade: learnState.activeGrade, subject: learnState.subject,
        unitId: unitId, lessonId: lessonId,
        source: 'lesson_content.json', contentStatus: 'ready'
      });
    }
  }

  function _pa1_loadPdf(lessonId, readStep) {
    var wrap  = document.getElementById('reading-pdf-wrap');
    var frame = document.getElementById('reading-pdf-frame');
    var text  = document.getElementById('reading-text-fallback');
    var pdfUrl = buildReadingPdfUrl(lessonId, readStep);
    resetPdfReaderState();
    logPdfDebug('path', getPdfLoadContext(lessonId, readStep, pdfUrl));
    if (!lessonId || !wrap || !frame || !pdfUrl) {
      exitReadingPdfMode();
      logPdfDebug('path:error', getPdfLoadContext(lessonId, readStep, pdfUrl), 'warn');
      _pa1_showTextFallback(lessonId, readStep, 'Không tìm thấy đường dẫn SGK.');
      return false;
    }

    wrap.style.display = 'none';
    if (text) text.style.display = 'none';
    document.body.classList.add('reading-pdf-mode');

    var loadPromise = loadPdfDocumentCanvas(lessonId, readStep, pdfUrl);
    var expectedSerial = pdfReaderRenderSerial;
    loadPromise.catch(function(err) {
      if (expectedSerial !== pdfReaderRenderSerial || pdfReaderState.pdfId !== lessonId) return;
      var message = err && err.message ? err.message : String(err || 'Unknown PDF.js error');
      probePdfHttp(pdfUrl).then(function(probe) {
        logPdfDebug('http:probe', { context: getPdfLoadContext(lessonId, readStep, pdfUrl), probe: probe }, probe && probe.ok ? 'info' : 'warn');
        if (probe && probe.ok === false && probe.status && probe.status >= 400) {
          _pa1_showTextFallback(lessonId, readStep, 'Không tải được SGK từ máy chủ (' + probe.status + ').');
          _pa1_showPdfModal(lessonId, readStep);
          return;
        }
        fallbackToIframePdf(lessonId, readStep, 'PDF.js unavailable for current PDF URL. Static module/worker, CORS, or render check failed: ' + message);
        frame.onerror = function() {
          _pa1_showTextFallback(lessonId, readStep, 'Trình duyệt không mở được khung SGK.');
          _pa1_showPdfModal(lessonId, readStep);
        };
        setTimeout(function() {
          if (!document.body.classList.contains('reading-pdf-mode')) return;
          try { void frame.contentDocument; }
          catch(e) { _pa1_showPdfModal(lessonId, readStep); }
        }, 4000);
      });
    });
    return true;
  }

  function _pa1_showPdfModal(lessonId, readStep) {
    var modalBtn = document.getElementById('reading-pdf-modal-btn');
    if (!modalBtn) return;
    modalBtn.style.display = 'block';
    modalBtn.textContent = 'Mở sách gốc';
    modalBtn.onclick = function() {
      if (readStep && readStep.pdf_file && lessonId === readStep.pdf_file && !readStep.pdf_lesson_id) {
        openLessonPdfViewer(null, null, getInitialPdfPage(readStep), readStep.pdf_file);
      } else {
        openLessonPdfViewer(lessonId, null, getInitialPdfPage(readStep), readStep && readStep.pdf_file);
      }
    };
  }

  function _pa1_showTextFallback(lessonId, readStep, reason) {
    exitReadingPdfMode();
    resetPdfReaderState();
    var wrap = document.getElementById('reading-pdf-wrap');
    var text = document.getElementById('reading-text-fallback');
    if (wrap) wrap.style.display = 'none';
    if (text) {
      text.style.display = 'block';
      var notice = document.getElementById('reading-pdf-fallback-notice');
      if (!notice) {
        notice = document.createElement('div');
        notice.id = 'reading-pdf-fallback-notice';
        notice.className = 'reading-pdf-fallback-notice';
        text.insertBefore(notice, text.firstChild);
      }
      while (notice.firstChild) notice.removeChild(notice.firstChild);
      var title = document.createElement('strong');
      title.textContent = 'SGK chưa mở được trong khung đọc.';
      var detail = document.createElement('span');
      detail.textContent = reason ? (' ' + reason) : ' Bạn vẫn có thể mở sách gốc và dùng các nút hỗ trợ bên dưới.';
      var action = document.createElement('button');
      action.type = 'button';
      action.className = 'reading-pdf-open-original';
      action.textContent = 'Mở sách gốc';
      action.onclick = function() { _pa1_showPdfModal(lessonId, readStep); var btn = document.getElementById('reading-pdf-modal-btn'); if (btn) btn.click(); };
      notice.appendChild(title);
      notice.appendChild(detail);
      notice.appendChild(action);
    }
  }

  function _pa1_initAudio(unitId) {
    var audioBtn    = document.getElementById('reading-audio-btn');
    var practiceBtn = document.getElementById('reading-start-practice');
    var skipBtn     = document.getElementById('reading-skip-audio');
    var voiceGender = lsGet(SK.VOICE_GENDER, 'female');
    var audioUrl    = API_BASE + '/curriculum/lesson-audio?unit_id='
                      + encodeURIComponent(unitId) + '&voice=' + voiceGender;

    if (!window._readingAudio) window._readingAudio = new Audio();
    var audio = window._readingAudio;
    audio.pause();
    audio.preload = 'none';
    audio.removeAttribute('src');
    audio.load();

    if (practiceBtn) {
      practiceBtn.disabled = true;
      practiceBtn.title = 'Nghe VyVy đọc bài hoặc bấm Bỏ qua để luyện tập';
    }
    if (audioBtn) {
      audioBtn.textContent = '▶ VyVy đọc bài';
      audioBtn.classList.add('vyvy-cta-pulse');
    }
    if (skipBtn) {
      skipBtn.style.setProperty('display', 'inline-flex', 'important');
      skipBtn.style.setProperty('align-items', 'center');
      skipBtn.style.setProperty('justify-content', 'center');
    }

    var finishDeferredAudio = function() {
      if (audioBtn) {
        audioBtn.textContent = '▶ Nghe lại';
        audioBtn.classList.add('vyvy-cta-pulse');
      }
      if (practiceBtn) {
        practiceBtn.disabled = false;
        practiceBtn.title = 'Bắt đầu luyện tập để nhận sao';
      }
      _pa1_setReadingVyvy('happy', 'Nghe xong rồi! Sẵn sàng chưa?');
    };

    audio.onended = finishDeferredAudio;
    audio.onplaying = function() {
      if (audioBtn) {
        audioBtn.textContent = '⏸ Đang đọc';
        audioBtn.classList.remove('vyvy-cta-pulse');
      }
      _pa1_setReadingVyvy('explaining', 'Mình đọc bài cho bạn nhé!');
    };
    audio.onerror = function() {
      if (audioBtn) {
        audioBtn.textContent = '▶ VyVy đọc bài';
        audioBtn.classList.add('vyvy-cta-pulse');
      }
      if (practiceBtn) {
        practiceBtn.disabled = false;
        practiceBtn.title = 'Không tải được audio, bạn có thể luyện tập tiếp';
      }
    };

    if (audioBtn) {
      audioBtn.onclick = function() {
        if (!audio.paused) {
          audio.pause();
          audioBtn.textContent = '▶ Tiếp tục';
          audioBtn.classList.add('vyvy-cta-pulse');
          return;
        }
        if (audio.getAttribute('src') !== audioUrl) {
          audio.src = audioUrl;
          audio.load();
        }
        audioBtn.textContent = '⏳ Đang tải...';
        audioBtn.classList.remove('vyvy-cta-pulse');
        audio.play().catch(function() {
          audioBtn.textContent = '▶ VyVy đọc bài';
          audioBtn.classList.add('vyvy-cta-pulse');
          if (practiceBtn) {
            practiceBtn.disabled = false;
            practiceBtn.title = 'Không phát được audio, bạn có thể luyện tập tiếp';
          }
        });
      };
    }
  }

  function _pa1_setReadingVyvy(pose, message) {
    var catalogRoot = window.VYVY_CATALOG || {};
    var catalog = catalogRoot.states || {};
    var fallbackAssets = {
      idle: 'vyvy_idle.webp',
      explaining: 'vyvy_explaining.webp',
      happy: 'vyvy_cheering.webp',
      reading: 'vyvy_reading.webp',
      listening: 'vyvy_listening.webp',
      thinking: 'vyvy_thinking.webp'
    };
    var poseDef = catalog[pose] || catalog['idle'] || {};
    var basePath = catalogRoot.basePath || '/static/assets/vyvy/';
    var imgSrc  = poseDef.asset
      ? basePath + poseDef.asset
      : basePath + (fallbackAssets[pose] || fallbackAssets.idle || 'vyvy_idle.webp');

    var img    = document.getElementById('reading-vyvy-img');
    var railImg = document.getElementById('reading-vyvy-rail-img');
    var bubble = document.getElementById('reading-vyvy-bubble');
    if (img) img.src = imgSrc;
    if (railImg) railImg.src = imgSrc;
    if (bubble && message) {
      bubble.textContent = message;
      bubble.classList.remove('hidden');
      if (pose === 'happy') {
        setTimeout(function() { bubble.classList.add('hidden'); }, 3000);
      }
    }
  }

  function _pa1_skipAudio() {
    if (window._readingAudio) {
      window._readingAudio.pause();
    }
    var practiceBtn = document.getElementById('reading-start-practice');
    var audioBtn    = document.getElementById('reading-audio-btn');
    if (practiceBtn) {
      practiceBtn.disabled = false;
      practiceBtn.title = 'Bắt đầu luyện tập để nhận sao';
    }
    if (audioBtn) audioBtn.textContent = '▶ Nghe lại';
    _pa1_setReadingVyvy('happy', 'Sẵn sàng luyện tập thôi nào! 💪');
  }
  window._pa1_skipAudio = _pa1_skipAudio;

  var _lessonAudioEl = null;
  function playLessonAudio(btn) {
    var bn = state.settings.bot_name || 'VyVy';
    if (_lessonAudioEl && !_lessonAudioEl.paused) {
      _lessonAudioEl.pause();
      _lessonAudioEl.currentTime = 0;
      _lessonAudioEl = null;
      btn.classList.remove('playing');
      btn.textContent = '🔊 Nghe ' + bn + ' đọc';
      ttsState.state = 'idle';
      return;
    }
    stopCurrentAudio();
    btn.classList.add('playing');
    btn.textContent = '⏸ Đang nghe...';
    ttsState.state = 'loading';
    var unitId = learnState.unitId;
    var voiceGender = state.settings.voice_gender || 'female';
    var audioUrl = API_BASE + '/curriculum/lesson-audio?unit_id=' + encodeURIComponent(unitId) + '&voice=' + voiceGender;
    var audio = new Audio(audioUrl);
    audio.preload = 'none';
    _lessonAudioEl = audio;
    ttsState.currentAudio = audio;

    audio.onplay = function() {
      ttsState.state = 'playing';
    };
    audio.onended = function() {
      btn.classList.remove('playing');
      btn.textContent = '🔊 Nghe ' + bn + ' đọc';
      _lessonAudioEl = null;
      ttsState.currentAudio = null;
      ttsState.state = 'idle';
    };
    audio.onerror = function() {
      btn.classList.remove('playing');
      btn.textContent = '🔊 Nghe ' + bn + ' đọc';
      _lessonAudioEl = null;
      ttsState.currentAudio = null;
      ttsState.state = 'idle';
      speak(document.getElementById('reading-objective-text').textContent + '. ' + document.getElementById('reading-explanation-text').textContent);
    };
    audio.play().catch(function() {
      btn.classList.remove('playing');
      btn.textContent = '🔊 Nghe ' + bn + ' đọc';
      _lessonAudioEl = null;
      ttsState.currentAudio = null;
      ttsState.state = 'idle';
    });
  }

  function openPdfViewer(bookId, pageStart, pdfFile) {
    var grade = learnState.activeGrade;
    var filename = encodeURIComponent(pdfFile);
    var url = API_BASE + '/curriculum/pdf/' + grade + '/' + filename;
    if (pageStart) url += '#page=' + pageStart;
    window.open(url, '_blank');
  }

  function openLessonPdfViewer(lessonId, bookId, pageStart, pdfFile) {
    var overlay = document.getElementById('pdf-viewer-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pdf-viewer-overlay';
      overlay.className = 'pdf-viewer-overlay';
      overlay.innerHTML = '<div class="pdf-viewer-container">' +
        '<div class="pdf-viewer-header">' +
          '<span class="pdf-viewer-title">Sách giáo khoa</span>' +
          '<div class="pdf-viewer-controls">' +
            '<button class="pdf-viewer-prev" onclick="pdfViewerPrev()">&#9664; Trang trước</button>' +
            '<span class="pdf-viewer-page-info" id="pdf-viewer-page-info"></span>' +
            '<button class="pdf-viewer-next" onclick="pdfViewerNext()">Trang sau &#9654;</button>' +
          '</div>' +
          '<button class="pdf-viewer-close" onclick="closePdfViewer()">&times;</button>' +
        '</div>' +
        '<iframe id="pdf-viewer-frame" class="pdf-viewer-frame" frameborder="0"></iframe>' +
      '</div>';
      document.body.appendChild(overlay);
    }

    var frame = document.getElementById('pdf-viewer-frame');
    var titleEl = overlay.querySelector('.pdf-viewer-title');

    var pdfUrl;
    if (lessonId) {
      pdfUrl = API_BASE + '/curriculum/lesson-pdf/' + lessonId;
    } else {
      var grade = learnState.activeGrade;
      var filename = encodeURIComponent(pdfFile);
      pdfUrl = API_BASE + '/curriculum/pdf/' + grade + '/' + filename;
    }

    frame.src = pdfUrl;
    if (titleEl) titleEl.textContent = 'Sách giáo khoa - Bài học';
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closePdfViewer() {
    var overlay = document.getElementById('pdf-viewer-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      var frame = document.getElementById('pdf-viewer-frame');
      if (frame) frame.src = '';
    }
  }

  function pdfViewerPrev() {
    var frame = document.getElementById('pdf-viewer-frame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: 'pdf-prev' }, '*');
    }
  }

  function pdfViewerNext() {
    var frame = document.getElementById('pdf-viewer-frame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: 'pdf-next' }, '*');
    }
  }

  function startPracticeFromReading() {
    _pa1_stopReadingAudio();
    clearReadingPdfFrame();
    var readingDiv = document.getElementById('learn-reading');
    var sessionDiv = document.getElementById('learn-session');
    setLearningStage('session');
    if (readingDiv) readingDiv.classList.add('hidden');
    if (sessionDiv) sessionDiv.classList.remove('hidden');

    var session = learnState.currentSession;
    if (!session) return;

    var titleEl = document.getElementById('learn-session-title');
    if (titleEl) titleEl.textContent = session.subject_emoji + ' ' + session.title;

    var msgEl = document.getElementById('learn-message');
    if (msgEl) msgEl.textContent = 'VyVy đang chuẩn bị câu hỏi...';

    fetch(API_BASE + '/curriculum/session/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        session_data: session,
        step: 'read',
        user_answer: '',
        item_index: 0,
        child_age: state.settings.age,
        nickname: state.settings.nickname
      })
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.error) {
          if (msgEl) msgEl.textContent = 'Có lỗi: ' + data.error;
          return;
        }
        learnState.currentStep = data.next_step;
        learnState.itemIndex = data.item_index || 0;
        // Extract options for first practice question
        var session = learnState.currentSession;
        if (session) {
          var items = (session.steps.practice || {}).items || [];
          if (items.length > 0 && items[0].options) {
            learnState.currentOptions = items[0].options;
          }
        }
        if (msgEl) msgEl.textContent = data.message;
        showLearnInput();
        updateStarsDisplay();
        updateProgressBar();
      })
      .catch(function(err) {
        if (msgEl) msgEl.textContent = 'Lỗi: ' + (err.message || err);
      });
  }

  function showLearnInput() {
    var inputArea = document.getElementById('learn-input-area');
    var actionsArea = document.getElementById('learn-actions');
    var input = document.getElementById('learn-answer-input');

    // Check if current question has multiple choice options
    var options = learnState.currentOptions;
    if (options && options.length > 0) {
      // Render multiple choice buttons
      if (inputArea) {
        inputArea.classList.remove('hidden');
        inputArea.innerHTML = '<div class="mc-options" id="mc-options"></div>';
        var mcContainer = document.getElementById('mc-options');
        for (var i = 0; i < options.length; i++) {
          var btn = document.createElement('button');
          btn.className = 'mc-option-btn';
          btn.textContent = options[i];
          btn.dataset.value = options[i];
          btn.onclick = function() {
            // Disable all buttons
            var allBtns = mcContainer.querySelectorAll('.mc-option-btn');
            for (var j = 0; j < allBtns.length; j++) allBtns[j].disabled = true;
            this.classList.add('mc-selected');
            // Send answer
            sendMcAnswer(this.dataset.value);
          };
          mcContainer.appendChild(btn);
        }
      }
    } else {
      // Restore text input if previously replaced
      if (inputArea) {
        inputArea.classList.remove('hidden');
        inputArea.innerHTML = '<input type="text" id="learn-answer-input" class="learn-answer-input" placeholder="Nhập câu trả lời..." autocomplete="off"><button id="learn-answer-btn" class="learn-answer-btn">Gửi</button>';
        var newInput = document.getElementById('learn-answer-input');
        var newBtn = document.getElementById('learn-answer-btn');
        if (newBtn) newBtn.onclick = sendLearnAnswer;
        if (newInput) {
          newInput.onkeydown = function(e) { if (e.key === 'Enter') sendLearnAnswer(); };
          newInput.focus();
        }
      }
    }

    if (actionsArea) actionsArea.classList.add('hidden');
  }

  function sendMcAnswer(answer) {
    var msgEl = document.getElementById('learn-message');
    if (msgEl) msgEl.textContent = 'VyVy đang suy nghĩ...';

    var session = learnState.currentSession;
    if (!session) return;

    var payload = {
      session_data: session,
      step: learnState.currentStep,
      user_answer: answer,
      item_index: learnState.itemIndex,
      child_age: state.settings.age,
      nickname: state.settings.nickname
    };

    fetch(API_BASE + '/curriculum/session/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        handleLearnResponse(data);
      })
      .catch(function() {
        if (msgEl) msgEl.textContent = 'Không kết nối được. Thử lại nhé!';
      });
  }

  function showLearnNext() {
    var inputArea = document.getElementById('learn-input-area');
    var actionsArea = document.getElementById('learn-actions');
    if (inputArea) inputArea.classList.add('hidden');
    if (actionsArea) actionsArea.classList.remove('hidden');
  }

  function updateStarsDisplay() {
    var el = document.getElementById('learn-stars');
    if (!el) return;
    var stars = '';
    for (var i = 0; i < learnState.totalStars; i++) stars += '⭐';
    if (learnState.totalStars === 0) stars = '';
    el.textContent = stars;
  }

  function updateProgressBar() {
    var bar = document.getElementById('learn-progress-bar');
    var fill = document.getElementById('learn-progress-fill');
    var text = document.getElementById('learn-progress-text');
    if (!bar || !fill || !text) return;
    var total = learnState.totalItems || 0;
    var current = Number(learnState.itemIndex);
    if (!isFinite(current) || current < 0) current = 0;
    if (total > 0 && current >= total) current = total - 1;
    if (total <= 0) {
      bar.classList.add('hidden');
      return;
    }
    bar.classList.remove('hidden');
    var pct = Math.min(100, Math.round(((current + 1) / total) * 100));
    fill.style.width = pct + '%';
    text.textContent = 'Câu ' + (current + 1) + '/' + total;
  }

  function sendLearnAnswer() {
    var input = document.getElementById('learn-answer-input');
    if (!input || !input.value.trim()) return;
    var answer = input.value.trim();
    var session = learnState.currentSession;
    if (!session) return;

    var msgEl = document.getElementById('learn-message');
    if (msgEl) msgEl.textContent = 'VyVy đang suy nghĩ...';

    var payload = {
      session_data: session,
      step: learnState.currentStep,
      user_answer: answer,
      item_index: learnState.itemIndex,
      child_age: state.settings.age,
      nickname: state.settings.nickname
    };
    // Send practice stars when moving to check step
    if (learnState.currentStep === 'check') {
      payload.practice_stars = learnState.totalStars;
    }

    fetch(API_BASE + '/curriculum/session/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        handleLearnResponse(data);
      })
      .catch(function() {
        if (msgEl) msgEl.textContent = 'Không kết nối được. Thử lại nhé!';
      });
  }

  function handleLearnResponse(data) {
    var msgEl = document.getElementById('learn-message');
    if (data.error) {
      if (msgEl) msgEl.textContent = 'Có lỗi: ' + data.error;
      return;
    }

    if (data.evaluation) {
      learnState.totalStars += (data.evaluation.stars || 0);
      updateStarsDisplay();
      if (data.evaluation.correct) {
        playSound('success');
        speak('Đúng rồi! Giỏi quá!');
        if (window.VyvyDecor && window.VyvyDecor.recordExerciseResult) {
          window.VyvyDecor.recordExerciseResult(true);
        }
      } else {
        playSound('wrong');
        var expectedTxt = data.evaluation.expected ? ' Đáp án là ' + data.evaluation.expected : '';
        speak('Thử lại nhé!' + expectedTxt);
        if (window.VyvyDecor && window.VyvyDecor.recordExerciseResult) {
          window.VyvyDecor.recordExerciseResult(false);
        }
      }
    }

    learnState.currentStep = data.next_step;
    if (!data.retry) {
      learnState.itemIndex = data.item_index || learnState.itemIndex;
    }
    updateProgressBar();

    // Extract options for next question from session data
    var session = learnState.currentSession;
    if (session && data.next_step === 'practice') {
      var items = (session.steps.practice || {}).items || [];
      var idx = data.item_index || learnState.itemIndex;
      if (idx >= 0 && idx < items.length) {
        learnState.currentOptions = items[idx].options || null;
      }
    } else if (data.retry) {
      // Keep current options on retry
    } else {
      learnState.currentOptions = null;
    }

    if (msgEl) {
      if (data.retry) {
        msgEl.innerHTML = renderMarkdown(data.message);
      } else {
        var _parts = data.message.split('\n');
        var _feedback = _parts[0] || '';
        var _question = _parts.slice(1).join('\n').trim();
        if (_question) {
          msgEl.innerHTML = '<div class="learn-feedback-line">' + _feedback + '</div><div>' + _question + '</div>';
        } else {
          msgEl.textContent = _feedback;
        }
      }
    }

    if (data.next_step === 'feedback') {
      showLearnNext();
      learnState.currentOptions = null;
      // Auto-complete
      var unitId = learnState.unitId;
      var subject = learnState.subject;
      var stars = learnState.totalStars;
      var grade = learnState.activeGrade;
      setTimeout(function() {
        fetch(API_BASE + '/curriculum/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unit_id: unitId, subject: subject, grade: grade, score: stars * 25, stars: stars })
        }).then(function() {
          if (typeof loadStarBalance === 'function') loadStarBalance();
        }).catch(function() {});
      }, 500);
    } else if (data.next_step === 'check') {
      learnState.currentOptions = null;
      setTimeout(function() { speak('Câu cuối rồi, cố lên nào!'); }, 600);
      showLearnInput();
    } else if (data.next_step === 'practice') {
      showLearnInput();
    } else if (data.next_step === 'done') {
      setTimeout(function() { speak('Tuyệt vời! Hôm nay con học rất giỏi!'); }, 400);
      showLearningComplete();
    }
  }

  function showLearningComplete() {
    // PA1C: persist lesson history for progress tracking
    try {
      var history = JSON.parse(localStorage.getItem('vyvy_lesson_history') || '[]');
      history.push({
        unitId: learnState.unitId, subject: learnState.subject,
        grade: learnState.activeGrade, stars: learnState.totalStars,
        completedAt: new Date().toISOString()
      });
      localStorage.setItem('vyvy_lesson_history', JSON.stringify(history.slice(-100)));
    } catch(e) {}

    var area = document.getElementById('learn-session-area');
    if (!area) return;
    var stars = learnState.totalStars;
    var msg = stars >= 3 ? 'Tuyệt vời!' : stars >= 1 ? 'Giỏi lắm!' : 'Cố gắng thêm nhé!';
    area.innerHTML =
      '<div class="learn-complete">' +
      '<div class="learn-complete-icon">🎉</div>' +
      '<div class="learn-complete-msg">' + msg + '</div>' +
      '<div class="learn-complete-detail">Con được ' + stars + ' ⭐</div>' +
      '<div class="learn-complete-actions">' +
        '<button class="learn-reward-btn" id="learn-open-shop-btn" type="button">Đổi sao lấy decor</button>' +
        '<button class="learn-reward-btn secondary" id="learn-open-room-btn" type="button">Tham quan phòng</button>' +
      '</div>' +
      '<div id="next-unit-suggestion" class="next-unit-suggestion"></div>' +
      '<button class="learn-next-btn" onclick="window._vyvyLearnBack()">Chọn môn khác</button>' +
      '</div>';
    playSound('levelup');
    spawnCelebration(['⭐', '🎉', '🏆', '✨'], window.innerWidth / 2, window.innerHeight / 2);

    var openShopBtn = document.getElementById('learn-open-shop-btn');
    if (openShopBtn) {
      openShopBtn.addEventListener('click', function() {
        playSound('click');
        openRewardsPanel();
      });
    }

    var openRoomBtn = document.getElementById('learn-open-room-btn');
    if (openRoomBtn) {
      openRoomBtn.addEventListener('click', function() {
        playSound('click');
        if (window.VyvyDecor) window.VyvyDecor.setBg('home');
        showView('home');
      });
    }

    // Fetch next unit suggestion
    var nextDiv = document.getElementById('next-unit-suggestion');
    if (nextDiv) {
      fetch(API_BASE + '/curriculum/next-unit?grade=' + learnState.activeGrade + '&subject=' + learnState.subject)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.unit) {
            nextDiv.innerHTML =
              '<p class="next-unit-label">Bài tiếp theo:</p>' +
              '<button class="learn-next-btn next-unit-btn" onclick="window._vyvyStartNextUnit(\'' +
              data.unit.daily_unit_id + '\',\'' + learnState.subject + '\')">' +
              data.subject_emoji + ' ' + data.unit.title + ' →</button>';
          }
        })
        .catch(function() {});
    }
    updateMissionProgress();
  }

  function updateMissionProgress() {
    var DAILY_GOAL = 2;
    try {
      var today = new Date().toDateString();
      var history = JSON.parse(localStorage.getItem('vyvy_lesson_history') || '[]');
      var todayCount = history.filter(function(h) {
        return new Date(h.completedAt).toDateString() === today;
      }).length;
      var pct = Math.min(100, Math.round(todayCount / DAILY_GOAL * 100));
      var fill = document.querySelector('.mission-progress-fill');
      var count = document.querySelector('.mission-progress-count');
      if (fill) fill.style.width = pct + '%';
      if (count) count.textContent = todayCount + '/' + DAILY_GOAL;
    } catch(e) {}
  }

  window._vyvyStartNextUnit = function(unitId, subject) {
    learnState.subject = subject;
    learnState.totalStars = 0;
    learnState.itemIndex = 0;
    var subjectsDiv = document.getElementById('learn-subjects');
    var sessionDiv = document.getElementById('learn-session');
    var readingDiv = document.getElementById('learn-reading');
    if (subjectsDiv) subjectsDiv.classList.add('hidden');
    if (sessionDiv) sessionDiv.classList.add('hidden');
    if (readingDiv) readingDiv.classList.add('hidden');
    var titleEl = document.getElementById('learn-session-title');
    if (titleEl) titleEl.textContent = 'Đang tải bài...';
    var msgEl = document.getElementById('learn-message');
    if (msgEl) msgEl.textContent = 'VyVy đang chuẩn bị bài...';
    fetch(API_BASE + '/curriculum/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ unit_id: unitId, subject: subject, grade: learnState.activeGrade, child_age: state.settings.age, nickname: state.settings.nickname })
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.error) { if (msgEl) msgEl.textContent = 'Có lỗi: ' + data.error; if (sessionDiv) sessionDiv.classList.remove('hidden'); return; }
        learnState.currentSession = data.session;
        learnState.currentStep = data.current_step;
        learnState.unitId = data.unit_id || '';
        learnState.totalStars = 0;
        learnState.itemIndex = 0;
        learnState.totalItems = (data.session.steps.practice.items || []).length;
        if (data.current_step === 'read' && data.session.has_content) {
          showLessonReading(data.session.steps.read, data.session);
        } else {
          if (titleEl) titleEl.textContent = data.session.subject_emoji + ' ' + data.session.title;
          if (msgEl) msgEl.textContent = data.message;
          if (sessionDiv) sessionDiv.classList.remove('hidden');
          showLearnInput();
          updateStarsDisplay();
        }
      })
      .catch(function(err) { if (msgEl) msgEl.textContent = 'Lỗi: ' + (err.message || err); if (sessionDiv) sessionDiv.classList.remove('hidden'); });
  };

  function _pa1_stopReadingAudio() {
    if (window._readingAudio) {
      window._readingAudio.pause();
      window._readingAudio.onended = null;
      window._readingAudio.onerror = null;
      window._readingAudio.src = '';
    }
  }

  window._vyvyLearnBack = function() {
    _pa1_stopReadingAudio();
    clearReadingPdfFrame();
    var subjectsDiv = document.getElementById('learn-subjects');
    var sessionDiv = document.getElementById('learn-session');
    var readingDiv = document.getElementById('learn-reading');
    var lessonListDiv = document.getElementById('learn-lesson-list');
    setLearningStage('picker');
    if (subjectsDiv) subjectsDiv.classList.remove('hidden');
    if (sessionDiv) sessionDiv.classList.add('hidden');
    if (readingDiv) readingDiv.classList.add('hidden');
    if (lessonListDiv) lessonListDiv.classList.add('hidden');
    // Reset session area
    var area = document.getElementById('learn-session-area');
    if (area) {
      area.innerHTML =
        '<div id="learn-progress-bar" class="learn-progress-bar hidden">' +
        '<div class="learn-progress-track"><div id="learn-progress-fill" class="learn-progress-fill" style="width:0%"></div></div>' +
        '<span id="learn-progress-text" class="learn-progress-text">Câu 0/0</span>' +
        '</div>' +
        '<div id="learn-message" class="learn-message"></div>' +
        '<div id="learn-input-area" class="learn-input-area hidden">' +
        '<input type="text" id="learn-answer-input" class="learn-answer-input" placeholder="Nhập câu trả lời..." autocomplete="off">' +
        '<button id="learn-answer-btn" class="learn-answer-btn">Gửi</button>' +
        '</div>' +
        '<div id="learn-actions" class="learn-actions hidden">' +
        '<button id="learn-next-btn" class="learn-next-btn">Tiếp tục &rarr;</button>' +
        '</div>' +
        '<div id="learn-stars" class="learn-stars"></div>';
    }
    learnState.currentSession = null;
    learnState.currentOptions = null;
    learnState.selectedSubject = '';
    learnState.selectedSubjectLabel = '';
    resetSelectedLesson();
    loadSubjectCards();
    loadProgressDisplay();
    bindLearnInputEvents();
  };

  function loadProgressDisplay() {
    var container = document.getElementById('learn-progress-list');
    if (!container) return;
    container.innerHTML = '';

    fetch(API_BASE + '/curriculum/progress?grade=' + learnState.activeGrade)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var subjects = data.subject_progress || {};
        var keys = Object.keys(subjects);
        if (keys.length === 0) {
          container.innerHTML = '<p style="text-align:center;color:var(--text-hint);font-size:14px">Chưa có bài nào hoàn thành</p>';
          return;
        }
        for (var i = 0; i < keys.length; i++) {
          var subj = keys[i];
          var count = subjects[subj];
          var item = document.createElement('div');
          item.className = 'progress-item';
          item.innerHTML =
            '<span class="progress-label">' + subj + '</span>' +
            '<span class="progress-count">' + count + ' bài</span>';
          container.appendChild(item);
        }
      })
      .catch(function() {});
  }

  function bindLearnInputEvents() {
    var answerBtn = document.getElementById('learn-answer-btn');
    if (answerBtn) answerBtn.onclick = sendLearnAnswer;
    var answerInput = document.getElementById('learn-answer-input');
    if (answerInput) {
      answerInput.onkeydown = function(e) {
        if (e.key === 'Enter') sendLearnAnswer();
      };
    }
    var nextBtn = document.getElementById('learn-next-btn');
    if (nextBtn) nextBtn.onclick = function() { showLearningComplete(); };
    var backBtn = document.getElementById('learn-back-btn');
    if (backBtn) backBtn.onclick = window._vyvyLearnBack;
    var readingBackBtn = document.getElementById('reading-back-btn');
    if (readingBackBtn) {
      readingBackBtn.onclick = function() {
        _pa1_stopReadingAudio();
        clearReadingPdfFrame();
        backToPickerPreserveSelection();
      };
    }
    var lessonListBack = document.getElementById('lesson-list-back');
    if (lessonListBack) lessonListBack.onclick = window._vyvyLearnBack;
    var homeBtn = document.getElementById('study-home-btn');
    if (homeBtn) {
      homeBtn.onclick = function() {
        _pa1_stopReadingAudio();
        clearReadingPdfFrame();
        setLearningStage('picker');
        if (window.VyvyDecor) window.VyvyDecor.setBg('home');
        setVyvyOutfit('uniform');
        showView('home');
      };
    }
    bindPdfReaderControls();
    updateStudyStartButton();
  }

  function addButtonSounds() {
    var buttons = document.querySelectorAll('.quick-btn, .game-card, .music-item, .action-btn, .draw-tool-btn, .color-btn, .brush-btn, .learn-cta-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function(e) {
        playSound('click');
        var btn = this;
        btn.classList.add('clicked');
        setTimeout(function() { btn.classList.remove('clicked'); }, 300);
      });
    }
  }

  /* ── Games System ─────────────────────── */
  var gamesState = {
    currentGame: null,
    score: 0,
    timer: null,
    timeLeft: 0,
    gameData: {}
  };

  var GAMES = {
    catch: { name: 'Bắt bóng', icon: '⚽', time: 30 },
    memory: { name: 'Ghép đôi', icon: '🧠', time: 60 },
    count: { name: 'Đếm sao', icon: '🔢', time: 20 },
    color: { name: 'Chọn màu', icon: '🎯', time: 30 },
    puzzle: { name: 'Xếp hình', icon: '🧩', time: 45 },
    whack: { name: 'Đập chuột', icon: '🔨', time: 30 },
    wordscramble: { name: 'Xếp chữ', icon: '✏️', time: 45 }
  };

  function showGamesPanel() {
    if (window.VyvyDecor) window.VyvyDecor.setBg('games');
    showView('games');
  }

  function hideGamesPanel() {
    goBack();
  }

  function startGame(gameId) {
    var menu = document.getElementById('games-menu');
    var area = document.getElementById('game-area');
    if (menu) menu.classList.add('hidden');
    if (area) area.classList.remove('hidden');

    gamesState.currentGame = gameId;
    gamesState.score = 0;
    gamesState.timeLeft = GAMES[gameId].time;
    updateGameScore();
    updateGameTimer();

    var controls = document.getElementById('game-controls');
    if (controls) controls.innerHTML = '';

    switch(gameId) {
      case 'catch': initCatchGame(); break;
      case 'memory': initMemoryGame(); break;
      case 'count': initCountGame(); break;
      case 'color': initColorGame(); break;
      case 'puzzle': initPuzzleGame(); break;
      case 'whack': initWhackGame(); break;
      case 'wordscramble': initWordScrambleGame(); break;
    }

    gamesState.timer = setInterval(function() {
      gamesState.timeLeft--;
      updateGameTimer();
      if (gamesState.timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  function stopGame() {
    if (gamesState.timer) {
      clearInterval(gamesState.timer);
      gamesState.timer = null;
    }
    var canvas = document.getElementById('game-canvas');
    if (canvas) {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function endGame() {
    stopGame();
    playSound('levelup');
    var score = gamesState.score;
    var isNew = saveHighScore(gamesState.currentGame, score);
    var highScores = getHighScores();
    var best = highScores[gamesState.currentGame] || score;

    var msg = 'Kết thúc! Con được ' + score + ' điểm!';
    if (isNew) msg += ' 🎉 Kỷ lục mới!';
    else msg += ' (Kỷ lục: ' + best + ')';
    if (score >= 10) msg += ' Tuyệt vời! ⭐';
    else if (score >= 5) msg += ' Giỏi lắm! 👍';
    else msg += ' Cố gắng thêm nhé! 💪';

    var controls = document.getElementById('game-controls');
    if (controls) {
      controls.innerHTML = '<p style="font-size:18px;font-weight:700;margin-bottom:12px">' + msg + '</p>' +
        '<button class="game-btn" onclick="window._vyvyRestartGame()">Chơi lại</button>' +
        '<button class="game-btn" style="background:#F5F5F5;color:var(--text);margin-left:8px" onclick="window._vyvyShowGameMenu()">Chọn game khác</button>';
    }
    spawnCelebration(['⭐', '🎉', '🏆', '✨'], window.innerWidth / 2, window.innerHeight / 2);
  }

  function updateGameScore() {
    var el = document.getElementById('game-score');
    if (el) el.textContent = 'Điểm: ' + gamesState.score;
  }

  function updateGameTimer() {
    var el = document.getElementById('game-timer');
    if (el) el.textContent = '⏰ ' + gamesState.timeLeft + 's';
  }

  window._vyvyRestartGame = function() {
    if (gamesState.currentGame) startGame(gamesState.currentGame);
  };

  window._vyvyShowGameMenu = function() {
    var menu = document.getElementById('games-menu');
    var area = document.getElementById('game-area');
    if (menu) menu.classList.remove('hidden');
    if (area) area.classList.add('hidden');
    stopGame();
  };

  /* -- Catch Game -- */
  function initCatchGame() {
    var canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    var ctx = canvas.getContext('2d');
    var balls = [];
    var paddle = { x: canvas.width / 2 - 40, w: 80, h: 12 };

    function addBall() {
      balls.push({
        x: Math.random() * (canvas.width - 20) + 10,
        y: 0,
        r: 10 + Math.random() * 10,
        speed: 2 + Math.random() * 2,
        color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][Math.floor(Math.random() * 6)]
      });
    }

    function drawCatch() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FF8FAB';
      ctx.fillRect(paddle.x, canvas.height - 20, paddle.w, paddle.h);

      for (var i = balls.length - 1; i >= 0; i--) {
        var b = balls[i];
        b.y += b.speed;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.stroke();

        if (b.y + b.r > canvas.height - 20 && b.x > paddle.x && b.x < paddle.x + paddle.w) {
          balls.splice(i, 1);
          gamesState.score++;
          updateGameScore();
          playSound('pop');
          addBall();
        } else if (b.y > canvas.height) {
          balls.splice(i, 1);
          addBall();
        }
      }

      if (gamesState.currentGame === 'catch') requestAnimationFrame(drawCatch);
    }

    function movePaddle(clientX) {
      var rect = canvas.getBoundingClientRect();
      paddle.x = clientX - rect.left - paddle.w / 2;
      paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));
    }

    canvas.onmousemove = function(e) { movePaddle(e.clientX); };
    canvas.ontouchmove = function(e) { e.preventDefault(); movePaddle(e.touches[0].clientX); };
    canvas.onclick = function(e) { movePaddle(e.clientX); };

    for (var i = 0; i < 5; i++) addBall();
    drawCatch();
  }

  /* -- Memory Game -- */
  function initMemoryGame() {
    var emojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑'];
    var cards = emojis.concat(emojis);
    cards.sort(function() { return Math.random() - 0.5; });

    gamesState.gameData = { cards: cards, flipped: [], matched: [], canFlip: true };

    var controls = document.getElementById('game-controls');
    if (!controls) return;

    var grid = document.createElement('div');
    grid.className = 'memory-grid';
    grid.style.maxWidth = '320px';
    grid.style.margin = '0 auto';

    for (var i = 0; i < cards.length; i++) {
      var card = document.createElement('button');
      card.className = 'memory-card';
      card.dataset.index = i;
      card.textContent = '?';
      card.onclick = function() { flipCard(parseInt(this.dataset.index)); };
      grid.appendChild(card);
    }

    controls.appendChild(grid);
    var canvas = document.getElementById('game-canvas');
    if (canvas) canvas.style.display = 'none';
  }

  function flipCard(index) {
    var gd = gamesState.gameData;
    if (!gd.canFlip) return;
    if (gd.flipped.indexOf(index) !== -1) return;
    if (gd.matched.indexOf(index) !== -1) return;

    playSound('pop');
    gd.flipped.push(index);
    var cards = document.querySelectorAll('.memory-card');
    if (cards[index]) {
      cards[index].textContent = gd.cards[index];
      cards[index].classList.add('flipped');
    }

    if (gd.flipped.length === 2) {
      gd.canFlip = false;
      var i1 = gd.flipped[0], i2 = gd.flipped[1];

      if (gd.cards[i1] === gd.cards[i2]) {
        setTimeout(function() {
          cards[i1].classList.add('matched');
          cards[i2].classList.add('matched');
          gd.matched.push(i1, i2);
          gd.flipped = [];
          gd.canFlip = true;
          gamesState.score += 2;
          updateGameScore();
          playSound('success');
          showStarBurst(window.innerWidth / 2, window.innerHeight / 2);

          if (gd.matched.length === gd.cards.length) {
            setTimeout(function() { endGame(); }, 500);
          }
        }, 300);
      } else {
        setTimeout(function() {
          cards[i1].textContent = '?';
          cards[i2].textContent = '?';
          cards[i1].classList.remove('flipped');
          cards[i2].classList.remove('flipped');
          gd.flipped = [];
          gd.canFlip = true;
          playSound('wrong');
        }, 800);
      }
    }
  }

  /* -- Count Game -- */
  function initCountGame() {
    var canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    var ctx = canvas.getContext('2d');

    var count = 3 + Math.floor(Math.random() * 8);
    var starEmojis = [];
    for (var i = 0; i < count; i++) {
      starEmojis.push({
        x: 30 + Math.random() * (canvas.width - 60),
        y: 30 + Math.random() * (canvas.height - 60),
        emoji: ['⭐', '🌟', '✨'][Math.floor(Math.random() * 3)]
      });
    }

    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    for (var j = 0; j < starEmojis.length; j++) {
      ctx.fillText(starEmojis[j].emoji, starEmojis[j].x, starEmojis[j].y);
    }

    gamesState.gameData = { correctCount: count };
    gamesState.timeLeft = 15;
    updateGameTimer();

    var controls = document.getElementById('game-controls');
    if (!controls) return;

    var p = document.createElement('p');
    p.style.cssText = 'font-size:18px;font-weight:600;margin-bottom:12px';
    p.textContent = 'Có bao nhiêu ngôi sao?';
    controls.appendChild(p);

    var options = document.createElement('div');
    options.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center';

    var answers = [count];
    while (answers.length < 4) {
      var r = Math.max(1, count + Math.floor(Math.random() * 5) - 2);
      if (answers.indexOf(r) === -1) answers.push(r);
    }
    answers.sort(function() { return Math.random() - 0.5; });

    for (var k = 0; k < answers.length; k++) {
      var btn = document.createElement('button');
      btn.className = 'game-option';
      btn.textContent = answers[k];
      btn.dataset.answer = answers[k];
      btn.onclick = function() {
        var val = parseInt(this.dataset.answer);
        if (val === gamesState.gameData.correctCount) {
          this.classList.add('correct');
          gamesState.score += 3;
          updateGameScore();
          playSound('success');
          spawnCelebration(['⭐', '🌟', '✨'], window.innerWidth / 2, window.innerHeight / 2);
          setTimeout(function() { endGame(); }, 800);
        } else {
          this.classList.add('wrong');
          playSound('wrong');
          this.disabled = true;
        }
      };
      options.appendChild(btn);
    }
    controls.appendChild(options);
  }

  /* -- Color Game -- */
  function initColorGame() {
    gamesState.score = 0;
    gamesState.timeLeft = 30;
    updateGameTimer();
    playColorRound();
  }

  function playColorRound() {
    var colors = [
      { name: 'Đỏ', code: '#FF0000' },
      { name: 'Xanh dương', code: '#2196F3' },
      { name: 'Xanh lá', code: '#4CAF50' },
      { name: 'Vàng', code: '#FFEB3B' },
      { name: 'Tím', code: '#9C27B0' },
      { name: 'Cam', code: '#FF9800' },
      { name: 'Hồng', code: '#FF69B4' },
      { name: 'Nâu', code: '#795548' }
    ];

    var target = colors[Math.floor(Math.random() * colors.length)];
    var options = [target];
    while (options.length < 4) {
      var c = colors[Math.floor(Math.random() * colors.length)];
      if (options.indexOf(c) === -1) options.push(c);
    }
    options.sort(function() { return Math.random() - 0.5; });

    var canvas = document.getElementById('game-canvas');
    if (canvas) {
      var ctx = canvas.getContext('2d');
      canvas.width = canvas.offsetWidth;
      canvas.height = 120;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = target.code;
      ctx.fillRect(20, 20, canvas.width - 40, 80);
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.strokeRect(20, 20, canvas.width - 40, 80);
    }

    var controls = document.getElementById('game-controls');
    if (!controls) return;
    controls.innerHTML = '';

    var p = document.createElement('p');
    p.style.cssText = 'font-size:18px;font-weight:600;margin-bottom:12px';
    p.textContent = 'Chọn màu: ' + target.name;
    controls.appendChild(p);

    var btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center';

    for (var i = 0; i < options.length; i++) {
      var btn = document.createElement('button');
      btn.className = 'game-option';
      btn.style.background = options[i].code;
      btn.style.width = '60px';
      btn.style.height = '60px';
      btn.style.borderRadius = '50%';
      btn.dataset.isCorrect = options[i] === target ? '1' : '0';
      btn.onclick = function() {
        if (this.dataset.isCorrect === '1') {
          this.classList.add('correct');
          gamesState.score += 2;
          updateGameScore();
          playSound('success');
          showStarBurst(window.innerWidth / 2, window.innerHeight / 2);
          if (gamesState.score >= 10) {
            setTimeout(function() { endGame(); }, 500);
          } else {
            setTimeout(function() { playColorRound(); }, 600);
          }
        } else {
          this.classList.add('wrong');
          playSound('wrong');
          this.disabled = true;
        }
      };
      btns.appendChild(btn);
    }
    controls.appendChild(btns);
  }

  /* -- Puzzle Game -- */
  function initPuzzleGame() {
    var canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    var ctx = canvas.getContext('2d');

    var shapes = [
      { type: 'circle', color: '#FF6B6B', x: 0, y: 0, r: 25 },
      { type: 'rect', color: '#4ECDC4', x: 0, y: 0, w: 45, h: 45 },
      { type: 'triangle', color: '#45B7D1', x: 0, y: 0, size: 40 },
      { type: 'star', color: '#FFEAA7', x: 0, y: 0, size: 25 }
    ];

    var slots = [];
    var puzzleW = 60, puzzleH = 60;
    var startX = (canvas.width - shapes.length * (puzzleW + 10)) / 2;
    var slotY = canvas.height - 80;

    for (var i = 0; i < shapes.length; i++) {
      slots.push({ x: startX + i * (puzzleW + 10) + 10, y: slotY, w: puzzleW, h: puzzleH, filled: false, shapeIdx: i });
    }

    var pieces = [];
    for (var j = 0; j < shapes.length; j++) {
      pieces.push({
        shape: shapes[j],
        x: 30 + Math.random() * (canvas.width - 80),
        y: 30 + Math.random() * (canvas.height / 2 - 30),
        dragging: false,
        placed: false
      });
    }

    gamesState.gameData = { pieces: pieces, slots: slots, dragIdx: -1 };

    function drawPuzzle() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var s = 0; s < slots.length; s++) {
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(slots[s].x, slots[s].y, slots[s].w, slots[s].h);
        ctx.setLineDash([]);
        ctx.fillStyle = '#F5F5F5';
        ctx.fillRect(slots[s].x + 2, slots[s].y + 2, slots[s].w - 4, slots[s].h - 4);
      }

      for (var p = 0; p < pieces.length; p++) {
        if (pieces[p].placed) continue;
        var piece = pieces[p];
        var shape = piece.shape;
        ctx.fillStyle = shape.color;

        if (shape.type === 'circle') {
          ctx.beginPath();
          ctx.arc(piece.x, piece.y, shape.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape.type === 'rect') {
          ctx.fillRect(piece.x - shape.w / 2, piece.y - shape.h / 2, shape.w, shape.h);
        } else if (shape.type === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(piece.x, piece.y - shape.size / 2);
          ctx.lineTo(piece.x - shape.size / 2, piece.y + shape.size / 2);
          ctx.lineTo(piece.x + shape.size / 2, piece.y + shape.size / 2);
          ctx.closePath();
          ctx.fill();
        } else if (shape.type === 'star') {
          drawStar(ctx, piece.x, piece.y, 5, shape.size, shape.size / 2);
        }
      }

      if (gamesState.currentGame === 'puzzle') requestAnimationFrame(drawPuzzle);
    }

    function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
      var rot = Math.PI / 2 * 3;
      var step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(cx, cy - outerR);
      for (var i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
        rot += step;
      }
      ctx.closePath();
      ctx.fill();
    }

    function handlePuzzleDown(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      var mx = clientX - rect.left;
      var my = clientY - rect.top;
      for (var i = pieces.length - 1; i >= 0; i--) {
        if (pieces[i].placed) continue;
        var dx = mx - pieces[i].x;
        var dy = my - pieces[i].y;
        if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
          gamesState.gameData.dragIdx = i;
          pieces[i].dragging = true;
          return;
        }
      }
    }

    function handlePuzzleMove(clientX, clientY) {
      var idx = gamesState.gameData.dragIdx;
      if (idx < 0 || !pieces[idx].dragging) return;
      var rect = canvas.getBoundingClientRect();
      pieces[idx].x = clientX - rect.left;
      pieces[idx].y = clientY - rect.top;
    }

    function handlePuzzleUp() {
      var idx = gamesState.gameData.dragIdx;
      if (idx < 0) return;
      pieces[idx].dragging = false;
      gamesState.gameData.dragIdx = -1;

      for (var s = 0; s < slots.length; s++) {
        if (slots[s].filled) continue;
        var dx = pieces[idx].x - (slots[s].x + slots[s].w / 2);
        var dy = pieces[idx].y - (slots[s].y + slots[s].h / 2);
        if (Math.abs(dx) < 25 && Math.abs(dy) < 25 && s === idx) {
          pieces[idx].x = slots[s].x + slots[s].w / 2;
          pieces[idx].y = slots[s].y + slots[s].h / 2;
          pieces[idx].placed = true;
          slots[s].filled = true;
          gamesState.score += 2;
          updateGameScore();
          playSound('success');

          var allPlaced = true;
          for (var k = 0; k < pieces.length; k++) {
            if (!pieces[k].placed) { allPlaced = false; break; }
          }
          if (allPlaced) setTimeout(function() { endGame(); }, 500);
          return;
        }
      }
    }

    canvas.onmousedown = function(e) { handlePuzzleDown(e.clientX, e.clientY); };
    canvas.onmousemove = function(e) { handlePuzzleMove(e.clientX, e.clientY); };
    canvas.onmouseup = function() { handlePuzzleUp(); };
    canvas.ontouchstart = function(e) { e.preventDefault(); handlePuzzleDown(e.touches[0].clientX, e.touches[0].clientY); };
    canvas.ontouchmove = function(e) { e.preventDefault(); handlePuzzleMove(e.touches[0].clientX, e.touches[0].clientY); };
    canvas.ontouchend = function() { handlePuzzleUp(); };

    drawPuzzle();
  }

  /* -- Whack Game -- */
  function initWhackGame() {
    var canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    var ctx = canvas.getContext('2d');

    var holes = [];
    var cols = 3, rows = 2;
    var holeW = 70, holeH = 70;
    var startX = (canvas.width - cols * (holeW + 20)) / 2;
    var startY = (canvas.height - rows * (holeH + 20)) / 2;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        holes.push({
          x: startX + c * (holeW + 20) + 10,
          y: startY + r * (holeH + 20) + 10,
          w: holeW, h: holeH,
          active: false,
          timer: 0
        });
      }
    }

    gamesState.gameData = { holes: holes, activeIdx: -1 };

    function drawWhack() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < holes.length; i++) {
        var h = holes[i];
        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.ellipse(h.x + h.w / 2, h.y + h.h / 2, h.w / 2, h.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        if (h.active) {
          ctx.font = '40px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🐹', h.x + h.w / 2, h.y + h.h / 2);
        }
      }

      if (gamesState.currentGame === 'whack') requestAnimationFrame(drawWhack);
    }

    function showMole() {
      if (gamesState.currentGame !== 'whack') return;
      var gd = gamesState.gameData;
      for (var i = 0; i < gd.holes.length; i++) gd.holes[i].active = false;
      var idx = Math.floor(Math.random() * gd.holes.length);
      gd.holes[idx].active = true;
      gd.activeIdx = idx;

      setTimeout(function() {
        if (gd.holes[idx]) gd.holes[idx].active = false;
        if (gamesState.currentGame === 'whack') setTimeout(showMole, 300 + Math.random() * 500);
      }, 800 + Math.random() * 600);
    }

    function handleWhack(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      var mx = clientX - rect.left;
      var my = clientY - rect.top;
      var gd = gamesState.gameData;

      for (var i = 0; i < gd.holes.length; i++) {
        var h = gd.holes[i];
        if (!h.active) continue;
        var dx = mx - (h.x + h.w / 2);
        var dy = my - (h.y + h.h / 2);
        if (Math.abs(dx) < h.w / 2 && Math.abs(dy) < h.h / 2) {
          h.active = false;
          gamesState.score++;
          updateGameScore();
          playSound('pop');
          showStarBurst(clientX, clientY);
          return;
        }
      }
    }

    canvas.onclick = function(e) { handleWhack(e.clientX, e.clientY); };
    canvas.ontouchstart = function(e) { e.preventDefault(); handleWhack(e.touches[0].clientX, e.touches[0].clientY); };

    drawWhack();
    setTimeout(showMole, 500);
  }

  /* ── Music Player System ──────────────── */
  var musicState = {
    isPlaying: false,
    currentSong: -1,
    oscillator: null,
    gainNode: null,
    volume: 0.7,
    songs: [
      { title: 'Chú Ếch Con', artist: 'Nhạc thiếu nhi', emoji: '🐸', notes: [
        {f:523,d:0.3},{f:523,d:0.3},{f:587,d:0.3},{f:659,d:0.3},{f:659,d:0.3},{f:587,d:0.3},{f:523,d:0.3},{f:494,d:0.6},
        {f:440,d:0.3},{f:440,d:0.3},{f:494,d:0.3},{f:523,d:0.3},{f:523,d:0.3},{f:494,d:0.3},{f:440,d:0.6}
      ]},
      { title: 'Bé Tập Đếm', artist: 'Nhạc thiếu nhi', emoji: '🔢', notes: [
        {f:440,d:0.4},{f:494,d:0.4},{f:523,d:0.4},{f:440,d:0.8},
        {f:494,d:0.4},{f:523,d:0.4},{f:587,d:0.4},{f:494,d:0.8},
        {f:523,d:0.4},{f:587,d:0.4},{f:659,d:0.4},{f:523,d:0.8}
      ]},
      { title: 'Con Bướm Xinh', artist: 'Nhạc thiếu nhi', emoji: '🦋', notes: [
        {f:659,d:0.3},{f:587,d:0.3},{f:523,d:0.3},{f:587,d:0.3},{f:659,d:0.6},
        {f:523,d:0.3},{f:494,d:0.3},{f:440,d:0.3},{f:494,d:0.3},{f:523,d:0.6},
        {f:659,d:0.3},{f:587,d:0.3},{f:523,d:0.3},{f:494,d:0.3},{f:440,d:0.6}
      ]},
      { title: 'Ngôi Sao Nhỏ', artist: 'Nhạc thiếu nhi', emoji: '⭐', notes: [
        {f:523,d:0.4},{f:523,d:0.2},{f:659,d:0.4},{f:659,d:0.2},{f:784,d:0.4},{f:659,d:0.4},{f:523,d:0.8},
        {f:494,d:0.4},{f:494,d:0.2},{f:523,d:0.4},{f:523,d:0.2},{f:587,d:0.4},{f:523,d:0.4},{f:494,d:0.8}
      ]},
      { title: 'Chú Mèo Con', artist: 'Nhạc thiếu nhi', emoji: '🐱', notes: [
        {f:440,d:0.3},{f:523,d:0.3},{f:587,d:0.3},{f:523,d:0.3},{f:440,d:0.6},
        {f:494,d:0.3},{f:440,d:0.3},{f:392,d:0.3},{f:440,d:0.3},{f:494,d:0.6},
        {f:523,d:0.3},{f:587,d:0.3},{f:659,d:0.3},{f:587,d:0.3},{f:523,d:0.6}
      ]},
      { title: 'Hoa Hồng Nhỏ', artist: 'Nhạc thiếu nhi', emoji: '🌸', notes: [
        {f:587,d:0.3},{f:523,d:0.3},{f:494,d:0.3},{f:523,d:0.3},{f:587,d:0.6},
        {f:659,d:0.3},{f:587,d:0.3},{f:523,d:0.3},{f:494,d:0.3},{f:440,d:0.6},
        {f:494,d:0.3},{f:523,d:0.3},{f:587,d:0.3},{f:659,d:0.3},{f:587,d:0.6}
      ]},
      { title: 'Vầng Trăng Khuyết', artist: 'Nhạc thiếu nhi', emoji: '🌙', notes: [
        {f:392,d:0.4},{f:440,d:0.4},{f:494,d:0.4},{f:523,d:0.8},
        {f:587,d:0.4},{f:523,d:0.4},{f:494,d:0.4},{f:440,d:0.8},
        {f:392,d:0.4},{f:440,d:0.4},{f:494,d:0.4},{f:392,d:0.8}
      ]},
      { title: 'Cầu Vồng', artist: 'Nhạc thiếu nhi', emoji: '🌈', notes: [
        {f:523,d:0.2},{f:587,d:0.2},{f:659,d:0.2},{f:698,d:0.2},{f:784,d:0.4},
        {f:784,d:0.2},{f:698,d:0.2},{f:659,d:0.2},{f:587,d:0.2},{f:523,d:0.4},
        {f:440,d:0.2},{f:494,d:0.2},{f:523,d:0.2},{f:587,d:0.2},{f:659,d:0.4}
      ]}
    ]
  };

  /* -- Word Scramble Game -- */
  var WORD_LIST = [
    {word: 'mèo', hint: 'Con vật kêu meo meo'},
    {word: 'chó', hint: 'Con vật kêu gâu gâu'},
    {word: 'nhà', hint: 'Nơi bạn ở với gia đình'},
    {word: 'hoa', hint: 'Có nhiều màu, thơm lắm'},
    {word: 'cây', hint: 'Có lá xanh, mọc ở vườn'},
    {word: 'sách', hint: 'Bạn đọc mỗi ngày'},
    {word: 'trường', hint: 'Bạn đến đây để học'},
    {word: 'bạn', hint: 'Bạn chơi chung với bạn'},
    {word: 'mẹ', hint: 'Mẹ yêu bạn nhất'},
    {word: 'bố', hint: 'Bố chơi với bạn'},
    {word: 'cá', hint: 'Sống dưới nước'},
    {word: 'chim', hint: 'Bay trên trời, hót hay'},
    {word: 'mặt trời', hint: 'Sáng lắm, nằm trên trời'},
    {word: 'mặt trăng', hint: 'Sáng ban đêm'},
    {word: 'nước', hint: 'Bạn uống mỗi ngày'},
    {word: 'cơm', hint: 'Bạn ăn mỗi bữa'},
    {word: 'bánh', hint: 'Ngọt và ngon'},
    {word: 'kẹo', hint: 'Ngọt lắm, bạn thích'},
    {word: 'trái cây', hint: 'Cam, chuối, táo...'},
    {word: 'xe đạp', hint: 'Bạn đạp đi chơi'},
    {word: 'ô tô', hint: 'Chạy bằng xăng'},
    {word: 'mưa', hint: 'Rơi từ trên trời xuống'},
    {word: 'nắng', hint: 'Ấm lắm'},
    {word: 'gió', hint: 'Thổi mát lắm'},
    {word: 'biển', hint: 'Rộng lớn, có sóng'},
    {word: 'núi', hint: 'Cao lắm, có đỉnh'},
    {word: 'sông', hint: 'Chảy dài, có nước'},
    {word: 'lớp', hint: 'Bạn học chung với bạn'},
    {word: 'cô giáo', hint: 'Dạy bạn ở trường'},
    {word: 'vở', hint: 'Bạn viết bài vào đây'},
    {word: 'bút', hint: 'Bạn viết bằng cái này'},
    {word: 'đèn', hint: 'Sáng lắm, thắp ban đêm'},
    {word: 'giường', hint: 'Bạn ngủ ở đây'},
    {word: 'bàn', hint: 'Bạn ngồi ăn cơm'},
    {word: 'ghế', hint: 'Bạn ngồi ở đây'},
    {word: 'quạt', hint: 'Thổi mát lắm'},
    {word: 'tivi', hint: 'Bạn xem phim ở đây'},
    {word: 'điện thoại', hint: 'Gọi cho ông bà'},
    {word: 'áo', hint: 'Bạn mặc ở trên'},
    {word: 'quần', hint: 'Bạn mặc ở dưới'},
    {word: 'giày', hint: 'Bạn mang ở chân'},
    {word: 'mũ', hint: 'Bạn đội ở đầu'},
    {word: 'ô', hint: 'Che khi trời mưa'},
    {word: 'túi', hint: 'Bạn bỏ đồ vào đây'},
    {word: 'đồng hồ', hint: 'Cho bạn biết giờ'},
    {word: 'chìa khóa', hint: 'Mở cửa nhà'},
    {word: 'kính', hint: 'Đeo ở mắt'},
    {word: 'thuốc', hint: 'Uống khi bị bệnh'},
    {word: 'bông', hint: 'Trắng như mây'},
    {word: 'cầu vồng', hint: 'Có 7 màu sau mưa'}
  ];

  function initWordScrambleGame() {
    gamesState.score = 0;
    gamesState.timeLeft = 45;
    updateGameTimer();
    gamesState.gameData = { wordIndex: 0, words: [], currentWord: '', scrambled: '', selected: [] };

    // Pick 5 random words
    var shuffled = WORD_LIST.slice().sort(function() { return Math.random() - 0.5; });
    gamesState.gameData.words = shuffled.slice(0, 5);

    var canvas = document.getElementById('game-canvas');
    if (canvas) canvas.style.display = 'none';

    playWordScrambleRound();
  }

  function playWordScrambleRound() {
    var gd = gamesState.gameData;
    if (gd.wordIndex >= gd.words.length) {
      endGame();
      return;
    }

    var entry = gd.words[gd.wordIndex];
    gd.currentWord = entry.word;
    gd.selected = [];

    // Scramble the word
    var chars = entry.word.split('');
    var scrambled = chars.slice();
    for (var i = scrambled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = scrambled[i]; scrambled[i] = scrambled[j]; scrambled[j] = tmp;
    }
    // Ensure it's actually scrambled
    if (scrambled.join('') === entry.word && scrambled.length > 1) {
      var t = scrambled[0]; scrambled[0] = scrambled[1]; scrambled[1] = t;
    }
    gd.scrambled = scrambled.join('');

    var controls = document.getElementById('game-controls');
    if (!controls) return;

    controls.innerHTML =
      '<p style="font-size:14px;color:var(--text-hint);margin-bottom:4px">Câu ' + (gd.wordIndex + 1) + '/' + gd.words.length + '</p>' +
      '<p style="font-size:16px;font-weight:600;margin-bottom:8px">' + entry.hint + '</p>' +
      '<div id="scramble-answer" class="scramble-answer"></div>' +
      '<div id="scramble-letters" class="scramble-letters"></div>' +
      '<div id="scramble-actions" style="margin-top:8px;display:flex;gap:8px;justify-content:center">' +
      '<button class="game-btn" style="font-size:14px;padding:8px 16px;background:#F5F5F5;color:var(--text)" onclick="window._vyvyScrambleReset()">Xóa</button>' +
      '</div>';

    renderScrambleLetters(scrambled);
    renderScrambleAnswer();
  }

  function renderScrambleLetters(scrambled) {
    var gd = gamesState.gameData;
    var el = document.getElementById('scramble-letters');
    if (!el) return;
    el.innerHTML = '';
    for (var i = 0; i < scrambled.length; i++) {
      var btn = document.createElement('button');
      btn.className = 'scramble-tile';
      btn.textContent = scrambled[i];
      btn.dataset.index = i;
      btn.dataset.char = scrambled[i];
      if (gd.selected.indexOf(i) !== -1) btn.classList.add('used');
      btn.onclick = function() {
        var idx = parseInt(this.dataset.index);
        if (gd.selected.indexOf(idx) === -1) {
          gd.selected.push(idx);
          playSound('pop');
          renderScrambleLetters(scrambled);
          renderScrambleAnswer();
          checkScrambleAnswer();
        }
      };
      el.appendChild(btn);
    }
  }

  function renderScrambleAnswer() {
    var gd = gamesState.gameData;
    var el = document.getElementById('scramble-answer');
    if (!el) return;
    el.innerHTML = '';
    var answer = '';
    for (var i = 0; i < gd.selected.length; i++) {
      answer += gd.scrambled[gd.selected[i]];
    }
    for (var j = 0; j < gd.currentWord.length; j++) {
      var tile = document.createElement('span');
      tile.className = 'scramble-answer-tile';
      if (j < answer.length) {
        tile.textContent = answer[j];
        tile.classList.add('filled');
      } else {
        tile.textContent = '_';
      }
      el.appendChild(tile);
    }
  }

  function checkScrambleAnswer() {
    var gd = gamesState.gameData;
    var answer = '';
    for (var i = 0; i < gd.selected.length; i++) {
      answer += gd.scrambled[gd.selected[i]];
    }
    if (answer.length === gd.currentWord.length) {
      if (answer === gd.currentWord) {
        gamesState.score += 3;
        updateGameScore();
        playSound('success');
        showStarBurst(window.innerWidth / 2, window.innerHeight / 2);
        gd.wordIndex++;
        setTimeout(function() { playWordScrambleRound(); }, 800);
      } else {
        playSound('wrong');
        showToast('Sai rồi! Thử lại nhé', 'error', 1500);
        gd.selected = [];
        var chars = gd.scrambled.split('');
        renderScrambleLetters(chars);
        renderScrambleAnswer();
      }
    }
  }

  window._vyvyScrambleReset = function() {
    gamesState.gameData.selected = [];
    var chars = gamesState.gameData.scrambled.split('');
    renderScrambleLetters(chars);
    renderScrambleAnswer();
  };

  function initMusicPanel() {
    var list = document.getElementById('music-list');
    if (!list) return;
    list.innerHTML = '';

    for (var i = 0; i < musicState.songs.length; i++) {
      var item = document.createElement('div');
      item.className = 'music-item';
      item.dataset.index = i;
      item.innerHTML = '<span class="music-item-icon">' + musicState.songs[i].emoji + '</span>' +
        '<div class="music-item-info"><div class="music-item-title">' + musicState.songs[i].title + '</div>' +
        '<div class="music-item-artist">' + musicState.songs[i].artist + '</div></div>';
      item.onclick = function() { playSong(parseInt(this.dataset.index)); };
      list.appendChild(item);
    }
  }

  function showMusicPanel() {
    if (window.VyvyDecor) window.VyvyDecor.setBg('music');
    showView('music');
  }

  function hideMusicPanel() {
    goBack();
  }

  function playSong(index) {
    stopMusic();
    musicState.currentSong = index;
    musicState.isPlaying = true;

    var items = document.querySelectorAll('.music-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', i === index);
    }

    var nowPlaying = document.getElementById('now-playing');
    if (nowPlaying) nowPlaying.textContent = musicState.songs[index].emoji + ' ' + musicState.songs[index].title;

    var playBtn = document.getElementById('music-play');
    if (playBtn) { playBtn.textContent = '⏸'; playBtn.classList.add('playing'); }

    var viz = document.getElementById('music-visualizer');
    if (viz) viz.classList.add('active');

    var song = musicState.songs[index];
    var ctx = getAudioCtx();
    var noteIndex = 0;

    function playNextNote() {
      if (!musicState.isPlaying || noteIndex >= song.notes.length) {
        if (musicState.isPlaying && noteIndex >= song.notes.length) {
          setTimeout(function() {
            if (musicState.isPlaying) {
              var next = (musicState.currentSong + 1) % musicState.songs.length;
              playSong(next);
            }
          }, 500);
        }
        return;
      }

      var note = song.notes[noteIndex];
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = note.f;
      osc.type = 'sine';
      gain.gain.setValueAtTime(musicState.volume * 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.d * 0.9);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + note.d);

      noteIndex++;
      setTimeout(playNextNote, note.d * 1000);
    }

    playNextNote();
  }

  function stopMusic() {
    musicState.isPlaying = false;
    try { getAudioCtx().close(); audioCtx = null; } catch(e) {}

    var playBtn = document.getElementById('music-play');
    if (playBtn) { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); }

    var viz = document.getElementById('music-visualizer');
    if (viz) viz.classList.remove('active');
  }

  function toggleMusic() {
    if (musicState.isPlaying) {
      stopMusic();
    } else if (musicState.currentSong >= 0) {
      playSong(musicState.currentSong);
    } else {
      playSong(0);
    }
  }

  /* ── Drawing System ───────────────────── */
  var drawState = {
    tool: 'pen',
    color: '#FF0000',
    size: 3,
    stamp: '⭐',
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    history: []
  };

  function initDrawingPanel() {
    var canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = 400;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawState.history = [];
    saveDrawHistory();

    canvas.onmousedown = function(e) { startDraw(e.clientX, e.clientY); };
    canvas.onmousemove = function(e) { moveDraw(e.clientX, e.clientY); };
    canvas.onmouseup = function() { endDraw(); };
    canvas.onmouseleave = function() { endDraw(); };
    canvas.ontouchstart = function(e) { e.preventDefault(); startDraw(e.touches[0].clientX, e.touches[0].clientY); };
    canvas.ontouchmove = function(e) { e.preventDefault(); moveDraw(e.touches[0].clientX, e.touches[0].clientY); };
    canvas.ontouchend = function() { endDraw(); };
  }

  function showDrawingPanel() {
    if (window.VyvyDecor) window.VyvyDecor.setBg('drawing');
    showView('drawing');
  }

  function hideDrawingPanel() {
    goBack();
  }

  function getDrawPos(clientX, clientY) {
    var canvas = document.getElementById('drawing-canvas');
    var rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function startDraw(clientX, clientY) {
    var pos = getDrawPos(clientX, clientY);
    drawState.isDrawing = true;
    drawState.lastX = pos.x;
    drawState.lastY = pos.y;

    if (drawState.tool === 'stamp') {
      var canvas = document.getElementById('drawing-canvas');
      var ctx = canvas.getContext('2d');
      ctx.font = '30px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(drawState.stamp, pos.x, pos.y);
      playSound('pop');
    } else if (drawState.tool === 'fill') {
      var canvas = document.getElementById('drawing-canvas');
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = drawState.color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      playSound('pop');
      saveDrawHistory();
    } else {
      var canvas = document.getElementById('drawing-canvas');
      var ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, drawState.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = drawState.tool === 'eraser' ? 'white' : drawState.color;
      ctx.fill();
    }
  }

  function moveDraw(clientX, clientY) {
    if (!drawState.isDrawing) return;
    if (drawState.tool === 'stamp' || drawState.tool === 'fill') return;

    var pos = getDrawPos(clientX, clientY);
    var canvas = document.getElementById('drawing-canvas');
    var ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(drawState.lastX, drawState.lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = drawState.tool === 'eraser' ? 'white' : drawState.color;
    ctx.lineWidth = drawState.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    drawState.lastX = pos.x;
    drawState.lastY = pos.y;
  }

  function endDraw() {
    if (drawState.isDrawing) {
      drawState.isDrawing = false;
      saveDrawHistory();
    }
  }

  function saveDrawHistory() {
    var canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    drawState.history.push(imgData);
    if (drawState.history.length > 30) drawState.history.shift();
  }

  function undoDraw() {
    if (drawState.history.length > 1) {
      drawState.history.pop();
      var canvas = document.getElementById('drawing-canvas');
      var ctx = canvas.getContext('2d');
      ctx.putImageData(drawState.history[drawState.history.length - 1], 0, 0);
      playSound('pop');
    }
  }

  function clearDrawing() {
    var canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveDrawHistory();
    playSound('pop');
  }

  function saveDrawing() {
    var canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    var dataUrl = canvas.toDataURL();
    // Save to gallery
    saveToGallery(dataUrl);
    // Also download
    var link = document.createElement('a');
    link.download = 've-tranh-vyvy.png';
    link.href = dataUrl;
    link.click();
    playSound('success');
    showToast('Đã lưu tranh vào gallery!', 'success');
    spawnCelebration(['🎨', '🖼️', '⭐', '✨'], window.innerWidth / 2, window.innerHeight / 2);
  }

  function setupDrawingTools() {
    var colorBtns = document.querySelectorAll('.color-btn');
    for (var i = 0; i < colorBtns.length; i++) {
      colorBtns[i].onclick = function() {
        for (var j = 0; j < colorBtns.length; j++) colorBtns[j].classList.remove('active');
        this.classList.add('active');
        drawState.color = this.dataset.color;
        playSound('click');
      };
    }

    var brushBtns = document.querySelectorAll('.brush-btn');
    for (var k = 0; k < brushBtns.length; k++) {
      brushBtns[k].onclick = function() {
        for (var j = 0; j < brushBtns.length; j++) brushBtns[j].classList.remove('active');
        this.classList.add('active');
        drawState.size = parseInt(this.dataset.size);
        playSound('click');
      };
    }

    var drawTools = document.querySelectorAll('.draw-tool-btn');
    for (var m = 0; m < drawTools.length; m++) {
      drawTools[m].onclick = function() {
        for (var j = 0; j < drawTools.length; j++) drawTools[j].classList.remove('active');
        this.classList.add('active');
        drawState.tool = this.id.replace('draw-', '');
        var stampSel = document.getElementById('stamp-selector');
        if (stampSel) {
          if (drawState.tool === 'stamp') stampSel.classList.remove('hidden');
          else stampSel.classList.add('hidden');
        }
        playSound('click');
      };
    }

    var stampOpts = document.querySelectorAll('.stamp-opt');
    for (var n = 0; n < stampOpts.length; n++) {
      stampOpts[n].onclick = function() {
        for (var j = 0; j < stampOpts.length; j++) stampOpts[j].classList.remove('active');
        this.classList.add('active');
        drawState.stamp = this.dataset.stamp;
        playSound('click');
      };
    }

    var undoBtn = document.getElementById('draw-undo');
    if (undoBtn) undoBtn.onclick = undoDraw;
    var clearBtn = document.getElementById('draw-clear');
    if (clearBtn) clearBtn.onclick = clearDrawing;
    var saveBtn = document.getElementById('draw-save');
    if (saveBtn) saveBtn.onclick = saveDrawing;
    var galleryBtn = document.getElementById('draw-gallery');
    if (galleryBtn) galleryBtn.onclick = showGallery;
  }

  /* ── Drawing Gallery ────────────────────── */
  function getGallery() {
    return lsGetJSON(SK.DRAWING_GALLERY, []);
  }

  function saveToGallery(dataUrl) {
    var gallery = getGallery();
    gallery.unshift({ id: Date.now(), data: dataUrl, date: new Date().toISOString() });
    if (gallery.length > 20) gallery = gallery.slice(0, 20);
    lsSetJSON(SK.DRAWING_GALLERY, gallery);
  }

  function deleteFromGallery(id) {
    var gallery = getGallery().filter(function(item) { return item.id !== id; });
    lsSetJSON(SK.DRAWING_GALLERY, gallery);
  }

  function showGallery() {
    var overlay = document.getElementById('gallery-overlay');
    var panel = document.getElementById('gallery-panel');
    var grid = document.getElementById('gallery-grid');
    var empty = document.getElementById('gallery-empty');
    if (overlay) overlay.classList.remove('hidden');
    if (panel) panel.classList.remove('hidden');

    var gallery = getGallery();
    if (gallery.length === 0) {
      if (grid) grid.classList.add('hidden');
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (grid) grid.classList.remove('hidden');
    if (empty) empty.classList.add('hidden');

    renderGallery(gallery);
  }

  function hideGallery() {
    var overlay = document.getElementById('gallery-overlay');
    var panel = document.getElementById('gallery-panel');
    if (overlay) overlay.classList.add('hidden');
    if (panel) panel.classList.add('hidden');
  }

  function renderGallery(gallery) {
    var grid = document.getElementById('gallery-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (var i = 0; i < gallery.length; i++) {
      var item = gallery[i];
      var div = document.createElement('div');
      div.className = 'gallery-item';
      div.innerHTML =
        '<img src="' + item.data + '" alt="Tranh">' +
        '<div class="gallery-item-actions">' +
        '<button class="gallery-save-btn" data-id="' + item.id + '">💾 Tải</button>' +
        '<button class="gallery-del-btn" data-id="' + item.id + '">🗑️ Xóa</button>' +
        '</div>';
      grid.appendChild(div);
    }

    // Bind events
    var saveBtns = grid.querySelectorAll('.gallery-save-btn');
    for (var j = 0; j < saveBtns.length; j++) {
      saveBtns[j].onclick = function() {
        var id = parseInt(this.dataset.id);
        var g = getGallery().find(function(x) { return x.id === id; });
        if (g) {
          var link = document.createElement('a');
          link.download = 've-tranh-vyvy-' + id + '.png';
          link.href = g.data;
          link.click();
          showToast('Đã tải tranh!', 'success');
        }
      };
    }

    var delBtns = grid.querySelectorAll('.gallery-del-btn');
    for (var k = 0; k < delBtns.length; k++) {
      delBtns[k].onclick = function() {
        var id = parseInt(this.dataset.id);
        deleteFromGallery(id);
        var updated = getGallery();
        if (updated.length === 0) {
          var g = document.getElementById('gallery-grid');
          var e = document.getElementById('gallery-empty');
          if (g) g.classList.add('hidden');
          if (e) e.classList.remove('hidden');
        } else {
          renderGallery(updated);
        }
        showToast('Đã xóa tranh', 'info');
      };
    }
  }

  // Add gallery overlay close handler
  var galleryOverlay = document.getElementById('gallery-overlay');
  if (galleryOverlay) galleryOverlay.onclick = hideGallery;
  var galleryCloseBtn = document.querySelector('[data-close="gallery"]');
  if (galleryCloseBtn) galleryCloseBtn.onclick = hideGallery;

  /* ── Setup New Feature Buttons ─────────── */
  function setupFeatureButtons() {
    var gamesBtn = document.getElementById('games-btn');
    if (gamesBtn) gamesBtn.onclick = function() { showView('games'); };

    var musicBtn = document.getElementById('music-btn');
    if (musicBtn) musicBtn.onclick = function() { showView('music'); };

    var drawingBtn = document.getElementById('drawing-btn');
    if (drawingBtn) drawingBtn.onclick = function() { showView('drawing'); };

    var closeBtns = document.querySelectorAll('[data-close]');
    for (var i = 0; i < closeBtns.length; i++) {
      closeBtns[i].onclick = function() {
        goBack();
      };
    }

    var gameCards = document.querySelectorAll('.game-card');
    for (var j = 0; j < gameCards.length; j++) {
      gameCards[j].onclick = function() {
        startGame(this.dataset.game);
        playSound('click');
      };
    }

    var gameBack = document.getElementById('game-back');
    if (gameBack) gameBack.onclick = function() {
      var menu = document.getElementById('games-menu');
      var area = document.getElementById('game-area');
      if (menu) menu.classList.remove('hidden');
      if (area) area.classList.add('hidden');
      stopGame();
    };

    var musicPlay = document.getElementById('music-play');
    if (musicPlay) musicPlay.onclick = toggleMusic;
    var musicPrev = document.getElementById('music-prev');
    if (musicPrev) musicPrev.onclick = function() {
      if (musicState.songs.length > 0) {
        var idx = (musicState.currentSong - 1 + musicState.songs.length) % musicState.songs.length;
        playSong(idx);
      }
    };
    var musicNext = document.getElementById('music-next');
    if (musicNext) musicNext.onclick = function() {
      if (musicState.songs.length > 0) {
        var idx = (musicState.currentSong + 1) % musicState.songs.length;
        playSong(idx);
      }
    };

    var volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
      volumeSlider.oninput = function() {
        musicState.volume = parseInt(this.value) / 100;
      };
    }

    setupDrawingTools();
  }

    /* Room Carousel: V3 scroll-snap home shelf */
  var ROOM_ORDER = ['learn', 'decor', 'games', 'library', 'art', 'music'];

  function routeToRoom(roomId) {
    playSound('click');
    if (roomId === 'learn') {
      openTodayLessonFromHome();
    } else if (roomId === 'library') {
      closeHomeChatDrawer();
      setVyvyOutfit('uniform');
      openLearningPicker();
    } else if (roomId === 'decor') {
      openRewardsPanel();
    } else if (roomId === 'art') {
      if (window.VyvyDecor) window.VyvyDecor.setBg('drawing');
      setVyvyOutfit('art');
      showView('drawing');
    } else if (roomId === 'music') {
      if (window.VyvyDecor) window.VyvyDecor.setBg('music');
      setVyvyOutfit('music');
      showView('music');
    } else if (roomId === 'games') {
      if (window.VyvyDecor) window.VyvyDecor.setBg('games');
      setVyvyOutfit('games');
      showView('games');
    }
  }

  function routeHomeWorldAction(action) {
    if (action === 'learn') {
      routeToRoom('learn');
    } else if (action === 'library' || action === 'decor') {
      routeToRoom(action);
    } else if (action === 'chat') {
      playSound('click');
      openHomeChatDrawer();
    } else if (action === 'rewards') {
      playSound('click');
      openRewardsPanel();
    } else if (action === 'games') {
      routeToRoom('games');
    } else if (action === 'art') {
      routeToRoom('art');
    } else if (action === 'music') {
      routeToRoom('music');
    }
  }

  function getNextRoomId(roomId) {
    var index = ROOM_ORDER.indexOf(roomId);
    if (index < 0) return ROOM_ORDER[1];
    return ROOM_ORDER[(index + 1) % ROOM_ORDER.length];
  }

  function getPrevRoomId(roomId) {
    var index = ROOM_ORDER.indexOf(roomId);
    if (index < 0) return ROOM_ORDER[ROOM_ORDER.length - 1];
    return ROOM_ORDER[(index - 1 + ROOM_ORDER.length) % ROOM_ORDER.length];
  }

  function setActiveRoom(roomId, shouldScroll) {
    if (ROOM_ORDER.indexOf(roomId) < 0) return;
    activeRoom = roomId;
    updateRoomCarouselState(document.getElementById('room-carousel'), shouldScroll);
  }

  function moveRoomCarousel(delta) {
    var index = ROOM_ORDER.indexOf(activeRoom);
    if (index < 0) index = 0;
    var nextIndex = (index + delta + ROOM_ORDER.length) % ROOM_ORDER.length;
    setActiveRoom(ROOM_ORDER[nextIndex], true);
  }

  function renderRoomDots() {
    var dots = document.getElementById('room-carousel-dots');
    if (!dots || dots.dataset.ready) return;
    for (var i = 0; i < ROOM_ORDER.length; i++) {
      var dot = document.createElement('span');
      dot.className = 'room-carousel-dot';
      dot.dataset.roomDot = ROOM_ORDER[i];
      dots.appendChild(dot);
    }
    dots.dataset.ready = 'true';
  }

  function updateRoomCarouselState(carousel, shouldScroll) {
    if (!carousel) return;
    renderRoomDots();
    if (ROOM_ORDER.indexOf(activeRoom) < 0) activeRoom = ROOM_ORDER[0];
    var nextRoom = getNextRoomId(activeRoom);
    var prevRoom = getPrevRoomId(activeRoom);
    var activeCard = null;

    carousel.querySelectorAll('.room-card').forEach(function(card) {
      var roomId = card.dataset.roomId;
      var isActive = roomId === activeRoom;
      var isNext = roomId === nextRoom;
      var isPrev = roomId === prevRoom;
      card.classList.toggle('is-active', isActive);
      card.classList.toggle('is-next', isNext);
      card.classList.toggle('is-prev', isPrev);
      card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      var isKeyboardReachable = isActive || isNext || isPrev;
      card.tabIndex = isKeyboardReachable ? 0 : -1;
      card.setAttribute('aria-hidden', isKeyboardReachable ? 'false' : 'true');
      if (isActive) activeCard = card;
    });

    var dots = document.querySelectorAll('[data-room-dot]');
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('active', dots[i].dataset.roomDot === activeRoom);
    }

    if (shouldScroll && activeCard) {
      requestAnimationFrame(function() {
        if (carousel.scrollWidth <= carousel.clientWidth) return;
        carousel.scrollTo({
          left: activeCard.offsetLeft - ((carousel.clientWidth - activeCard.offsetWidth) / 2),
          behavior: 'smooth'
        });
      });
    }
  }

  function initRoomCarousel() {
    var carousel = document.getElementById('room-carousel');
    if (!carousel) return;
    var scrollTimer = null;

    carousel.querySelectorAll('.room-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var roomId = card.dataset.roomId;
        if (!roomId) return;
        setActiveRoom(roomId, true);
        routeToRoom(roomId);
      });

      card.addEventListener('keydown', function(ev) {
        if (ev.key === 'ArrowRight') {
          ev.preventDefault();
          moveRoomCarousel(1);
        } else if (ev.key === 'ArrowLeft') {
          ev.preventDefault();
          moveRoomCarousel(-1);
        } else if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          card.click();
        }
      });
    });

    var prevBtn = document.getElementById('room-prev-btn');
    var nextBtn = document.getElementById('room-next-btn');
    if (prevBtn) prevBtn.addEventListener('click', function() { playSound('click'); moveRoomCarousel(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function() { playSound('click'); moveRoomCarousel(1); });

    carousel.addEventListener('scroll', function() {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function() {
        var cards = carousel.querySelectorAll('.room-card');
        var viewportCenter = carousel.scrollLeft + (carousel.clientWidth / 2);
        var closestRoom = activeRoom;
        var closestDistance = Infinity;
        cards.forEach(function(card) {
          var roomId = card.dataset.roomId;
          if (!roomId) return;
          var cardCenter = card.offsetLeft + (card.offsetWidth / 2);
          var distance = Math.abs(cardCenter - viewportCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestRoom = roomId;
          }
        });
        if (closestRoom !== activeRoom && ROOM_ORDER.indexOf(closestRoom) >= 0) {
          activeRoom = closestRoom;
          updateRoomCarouselState(carousel, false);
        }
      }, 80);
    }, { passive: true });

    renderRoomDots();
    var dots = document.querySelectorAll('[data-room-dot]');
    for (var i = 0; i < dots.length; i++) {
      dots[i].addEventListener('click', function() {
        setActiveRoom(this.dataset.roomDot, true);
      });
    }

    updateRoomCarouselState(carousel, false);
  }

  function setupMissionCta() {
    var missionStartBtn = document.getElementById('mission-begin-btn');
    if (missionStartBtn) {
      missionStartBtn.addEventListener('click', function() {
        routeHomeWorldAction('learn');
      });
    }

    var bubbleChatBtn = document.getElementById('home-bubble-chat-btn');
    if (bubbleChatBtn) {
      bubbleChatBtn.addEventListener('click', function() {
        routeHomeWorldAction('chat');
      });
    }

    var laterBtn = document.getElementById('home-bubble-later-btn');
    if (laterBtn) {
      laterBtn.addEventListener('click', function() {
        playSound('click');
        var mission = document.getElementById('mission-cta');
        if (mission) mission.classList.add('is-minimized');
        showToast('VyVy vẫn ở đây khi bạn muốn học nhé!', 'info');
      });
    }

    var hotspots = document.querySelectorAll('[data-home-hotspot]');
    for (var i = 0; i < hotspots.length; i++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          routeHomeWorldAction(btn.dataset.homeHotspot);
        });
      })(hotspots[i]);
    }
  }

  /* ── Learn CTA Button ──────────────────── */
  function setBottomNavActive(section) {
    var items = document.querySelectorAll('[data-bottom-nav]');
    for (var i = 0; i < items.length; i++) {
      var isActive = items[i].dataset.bottomNav === section;
      items[i].classList.toggle('is-active', isActive);
      items[i].setAttribute('aria-current', isActive ? 'page' : 'false');
    }
  }

  function updateBottomNavState(section) {
    if (section) {
      setBottomNavActive(section);
      return;
    }
    var active = '';
    if (currentView === 'home') active = 'home';
    else if (currentView === 'learning') active = 'learning';
    else if (currentView === 'chat') active = 'chat';
    setBottomNavActive(active);
  }

  function openHomeChatDrawer() {
    var app = document.getElementById('app');
    if (!app) return;
    app.classList.add('home-chat-drawer-open');
    var chatArea = document.getElementById('chat-area');
    if (chatArea) chatArea.setAttribute('role', 'dialog');
    updateBottomNavState('chat');
    setHomeChatSuggestionsVisible(true);
    var input = document.getElementById('chat-input');
    if (input) {
      setTimeout(function() { input.focus(); }, 80);
    }
    if (DOM.chatMessages) {
      setTimeout(function() { DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight; }, 40);
    }
  }

  function closeHomeChatDrawer(focusChatButton) {
    var app = document.getElementById('app');
    if (!app) return;
    if (!app.classList.contains('home-chat-drawer-open')) return;
    app.classList.remove('home-chat-drawer-open');
    hideHomeChatSuggestions();
    var chatArea = document.getElementById('chat-area');
    if (chatArea) chatArea.removeAttribute('role');
    if (currentView === 'home') updateBottomNavState('home');
    if (focusChatButton) {
      var chatBtn = document.querySelector('[data-bottom-nav="chat"]');
      if (chatBtn) chatBtn.focus();
    }
  }

  function toggleHomeChatDrawer() {
    var app = document.getElementById('app');
    if (!app) return;
    if (app.classList.contains('home-chat-drawer-open')) {
      closeHomeChatDrawer(true);
    } else {
      openHomeChatDrawer();
    }
  }

  function setupHomeChatDrawer() {
    var closeBtn = document.getElementById('home-chat-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        closeHomeChatDrawer(true);
      });
    }
    document.addEventListener('keydown', function(ev) {
      if (ev.key === 'Escape') closeHomeChatDrawer(true);
    });
  }

  function openRewardsPanel() {
    closeFloatingSurfaces();
    if (window.VyvyDecor && typeof window.VyvyDecor.openShop === 'function') {
      window.VyvyDecor.openShop();
      return;
    }
    var avatarShopBtn = document.getElementById('avatar-shop-btn');
    if (avatarShopBtn) avatarShopBtn.click();
  }

  function setupBottomNav() {
    var navItems = document.querySelectorAll('[data-bottom-nav]');
    for (var i = 0; i < navItems.length; i++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          var target = btn.dataset.bottomNav;
          playSound('click');
          closeFloatingSurfaces();
          if (target === 'home') {
            closeHomeChatDrawer();
            if (window.VyvyDecor) window.VyvyDecor.setBg('home');
            setVyvyOutfit('uniform');
            showView('home');
          } else if (target === 'learning') {
            closeHomeChatDrawer();
            setVyvyOutfit('uniform');
            openLearningPicker();
          } else if (target === 'chat') {
            if (currentView === 'home') {
              toggleHomeChatDrawer();
            } else {
              closeHomeChatDrawer();
              showView('chat');
            }
          } else if (target === 'rewards') {
            closeHomeChatDrawer();
            updateBottomNavState('rewards');
            openRewardsPanel();
          } else if (target === 'settings') {
            closeHomeChatDrawer();
            updateBottomNavState('settings');
            showParentPanel();
          }
        });
      })(navItems[i]);
    }
    updateBottomNavState();
  }

  function setupLearnCTA() {
    var learnBtn = document.getElementById('learn-btn');
    if (learnBtn) {
      learnBtn.addEventListener('click', function() {
        openLearningPicker();
      });
    }
  }

  /* ── Voice Rate Slider ────────────────── */
  function setupVoiceRate() {
    var slider = document.getElementById('voice-rate-slider');
    var valueEl = document.getElementById('voice-rate-value');
    if (!slider) return;

    var saved = lsGet(SK.VOICE_RATE, '1.05');
    slider.value = Math.round(parseFloat(saved) * 100);
    if (valueEl) valueEl.textContent = parseFloat(saved).toFixed(2) + 'x';

    slider.addEventListener('input', function() {
      var rate = parseInt(this.value) / 100;
      lsSet(SK.VOICE_RATE, String(rate));
      if (valueEl) valueEl.textContent = rate.toFixed(2) + 'x';
    });
  }

  /* ── Navigation System ─────────────────── */
  function showView(viewName, params) {
    closeFloatingSurfaces();
    if (viewName !== 'home') closeHomeChatDrawer();
    if (currentView === viewName) return;
    if (currentView === 'learning' && viewName !== 'learning') {
      clearReadingPdfFrame();
    }
    viewStack.push(currentView);
    currentView = viewName;
    renderCurrentView(params);
  }

  function goBack() {
    closeHomeChatDrawer();
    if (viewStack.length > 0) {
      currentView = viewStack.pop();
    } else {
      currentView = 'home';
    }
    if (currentView !== 'learning') {
      clearReadingPdfFrame();
    }
    if (currentView === 'home') {
      if (window.VyvyDecor) window.VyvyDecor.setBg('home');
      setVyvyOutfit('uniform');
    }
    renderCurrentView();
  }

  function renderCurrentView() {
    var appEl = document.getElementById('app');
    var headerTitle = document.getElementById('header-title');
    var headerSub = document.getElementById('header-sub');
    var backBtn = document.getElementById('back-btn');
    var inputArea = document.getElementById('input-area');
    var bn = state.settings.bot_name || 'VyVy';

    if (appEl) appEl.dataset.view = currentView;

    var allViews = document.querySelectorAll('.view-container');
    for (var i = 0; i < allViews.length; i++) {
      allViews[i].classList.remove('active');
    }

    if (currentView === 'home') {
      if (appEl) appEl.classList.add('home-state');
      if (headerTitle) headerTitle.textContent = bn;
      if (headerSub) { headerSub.textContent = 'bạn AI của bạn'; headerSub.style.display = ''; }
      if (backBtn) backBtn.classList.add('hidden');
      if (inputArea) inputArea.classList.add('hidden');
      setVyvyOutfit('uniform');
    } else {
      if (appEl) appEl.classList.remove('home-state');
      if (backBtn) backBtn.classList.remove('hidden');

      var viewTitles = {
        'games': ['🎮 Trò chơi', ''],
        'music': ['🎵 Nhạc thiếu nhi', ''],
        'drawing': ['🎨 Vẽ tranh', ''],
        'chat': ['💬 Nói chuyện với ' + bn, ''],
        'learning': ['📚 Học bài', '']
      };
      var titles = viewTitles[currentView] || [bn, ''];
      if (headerTitle) headerTitle.textContent = titles[0];
      if (headerSub) headerSub.style.display = 'none';

      var showInput = (currentView === 'chat');
      if (inputArea) inputArea.classList.toggle('hidden', !showInput);

      var viewEl = document.getElementById(currentView + '-view');
      if (viewEl) {
        viewEl.classList.add('active');
        if (currentView === 'games') renderGamesView();
        else if (currentView === 'music') renderMusicView();
        else if (currentView === 'drawing') renderDrawingView();
        else if (currentView === 'chat') renderChatView();
        else if (currentView === 'learning') renderLearningView();
      }
    }

    updateBottomNavState();
  }

  function closeFloatingSurfaces() {
    if (window.VyvyDecor && typeof window.VyvyDecor.closeShop === 'function') {
      try { window.VyvyDecor.closeShop(); } catch (e) {}
    }
    var ids = [
      'decor-shop-panel', 'decor-shop-overlay',
      'avatar-shop-panel', 'avatar-shop-overlay',
      'parent-panel', 'parent-overlay'
    ];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (!el) continue;
      el.classList.add('hidden');
      el.classList.remove('open');
    }
  }

  function renderGamesView() {
    var container = document.getElementById('games-view-content');
    if (!container || container.dataset.loaded) return;
    var panel = document.getElementById('games-panel');
    if (panel) {
      container.appendChild(panel);
      panel.classList.remove('hidden');
      container.dataset.loaded = 'true';
      var closeBtn = panel.querySelector('.close-panel-btn');
      if (closeBtn) closeBtn.style.display = 'none';
    }
  }

  function renderMusicView() {
    var container = document.getElementById('music-view-content');
    if (!container || container.dataset.loaded) return;
    var panel = document.getElementById('music-panel');
    if (panel) {
      container.appendChild(panel);
      panel.classList.remove('hidden');
      container.dataset.loaded = 'true';
      var closeBtn = panel.querySelector('.close-panel-btn');
      if (closeBtn) closeBtn.style.display = 'none';
      initMusicPanel();
      fetch(API_BASE + '/music/songs')
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.songs && data.songs.length > 0) musicState.songs = data.songs;
          initMusicPanel();
        })
        .catch(function() {});
    }
  }

  function renderDrawingView() {
    var container = document.getElementById('drawing-view-content');
    if (!container || container.dataset.loaded) return;
    var panel = document.getElementById('drawing-panel');
    if (panel) {
      container.appendChild(panel);
      panel.classList.remove('hidden');
      container.dataset.loaded = 'true';
      var closeBtn = panel.querySelector('.close-panel-btn');
      if (closeBtn) closeBtn.style.display = 'none';
      setTimeout(function() { initDrawingPanel(); }, 100);
    }
  }

  function renderChatView() {
    var container = document.getElementById('chat-view-content');
    if (!container || container.dataset.loaded) return;
    var chatArea = document.getElementById('chat-area');
    var inputArea = document.getElementById('input-area');
    if (chatArea) container.appendChild(chatArea);
    if (inputArea) container.appendChild(inputArea);
    container.dataset.loaded = 'true';
    scrollToBottom();
  }

  function renderLearningView() {
    var container = document.getElementById('learning-view-content');
    if (!container) return;
    if (container.dataset.loaded) {
      backToPickerPreserveSelection();
      updateStudyHud();
      updateStudyStartButton();
      return;
    }
    var panel = document.getElementById('learn-panel');
    if (panel) {
      container.appendChild(panel);
      panel.classList.remove('hidden');
      container.dataset.loaded = 'true';
      var closeBtn = panel.querySelector('.close-panel-btn');
      if (closeBtn) closeBtn.style.display = 'none';
      backToPickerPreserveSelection();
      updateStudyHud();
      loadGrades();
      bindLearnInputEvents();
    }
  }

  /* ── TTS Status Check ──────────────────── */
  function checkTtsStatus() {
    fetch(API_BASE + '/tts/status')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        ttsAvailable = data.available === true;
        FEATURE_FLAGS.edgeTts = ttsAvailable;
        updateTtsVisibility();
      })
      .catch(function() {
        ttsAvailable = false;
        FEATURE_FLAGS.edgeTts = false;
        updateTtsVisibility();
      });
  }

  function updateTtsVisibility() {
    var ttsCard = document.getElementById('home-tts-card');
    if (ttsCard) ttsCard.classList.toggle('hidden', !ttsAvailable);
    var ttsBtns = document.querySelectorAll('[data-feature="edgeTts"]');
    for (var i = 0; i < ttsBtns.length; i++) {
      ttsBtns[i].classList.toggle('hidden', !ttsAvailable);
    }
  }

  /* ── Voice Preset Setup ────────────────── */
  function setupVoicePresets() {
    currentVoicePreset = lsGet('vyvy_voice_preset', 'ban-nho');
    var presetBtns = document.querySelectorAll('.voice-preset-btn');
    var descEl = document.getElementById('voice-preset-desc');

    function setActivePreset(preset) {
      currentVoicePreset = preset;
      lsSet('vyvy_voice_preset', preset);
      for (var i = 0; i < presetBtns.length; i++) {
        presetBtns[i].classList.toggle('active', presetBtns[i].dataset.preset === preset);
      }
      if (descEl && VOICE_PRESETS[preset]) {
        descEl.textContent = VOICE_PRESETS[preset].desc;
      }
    }

    setActivePreset(currentVoicePreset);

    for (var i = 0; i < presetBtns.length; i++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          setActivePreset(btn.dataset.preset);
          playSound('click');
        });
      })(presetBtns[i]);
    }
  }

  /* ── Home Action Buttons ───────────────── */
  function setupHomeActions() {
    var homeTalkBtn = document.getElementById('home-talk-btn');
    if (homeTalkBtn) {
      homeTalkBtn.addEventListener('click', function() {
        playSound('click');
        openHomeChatDrawer();
      });
    }

    var homeLearnBtn = document.getElementById('home-learn-btn');
    if (homeLearnBtn) {
      homeLearnBtn.addEventListener('click', function() {
        openLearningPicker();
      });
    }

    var homeActionCards = document.querySelectorAll('.home-action-card');
    for (var i = 0; i < homeActionCards.length; i++) {
      (function(card) {
        card.addEventListener('click', function() {
          var action = card.dataset.action;
          playSound('click');
          if (action === 'games') { if (window.VyvyDecor) window.VyvyDecor.setBg('games'); setVyvyOutfit('games'); showView('games'); }
          else if (action === 'music') { if (window.VyvyDecor) window.VyvyDecor.setBg('music'); setVyvyOutfit('music'); showView('music'); }
          else if (action === 'drawing') { if (window.VyvyDecor) window.VyvyDecor.setBg('drawing'); setVyvyOutfit('art'); showView('drawing'); }
          else if (action === 'quiz') {
            appendMessage('Bạn đố vui mình một câu nhé!', 'user');
            sendMessage('Bạn đố vui mình một câu nhé!', 'quiz');
          }
          else if (action === 'tts') {
            var bn = state.settings.bot_name || 'VyVy';
            // Try to read last bot message, fallback to greeting
            var botMessages = document.querySelectorAll('.message-bot .bubble');
            var lastBotMsg = botMessages.length > 0 ? botMessages[botMessages.length - 1].textContent : '';
            var textToSpeak = lastBotMsg || ('Xin chào, mình là ' + bn + '! Hôm nay mình cùng học nhé!');
            speak(textToSpeak);
          }
        });
      })(homeActionCards[i]);
    }

    var backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        playSound('click');
        goBack();
      });
    }
  }

  /* ── Update Header with Bot Name ───────── */
  function updateHeaderBotName() {
    var bn = state.settings.bot_name || 'VyVy';
    var headerTitle = document.getElementById('header-title');
    var headerSub = document.getElementById('header-sub');
    if (currentView === 'home') {
      if (headerTitle) headerTitle.textContent = bn;
      if (headerSub) headerSub.textContent = 'bạn AI của bạn';
    }
    var learnSub = document.getElementById('home-learn-sub');
    if (learnSub) learnSub.textContent = 'Hôm nay bạn muốn học gì?';
    var onbName = document.getElementById('onboarding-bot-name');
    if (onbName) onbName.textContent = bn;
  }

  /* ── Quick Buttons ──────────────────────── */
  function setupQuickButtons() {
    var buttons = document.querySelectorAll('.quick-btn');
    for (var i = 0; i < buttons.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var action = btn.dataset.action || '';
          var map = ACTION_MAP[action];
          if (!map) return;
          if (state.mode !== 'idle' || state.isProcessing) return;
          hideHomeChatSuggestions();

          // Handle special actions (games, music, drawing)
          if (map.special === 'games') { setVyvyOutfit('games'); showGamesPanel(); return; }
          if (map.special === 'music') { setVyvyOutfit('music'); showMusicPanel(); return; }
          if (map.special === 'drawing') { setVyvyOutfit('art'); showDrawingPanel(); return; }
          if (map.special === 'learn') { showLearningPanel(); return; }

          state.sessionMode = map.mode;

          // Try to get a starter from content pack
          var starter = null;
          if (typeof vyvyGetStarter === 'function') {
            starter = vyvyGetStarter(map.mode);
          }

          var prompt = starter || map.prompt;
          appendMessage(prompt, 'user');
          sendMessage(prompt, map.mode);
        });
      })(buttons[i]);
    }
  }

  /* ── Send Button & Input ────────────────── */
  function setupChatInput() {
    if (DOM.sendBtn) {
      DOM.sendBtn.addEventListener('click', function () {
        var text = DOM.chatInput ? DOM.chatInput.value.trim() : '';
        if (text && state.mode === 'idle' && !state.isProcessing) {
          hideHomeChatSuggestions();
          appendMessage(text, 'user');
          sendMessage(text);
          DOM.chatInput.value = '';
        }
      });
    }
    if (DOM.chatInput) {
      DOM.chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (DOM.sendBtn) DOM.sendBtn.click();
        }
      });
    }
  }

  /* ── Live Call Buttons ──────────────────── */
  function setupLiveCallButtons() {
    loadMicMode();
    setupMicListeners();
    if (DOM.liveCallBtn) DOM.liveCallBtn.title = getMicTitle();
    if (DOM.endCallBtn) {
      DOM.endCallBtn.addEventListener('click', function () {
        stopLiveCall();
      });
    }
    if (DOM.stopCallBtn) {
      DOM.stopCallBtn.addEventListener('click', function () {
        stopLiveCall();
      });
    }
  }

  /* ── Parent Settings Panel ──────────────── */
  function showParentPanel() {
    if (DOM.parentOverlay) DOM.parentOverlay.classList.remove('hidden');
    if (DOM.parentPanel) DOM.parentPanel.classList.remove('hidden');
    if (DOM.pinError) DOM.pinError.classList.add('hidden');
    if (DOM.pinInput) {
      DOM.pinInput.value = '';
      DOM.pinInput.disabled = false;
    }
    if (DOM.pinSubmit) DOM.pinSubmit.disabled = false;

    var storedPin = lsGet(SK.PIN, '');
    if (!storedPin) {
      // No PIN set — allow direct access or create new PIN
      if (DOM.pinGate) DOM.pinGate.classList.add('hidden');
      showSettings();
      return;
    }

    if (DOM.pinGate) DOM.pinGate.classList.remove('hidden');
    if (DOM.settingsContent) DOM.settingsContent.classList.add('hidden');

    if (isPinLocked()) {
      var remaining = Math.ceil((getPinLock() - Date.now()) / 1000);
      if (DOM.pinError) {
        DOM.pinError.textContent = 'Nhập sai quá nhiều. Thử lại sau ' + remaining + ' giây.';
        DOM.pinError.classList.remove('hidden');
      }
      if (DOM.pinInput) DOM.pinInput.disabled = true;
      if (DOM.pinSubmit) DOM.pinSubmit.disabled = true;
    } else if (DOM.pinInput) {
      DOM.pinInput.focus();
    }
  }

  function hideParentPanel() {
    if (DOM.parentOverlay) DOM.parentOverlay.classList.add('hidden');
    if (DOM.parentPanel) DOM.parentPanel.classList.add('hidden');
    if (state.pinLockTimer) {
      clearInterval(state.pinLockTimer);
      state.pinLockTimer = null;
    }
  }

  function showSettings() {
    if (DOM.pinGate) DOM.pinGate.classList.add('hidden');
    if (DOM.settingsContent) DOM.settingsContent.classList.remove('hidden');

    // Populate
    if (DOM.nicknameInput) DOM.nicknameInput.value = state.settings.nickname;
    if (DOM.ageSelect) DOM.ageSelect.value = String(state.settings.age);
    if (DOM.goalInput) DOM.goalInput.value = state.settings.goal;

    var botNameInput = document.getElementById('setting-bot-name');
    if (botNameInput) botNameInput.value = state.settings.bot_name || 'VyVy';

    if (DOM.modeBtns) {
      for (var i = 0; i < DOM.modeBtns.length; i++) {
        var btn = DOM.modeBtns[i];
        if (btn.dataset.mode === state.settings.mode) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    }

    // Voice gender toggle
    var femaleBtn = document.getElementById('voice-female-btn');
    var maleBtn = document.getElementById('voice-male-btn');
    if (femaleBtn && maleBtn) {
      if (state.settings.voice_gender === 'male') {
        femaleBtn.classList.remove('active');
        maleBtn.classList.add('active');
      } else {
        femaleBtn.classList.add('active');
        maleBtn.classList.remove('active');
      }
    }

    // Voice preset toggle
    currentVoicePreset = lsGet('vyvy_voice_preset', 'ban-nho');
    var presetBtns = document.querySelectorAll('.voice-preset-btn');
    var descEl = document.getElementById('voice-preset-desc');
    for (var pi = 0; pi < presetBtns.length; pi++) {
      presetBtns[pi].classList.toggle('active', presetBtns[pi].dataset.preset === currentVoicePreset);
    }
    if (descEl && VOICE_PRESETS[currentVoicePreset]) {
      descEl.textContent = VOICE_PRESETS[currentVoicePreset].desc;
    }

    // Mic mode toggle
    var currentMicMode = state.micMode || 'ptt';
    var micPttBtn = document.getElementById('mic-ptt-btn');
    var micHoldBtn = document.getElementById('mic-hold-btn');
    var micLiveBtn = document.getElementById('mic-live-btn');
    var micDescEl = document.getElementById('mic-mode-desc');
    var micDescs = {
      ptt: 'Bấm nút micro, nói xong bấm lại để gửi.',
      hold: 'Giữ nút micro, nói xong thả ra để gửi.',
      live_call: 'Bấm nút micro để bắt đầu, nói chuyện liên tục. Bấm "Kết thúc" để dừng.'
    };
    if (micPttBtn) micPttBtn.classList.toggle('active', currentMicMode === 'ptt');
    if (micHoldBtn) micHoldBtn.classList.toggle('active', currentMicMode === 'hold');
    if (micLiveBtn) micLiveBtn.classList.toggle('active', currentMicMode === 'live_call');
    if (micDescEl) micDescEl.textContent = micDescs[currentMicMode] || '';

    // Re-select voice and render status
    state.vyvyVoice = selectVietnameseVoice(state.settings.voice_gender);
    renderVoiceStatus();

    // Theme toggle
    var currentTheme = lsGet(SK.THEME, 'light');
    var themeLight = document.getElementById('theme-light-btn');
    var themeDark = document.getElementById('theme-dark-btn');
    var themeAuto = document.getElementById('theme-auto-btn');
    if (themeLight && themeDark && themeAuto) {
      themeLight.classList.toggle('active', currentTheme === 'light');
      themeDark.classList.toggle('active', currentTheme === 'dark');
      themeAuto.classList.toggle('active', currentTheme === 'auto');
    }

    // Voice rate slider
    var rateSlider = document.getElementById('voice-rate-slider');
    var rateValue = document.getElementById('voice-rate-value');
    if (rateSlider) {
      var savedRate = lsGet(SK.VOICE_RATE, '0.95');
      rateSlider.value = Math.round(parseFloat(savedRate) * 100);
      if (rateValue) rateValue.textContent = parseFloat(savedRate).toFixed(2) + 'x';
    }

    // Time limit
    var timeLimitInput = document.getElementById('setting-time-limit');
    if (timeLimitInput) timeLimitInput.value = getTimeLimit();
  }

  function setupParentControls() {
    if (DOM.parentBtn) {
      DOM.parentBtn.addEventListener('click', showParentPanel);
    }
    if (DOM.parentOverlay) {
      DOM.parentOverlay.addEventListener('click', hideParentPanel);
    }
    if (DOM.closeBtn) {
      DOM.closeBtn.addEventListener('click', hideParentPanel);
    }

    // PIN submit
    if (DOM.pinSubmit) {
      DOM.pinSubmit.addEventListener('click', function () {
        if (isPinLocked()) return;
        var pin = DOM.pinInput ? DOM.pinInput.value.trim() : '';
        if (pin.length < 4) {
          if (DOM.pinError) {
            DOM.pinError.textContent = 'PIN phải có ít nhất 4 số';
            DOM.pinError.classList.remove('hidden');
          }
          return;
        }

        if (DOM.pinInput) DOM.pinInput.disabled = true;
        if (DOM.pinSubmit) DOM.pinSubmit.disabled = true;

        verifyPin(pin).then(function (ok) {
          if (ok) {
            setPinFails(0); setPinLock(0);
            if (DOM.pinError) DOM.pinError.classList.add('hidden');
            showSettings();
          } else {
            var fails = getPinFails() + 1;
            setPinFails(fails);
            if (fails >= MAX_PIN_ATTEMPTS) {
              setPinLock(Date.now() + PIN_LOCK_MS);
              if (DOM.pinError) {
                DOM.pinError.textContent = 'Nhập sai quá nhiều. Thử lại sau 30 giây.';
                DOM.pinError.classList.remove('hidden');
              }
            } else {
              var left = MAX_PIN_ATTEMPTS - fails;
              if (DOM.pinError) {
                DOM.pinError.textContent = 'Sai mã PIN. Còn ' + left + ' lần thử.';
                DOM.pinError.classList.remove('hidden');
              }
            }
            if (DOM.pinInput) {
              DOM.pinInput.disabled = false;
              DOM.pinInput.value = '';
              DOM.pinInput.focus();
            }
            if (DOM.pinSubmit) DOM.pinSubmit.disabled = false;
          }
        });
      });
    }

    if (DOM.pinInput) {
      DOM.pinInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (DOM.pinSubmit) DOM.pinSubmit.click();
        }
      });
    }

    // Mode toggle
    if (DOM.modeBtns) {
      for (var i = 0; i < DOM.modeBtns.length; i++) {
        (function (btn) {
          btn.addEventListener('click', function () {
            for (var j = 0; j < DOM.modeBtns.length; j++) DOM.modeBtns[j].classList.remove('active');
            btn.classList.add('active');
            state.settings.mode = btn.dataset.mode || 'balanced';
          });
        })(DOM.modeBtns[i]);
      }
    }

    // Save settings
    if (DOM.saveBtn) {
      DOM.saveBtn.addEventListener('click', function () {
    if (DOM.nicknameInput) state.settings.nickname = DOM.nicknameInput.value.trim() || 'Bạn';
    if (DOM.ageSelect) state.settings.age = parseInt(DOM.ageSelect.value, 10) || 8;
    if (DOM.goalInput) state.settings.goal = DOM.goalInput.value.trim() || 'vui vẻ và học hỏi';
    var botNameInput = document.getElementById('setting-bot-name');
    if (botNameInput) state.settings.bot_name = botNameInput.value.trim() || 'VyVy';
    var timeLimitInput = document.getElementById('setting-time-limit');
    if (timeLimitInput) lsSet(SK.TIME_LIMIT, String(parseInt(timeLimitInput.value, 10) || 60));

    var activeMicBtn = document.querySelector('.mic-mode-btn.active');
    if (activeMicBtn && activeMicBtn.dataset.micMode) {
      applyMicMode(activeMicBtn.dataset.micMode);
    }

    saveSettings();
    hideParentPanel();
    showToast('Đã lưu cài đặt!', 'success');
    appendMessage('Đã lưu cài đặt! ' + state.settings.bot_name + ' sẽ nhớ bạn ' + state.settings.nickname + ' nhé!', 'bot');
      });
    }

    // Reset memory
    if (DOM.resetMemoryBtn) {
      DOM.resetMemoryBtn.addEventListener('click', function () {
        if (confirm('Xóa bộ nhớ VyVy? VyVy sẽ không nhớ gì về bạn nữa.')) {
          resetMemory();
          appendMessage('Đã xóa bộ nhớ. VyVy bắt đầu lại từ đầu nhé!', 'bot');
        }
      });
    }

    // Daily summary
    if (DOM.dailySummaryBtn) {
      DOM.dailySummaryBtn.addEventListener('click', function () {
        if (DOM.summaryDisplay) {
          var summary = 'Hôm nay bạn đã nói chuyện ' + getDailyCount() + ' lần với VyVy.\n';
          summary += 'Tổng cộng đã nói chuyện ' + state.memory.conversation_count + ' lần.\n';
          if (state.memory.favorite_topics.length > 0) {
            summary += 'Bạn thích: ' + state.memory.favorite_topics.slice(-5).join(', ') + '\n';
          }
          if (state.memory.known_english.length > 0) {
            summary += 'Từ tiếng Anh đã học: ' + state.memory.known_english.slice(-5).join(', ') + '\n';
          }
          if (state.memory.recent_mood) {
            summary += 'Tâm trạng gần đây: ' + state.memory.recent_mood;
          }
          DOM.summaryDisplay.textContent = summary;
          DOM.summaryDisplay.classList.remove('hidden');
        }
      });
    }

    // Learning history
    var historyBtn = document.getElementById('learning-history-btn');
    var historyDisplay = document.getElementById('learning-history-display');
    if (historyBtn && historyDisplay) {
      historyBtn.addEventListener('click', function () {
        if (!historyDisplay.classList.contains('hidden')) {
          historyDisplay.classList.add('hidden');
          return;
        }
        historyDisplay.textContent = 'Đang tải...';
        historyDisplay.classList.remove('hidden');
        fetch(API_BASE + '/curriculum/history?grade=' + learnState.activeGrade + '&limit=20')
          .then(function(res) { return res.json(); })
          .then(function(data) {
            var sessions = data.sessions || [];
            if (sessions.length === 0) {
              historyDisplay.textContent = 'Chưa có bài học nào hoàn thành.';
              return;
            }
            var lines = [];
            for (var i = 0; i < sessions.length; i++) {
              var s = sessions[i];
              var d = s.completed_at ? s.completed_at.slice(0, 10) : '?';
              var stars = '';
              for (var j = 0; j < (s.stars || 0); j++) stars += '⭐';
              lines.push(d + ' | ' + (s.subject || '?') + ' | ' + stars);
            }
            historyDisplay.textContent = lines.join('\n');
          })
          .catch(function(err) {
            historyDisplay.textContent = 'Lỗi tải lịch sử: ' + (err.message || err);
          });
      });
    }

    // Weekly report
    var weeklyBtn = document.getElementById('weekly-report-btn');
    var weeklyDisplay = document.getElementById('weekly-report-display');
    if (weeklyBtn && weeklyDisplay) {
      weeklyBtn.addEventListener('click', function () {
        if (!weeklyDisplay.classList.contains('hidden')) {
          weeklyDisplay.classList.add('hidden');
          return;
        }
        weeklyDisplay.textContent = 'Đang tải...';
        weeklyDisplay.classList.remove('hidden');
        fetch(API_BASE + '/curriculum/weekly-report?grade=' + learnState.activeGrade)
          .then(function(res) { return res.json(); })
          .then(function(data) {
            var lines = ['📊 Báo cáo tuần này:', ''];
            lines.push('Tổng bài học: ' + data.total_sessions);
            lines.push('Tổng sao: ' + data.total_stars + ' ⭐');
            lines.push('Trung bình: ' + data.avg_stars + ' sao/bài');
            lines.push('Số ngày học: ' + data.days_active + '/7 ngày');
            if (data.subjects && Object.keys(data.subjects).length > 0) {
              lines.push('', 'Môn học:');
              var keys = Object.keys(data.subjects);
              for (var i = 0; i < keys.length; i++) {
                lines.push('  ' + keys[i] + ': ' + data.subjects[keys[i]] + ' bài');
              }
            }
            weeklyDisplay.textContent = lines.join('\n');
          })
          .catch(function(err) {
            weeklyDisplay.textContent = 'Lỗi: ' + (err.message || err);
          });
      });
    }

    // Voice gender toggle
    var voiceFemaleBtn = document.getElementById('voice-female-btn');
    var voiceMaleBtn = document.getElementById('voice-male-btn');
    if (voiceFemaleBtn && voiceMaleBtn) {
      voiceFemaleBtn.addEventListener('click', function () {
        voiceFemaleBtn.classList.add('active');
        voiceMaleBtn.classList.remove('active');
        state.settings.voice_gender = 'female';
        state.vyvyVoice = selectVietnameseVoice('female');
        renderVoiceStatus();
      });
      voiceMaleBtn.addEventListener('click', function () {
        voiceMaleBtn.classList.add('active');
        voiceFemaleBtn.classList.remove('active');
        state.settings.voice_gender = 'male';
        state.vyvyVoice = selectVietnameseVoice('male');
        renderVoiceStatus();
      });
    }

    // Mic mode toggle
    var micModes = ['ptt', 'hold', 'live_call'];
    var micDescs = {
      ptt: 'Bấm nút micro, nói xong bấm lại để gửi.',
      hold: 'Giữ nút micro, nói xong thả ra để gửi.',
      live_call: 'Bấm nút micro để bắt đầu, nói chuyện liên tục. Bấm "Kết thúc" để dừng.'
    };
    var micPttBtn = document.getElementById('mic-ptt-btn');
    var micHoldBtn = document.getElementById('mic-hold-btn');
    var micLiveBtn = document.getElementById('mic-live-btn');
    var micDescEl = document.getElementById('mic-mode-desc');
    var micBtns = [micPttBtn, micHoldBtn, micLiveBtn];

    function setMicModeUI(mode) {
      for (var i = 0; i < micBtns.length; i++) {
        if (micBtns[i]) micBtns[i].classList.toggle('active', micModes[i] === mode);
      }
      if (micDescEl) micDescEl.textContent = micDescs[mode] || '';
    }

    if (micPttBtn) {
      micPttBtn.addEventListener('click', function () { setMicModeUI('ptt'); });
    }
    if (micHoldBtn) {
      micHoldBtn.addEventListener('click', function () { setMicModeUI('hold'); });
    }
    if (micLiveBtn) {
      micLiveBtn.addEventListener('click', function () { setMicModeUI('live_call'); });
    }

    // Test voice button
    var testVoiceBtn = document.getElementById('test-voice-btn');
    if (testVoiceBtn) {
      testVoiceBtn.addEventListener('click', function () {
        if (ttsState.state === 'loading' || ttsState.state === 'playing') {
          stopCurrentAudio();
          setTtsButtonState('idle');
          setAvatarState('idle');
          return;
        }
        var bn = state.settings.bot_name || 'VyVy';
        var testText = 'Xin chào, mình là ' + bn + '! Hôm nay mình cùng học nhé!';
        speak(testText);
      });
    }

    // Refresh voices button
    var refreshVoicesBtn = document.getElementById('refresh-voices-btn');
    if (refreshVoicesBtn) {
      refreshVoicesBtn.addEventListener('click', function () {
        // Force re-scan voices
        if (state.synthesis) {
          state.synthesis.cancel();
          // Trigger voice list refresh
          state.synthesis.getVoices();
          state.vyvyVoice = selectVietnameseVoice(state.settings.voice_gender);
          renderVoiceStatus();
        }
      });
    }
  }

  /* ── Health Check ───────────────────────── */
  function checkHealth() {
    fetch(HEALTH_ENDPOINT, { method: 'GET' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.status === 'ok') {
          console.log('VyVy backend connected');
        }
      })
      .catch(function () {
        console.log('Backend not reachable, will use fallback');
      });
  }

  /* ── Welcome ────────────────────────────── */
  function showWelcome() {
    var name = state.settings.nickname;
    var bn = state.settings.bot_name || 'VyVy';
    var greeting = 'Chào ' + name + '! Mình là ' + bn + '. Hôm nay tụi mình nói chuyện gì vui nhỉ?';
    appendMessage(greeting, 'bot');
  }

  var homeWelcomeTimer = null;

  function hideHomeWelcomeBubble() {
    var bubble = document.getElementById('home-welcome-bubble');
    if (homeWelcomeTimer) {
      clearTimeout(homeWelcomeTimer);
      homeWelcomeTimer = null;
    }
    if (bubble) bubble.classList.add('hidden');
  }

  function showHomeWelcomeBubble() {
    var bubble = document.getElementById('home-welcome-bubble');
    if (!bubble) return;
    var name = state.settings.nickname || 'bạn';
    bubble.textContent = 'Chào ' + name + '! Mình là VyVy. Mình học cùng bạn nhé!';
    bubble.classList.remove('hidden');
    bubble.onclick = function() {
      hideHomeWelcomeBubble();
      openHomeChatDrawer();
    };
    if (homeWelcomeTimer) clearTimeout(homeWelcomeTimer);
    homeWelcomeTimer = setTimeout(hideHomeWelcomeBubble, 4000);
  }

  /* ── First-time setup ───────────────────── */
  function promptFirstTime() {
    if (!isSettingsDone()) {
      showOnboarding();
    }
  }

  /* ── Onboarding Mic Tutorial ───────────── */
  function setupOnboardingMic() {
    var micBtn = document.getElementById('onboarding-mic-btn');
    var statusEl = document.getElementById('onboarding-mic-status');
    var nextBtn = document.getElementById('onboarding-next-mic');
    var skipBtn = document.getElementById('onboarding-skip-mic');
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR || !micBtn) {
      if (statusEl) statusEl.textContent = 'Thiết bị chưa hỗ trợ micro. Con có thể nhắn chữ nhé!';
      if (micBtn) { micBtn.disabled = true; micBtn.style.opacity = '0.5'; }
      return;
    }

    var testRec = null;
    var testActive = false;

    micBtn.onclick = function() {
      if (testActive) {
        try { if (testRec) testRec.stop(); } catch (e) {}
        testActive = false;
        micBtn.classList.remove('listening');
        return;
      }

      testActive = true;
      micBtn.classList.add('listening');
      if (statusEl) statusEl.textContent = 'Đang nghe... Con nói "Xin chào VyVy" nhé!';

      testRec = new SR();
      testRec.lang = 'vi-VN';
      testRec.interimResults = false;
      testRec.maxAlternatives = 1;
      testRec.continuous = false;

      testRec.onresult = function(ev) {
        var text = '';
        if (ev.results && ev.results.length > 0) {
          text = ev.results[0][0].transcript || '';
        }
        if (text.trim()) {
          testActive = false;
          micBtn.classList.remove('listening');
          micBtn.classList.add('success');
          micBtn.textContent = '✓';
          if (statusEl) statusEl.textContent = 'Tuyệt vời! VyVy nghe được: "' + text.trim() + '"';
          if (nextBtn) nextBtn.classList.remove('hidden');
          if (skipBtn) skipBtn.classList.add('hidden');
          try { testRec.stop(); } catch (e) {}
        }
      };

      testRec.onerror = function(ev) {
        testActive = false;
        micBtn.classList.remove('listening');
        if (ev.error === 'not-allowed') {
          if (statusEl) statusEl.textContent = 'Cho phép micro trên trình duyệt nhé! Con có thể bỏ qua và dùng nhắn chữ.';
        } else {
          if (statusEl) statusEl.textContent = 'VyVy chưa nghe rõ. Con thử lại nhé!';
        }
      };

      testRec.onend = function() {
        if (testActive) {
          testActive = false;
          micBtn.classList.remove('listening');
          if (statusEl && statusEl.textContent.indexOf('Tuyệt vời') === -1) {
            statusEl.textContent = 'VyVy chưa nghe rõ. Con thử lại nhé!';
          }
        }
      };

      try {
        testRec.start();
      } catch (e) {
        testActive = false;
        micBtn.classList.remove('listening');
        if (statusEl) statusEl.textContent = 'Không thể bật micro. Con có thể bỏ qua và dùng nhắn chữ.';
      }
    };
  }

  /* ── Onboarding Flow ────────────────────── */
  function showOnboarding() {
    var overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');

    var nameInput = document.getElementById('onboarding-name');
    var gradeContainer = document.getElementById('onboarding-grades');
    var pinInput = document.getElementById('onboarding-pin');
    var pinError = document.getElementById('onboarding-pin-error');
    var backBtn = document.getElementById('onboarding-back');
    var progressEl = document.getElementById('onboarding-progress');
    var next1 = document.getElementById('onboarding-next1');
    var next2 = document.getElementById('onboarding-next2');
    var finishBtn = document.getElementById('onboarding-finish');
    var skipPinBtn = document.getElementById('onboarding-skip-pin');
    var onboardingState = {
      step: 'name',
      nickname: '',
      grade: getSavedGrade(3)
    };

    function syncName() {
      onboardingState.nickname = nameInput ? nameInput.value.trim() : '';
      return onboardingState.nickname;
    }

    function renderProgress() {
      if (!progressEl) return;
      progressEl.innerHTML = '';
      if (onboardingState.step === 'pin') {
        progressEl.classList.add('is-parent-step');
        return;
      }
      progressEl.classList.remove('is-parent-step');
      var steps = ['name', 'grade'];
      var activeIndex = steps.indexOf(onboardingState.step);
      for (var i = 0; i < steps.length; i++) {
        var dot = document.createElement('span');
        dot.className = 'onboarding-dot';
        if (i < activeIndex) dot.classList.add('done');
        if (i === activeIndex) dot.classList.add('active');
        progressEl.appendChild(dot);
      }
    }

    function renderGrades() {
      if (!gradeContainer) return;
      gradeContainer.innerHTML = '';
      for (var g = 1; g <= 5; g++) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'onboarding-grade-btn' + (g === onboardingState.grade ? ' active' : '');
        btn.textContent = 'Lớp ' + g;
        btn.dataset.grade = g;
        btn.setAttribute('aria-pressed', g === onboardingState.grade ? 'true' : 'false');
        btn.onclick = function() {
          onboardingState.grade = parseInt(this.dataset.grade, 10) || 3;
          renderGrades();
        };
        gradeContainer.appendChild(btn);
      }
    }

    function renderOnboarding() {
      var panels = {
        name: document.getElementById('onboarding-step1'),
        grade: document.getElementById('onboarding-step2'),
        pin: document.getElementById('onboarding-step3')
      };
      Object.keys(panels).forEach(function(key) {
        if (panels[key]) panels[key].classList.toggle('hidden', key !== onboardingState.step);
      });
      if (backBtn) backBtn.classList.toggle('hidden', onboardingState.step === 'name');
      if (pinError) pinError.classList.add('hidden');
      renderProgress();
      if (onboardingState.step === 'grade') renderGrades();
      setTimeout(function() {
        if (onboardingState.step === 'name' && nameInput) nameInput.focus();
        if (onboardingState.step === 'pin' && pinInput) pinInput.focus();
      }, 30);
    }

    function setStep(step) {
      onboardingState.step = step;
      renderOnboarding();
    }

    function advanceName() {
      var name = syncName();
      if (!name) {
        if (nameInput) nameInput.focus();
        return;
      }
      setStep('grade');
    }

    function finishOnboarding(skipPin) {
      var pinVal = pinInput ? pinInput.value.trim() : '';
      if (!skipPin && pinVal.length > 0 && pinVal.length < 4) {
        if (pinError) pinError.classList.remove('hidden');
        if (pinInput) pinInput.focus();
        return;
      }

      state.settings.nickname = syncName() || 'Bé';
      state.settings.bot_name = 'VyVy';
      state.settings.age = deriveAgeFromGrade(onboardingState.grade);
      state.settings.mode = 'balanced';
      state.settings.goal = 'vui vẻ và học hỏi';

      var doFinish = function() {
        lsSet(SK.GRADE, String(onboardingState.grade));
        saveSettings();
        fetch(API_BASE + '/curriculum/active-grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grade: onboardingState.grade })
        }).catch(function() {});
        overlay.classList.add('hidden');
        updateHomeProfileBadges();
        showToast('Chào mừng ' + state.settings.nickname + '! Mình là VyVy nhé!', 'success');
        showWelcome();
        showHomeWelcomeBubble();
      };

      if (!skipPin && pinVal.length >= 4) {
        hashPin(pinVal).then(function(hash) {
          lsSet(SK.PIN, hash);
          doFinish();
        });
      } else {
        doFinish();
      }
    }

    if (nameInput) {
      nameInput.value = onboardingState.nickname;
      nameInput.onkeydown = function(ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          advanceName();
        }
      };
    }
    if (next1) next1.onclick = advanceName;
    if (next2) next2.onclick = function() { setStep('pin'); };
    if (backBtn) {
      backBtn.onclick = function() {
        if (onboardingState.step === 'grade') setStep('name');
        else if (onboardingState.step === 'pin') setStep('grade');
      };
    }
    if (finishBtn) finishBtn.onclick = function() { finishOnboarding(false); };
    if (skipPinBtn) skipPinBtn.onclick = function() { finishOnboarding(true); };
    if (pinInput) {
      pinInput.value = '';
      pinInput.onkeydown = function(ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          finishOnboarding(false);
        }
      };
    }

    renderOnboarding();
  }

  /* ── Avatar Shop ─────────────────────────── */
  var AVATAR_LIST = [
    { id: 'robot_default', name: 'Robot VyVy', emoji: '🤖', cost: 0 },
    { id: 'cat_cute', name: 'Mèo cute', emoji: '🐱', cost: 0 },
    { id: 'dog_happy', name: 'Cún vui', emoji: '🐶', cost: 0 },
    { id: 'bunny_pink', name: 'Thỏ hồng', emoji: '🐰', cost: 5 },
    { id: 'fox_smart', name: 'Cáo thông minh', emoji: '🦊', cost: 5 },
    { id: 'panda_round', name: 'Gấu trúc', emoji: '🐼', cost: 10 },
    { id: 'unicorn_magic', name: 'Kỳ lân', emoji: '🦄', cost: 10 },
    { id: 'dragon_cool', name: 'Rồng nhỏ', emoji: '🐲', cost: 15 },
    { id: 'alien_space', name: 'Người ngoài hành tinh', emoji: '👽', cost: 15 },
    { id: 'ghost_cute', name: 'Ma dễ thương', emoji: '👻', cost: 20 },
    { id: 'robot_gold', name: 'Robot vàng', emoji: '🤖', cost: 20 },
    { id: 'princess', name: 'Công chúa', emoji: '👸', cost: 25 },
    { id: 'superhero', name: 'Siêu anh hùng', emoji: '🦸', cost: 25 },
    { id: 'wizard', name: 'Phù thủy', emoji: '🧙', cost: 30 },
    { id: 'astronaut', name: 'Phi hành gia', emoji: '🧑‍🚀', cost: 30 },
    { id: 'ninja', name: 'Ninja', emoji: '🥷', cost: 35 },
    { id: 'pirate', name: 'Cướp biển', emoji: '🏴‍☠️', cost: 35 },
    { id: 'dinosaur', name: 'Khủng long', emoji: '🦕', cost: 40 },
    { id: 'phoenix', name: 'Phượng hoàng', emoji: '🔥', cost: 50 },
    { id: 'rainbow', name: 'Cầu vồng', emoji: '🌈', cost: 50 },
  ];

  var avatarShopState = {
    stars: 0,
    currentAvatar: null,
    selectedAvatar: null,
    purchasedAvatars: [],
  };

  function loadStarBalance() {
    var grade = getHomeLessonGrade();
    fetch(API_BASE + '/curriculum/progress?grade=' + encodeURIComponent(grade))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var stars = data.cumulative_stars ? data.cumulative_stars.total_stars : 0;
        avatarShopState.stars = stars;
        var starCountEl = document.getElementById('star-count');
        if (starCountEl) starCountEl.textContent = stars;
        updateHomeHudStats(data);
        var shopBalanceEl = document.getElementById('shop-balance-stars');
        if (shopBalanceEl) shopBalanceEl.textContent = '⭐ ' + stars;
      })
      .catch(function(err) {
        console.error('[AvatarShop] Load star balance error:', err);
        updateHomeHudStats();
      });
  }

  function loadCurrentAvatar() {
    fetch(API_BASE + '/curriculum/avatar')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        avatarShopState.currentAvatar = data;
        avatarShopState.purchasedAvatars = data.purchased || [];
        updateAvatarDisplay(data);
      })
      .catch(function(err) {
        console.error('[AvatarShop] Load avatar error:', err);
      });
  }

  function updateAvatarDisplay(avatar) {
    var avatarEl = document.getElementById('vyvy-avatar');
    if (!avatarEl) return;
    var emojiEl = avatarEl.querySelector('.avatar-shop-emoji');
    if (emojiEl) {
      emojiEl.textContent = avatar.emoji;
    }
  }

  function renderAvatarShop() {
    var grid = document.getElementById('avatar-shop-grid');
    if (!grid) return;
    grid.innerHTML = '';

    AVATAR_LIST.forEach(function(avatar) {
      var item = document.createElement('div');
      item.className = 'avatar-item';
      var isOwned = avatar.cost === 0 || avatarShopState.purchasedAvatars.some(function(a) { return a.id === avatar.id; });
      var canAfford = avatarShopState.stars >= avatar.cost;
      var isSelected = avatarShopState.currentAvatar && avatarShopState.currentAvatar.id === avatar.id;

      if (isSelected) item.classList.add('selected');
      if (!isOwned && !canAfford) item.classList.add('locked');

      item.innerHTML =
        '<div class="avatar-item-emoji">' + avatar.emoji + '</div>' +
        '<div class="avatar-item-name">' + avatar.name + '</div>' +
        '<div class="avatar-item-cost ' + (avatar.cost === 0 ? 'free' : (!canAfford && !isOwned ? 'locked-cost' : '')) + '">' +
        (avatar.cost === 0 ? 'Miễn phí' : (isOwned ? 'Đã sở hữu' : '⭐ ' + avatar.cost)) +
        '</div>';

      item.onclick = function() {
        avatarShopState.selectedAvatar = avatar;
        showAvatarPreview(avatar, isOwned || canAfford);
      };

      grid.appendChild(item);
    });
  }

  function showAvatarPreview(avatar, canBuy) {
    var preview = document.getElementById('avatar-shop-preview');
    if (!preview) return;
    preview.classList.remove('hidden');

    document.getElementById('preview-avatar').textContent = avatar.emoji;
    document.getElementById('preview-name').textContent = avatar.name;
    document.getElementById('preview-cost').textContent = avatar.cost === 0 ? 'Miễn phí' : '⭐ ' + avatar.cost + ' sao';

    var buyBtn = document.getElementById('preview-buy-btn');
    var isOwned = avatar.cost === 0 || avatarShopState.purchasedAvatars.some(function(a) { return a.id === avatar.id; });

    if (isOwned) {
      buyBtn.textContent = 'Đang sử dụng';
      buyBtn.disabled = true;
    } else if (canBuy) {
      buyBtn.textContent = 'Đổi avatar (' + avatar.cost + ' ⭐)';
      buyBtn.disabled = false;
      buyBtn.onclick = function() { purchaseAvatar(avatar); };
    } else {
      buyBtn.textContent = 'Không đủ sao';
      buyBtn.disabled = true;
    }
  }

  function purchaseAvatar(avatar) {
    if (avatarShopState.stars < avatar.cost) {
      showToast('Không đủ sao! Cần ' + avatar.cost + ' ⭐', 'error');
      return;
    }

    fetch(API_BASE + '/curriculum/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        avatar_id: avatar.id,
        avatar_name: avatar.name,
        avatar_emoji: avatar.emoji,
      }),
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        avatarShopState.currentAvatar = data;
        showToast('Đổi avatar thành công! ' + avatar.emoji, 'success');
        loadStarBalance();
        renderAvatarShop();
        showAvatarPreview(avatar, true);
      })
      .catch(function(err) {
        console.error('[AvatarShop] Purchase error:', err);
        showToast('Có lỗi xảy ra, thử lại nhé!', 'error');
      });
  }

  function setupAvatarShop() {
    var shopBtn = document.getElementById('avatar-shop-btn');
    var overlay = document.getElementById('avatar-shop-overlay');
    var panel = document.getElementById('avatar-shop-panel');
    var closeBtn = panel ? panel.querySelector('.close-panel-btn') : null;

    if (shopBtn) {
      shopBtn.onclick = function() {
        if (window.VyvyDecor) {
          window.VyvyDecor.openShop();
        } else {
          loadStarBalance();
          renderAvatarShop();
          overlay.classList.remove('hidden');
          panel.classList.remove('hidden');
        }
      };
    }

    if (overlay) {
      overlay.onclick = function() {
        overlay.classList.add('hidden');
        panel.classList.add('hidden');
      };
    }

    if (closeBtn) {
      closeBtn.onclick = function() {
        overlay.classList.add('hidden');
        panel.classList.add('hidden');
      };
    }
  }

  /* ── Init ───────────────────────────────── */
  function init() {
    cacheDom();
    loadSettings();
    updateHomeProfileBadges();
    loadStarBalance();
    loadMemory();
    loadTheme();
    loadVoices();
    initSpeechRecognition();
    setupChatInput();
    setupQuickButtons();
    setupLiveCallButtons();
    setupParentControls();
    setupFeatureButtons();
    setupThemeToggle();
    setupLearnCTA();
    setupMissionCta();
    setupHomeChatDrawer();
    setupBottomNav();
    updateMissionProgress();
    initRoomCarousel();
    setupVoiceRate();
    setupVoicePresets();
    setupHomeActions();
    bindLearnInputEvents();
    addButtonSounds();
    setAvatarState('idle');
    checkHealth();
    checkTtsStatus();
    updateHeaderBotName();
    if (isSettingsDone()) { showWelcome(); }
    promptFirstTime(); // onboarding finish gọi showWelcome() sau khi save

    if (!window.speechSynthesis) {
      showToast('Trình duyệt không hỗ trợ giọng nói. Dùng Chrome hoặc Edge.', 'warning', 5000);
      var lcb = document.getElementById('live-call-btn');
      if (lcb) { lcb.disabled = true; lcb.style.opacity = '0.4'; lcb.title = 'Không hỗ trợ giọng nói'; }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
