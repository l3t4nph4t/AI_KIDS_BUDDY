/**
 * study-room-app.js V9 — Perspective Slot System
 * Based on VyVy Home Template v5
 */
'use strict';

(function () {
  /* ── Config ── */
  var ASSET = 'assets/vyvy_ui_atlas_pack_v2/crops/';
  var FRAME = { w: 768, h: 1300 };
  var isPreviewMode = new URLSearchParams(window.location.search).get('preview') === '1';

  /* ── Storage Keys ── */
  var SK = {
    STARS: 'sr_stars', STREAK: 'sr_streak', LEVEL: 'sr_level',
    TAB: 'sr_active_tab', EQUIPPED: 'sr_equipped_decor',
    OWNED: 'sr_owned_decor', LESSONS: 'sr_lessons_done', NAME: 'sr_player_name',
    AGE: 'sr_player_age', SETTINGS_DONE: 'sr_settings_done',
    BOT_NAME: 'sr_bot_name', GRADE: 'sr_grade'
  };

  function get(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* */ } }
  function isSettingsDone() { return get(SK.SETTINGS_DONE, false) === true; }

  /* ── Init Defaults ── */
  function init() {
    if (get(SK.TAB, null) === null) set(SK.TAB, 'home');
    if (get(SK.EQUIPPED, null) === null) set(SK.EQUIPPED, []);
    if (get(SK.OWNED, null) === null) set(SK.OWNED, []);
    if (!isSettingsDone()) {
      set(SK.STARS, 0); set(SK.STREAK, 0); set(SK.LEVEL, 1);
      set(SK.LESSONS, 0); set(SK.NAME, '');
    }
  }
  init();

  /* ── State ── */
  var appEl = null;
  var tab = get(SK.TAB, 'home');
  var activeSubject = null;
  var practiceQ = 0;
  var practiceDone = false;
  var practicePick = -1;
  var shopCat = 'all';

  /* ── Content ── */
  var QUESTIONS = [
    { q: '5 + 7 = ?', a: ['10', '11', '12', '13'], c: 2 },
    { q: '3 + 4 = ?', a: ['5', '7', '8', '6'], c: 1 },
    { q: 'Hoa nào là quốc hoa VN?', a: ['Hoa hồng', 'Hoa sen', 'Hoa mai', 'Hoa đào'], c: 1 },
    { q: 'Mặt trời mọc hướng nào?', a: ['Tây', 'Nam', 'Đông', 'Bắc'], c: 2 },
    { q: '5 x 3 = ?', a: ['12', '18', '15', '20'], c: 2 }
  ];

  var ENGLISH = [
    { word: 'cat', meaning: 'con mèo', emoji: '🐱' },
    { word: 'sun', meaning: 'mặt trời', emoji: '☀️' },
    { word: 'happy', meaning: 'vui vẻ', emoji: '😊' },
    { word: 'star', meaning: 'ngôi sao', emoji: '⭐' },
    { word: 'book', meaning: 'quyển sách', emoji: '📖' },
    { word: 'rainbow', meaning: 'cầu vồng', emoji: '🌈' }
  ];
  var MATH = [
    { q: 'VyVy có 3 ngôi sao, thêm 2 nữa là mấy?', a: '5', emoji: '⭐' },
    { q: 'Con có 5 viên kẹo, cho 1 viên, còn mấy?', a: '4', emoji: '🍬' },
    { q: '2 + 3 = ?', a: '5', emoji: '🔢' },
    { q: '6 - 2 = ?', a: '4', emoji: '🧮' }
  ];
  var STORIES = [
    { title: 'Mèo con và ngôi sao', prompt: 'Mèo con nhìn thấy một ngôi sao...', emoji: '🐱⭐' },
    { title: 'Chiếc hộp bí mật', prompt: 'VyVy tìm thấy một chiếc hộp...', emoji: '🎁' },
    { title: 'Khu vườn kỳ diệu', prompt: 'Trong khu vườn có bông hoa biết nói...', emoji: '🌺' }
  ];
  var FEELINGS = [
    { feeling: 'vui', prompt: 'Hôm nay bạn thấy vui không?', emoji: '😊' },
    { feeling: 'buồn', prompt: 'Nếu hơi buồn, mình hít thở nhé.', emoji: '😢' },
    { feeling: 'hào hứng', prompt: 'Yeah! Bạn hào hứng gì?', emoji: '🤩' }
  ];
  var GUIDANCE = [
    'Mình học từng chút thôi nha!',
    'Bạn chọn một hoạt động, VyVy học cùng.',
    'Hôm nay mình sẽ học thật vui!',
    'Đừng lo, VyVy ở đây mà!'
  ];

  /* ── Slot Layout (mobile 768x1300) ── */
  var SLOTS = [
    { id: 'wall_color', layer: 'scene', role: 'scene', x: 0, y: 0, w: 768, h: 1300, z: 1, plane: 'wall' },
    { id: 'window_scene', layer: 'room-slot', role: 'window', x: 24, y: 176, w: 206, h: 266, z: 14, plane: 'wall', text: 'Cửa sổ' },
    { id: 'window_curtain', layer: 'room-slot', role: 'decor', x: 18, y: 156, w: 220, h: 294, z: 18, plane: 'wall', text: 'Rèm' },
    { id: 'wall_art', layer: 'room-slot', role: 'decor', x: 268, y: 164, w: 118, h: 110, z: 18, plane: 'wall', text: 'Tranh' },
    { id: 'wall_clock', layer: 'room-slot', role: 'decor', x: 404, y: 166, w: 64, h: 64, z: 18, plane: 'wall', round: true, text: '🕐' },
    { id: 'wall_shelf', layer: 'room-slot', role: 'shelf', x: 520, y: 146, w: 214, h: 448, z: 17, plane: 'right-shelf', shelf: true, text: 'Kệ sách' },
    { id: 'shelf_fav_plush', layer: 'favorite', role: 'decor', x: 548, y: 176, w: 158, h: 74, z: 27, plane: 'right-shelf', text: '🧸' },
    { id: 'shelf_fav_book', layer: 'favorite', role: 'decor', x: 548, y: 272, w: 158, h: 84, z: 27, plane: 'right-shelf', text: '📚' },
    { id: 'shelf_fav_trophy', layer: 'favorite', role: 'decor', x: 548, y: 382, w: 158, h: 84, z: 27, plane: 'right-shelf', text: '🏆' },
    { id: 'wall_board', layer: 'room-slot', role: 'decor', x: 280, y: 316, w: 220, h: 94, z: 18, plane: 'wall', text: 'Bảng trắng' },
    { id: 'desk', layer: 'scene', role: 'furniture', x: 208, y: 594, w: 330, h: 144, z: 30, plane: 'floor', text: 'Bàn học' },
    { id: 'desk_lamp', layer: 'room-slot', role: 'decor', x: 286, y: 518, w: 82, h: 98, z: 36, plane: 'desk-top', text: '💡' },
    { id: 'desk_pencil', layer: 'room-slot', role: 'decor', x: 248, y: 636, w: 70, h: 58, z: 37, plane: 'desk-top', text: '✏️' },
    { id: 'desk_cup', layer: 'room-slot', role: 'decor', x: 484, y: 634, w: 54, h: 60, z: 37, plane: 'desk-top', text: '☕' },
    { id: 'desk_plant', layer: 'room-slot', role: 'decor', x: 396, y: 604, w: 70, h: 70, z: 37, plane: 'desk-top', text: '🌿' },
    { id: 'floor_rug', layer: 'room-slot', role: 'floor', x: 430, y: 892, w: 206, h: 76, z: 9, plane: 'floor', round: true, text: ' thảm' },
    { id: 'floor_chair', layer: 'room-slot', role: 'floor', x: 350, y: 804, w: 112, h: 180, z: 33, plane: 'floor', text: '🪑' },
    { id: 'floor_pet', layer: 'room-slot', role: 'floor', x: 28, y: 860, w: 92, h: 74, z: 34, plane: 'floor', text: '🐱' },
    { id: 'vyvy_shadow', layer: 'vyvy', role: 'vyvy-shadow', x: 78, y: 864, w: 180, h: 34, z: 45, plane: 'floor' },
    { id: 'vyvy_body', layer: 'vyvy', role: 'vyvy', x: 52, y: 330, w: 246, h: 540, z: 50, plane: 'character' }
  ];

  /* ── Helpers ── */
  function img(name, cls, alt) {
    return '<img src="' + ASSET + name + '" class="' + (cls || '') + '" alt="' + (alt || '') + '" loading="lazy">';
  }
  function stars() { return get(SK.STARS, 0); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function navigateTo(t) {
    if (isPreviewMode && t !== 'home') return;
    tab = t;
    set(SK.TAB, t);
    render();
  }

  function addStars(n) {
    set(SK.STARS, stars() + n);
    floatStar(n);
    toast('+' + n + ' Sao!');
    render();
  }

  function completeLesson() {
    set(SK.LESSONS, get(SK.LESSONS, 0) + 1);
    addStars(50);
  }

  /* ── UI Feedback ── */
  function floatStar(n) {
    var el = document.createElement('div');
    el.className = 'sr-star-float';
    el.textContent = '+' + n + ' Sao!';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 1200);
  }

  function toast(msg) {
    var old = document.querySelector('.sr-toast');
    if (old) old.remove();
    var el = document.createElement('div');
    el.className = 'sr-toast'; el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 350);
    }, 1800);
  }

  function rewardBurst(n, msg) {
    var old = document.querySelector('.sr-reward-burst');
    if (old) old.remove();
    var el = document.createElement('div');
    el.className = 'sr-reward-burst';
    el.innerHTML =
      '<div class="sr-reward-box">' +
      '<div class="sr-reward-stars">⭐⭐⭐</div>' +
      '<div class="sr-reward-amount">+' + n + ' Sao!</div>' +
      '<div class="sr-reward-msg">' + msg + '</div>' +
      '<button class="sr-reward-close" data-action="close-reward">Tuyệt vời!</button>' +
      '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('active'); });
  }

  /* ── Slot Rendering ── */
  function renderSlot(s) {
    var planeDefs = {
      'wall': { rotate: 0, skewX: 0, skewY: 0 },
      'right-shelf': { rotate: -1, skewX: -2, skewY: 0 },
      'desk-top': { rotate: -2, skewX: -4, skewY: 0 },
      'floor': { rotate: -3, skewX: -8, skewY: 0 },
      'character': { rotate: 0, skewX: 0, skewY: 0 },
      'character-fx': { rotate: 0, skewX: 0, skewY: 0 },
      'ui': { rotate: 0, skewX: 0, skewY: 0 }
    };
    var def = planeDefs[s.plane] || planeDefs.ui;
    var rotate = s.rotate != null ? s.rotate : def.rotate;
    var skewX = s.skewX != null ? s.skewX : def.skewX;
    var skewY = s.skewY != null ? s.skewY : def.skewY;

    var h = '<div class="sr-slot" data-slot="' + s.id + '" data-layer="' + s.layer + '" data-role="' + s.role + '" data-plane="' + s.plane + '"';
    h += ' style="left:' + s.x + 'px;top:' + s.y + 'px;width:' + s.w + 'px;height:' + s.h + 'px;z-index:' + s.z;
    h += ';--rotate:' + rotate + 'deg;--skew-x:' + skewX + 'deg;--skew-y:' + skewY + 'deg"';
    if (s.round) h += ' data-round="true"';
    h += '>';
    h += '</div>';
    return h;
  }

  /* ── Home Screen ── */
  function homeScreen() {
    var name = get(SK.NAME, 'Bé');
    var s = stars(), st = get(SK.STREAK, 0), lv = get(SK.LEVEL, 1);
    var done = get(SK.LESSONS, 0), total = 3, pct = Math.min(100, Math.round(done / total * 100));
    var greeting = pick(GUIDANCE);

    var h = '';

    // Background layers
    h += '<div class="sr-paint"></div>';
    h += '<div class="sr-light"></div>';
    h += '<div class="sr-floor-bg"></div>';

    // Room slots
    for (var i = 0; i < SLOTS.length; i++) {
      var slot = SLOTS[i];
      h += renderSlot(slot);

      // Fill slot content
      if (slot.id === 'wall_color') continue;

      // Content will be injected after render
    }

    // HUD (absolute positioned)
    h += '<div class="sr-slot" data-layer="ui" data-role="hud" data-plane="ui" style="left:34px;top:28px;width:700px;height:76px;z-index:80">';
    h += '<div class="sr-hud">';
    h += '<div class="sr-hud-stats">';
    h += '<span class="sr-hud-pill">⭐ ' + s.toLocaleString('vi-VN') + '</span>';
    h += '<span class="sr-hud-pill">🔥 ' + st + '</span>';
    h += '<span class="sr-hud-pill">Lv.' + lv + '</span>';
    h += '</div>';
    h += '<div class="sr-hud-profile">' + img('avatar_profile_badge.png', '', 'avatar') + '</div>';
    h += '</div></div>';

    // Speech card
    h += '<div class="sr-slot" data-layer="ui" data-role="card" data-plane="ui" style="left:120px;top:184px;width:204px;height:112px;z-index:72">';
    h += '<div class="sr-speech"><span class="sr-speech-text">' + greeting + '</span></div></div>';

    // Mission panel
    h += '<div class="sr-slot" data-layer="ui" data-role="card" data-plane="ui" style="left:70px;top:962px;width:628px;height:222px;z-index:70">';
    h += '<div class="sr-mission">';
    h += '<div class="sr-mission-title">Chào ' + name + '!</div>';
    h += '<div class="sr-mission-sub">Hôm nay mình học gì nè?</div>';
    h += '<div class="sr-mission-progress">';
    h += '<div class="sr-mission-bar"><div class="sr-mission-bar-fill" style="width:' + pct + '%"></div></div>';
    h += '<span class="sr-mission-bar-text">' + done + '/' + total + ' bài</span>';
    h += '</div>';
    h += '<div class="sr-mission-actions">';
    h += '<button class="sr-btn sr-btn-primary" data-action="start-learn">Bắt đầu học</button>';
    h += '<button class="sr-btn sr-btn-secondary" data-action="view-room">Xem góc học</button>';
    h += '</div>';
    h += '</div></div>';

    // Subject buttons
    h += '<div class="sr-slot" data-layer="ui" data-role="ui" data-plane="ui" style="left:84px;top:1196px;width:596px;height:82px;z-index:78">';
    h += '<div class="sr-subjects" style="grid-template-columns:repeat(4,1fr)">';
    h += '<button class="sr-subject-btn" data-action="open-subject" data-subject="math"><span class="sr-subject-icon">🔢</span><span class="sr-subject-label">Toán</span></button>';
    h += '<button class="sr-subject-btn" data-action="open-subject" data-subject="english"><span class="sr-subject-icon">🇬🇧</span><span class="sr-subject-label">Tiếng Anh</span></button>';
    h += '<button class="sr-subject-btn" data-action="open-subject" data-subject="story"><span class="sr-subject-icon">📖</span><span class="sr-subject-label">Kể chuyện</span></button>';
    h += '<button class="sr-subject-btn" data-action="open-subject" data-subject="feelings"><span class="sr-subject-icon">💖</span><span class="sr-subject-label">Cảm xúc</span></button>';
    h += '</div></div>';

    // Bottom nav
    h += '<div class="sr-slot" data-layer="ui" data-role="nav" data-plane="ui" style="left:30px;top:1222px;width:708px;height:60px;z-index:89">';
    h += '<div class="sr-bottom-nav">';
    h += '<button class="sr-nav-item' + (tab === 'home' ? ' active' : '') + '" data-nav="home"><span class="sr-nav-icon">🏠</span><span class="sr-nav-label">Nhà</span></button>';
    h += '<button class="sr-nav-item' + (tab === 'learn' ? ' active' : '') + '" data-nav="learn"><span class="sr-nav-icon">📚</span><span class="sr-nav-label">Học bài</span></button>';
    h += '<button class="sr-nav-item' + (tab === 'practice' ? ' active' : '') + '" data-nav="practice"><span class="sr-nav-icon">✏️</span><span class="sr-nav-label">Luyện tập</span></button>';
    h += '<button class="sr-nav-item' + (tab === 'shop' ? ' active' : '') + '" data-nav="shop"><span class="sr-nav-icon">🎁</span><span class="sr-nav-label">Cửa hàng</span></button>';
    h += '<button class="sr-nav-item' + (tab === 'parent' ? ' active' : '') + '" data-nav="parent"><span class="sr-nav-icon">⚙️</span><span class="sr-nav-label">Phụ huynh</span></button>';
    h += '</div></div>';

    // VyVy shadow
    h += '<div class="sr-slot" data-layer="vyvy" data-role="vyvy-shadow" data-plane="floor" style="left:78px;top:864px;width:180px;height:34px;z-index:45">';
    h += '<div class="sr-vyvy-shadow-img" style="background:rgba(100,50,28,.16);border-radius:50%;width:100%;height:100%"></div></div>';

    // VyVy character
    h += '<div class="sr-slot" data-layer="vyvy" data-role="vyvy" data-plane="character" style="left:52px;top:330px;width:246px;height:540px;z-index:50">';
    h += '<img class="sr-vyvy-img" src="assets/vyvy/derived/vyvy_idle.png" alt="VyVy" loading="lazy"></div>';

    return h;
  }

  /* ── Learn Screen ── */
  function learnScreen() {
    var content = getSubjectContent(activeSubject || 'math');
    var h = '<div class="sr-shell"><div class="sr-shell-header">';
    h += '<button class="sr-shell-back" data-nav="home">←</button>';
    h += '<span class="sr-shell-title">Học bài</span></div>';
    h += '<div class="sr-shell-body">';
    h += '<div class="sr-learn-content">';
    h += '<div class="sr-learn-title">' + content.title + '</div>';
    h += '<div class="sr-learn-subtitle">' + content.subtitle + '</div>';
    h += '<div class="sr-learn-text">' + content.promptText;
    if (content.hint) h += '<br><br><strong>Gợi ý:</strong> ' + content.hint;
    h += '</div>';
    h += '<div class="sr-learn-nav">';
    h += '<button class="sr-btn sr-btn-secondary" data-nav="home">Quay lại</button>';
    h += '<button class="sr-btn sr-btn-primary" data-action="complete-lesson">Hoàn thành</button>';
    h += '</div></div></div></div>';
    return h;
  }

  /* ── Practice Screen ── */
  function practiceScreen() {
    var q = QUESTIONS[practiceQ % QUESTIONS.length];
    var h = '<div class="sr-shell"><div class="sr-shell-header">';
    h += '<button class="sr-shell-back" data-nav="home">←</button>';
    h += '<span class="sr-shell-title">Luyện tập</span></div>';
    h += '<div class="sr-shell-body">';
    h += '<div class="sr-practice-q">';
    h += '<div class="sr-practice-q-text">' + q.q + '</div>';
    h += '<div class="sr-practice-grid">';
    q.a.forEach(function (ans, i) {
      var cls = 'sr-practice-card';
      if (practiceDone) {
        if (i === q.c) cls += ' correct';
        else if (i === practicePick) cls += ' wrong';
      }
      h += '<button class="' + cls + '" data-answer="' + i + '">' + ans + '</button>';
    });
    h += '</div>';
    if (practiceDone) {
      var correct = practicePick === q.c;
      h += '<div class="sr-practice-fb">' + (correct ? '✅ Đúng rồi! +20 Sao' : '❌ Sai rồi! Đáp án: ' + q.a[q.c]) + '</div>';
      h += '<div style="text-align:center;margin-top:14px"><button class="sr-btn sr-btn-primary" data-action="next-q">Câu tiếp theo</button></div>';
    }
    h += '</div>';
    var step = (practiceQ % QUESTIONS.length) + 1;
    h += '<div style="text-align:center;margin-top:12px;font-size:13px;color:var(--brown2)">Câu ' + step + '/' + QUESTIONS.length + '</div>';
    h += '</div></div>';
    return h;
  }

  /* ── Shop Screen ── */
  function shopScreen() {
    var s = stars();
    var h = '<div class="sr-shell"><div class="sr-shell-header">';
    h += '<button class="sr-shell-back" data-nav="home">←</button>';
    h += '<span class="sr-shell-title">Cửa hàng</span></div>';
    h += '<div class="sr-shell-body">';
    h += '<div class="sr-parent-card">';
    h += '<div class="sr-parent-title">⭐ Sao của bạn: ' + s.toLocaleString('vi-VN') + '</div>';
    h += '<p style="font-size:13px;color:var(--brown2)">Hoàn thành bài học để kiếm sao và mua đồ trang trí!</p>';
    h += '</div></div></div>';
    return h;
  }

  /* ── Parent Screen ── */
  function parentScreen() {
    var name = get(SK.NAME, 'Bé'), lv = get(SK.LEVEL, 1), s = stars(), st = get(SK.STREAK, 0), ls = get(SK.LESSONS, 0);
    var h = '<div class="sr-shell"><div class="sr-shell-header">';
    h += '<button class="sr-shell-back" data-nav="home">←</button>';
    h += '<span class="sr-shell-title">Phụ huynh</span></div>';
    h += '<div class="sr-shell-body">';
    h += '<div class="sr-parent-card"><div class="sr-parent-title">📊 Tổng quan học tập</div>';
    h += '<div class="sr-parent-row"><span class="sr-parent-label">Tên con</span><span class="sr-parent-val">' + name + '</span></div>';
    h += '<div class="sr-parent-row"><span class="sr-parent-label">Cấp độ</span><span class="sr-parent-val">Lv. ' + lv + '</span></div>';
    h += '<div class="sr-parent-row"><span class="sr-parent-label">Sao tích lũy</span><span class="sr-parent-val">⭐ ' + s.toLocaleString('vi-VN') + '</span></div>';
    h += '<div class="sr-parent-row"><span class="sr-parent-label">Streak</span><span class="sr-parent-val">' + st + ' ngày</span></div>';
    h += '<div class="sr-parent-row"><span class="sr-parent-label">Bài hoàn thành</span><span class="sr-parent-val">' + ls + '</span></div></div>';
    h += '<div class="sr-parent-card"><div class="sr-parent-title">⚙️ Cài đặt</div>';
    h += '<div class="sr-parent-row"><span class="sr-parent-label">Giới hạn thời gian</span><span class="sr-parent-val">60 phút/ngày</span></div>';
    h += '<div class="sr-parent-row"><span class="sr-parent-label">Chế độ học</span><span class="sr-parent-val">Cân bằng</span></div></div>';
    h += '<div class="sr-parent-card"><div class="sr-parent-title">🛡️ An toàn</div>';
    h += '<div class="sr-parent-row"><span class="sr-parent-label">Lọc nội dung</span><button class="sr-parent-toggle on" data-toggle="filter"></button></div>';
    h += '<div class="sr-parent-row"><span class="sr-parent-label">Giám sát</span><button class="sr-parent-toggle on" data-toggle="supervise"></button></div></div>';
    h += '</div></div>';
    return h;
  }

  /* ── Subject Content ── */
  function getSubjectContent(subject) {
    switch (subject) {
      case 'english':
        var eng = pick(ENGLISH);
        return { title: 'Tiếng Anh nhẹ', subtitle: 'Học từ mới cùng VyVy', promptText: eng.emoji + ' ' + eng.word + ' = ' + eng.meaning, hint: 'Lặp lại 3 lần để nhớ!' };
      case 'math':
        var math = pick(MATH);
        return { title: 'Toán vui', subtitle: 'Giải toán nhẹ nhàng', promptText: math.emoji + ' ' + math.q, hint: 'Đáp án: ' + math.a };
      case 'story':
        var story = pick(STORIES);
        return { title: 'Kể chuyện', subtitle: 'Sáng tạo câu chuyện', promptText: story.emoji + ' ' + story.prompt, hint: 'Tưởng tượng tự do!' };
      case 'feelings':
        var f = pick(FEELINGS);
        return { title: 'Cảm xúc hôm nay', subtitle: 'Chia sẻ cùng VyVy', promptText: f.emoji + ' ' + f.prompt, hint: 'Nói thật nhé!' };
      default:
        return { title: 'Toán vui', subtitle: 'Giải toán nhẹ nhàng', promptText: '🔢 2 + 3 = ?', hint: 'Đáp án: 5' };
    }
  }

  /* ── Main Render ── */
  function render() {
    if (!appEl) return;
    var h = '';
    switch (tab) {
      case 'home': h += homeScreen(); break;
      case 'learn': h += homeScreen() + learnScreen(); break;
      case 'practice': h += homeScreen() + practiceScreen(); break;
      case 'shop': h += homeScreen() + shopScreen(); break;
      case 'parent': h += homeScreen() + parentScreen(); break;
      default: h += homeScreen();
    }
    appEl.innerHTML = h;
    scaleStage();
  }

  /* ── Scale Stage to Fit Viewport ── */
  function scaleStage() {
    var shell = appEl.parentElement;
    if (!shell) return;
    var safeW = window.innerWidth - 2;
    var safeH = window.innerHeight - 2;
    var scale = Math.min(safeW / FRAME.w, safeH / FRAME.h, 1);
    document.documentElement.style.setProperty('--frame-w', FRAME.w);
    document.documentElement.style.setProperty('--frame-h', FRAME.h);
    document.documentElement.style.setProperty('--scale', scale.toFixed(5));
  }

  /* ── Onboarding ── */
  var obStep = 1, obName = '', obAge = 8;

  function rOnboarding() {
    var h = '<div class="sr-onboarding-overlay" id="sr-onboarding">';
    h += '<div class="sr-onboarding-card">';
    if (obStep === 1) {
      h += '<div class="sr-onboarding-icon">👋</div>';
      h += '<div class="sr-onboarding-title">Chào con! Con tên gì?</div>';
      h += '<div class="sr-onboarding-desc">VyVy muốn biết tên con để học cùng nhau!</div>';
      h += '<input class="sr-onboarding-input" id="ob-name" type="text" placeholder="Nhập tên con..." maxlength="20" value="' + obName + '">';
      h += '<div class="sr-onboarding-ages">';
      for (var a = 5; a <= 12; a++) {
        h += '<button class="sr-onboarding-age-btn' + (a === obAge ? ' active' : '') + '" data-age="' + a + '">' + a + '</button>';
      }
      h += '</div>';
      h += '<button class="sr-btn sr-btn-primary sr-onboarding-btn" data-action="ob-next">Tiếp theo</button>';
    } else {
      h += '<div class="sr-onboarding-icon">🔒</div>';
      h += '<div class="sr-onboarding-title">Mã PIN cho phụ huynh</div>';
      h += '<div class="sr-onboarding-desc">Để ba mẹ quản lý cài đặt. Bỏ qua nếu không cần.</div>';
      h += '<input class="sr-onboarding-input" id="ob-pin" type="password" placeholder="PIN 4 số (tùy chọn)" maxlength="8">';
      h += '<button class="sr-btn sr-btn-primary sr-onboarding-btn" data-action="finish-onboarding">Bắt đầu học!</button>';
      h += '<button class="sr-btn sr-btn-secondary sr-onboarding-btn" data-action="finish-onboarding" style="margin-top:8px">Bỏ qua</button>';
    }
    h += '</div></div>';
    return h;
  }

  function showOnboarding() {
    var el = document.createElement('div');
    el.id = 'sr-onboarding-root';
    el.innerHTML = rOnboarding();
    document.body.appendChild(el);
    bindObEvents();
  }

  function bindObEvents() {
    var root = document.getElementById('sr-onboarding-root');
    if (!root) return;
    root.onclick = function (e) {
      var ageBtn = e.target.closest('[data-age]');
      if (ageBtn) {
        obAge = parseInt(ageBtn.getAttribute('data-age'), 10);
        var all = root.querySelectorAll('.sr-onboarding-age-btn');
        for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
        ageBtn.classList.add('active');
        return;
      }
      var act = e.target.closest('[data-action]');
      if (!act) return;
      var action = act.getAttribute('data-action');
      if (action === 'ob-next') {
        var nameInput = document.getElementById('ob-name');
        var name = nameInput ? nameInput.value.trim() : '';
        if (!name) { if (nameInput) nameInput.focus(); return; }
        obName = name;
        obStep = 2;
        root.innerHTML = rOnboarding();
        bindObEvents();
      } else if (action === 'finish-onboarding') {
        finishOnboarding();
      }
    };
    root.onkeydown = function (e) {
      if (e.key === 'Enter') {
        if (obStep === 1) {
          var nameInput = document.getElementById('ob-name');
          var name = nameInput ? nameInput.value.trim() : '';
          if (!name) return;
          obName = name; obStep = 2;
          root.innerHTML = rOnboarding();
          bindObEvents();
        } else { finishOnboarding(); }
      }
    };
    if (obStep === 1) {
      var ni = document.getElementById('ob-name');
      if (ni) setTimeout(function () { ni.focus(); }, 100);
    }
  }

  function finishOnboarding() {
    var pinInput = document.getElementById('ob-pin');
    var pin = pinInput ? pinInput.value.trim() : '';
    var grade = Math.max(1, Math.min(5, obAge - 5));
    if (obAge <= 5) grade = 1;
    set(SK.NAME, obName);
    set(SK.AGE, obAge);
    set(SK.GRADE, grade);
    set(SK.STARS, 0);
    set(SK.STREAK, 0);
    set(SK.LEVEL, 1);
    set(SK.LESSONS, 0);
    set(SK.SETTINGS_DONE, true);
    try {
      localStorage.setItem('vyvy_nickname', obName);
      localStorage.setItem('vyvy_age', String(obAge));
      localStorage.setItem('vyvy_grade', String(grade));
      localStorage.setItem('vyvy_settings_done', 'true');
      localStorage.setItem('vyvy_bot_name', 'VyVy');
      localStorage.setItem('vyvy_mode', 'balanced');
      localStorage.setItem('vyvy_goal', 'vui vẻ và học hỏi');
      if (pin.length >= 4) localStorage.setItem('vyvy_pin', pin);
    } catch (e) {}
    var root = document.getElementById('sr-onboarding-root');
    if (root) root.remove();
    toast('Chào mừng ' + obName + '! Mình là VyVy nhé!');
    render();
  }

  /* ── Event Handling ── */
  function handleClick(e) {
    var navBtn = e.target.closest('[data-nav]');
    if (navBtn) {
      e.preventDefault();
      navigateTo(navBtn.getAttribute('data-nav'));
      return;
    }
    var actionEl = e.target.closest('[data-action]');
    if (actionEl) {
      e.preventDefault();
      var action = actionEl.getAttribute('data-action');
      if (action === 'start-learn') { activeSubject = 'math'; navigateTo('learn'); }
      else if (action === 'view-room') toast('Đây là góc học của riêng em!');
      else if (action === 'complete-lesson') { completeLesson(); rewardBurst(50, 'Hoàn thành bài học!'); }
      else if (action === 'next-q') { practiceQ++; practiceDone = false; practicePick = -1; render(); }
      else if (action === 'close-reward') { var rb = document.querySelector('.sr-reward-burst'); if (rb) rb.remove(); }
      else if (action === 'open-subject') {
        var subj = actionEl.getAttribute('data-subject');
        if (subj) { activeSubject = subj; render(); }
      }
      return;
    }
    var answerEl = e.target.closest('[data-answer]');
    if (answerEl) {
      e.preventDefault();
      if (practiceDone) return;
      var idx = parseInt(answerEl.getAttribute('data-answer'), 10);
      var q = QUESTIONS[practiceQ % QUESTIONS.length];
      practiceDone = true; practicePick = idx;
      if (idx === q.c) addStars(20);
      else toast('Sai rồi! Đáp án: ' + q.a[q.c]);
      render();
      return;
    }
    var toggleEl = e.target.closest('[data-toggle]');
    if (toggleEl) {
      e.preventDefault();
      toggleEl.classList.toggle('on');
    }
  }

  /* ── Init ── */
  function start() {
    appEl = document.getElementById('sr-app');
    if (!appEl) { console.error('Study Room: #sr-app not found'); return; }
    if (isPreviewMode) document.body.classList.add('is-preview-mode');
    appEl.addEventListener('click', handleClick);
    window.addEventListener('resize', function () { scaleStage(); });
    render();
    if (!isSettingsDone()) showOnboarding();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
