/**
 * decor.js — VyVy Decoration, Level, Star & Exercise System
 * Integrates with script.js for the AI_KIDS_BUDDY app.
 * IIFE, 'use strict', fully responsive (clamp/vmin/vw throughout injected styles).
 */
(function () {
  'use strict';

  /* =========================================================
     STORAGE KEYS
  ========================================================= */
  window.DECOR_SK = {
    STARS:          'vyvy_stars',
    DECOR_OWNED:    'vyvy_decor_owned',
    DECOR_PLACED:   'vyvy_decor_placed',
    VYVY_LEVEL:     'vyvy_level',
    VYVY_OUTFIT:    'vyvy_outfit',
    EXERCISE_STATS: 'vyvy_exercise_stats',
  };

  /* =========================================================
     DECORATION ITEMS DATA
  ========================================================= */
  var DECOR_ITEMS = [
    // ── HOME ─────────────────────────────────────────────────
    // wall-poster
    {id:'wp1',  slot:'wall-poster',     level:1, name:'Bảng chữ cái',    emoji:'🔤', cost:5,   bg:'home',     desc:'Poster bảng chữ cái đẹp'},
    {id:'wp2',  slot:'wall-poster',     level:2, name:'Tranh phong cảnh',emoji:'🏞️', cost:15,  bg:'home',     desc:'Tranh phong cảnh đẹp'},
    {id:'wp3',  slot:'wall-poster',     level:3, name:'Tranh VyVy',      emoji:'🖼️', cost:30,  bg:'home',     desc:'Tranh VyVy đặc biệt'},
    // wall-clock
    {id:'wc1',  slot:'wall-clock',      level:1, name:'Đồng hồ gỗ',     emoji:'🕐', cost:5,   bg:'home',     desc:'Đồng hồ gỗ tròn'},
    {id:'wc2',  slot:'wall-clock',      level:2, name:'Đồng hồ mặt trời',emoji:'🌞',cost:15,  bg:'home',     desc:'Đồng hồ hình mặt trời'},
    {id:'wc3',  slot:'wall-clock',      level:3, name:'Đồng hồ cát',    emoji:'⏳', cost:30,  bg:'home',     desc:'Đồng hồ cát phát sáng'},
    // desk-lamp
    {id:'dl1',  slot:'desk-lamp',       level:1, name:'Đèn ngôi sao',   emoji:'💡', cost:5,   bg:'home',     desc:'Đèn bàn hình ngôi sao'},
    {id:'dl2',  slot:'desk-lamp',       level:2, name:'Đèn mặt trăng',  emoji:'🌙', cost:15,  bg:'home',     desc:'Đèn mặt trăng xanh'},
    {id:'dl3',  slot:'desk-lamp',       level:3, name:'Đèn cầu vồng',   emoji:'🌈', cost:30,  bg:'home',     desc:'Đèn cầu vồng phát sáng'},
    // pencil-box
    {id:'pb1',  slot:'pencil-box',      level:1, name:'Hộp bút màu',    emoji:'✏️', cost:3,   bg:'home',     desc:'Hộp bút nhựa màu sắc'},
    {id:'pb2',  slot:'pencil-box',      level:2, name:'Hộp bút gỗ',     emoji:'📦', cost:10,  bg:'home',     desc:'Hộp gỗ khắc tên'},
    {id:'pb3',  slot:'pencil-box',      level:3, name:'Hộp bút pha lê', emoji:'💎', cost:25,  bg:'home',     desc:'Hộp pha lê có khắc'},
    // desk-plant
    {id:'dpt1', slot:'desk-plant',      level:1, name:'Xương rồng',     emoji:'🌵', cost:5,   bg:'home',     desc:'Xương rồng mini dễ thương'},
    {id:'dpt2', slot:'desk-plant',      level:2, name:'Cỏ bốn lá',      emoji:'🍀', cost:12,  bg:'home',     desc:'Cỏ bốn lá may mắn'},
    {id:'dpt3', slot:'desk-plant',      level:3, name:'Hoa hướng dương',emoji:'🌻', cost:28,  bg:'home',     desc:'Hoa hướng dương nhỏ'},
    // bookshelf
    {id:'bs1',  slot:'bookshelf',       level:1, name:'Kệ 3 cuốn',      emoji:'📚', cost:8,   bg:'home',     desc:'Kệ sách 3 cuốn'},
    {id:'bs2',  slot:'bookshelf',       level:2, name:'Kệ + cúp',       emoji:'🏆', cost:20,  bg:'home',     desc:'Kệ sách và cúp nhỏ'},
    {id:'bs3',  slot:'bookshelf',       level:3, name:'Kệ đầy',         emoji:'🎖️', cost:40,  bg:'home',     desc:'Kệ đầy + huy chương vàng'},
    // pet
    {id:'pt1',  slot:'pet',             level:1, name:'Mèo trắng',      emoji:'🐱', cost:30,  bg:'home',     desc:'Mèo trắng ngủ góc bàn'},
    {id:'pt2',  slot:'pet',             level:2, name:'Chó vàng',        emoji:'🐶', cost:50,  bg:'home',     desc:'Chó vàng vẫy đuôi'},
    {id:'pt3',  slot:'pet',             level:3, name:'Thỏ xám',         emoji:'🐰', cost:80,  bg:'home',     desc:'Thỏ xám nhảy vui'},
    // floor-rug
    {id:'fr1',  slot:'floor-rug',       level:1, name:'Thảm tròn',      emoji:'🔴', cost:8,   bg:'home',     desc:'Thảm tròn xám dễ thương'},
    {id:'fr2',  slot:'floor-rug',       level:2, name:'Thảm gấu',       emoji:'🐻', cost:18,  bg:'home',     desc:'Thảm hình gấu dễ thương'},
    {id:'fr3',  slot:'floor-rug',       level:3, name:'Thảm bản đồ',    emoji:'🗺️', cost:35,  bg:'home',     desc:'Thảm bản đồ thế giới'},
    // water-cup
    {id:'wcu1', slot:'water-cup',       level:1, name:'Ly hình gấu',    emoji:'🐻', cost:4,   bg:'home',     desc:'Ly nhựa hình gấu'},
    {id:'wcu2', slot:'water-cup',       level:2, name:'Ly cốc sứ',      emoji:'🍵', cost:10,  bg:'home',     desc:'Ly cốc sứ có hoa'},
    {id:'wcu3', slot:'water-cup',       level:3, name:'Ly đổi màu',     emoji:'🌊', cost:20,  bg:'home',     desc:'Ly thủy tinh đổi màu'},
    // window-scene
    {id:'ws1',  slot:'window-scene',    level:1, name:'Cây + nắng',     emoji:'☀️', cost:8,   bg:'home',     desc:'Cây xanh và nắng ấm'},
    {id:'ws2',  slot:'window-scene',    level:2, name:'Cầu vồng',       emoji:'🌈', cost:18,  bg:'home',     desc:'Cầu vồng sau mưa'},
    {id:'ws3',  slot:'window-scene',    level:3, name:'Pháo hoa',       emoji:'🎆', cost:35,  bg:'home',     desc:'Pháo hoa sinh nhật'},
    // window-hang
    {id:'wh1',  slot:'window-hang',     level:1, name:'Chuông gió 3 que',emoji:'🎐',cost:6,   bg:'home',     desc:'Chuông gió nhỏ'},
    {id:'wh2',  slot:'window-hang',     level:2, name:'Chuông sao',     emoji:'⭐', cost:15,  bg:'home',     desc:'Chuông gió hình sao'},
    {id:'wh3',  slot:'window-hang',     level:3, name:'Mobile sao trăng',emoji:'🌙',cost:28,  bg:'home',     desc:'Mobile mặt trăng và sao'},
    // toy-basket
    {id:'tb1',  slot:'toy-basket',      level:1, name:'Khối xếp hình',  emoji:'🧩', cost:6,   bg:'home',     desc:'Vài khối xếp hình nhỏ'},
    {id:'tb2',  slot:'toy-basket',      level:2, name:'Hộp đồ chơi',    emoji:'🎁', cost:15,  bg:'home',     desc:'Hộp đồ chơi nhỏ'},
    {id:'tb3',  slot:'toy-basket',      level:3, name:'Tàu lửa gỗ',     emoji:'🚂', cost:30,  bg:'home',     desc:'Tàu lửa gỗ chạy vòng'},
    // backpack
    {id:'bk1',  slot:'backpack',        level:1, name:'Ba lô xanh',     emoji:'🎒', cost:8,   bg:'home',     desc:'Ba lô vải xanh'},
    {id:'bk2',  slot:'backpack',        level:2, name:'Ba lô thú',       emoji:'🐼', cost:20,  bg:'home',     desc:'Ba lô hình thú'},
    {id:'bk3',  slot:'backpack',        level:3, name:'Ba lô cầu vồng', emoji:'🌈', cost:40,  bg:'home',     desc:'Ba lô cầu vồng phát sáng'},
    // curtain
    {id:'ct1',  slot:'curtain',         level:1, name:'Rèm sọc',        emoji:'🪟', cost:8,   bg:'home',     desc:'Rèm sọc màu'},
    {id:'ct2',  slot:'curtain',         level:2, name:'Rèm hoa',        emoji:'🌸', cost:18,  bg:'home',     desc:'Rèm hoa nhỏ'},
    {id:'ct3',  slot:'curtain',         level:3, name:'Rèm ren thêu',   emoji:'💐', cost:35,  bg:'home',     desc:'Rèm ren thêu tay'},
    // chair
    {id:'ch1',  slot:'chair',           level:1, name:'Ghế đệm hồng',   emoji:'🪑', cost:10,  bg:'home',     desc:'Ghế có đệm hồng'},
    {id:'ch2',  slot:'chair',           level:2, name:'Ghế bóng hơi',   emoji:'💺', cost:22,  bg:'home',     desc:'Ghế bóng hơi xanh'},
    {id:'ch3',  slot:'chair',           level:3, name:'Ghế nhung tim',  emoji:'❤️', cost:40,  bg:'home',     desc:'Ghế nhung có khắc tên'},
    // whiteboard
    {id:'wb1',  slot:'whiteboard',      level:1, name:'Bảng nhỏ',       emoji:'📋', cost:6,   bg:'home',     desc:'Bảng trắng nhỏ'},
    {id:'wb2',  slot:'whiteboard',      level:2, name:'Bảng ghi chú',   emoji:'📝', cost:14,  bg:'home',     desc:'Bảng có ghi chú cute'},
    {id:'wb3',  slot:'whiteboard',      level:3, name:'Bảng VyVy vẽ',   emoji:'🎨', cost:28,  bg:'home',     desc:'Bảng có VyVy vẽ trên'},
    // subject-poster
    {id:'sp1',  slot:'subject-poster',  level:1, name:'Bảng cửu chương',emoji:'🔢', cost:5,   bg:'home',     desc:'Bảng cửu chương xinh'},
    {id:'sp2',  slot:'subject-poster',  level:2, name:'Bảng alphabet',  emoji:'🔤', cost:12,  bg:'home',     desc:'Bảng alphabet có hình'},
    {id:'sp3',  slot:'subject-poster',  level:3, name:'Bản đồ thế giới',emoji:'🌍', cost:25,  bg:'home',     desc:'Bản đồ thế giới mini'},

    // ── LEARN ────────────────────────────────────────────────
    {id:'lbm1', slot:'learn-bookmark',  level:1, name:'Bookmark sao',   emoji:'🔖', cost:4,   bg:'learn',    desc:'Đánh dấu sách hình sao'},
    {id:'lbm2', slot:'learn-bookmark',  level:2, name:'Bookmark tim',   emoji:'❤️', cost:10,  bg:'learn',    desc:'Đánh dấu sách hình tim'},
    {id:'lpn1', slot:'learn-pencil',    level:1, name:'Bút chì vàng',   emoji:'✏️', cost:4,   bg:'learn',    desc:'Bút chì vàng xinh'},
    {id:'lpn2', slot:'learn-pencil',    level:2, name:'Bút màu',        emoji:'🖊️', cost:10,  bg:'learn',    desc:'Bút màu lấp lánh'},
    {id:'llt1', slot:'learn-lamp',      level:1, name:'Đèn đọc sách',   emoji:'🔦', cost:8,   bg:'learn',    desc:'Đèn đọc sách ấm'},

    // ── PRACTICE ─────────────────────────────────────────────
    {id:'prn1', slot:'practice-notebook',level:1,name:'Vở ô vuông',     emoji:'📓', cost:5,   bg:'practice', desc:'Vở kẻ ô vuông'},
    {id:'prn2', slot:'practice-notebook',level:2,name:'Vở màu xanh',    emoji:'📘', cost:12,  bg:'practice', desc:'Vở màu xanh đẹp'},
    {id:'pre1', slot:'practice-eraser', level:1, name:'Tẩy hình thú',   emoji:'🐱', cost:4,   bg:'practice', desc:'Tẩy hình mèo'},
    {id:'pre2', slot:'practice-eraser', level:2, name:'Tẩy thơm',       emoji:'🍓', cost:8,   bg:'practice', desc:'Tẩy thơm hình dâu'},
    {id:'prs1', slot:'practice-sticker',level:1, name:'Sticker ⭐',     emoji:'⭐', cost:3,   bg:'practice', desc:'Nhãn sao vàng'},

    // ── GAMES ────────────────────────────────────────────────
    {id:'gbl1', slot:'games-board',     level:1, name:'Cờ vua mini',    emoji:'♟️', cost:10,  bg:'games',    desc:'Bàn cờ vua nhỏ'},
    {id:'gbl2', slot:'games-board',     level:2, name:'Cá ngựa',        emoji:'🎠', cost:20,  bg:'games',    desc:'Bộ cờ cá ngựa'},
    {id:'gpz1', slot:'games-puzzle',    level:1, name:'Puzzle 9 mảnh',  emoji:'🧩', cost:8,   bg:'games',    desc:'Xếp hình 9 mảnh'},
    {id:'gpz2', slot:'games-puzzle',    level:2, name:'Puzzle VyVy',    emoji:'🧸', cost:18,  bg:'games',    desc:'Xếp hình hình VyVy'},
    {id:'gcsh1',slot:'games-cushion',   level:1, name:'Gối tròn',       emoji:'🛋️', cost:8,   bg:'games',    desc:'Gối ngồi tròn'},

    // ── MUSIC ────────────────────────────────────────────────
    {id:'ms1',  slot:'music-instrument',level:1, name:'Sáo trúc',       emoji:'🎵', cost:10,  bg:'music',    desc:'Sáo trúc nhỏ'},
    {id:'ms2',  slot:'music-instrument',level:2, name:'Đàn organ mini', emoji:'🎹', cost:25,  bg:'music',    desc:'Đàn organ nhỏ'},
    {id:'ms3',  slot:'music-instrument',level:3, name:'Guitar xinh',    emoji:'🎸', cost:45,  bg:'music',    desc:'Đàn guitar acoustic'},
    {id:'msp1', slot:'music-speaker',   level:1, name:'Loa robot',      emoji:'🤖', cost:12,  bg:'music',    desc:'Loa hình robot'},
    {id:'mh1',  slot:'music-headphone', level:1, name:'Tai nghe hồng',  emoji:'🎧', cost:15,  bg:'music',    desc:'Tai nghe màu hồng'},

    // ── DRAWING ──────────────────────────────────────────────
    {id:'dre1', slot:'drawing-easel',   level:1, name:'Giá vẽ gỗ',      emoji:'🎨', cost:12,  bg:'drawing',  desc:'Giá vẽ gỗ nhỏ'},
    {id:'dre2', slot:'drawing-easel',   level:2, name:'Giá vẽ pro',     emoji:'🖼️', cost:28,  bg:'drawing',  desc:'Giá vẽ chuyên nghiệp'},
    {id:'drp1', slot:'drawing-paint',   level:1, name:'Màu nước',       emoji:'💧', cost:8,   bg:'drawing',  desc:'Hộp màu nước'},
    {id:'drp2', slot:'drawing-paint',   level:2, name:'Màu dầu',        emoji:'🎭', cost:20,  bg:'drawing',  desc:'Bộ màu dầu'},
    {id:'drb1', slot:'drawing-brush',   level:1, name:'Cọ đơn',         emoji:'🖌️', cost:5,   bg:'drawing',  desc:'Cọ vẽ nhỏ'},

    // ── READING ──────────────────────────────────────────────
    {id:'rdl1', slot:'reading-lamp',    level:1, name:'Đèn đọc sách',   emoji:'🕯️', cost:8,   bg:'reading',  desc:'Đèn đọc ấm áp'},
    {id:'rdl2', slot:'reading-lamp',    level:2, name:'Đèn mặt trăng',  emoji:'🌙', cost:20,  bg:'reading',  desc:'Đèn hình mặt trăng'},
    {id:'rdp1', slot:'reading-pillow',  level:1, name:'Gối ôm thú',     emoji:'🧸', cost:10,  bg:'reading',  desc:'Gối ôm hình gấu bông'},
    {id:'rdm1', slot:'reading-mobile',  level:1, name:'Mobile sao trăng',emoji:'✨',cost:15,  bg:'reading',  desc:'Mobile mặt trăng sao'},
    {id:'rdc1', slot:'reading-constellation',level:1,name:'Bầu trời sao',emoji:'🌟',cost:20, bg:'reading',  desc:'Poster bầu trời sao đêm'},

    // ── VYVY OUTFITS ─────────────────────────────────────────
    {id:'ot-detective', slot:'vyvy-outfit', level:0, name:'Thám tử',       emoji:'🕵️', cost:20,  bg:'all', desc:'Áo khoác thám tử'},
    {id:'ot-astronaut', slot:'vyvy-outfit', level:0, name:'Phi hành gia',  emoji:'👨‍🚀',cost:50,  bg:'all', desc:'Bộ đồ phi hành gia'},
    {id:'ot-wizard',    slot:'vyvy-outfit', level:0, name:'Pháp sư sách',  emoji:'🧙', cost:80,  bg:'all', desc:'Áo choàng tím sách ma thuật'},
    {id:'ot-superhero', slot:'vyvy-outfit', level:0, name:'Siêu anh hùng', emoji:'🦸', cost:120, bg:'all', desc:'Cape bay, badge ngực'},
    {id:'ot-gold',      slot:'vyvy-outfit', level:0, name:'VyVy Vàng',     emoji:'⭐', cost:200, bg:'all', desc:'Toàn thân vàng ánh kim'},
  ];

  var DECOR_ASSET_BASE = '/static/assets/decor/';
  var DECOR_SLOT_ASSETS = {
    'wall-poster': 'deco_frame.webp',
    'wall-clock': 'deco_cloud_light.webp',
    'desk-lamp': 'deco_desk_lamp.webp',
    'pencil-box': 'deco_pencil_cup.webp',
    'desk-plant': 'deco_plant.webp',
    'bookshelf': 'deco_shelf.webp',
    'pet': 'deco_teddy.webp',
    'floor-rug': 'deco_rug.webp',
    'water-cup': 'deco_pencil_cup.webp',
    'toy-basket': 'deco_ball.webp',
    'backpack': 'deco_backpack.webp',
    'learn-lamp': 'deco_star_lamp.webp',
    'practice-notebook': 'deco_drawer.webp',
    'practice-eraser': 'deco_pencil_cup.webp',
    'practice-sticker': 'deco_star_lamp.webp',
    'games-board': 'deco_ball.webp',
    'games-puzzle': 'deco_ball.webp',
    'games-cushion': 'deco_rug.webp',
    'music-speaker': 'deco_cloud_light.webp',
    'drawing-paint': 'deco_pencil_cup.webp',
    'reading-lamp': 'deco_star_lamp.webp',
    'reading-pillow': 'deco_teddy.webp'
  };

  DECOR_ITEMS.forEach(function (item) {
    var asset = DECOR_SLOT_ASSETS[item.slot];
    if (asset) item.asset = DECOR_ASSET_BASE + asset;
  });

  /* =========================================================
     VYVY LEVELS
  ========================================================= */
  var VYVY_LEVELS = [
    {level:1, name:'Tập sự',     minStars:0,   badge:'🌱', glow:'pink'},
    {level:2, name:'Năng động',  minStars:30,  badge:'⚡', glow:'orange'},
    {level:3, name:'Thông minh', minStars:80,  badge:'📚', glow:'blue'},
    {level:4, name:'Xuất sắc',   minStars:150, badge:'🏆', glow:'gold'},
    {level:5, name:'Siêu sao',   minStars:250, badge:'⭐', glow:'rainbow'},
    {level:6, name:'Huyền Thoại',minStars:400, badge:'💫', glow:'legendary'},
  ];

  /* =========================================================
     INJECTED STYLES — fully responsive with clamp / vmin / vw
  ========================================================= */
  (function injectStyles() {
    var style = document.createElement('style');
    style.id = 'decor-styles';
    style.textContent = [
      /* ── decor layer ─────────────────────────────────────── */
      '#study-decor-layer{',
      '  position:fixed;inset:0;pointer-events:none;z-index:1;',
      '  overflow:hidden;',
      '}',
      '.decor-slot{',
      '  position:absolute;',
      '  display:flex;align-items:center;justify-content:center;',
      '  font-size:clamp(20px,4vmin,52px);',
      '  transition:transform .35s cubic-bezier(.34,1.56,.64,1), opacity .3s;',
      '  pointer-events:none;',
      '  user-select:none;',
      '}',
      '.decor-slot img{',
      '  width:clamp(42px,8vmin,92px);height:auto;max-width:16vw;max-height:16vh;',
      '  object-fit:contain;display:block;filter:drop-shadow(0 6px 14px rgba(80,54,28,.18));',
      '}',
      '.decor-slot.just-added{',
      '  animation:decorPop .6s cubic-bezier(.34,1.56,.64,1) both;',
      '}',
      '@keyframes decorPop{',
      '  0%{transform:scale(0) rotate(-20deg);opacity:0}',
      '  70%{transform:scale(1.25) rotate(4deg);opacity:1}',
      '  100%{transform:scale(1) rotate(0deg);opacity:1}',
      '}',

      /* slot positions (percentage-based so they scale) */
      '[data-slot="wall-poster"]  {top:8%; left:12%;}',
      '[data-slot="wall-clock"]   {top:8%; left:72%;}',
      '[data-slot="desk-lamp"]    {top:55%;left:70%;}',
      '[data-slot="pencil-box"]   {top:65%;left:55%;}',
      '[data-slot="desk-plant"]   {top:60%;left:80%;}',
      '[data-slot="bookshelf"]    {top:20%;left:5%;}',
      '[data-slot="pet"]          {top:75%;left:15%;}',
      '[data-slot="floor-rug"]    {top:82%;left:40%;}',
      '[data-slot="water-cup"]    {top:62%;left:45%;}',
      '[data-slot="window-scene"] {top:10%;left:40%;}',
      '[data-slot="window-hang"]  {top:18%;left:52%;}',
      '[data-slot="toy-basket"]   {top:80%;left:65%;}',
      '[data-slot="backpack"]     {top:70%;left:5%;}',
      '[data-slot="curtain"]      {top:5%; left:60%;}',
      '[data-slot="chair"]        {top:65%;left:30%;}',
      '[data-slot="whiteboard"]   {top:22%;left:22%;}',
      '[data-slot="subject-poster"]{top:6%;left:82%;}',
      '[data-slot="learn-bookmark"]{top:30%;left:6%;}',
      '[data-slot="learn-pencil"] {top:70%;left:8%;}',
      '[data-slot="learn-lamp"]   {top:55%;left:88%;}',
      '[data-slot="practice-notebook"]{top:35%;left:75%;}',
      '[data-slot="practice-eraser"]{top:68%;left:78%;}',
      '[data-slot="practice-sticker"]{top:20%;left:88%;}',
      '[data-slot="games-board"]  {top:40%;left:10%;}',
      '[data-slot="games-puzzle"] {top:55%;left:25%;}',
      '[data-slot="games-cushion"]{top:78%;left:50%;}',
      '[data-slot="music-instrument"]{top:50%;left:5%;}',
      '[data-slot="music-speaker"]{top:30%;left:85%;}',
      '[data-slot="music-headphone"]{top:15%;left:78%;}',
      '[data-slot="drawing-easel"]{top:25%;left:60%;}',
      '[data-slot="drawing-paint"]{top:65%;left:62%;}',
      '[data-slot="drawing-brush"]{top:75%;left:72%;}',
      '[data-slot="reading-lamp"] {top:20%;left:7%;}',
      '[data-slot="reading-pillow"]{top:72%;left:30%;}',
      '[data-slot="reading-mobile"]{top:8%; left:55%;}',
      '[data-slot="reading-constellation"]{top:5%;left:30%;}',

      /* ── star burst fx ─────────────────────────────────────── */
      '.star-burst-fx{',
      '  position:fixed;pointer-events:none;z-index:9999;',
      '  font-size:clamp(18px,4vw,36px);',
      '  animation:starBurstAnim .9s ease-out forwards;',
      '}',
      '@keyframes starBurstAnim{',
      '  0%  {opacity:1;transform:scale(0.5) translateY(0);}',
      '  60% {opacity:1;transform:scale(1.4) translateY(-40px);}',
      '  100%{opacity:0;transform:scale(0.8) translateY(-90px);}',
      '}',

      /* ── shop panel ─────────────────────────────────────── */
      '#decor-shop-panel{',
      '  position:fixed;inset:0;z-index:8000;',
      '  display:none;flex-direction:column;',
      '  background:rgba(0,0,0,.55);backdrop-filter:blur(6px);',
      '  align-items:center;justify-content:flex-end;',
      '}',
      '#decor-shop-panel.open{display:flex;}',
      '#decor-shop-inner{',
      '  width:min(100%,680px);',
      '  max-height:80vh;',
      '  background:#FFF8EC;',
      '  border-radius:clamp(16px,3vw,32px) clamp(16px,3vw,32px) 0 0;',
      '  padding:clamp(12px,3vw,24px);',
      '  padding-bottom:calc(clamp(12px,3vw,24px) + env(safe-area-inset-bottom, 0px));',
      '  overflow-y:auto;',
      '  box-shadow:0 -4px 32px rgba(0,0,0,.18);',
      '}',
      '#decor-shop-header{',
      '  display:flex;align-items:center;justify-content:space-between;',
      '  margin-bottom:clamp(8px,2vw,16px);',
      '}',
      '#decor-shop-title{',
      '  font-size:clamp(16px,3.5vw,26px);',
      '  font-weight:700;color:#263238;',
      '}',
      '#decor-shop-stars-display{',
      '  font-size:clamp(14px,3vw,20px);',
      '  background:#FFE082;border-radius:clamp(8px,2vw,16px);',
      '  padding:clamp(4px,1vw,8px) clamp(10px,2vw,18px);',
      '  font-weight:700;',
      '}',
      '#decor-shop-close{',
      '  width:clamp(44px,8vw,52px);height:clamp(44px,8vw,52px);',
      '  border:none;border-radius:50%;',
      '  background:#FF8FAB;color:#fff;',
      '  font-size:clamp(16px,3vw,22px);cursor:pointer;',
      '  display:flex;align-items:center;justify-content:center;',
      '}',
      '#decor-shop-tabs{',
      '  display:flex;gap:clamp(4px,1vw,10px);flex-wrap:wrap;',
      '  margin-bottom:clamp(8px,2vw,14px);',
      '}',
      '.decor-tab-btn{',
      '  min-height:44px;',
      '  padding:clamp(4px,1.2vw,8px) clamp(10px,2.5vw,18px);',
      '  border:2px solid #C9A0FF;border-radius:clamp(8px,2vw,20px);',
      '  background:#fff;color:#263238;cursor:pointer;',
      '  font-size:clamp(11px,2.2vw,15px);font-weight:600;',
      '  display:inline-flex;align-items:center;justify-content:center;',
      '  transition:background .2s,color .2s;',
      '}',
      '.decor-tab-btn.active{background:#C9A0FF;color:#fff;}',
      '#decor-shop-grid{',
      '  display:grid;',
      '  grid-template-columns:repeat(auto-fill,minmax(clamp(90px,18vw,130px),1fr));',
      '  gap:clamp(8px,2vw,16px);',
      '}',
      '.shop-item-card{',
      '  background:#fff;border-radius:clamp(10px,2vw,18px);',
      '  padding:clamp(8px,2vw,14px);',
      '  display:flex;flex-direction:column;align-items:center;gap:clamp(4px,1vw,8px);',
      '  box-shadow:0 2px 8px rgba(0,0,0,.08);',
      '  border:2px solid transparent;',
      '  transition:transform .2s,border-color .2s,box-shadow .2s;',
      '  cursor:pointer;position:relative;',
      '}',
      '.shop-item-card:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.14);}',
      '.shop-item-card.owned{border-color:#A5D6A7;background:#F1FAF1;}',
      '.shop-item-card.placed{border-color:#90CAF9;background:#EAF4FE;}',
      '.shop-item-card .item-emoji{font-size:clamp(24px,6vmin,48px);}',
      '.shop-item-card .item-asset{width:clamp(48px,11vmin,86px);height:clamp(48px,11vmin,86px);object-fit:contain;display:block;}',
      '.shop-item-card .item-name{font-size:clamp(10px,2vw,13px);font-weight:600;text-align:center;color:#263238;}',
      '.shop-item-card .item-cost{',
      '  font-size:clamp(11px,2.2vw,14px);font-weight:700;color:#FF8FAB;',
      '  background:#FFF0F4;border-radius:clamp(6px,1.5vw,12px);',
      '  padding:clamp(2px,.8vw,5px) clamp(6px,1.5vw,12px);',
      '}',
      '.shop-item-card .item-badge{',
      '  position:absolute;top:clamp(4px,1vw,8px);right:clamp(4px,1vw,8px);',
      '  font-size:clamp(10px,2vw,13px);',
      '}',
      '.shop-item-card .item-desc{',
      '  font-size:clamp(9px,1.8vw,12px);color:#666;text-align:center;',
      '}',
      '.shop-item-card .buy-btn{',
      '  min-height:44px;',
      '  padding:clamp(4px,1vw,8px) clamp(10px,2.5vw,18px);',
      '  border:none;border-radius:clamp(8px,2vw,16px);',
      '  background:#FF8FAB;color:#fff;cursor:pointer;',
      '  font-size:clamp(11px,2.2vw,14px);font-weight:700;',
      '  width:100%;transition:background .2s,transform .15s;',
      '}',
      '.shop-item-card .buy-btn:hover{background:#e0607c;transform:scale(1.04);}',
      '.shop-item-card .buy-btn.owned-btn{background:#A5D6A7;cursor:default;}',
      '.shop-item-card .buy-btn.placed-btn{background:#90CAF9;cursor:default;}',

      /* ── level-up overlay ─────────────────────────────────── */
      '#level-up-overlay{',
      '  position:fixed;inset:0;z-index:9500;',
      '  display:none;flex-direction:column;',
      '  align-items:center;justify-content:center;',
      '  background:rgba(0,0,0,.6);backdrop-filter:blur(8px);',
      '}',
      '#level-up-overlay.show{display:flex;}',
      '#level-up-card{',
      '  background:#FFF8EC;',
      '  border-radius:clamp(18px,4vw,36px);',
      '  padding:clamp(24px,5vw,48px) clamp(20px,6vw,56px);',
      '  text-align:center;',
      '  animation:levelUpBounce .7s cubic-bezier(.34,1.56,.64,1) both;',
      '  box-shadow:0 8px 48px rgba(201,160,255,.5);',
      '  max-width:min(90vw,420px);',
      '}',
      '@keyframes levelUpBounce{',
      '  0%{transform:scale(.4) rotate(-8deg);opacity:0}',
      '  70%{transform:scale(1.12) rotate(2deg);opacity:1}',
      '  100%{transform:scale(1) rotate(0deg);opacity:1}',
      '}',
      '#level-up-card .lu-badge{font-size:clamp(40px,12vmin,80px);}',
      '#level-up-card .lu-title{',
      '  font-size:clamp(20px,5vw,34px);font-weight:800;color:#C9A0FF;',
      '  margin:clamp(8px,2vw,16px) 0 clamp(4px,1vw,10px);',
      '}',
      '#level-up-card .lu-name{',
      '  font-size:clamp(14px,3vw,22px);font-weight:700;color:#FF8FAB;',
      '}',
      '#level-up-card .lu-close{',
      '  margin-top:clamp(16px,3vw,28px);',
      '  min-height:clamp(44px,8vw,56px);',
      '  padding:0 clamp(24px,5vw,40px);',
      '  border:none;border-radius:clamp(12px,3vw,24px);',
      '  background:#C9A0FF;color:#fff;cursor:pointer;',
      '  font-size:clamp(14px,3vw,20px);font-weight:700;',
      '  transition:background .2s;',
      '}',
      '#level-up-card .lu-close:hover{background:#a87ee0;}',

      /* ── star display widget ─────────────────────────────── */
      '.star-count-display{',
      '  display:inline-flex;align-items:center;gap:clamp(3px,1vw,6px);',
      '  font-size:clamp(13px,2.8vw,18px);font-weight:700;color:#263238;',
      '}',
      '.star-count-display .star-icon{font-size:clamp(14px,3vw,20px);}',

      /* ── toast notification ───────────────────────────────── */
      '#decor-toast-container{',
      '  position:fixed;bottom:clamp(16px,4vw,32px);left:50%;',
      '  transform:translateX(-50%);',
      '  z-index:9800;display:flex;flex-direction:column;',
      '  align-items:center;gap:clamp(6px,1.5vw,12px);',
      '  pointer-events:none;',
      '}',
      '.decor-toast{',
      '  padding:clamp(10px,2vw,16px) clamp(18px,4vw,32px);',
      '  border-radius:clamp(10px,2.5vw,20px);',
      '  font-size:clamp(13px,2.8vw,18px);font-weight:600;',
      '  color:#fff;box-shadow:0 4px 20px rgba(0,0,0,.2);',
      '  animation:toastIn .4s cubic-bezier(.34,1.56,.64,1) both;',
      '  max-width:min(90vw,460px);text-align:center;',
      '}',
      '.decor-toast.success{background:#A5D6A7;}',
      '.decor-toast.warning{background:#FF8FAB;}',
      '.decor-toast.info   {background:#90CAF9;}',
      '@keyframes toastIn{',
      '  from{opacity:0;transform:translateY(24px) scale(.92)}',
      '  to  {opacity:1;transform:translateY(0) scale(1)}',
      '}',
      '@keyframes toastOut{',
      '  from{opacity:1;transform:translateY(0) scale(1)}',
      '  to  {opacity:0;transform:translateY(-16px) scale(.92)}',
      '}',

      /* ── exercise result indicator ───────────────────────── */
      '.exercise-result-fx{',
      '  position:fixed;top:50%;left:50%;',
      '  transform:translate(-50%,-50%);',
      '  font-size:clamp(40px,12vmin,96px);',
      '  pointer-events:none;z-index:9600;',
      '  animation:exResultAnim .8s ease-out forwards;',
      '}',
      '@keyframes exResultAnim{',
      '  0%  {opacity:1;transform:translate(-50%,-50%) scale(.5)}',
      '  40% {opacity:1;transform:translate(-50%,-50%) scale(1.3)}',
      '  100%{opacity:0;transform:translate(-50%,-50%) scale(.9)}',
      '}',

      /* ── vyvy avatar glow ─────────────────────────────────── */
      '[data-level="1"] #vyvy-avatar-img{filter:drop-shadow(0 0 6px #FF8FAB);}',
      '[data-level="2"] #vyvy-avatar-img{filter:drop-shadow(0 0 8px orange);}',
      '[data-level="3"] #vyvy-avatar-img{filter:drop-shadow(0 0 10px #90CAF9);}',
      '[data-level="4"] #vyvy-avatar-img{filter:drop-shadow(0 0 14px gold);}',
      '[data-level="5"] #vyvy-avatar-img{filter:drop-shadow(0 0 18px #C9A0FF) drop-shadow(0 0 6px gold);}',
      '[data-level="6"] #vyvy-avatar-img{filter:drop-shadow(0 0 22px #FFE082) drop-shadow(0 0 12px #C9A0FF) drop-shadow(0 0 4px cyan);}',

      /* ── bg themes ───────────────────────────────────────── */
      '#app[data-bg="home"]    {--bg-accent:#FFF8EC;}',
      '#app[data-bg="learn"]   {--bg-accent:#EAF4FE;}',
      '#app[data-bg="practice"]{--bg-accent:#F1FAF1;}',
      '#app[data-bg="games"]   {--bg-accent:#FFF0F4;}',
      '#app[data-bg="music"]   {--bg-accent:#F3ECFF;}',
      '#app[data-bg="drawing"] {--bg-accent:#FFFDE7;}',
      '#app[data-bg="reading"] {--bg-accent:#E8EAF6;}',

      /* progress bar for exercise streak */
      '#streak-bar-wrap{',
      '  display:flex;align-items:center;gap:clamp(6px,1.5vw,12px);',
      '  margin:clamp(6px,1.5vw,10px) 0;',
      '}',
      '#streak-bar{',
      '  flex:1;height:clamp(6px,1.5vw,12px);',
      '  background:#eee;border-radius:999px;overflow:hidden;',
      '}',
      '#streak-bar-fill{',
      '  height:100%;background:linear-gradient(90deg,#FF8FAB,#C9A0FF);',
      '  border-radius:999px;transition:width .4s ease;',
      '}',
      '#streak-label{font-size:clamp(11px,2.2vw,15px);font-weight:700;color:#FF8FAB;}',
    ].join('\n');
    document.head.appendChild(style);
  })();

  /* =========================================================
     DOM HELPERS
  ========================================================= */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsAll(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'cls') { e.className = attrs[k]; }
        else if (k === 'html') { e.innerHTML = attrs[k]; }
        else if (k === 'text') { e.textContent = attrs[k]; }
        else { e.setAttribute(k, attrs[k]); }
      });
    }
    if (children) {
      children.forEach(function (c) { if (c) e.appendChild(c); });
    }
    return e;
  }

  function createDecorVisual(item, className) {
    if (item && item.asset) {
      return el('img', {
        cls: className || 'decor-asset',
        src: item.asset,
        alt: item.name || '',
        loading: 'lazy',
        decoding: 'async'
      });
    }
    return el('span', {cls: className || 'item-emoji', text: item && item.emoji ? item.emoji : ''});
  }

  /* =========================================================
     STAR SYSTEM
  ========================================================= */
  function getStars() {
    return parseInt(localStorage.getItem(window.DECOR_SK.STARS) || '0', 10) || 0;
  }

  function addStars(n) {
    var s = getStars() + n;
    localStorage.setItem(window.DECOR_SK.STARS, String(s));
    updateStarDisplay();
    checkLevelUp();
    spawnStarBurst(n);
  }

  function spendStars(n) {
    var s = getStars();
    if (s < n) return false;
    localStorage.setItem(window.DECOR_SK.STARS, String(s - n));
    updateStarDisplay();
    return true;
  }

  function updateStarDisplay() {
    var stars = getStars();
    var level = getVyvyLevel();
    var lvData = VYVY_LEVELS[level - 1] || VYVY_LEVELS[0];
    var next = VYVY_LEVELS[level] || null;

    // Update all .star-count-display elements
    qsAll('.star-count-display, #star-count, #stars-display, [data-star-count]').forEach(function (el) {
      el.textContent = String(stars);
    });

    // Update shop star display if open
    var shopStars = qs('#decor-shop-stars-display');
    if (shopStars) shopStars.textContent = '⭐ ' + stars;

    // Update streak bar if present
    updateStreakBar();

    // Update level badge elements
    qsAll('[data-level-badge]').forEach(function (el) {
      el.textContent = lvData.badge + ' ' + lvData.name;
    });

    // Update next-level progress if element exists
    var prog = qs('#level-progress-bar-fill');
    if (prog && next) {
      var range = next.minStars - lvData.minStars;
      var progress = Math.min(100, Math.max(0, Math.round((stars - lvData.minStars) / range * 100)));
      prog.style.width = progress + '%';
    }
  }

  function spawnStarBurst(n) {
    var count = Math.min(n, 8);
    for (var i = 0; i < count; i++) {
      (function (delay) {
        setTimeout(function () {
          var fx = document.createElement('div');
          fx.className = 'star-burst-fx';
          fx.textContent = '⭐';
          fx.style.left = (20 + Math.random() * 60) + 'vw';
          fx.style.top  = (30 + Math.random() * 40) + 'vh';
          document.body.appendChild(fx);
          setTimeout(function () { fx.parentNode && fx.parentNode.removeChild(fx); }, 950);
        }, delay);
      })(i * 80);
    }
  }

  function updateStreakBar() {
    var stats = getExerciseStats();
    var streakBar = qs('#streak-bar-fill');
    var streakLabel = qs('#streak-label');
    if (streakBar) {
      var pct = Math.min(100, (stats.streak / 5) * 100);
      streakBar.style.width = pct + '%';
    }
    if (streakLabel) {
      streakLabel.textContent = '🔥 ' + stats.streak;
    }
  }

  /* =========================================================
     BACKGROUND SWITCHING
  ========================================================= */
  function setBg(bgName) {
    var app = document.getElementById('app');
    if (app) app.setAttribute('data-bg', bgName);
    localStorage.setItem('vyvy_current_bg', bgName);
    updateDecorLayer(bgName);
  }

  /* =========================================================
     DECOR LAYER
  ========================================================= */
  function initDecorLayer() {
    if (!qs('#study-decor-layer')) {
      var layer = document.createElement('div');
      layer.id = 'study-decor-layer';
      document.body.appendChild(layer);
    }
    buildDecorLayer();
  }

  function buildDecorLayer() {
    var layer = qs('#study-decor-layer');
    if (!layer) return;
    // Remove existing slot nodes (keep fresh)
    layer.innerHTML = '';
    // Build a slot node for every unique slot in DECOR_ITEMS
    var slots = {};
    DECOR_ITEMS.forEach(function (item) {
      if (!slots[item.slot]) slots[item.slot] = true;
    });
    Object.keys(slots).forEach(function (slotName) {
      var node = document.createElement('div');
      node.className = 'decor-slot';
      node.setAttribute('data-slot', slotName);
      node.setAttribute('aria-hidden', 'true');
      layer.appendChild(node);
    });
  }

  function updateDecorLayer(bgName) {
    var layer = qs('#study-decor-layer');
    if (!layer) return;
    var placed = getPlacedDecor();
    var owned  = getOwnedDecor();
    qsAll('.decor-slot', layer).forEach(function (node) {
      var slotName = node.getAttribute('data-slot');
      var entry = placed[slotName];
      if (!entry) {
        node.innerHTML = '';
        node.style.display = 'none';
        return;
      }
      // Check if item bg matches current bg (or is 'all')
      var item = DECOR_ITEMS.filter(function (i) { return i.id === entry.id; })[0];
      if (!item) { node.style.display = 'none'; return; }
      var visible = (item.bg === bgName || item.bg === 'all' || item.slot === 'vyvy-outfit');
      if (!visible) { node.style.display = 'none'; return; }
      node.innerHTML = '';
      node.appendChild(createDecorVisual({
        asset: entry.asset || item.asset,
        emoji: entry.emoji || item.emoji,
        name: item.name
      }, item.asset || entry.asset ? 'decor-slot-asset' : 'decor-slot-emoji'));
      node.style.display = 'flex';
    });
  }

  function showDecorAnimation(slot, emoji) {
    var layer = qs('#study-decor-layer');
    if (!layer) return;
    var node = qs('[data-slot="' + slot + '"]', layer);
    if (!node) return;
    node.classList.remove('just-added');
    // Force reflow
    void node.offsetWidth;
    node.classList.add('just-added');
    setTimeout(function () { node.classList.remove('just-added'); }, 700);
  }

  /* =========================================================
     OWNED / PLACED PERSISTENCE
  ========================================================= */
  function getOwnedDecor() {
    try { return JSON.parse(localStorage.getItem(window.DECOR_SK.DECOR_OWNED) || '[]'); }
    catch (e) { return []; }
  }

  function getPlacedDecor() {
    try { return JSON.parse(localStorage.getItem(window.DECOR_SK.DECOR_PLACED) || '{}'); }
    catch (e) { return {}; }
  }

  function placeItem(itemId) {
    var item = DECOR_ITEMS.filter(function (i) { return i.id === itemId; })[0];
    if (!item) return;
    var placed = getPlacedDecor();
    placed[item.slot] = {id: itemId, level: item.level, asset: item.asset || '', emoji: item.emoji};
    localStorage.setItem(window.DECOR_SK.DECOR_PLACED, JSON.stringify(placed));
    var currentBg = (document.getElementById('app') || {}).getAttribute ?
      (document.getElementById('app').getAttribute('data-bg') || 'home') : 'home';
    updateDecorLayer(currentBg);
    showDecorAnimation(item.slot, item.emoji);
  }

  function removeItem(itemId) {
    var item = DECOR_ITEMS.filter(function (i) { return i.id === itemId; })[0];
    if (!item) return;
    var placed = getPlacedDecor();
    if (placed[item.slot] && placed[item.slot].id === itemId) {
      delete placed[item.slot];
      localStorage.setItem(window.DECOR_SK.DECOR_PLACED, JSON.stringify(placed));
      var currentBg = (document.getElementById('app') || {}).getAttribute ?
        (document.getElementById('app').getAttribute('data-bg') || 'home') : 'home';
      updateDecorLayer(currentBg);
    }
  }

  /* =========================================================
     BUY ITEM
  ========================================================= */
  function buyItem(itemId) {
    var item = DECOR_ITEMS.filter(function (i) { return i.id === itemId; })[0];
    if (!item) return;
    var owned = getOwnedDecor();
    if (owned.indexOf(itemId) !== -1) {
      // Already owned — just place it
      placeItem(itemId);
      renderShop(currentShopBg);
      showToast('Đã trang trí ' + item.emoji + ' ' + item.name + '!', 'info');
      return;
    }
    if (!spendStars(item.cost)) {
      showToast('Không đủ sao! Học thêm để kiếm sao nhé! ⭐', 'warning');
      return;
    }
    owned.push(itemId);
    localStorage.setItem(window.DECOR_SK.DECOR_OWNED, JSON.stringify(owned));
    placeItem(itemId);
    renderShop(currentShopBg);
    showToast('Đã thêm ' + item.name + ' vào góc học tập! 🎉', 'success');
  }

  /* =========================================================
     SHOP UI
  ========================================================= */
  var currentShopBg = 'home';

  var SHOP_TABS = [
    {key:'home',     label:'🏠 Phòng'},
    {key:'learn',    label:'📖 Học'},
    {key:'practice', label:'✏️ Luyện'},
    {key:'games',    label:'🎮 Chơi'},
    {key:'music',    label:'🎵 Nhạc'},
    {key:'drawing',  label:'🎨 Vẽ'},
    {key:'reading',  label:'📚 Đọc'},
    {key:'all',      label:'🦸 Outfit'},
  ];

  function ensureDecorShellBindings() {
    var panel = qs('#decor-shop-panel');
    if (!panel || panel.dataset.decorBound === '1') return;
    panel.dataset.decorBound = '1';

    var closeBtn = qs('#decor-shop-close');
    if (closeBtn) closeBtn.addEventListener('click', closeDecorShop);

    qsAll('.decor-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tabKey = btn.getAttribute('data-bg') || btn.getAttribute('data-tab') || 'home';
        currentShopBg = tabKey;
        setDecorActiveTab(tabKey);
        renderShop(tabKey);
      });
    });

    panel.addEventListener('click', function (e) {
      if (e.target === panel) closeDecorShop();
    });

    if (!qs('#decor-toast-container')) {
      document.body.appendChild(el('div', {id:'decor-toast-container'}));
    }
  }

  function setDecorActiveTab(tabKey) {
    qsAll('.decor-tab-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabKey);
    });
    qsAll('.decor-tab').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-bg') === tabKey || b.getAttribute('data-tab') === tabKey);
    });
  }

  function updateDecorShopStars() {
    var value = getStars();
    var shopStars = qs('#decor-shop-stars-display');
    if (shopStars) shopStars.textContent = '\u2b50 ' + value;
    var staticStars = qs('#decor-shop-star-count');
    if (staticStars) staticStars.textContent = String(value);
  }

  function buildShopDOM() {
    if (qs('#decor-shop-panel')) {
      ensureDecorShellBindings();
      return;
    }

    var panel = el('div', {id:'decor-shop-panel'});
    var inner = el('div', {id:'decor-shop-inner'});

    // Header
    var header = el('div', {id:'decor-shop-header'}, [
      el('span', {id:'decor-shop-title', text:'🛍️ Cửa hàng trang trí'}),
      el('span', {id:'decor-shop-stars-display', text:'⭐ 0'}),
      el('button', {id:'decor-shop-close', 'aria-label':'Đóng', text:'✕'}),
    ]);

    // Tabs
    var tabsDiv = el('div', {id:'decor-shop-tabs'});
    SHOP_TABS.forEach(function (tab) {
      var btn = el('button', {cls:'decor-tab-btn', 'data-tab':tab.key, text:tab.label});
      btn.addEventListener('click', function () {
        currentShopBg = tab.key;
        setDecorActiveTab(tab.key);
        renderShop(tab.key);
      });
      tabsDiv.appendChild(btn);
    });

    var grid = el('div', {id:'decor-shop-grid'});

    inner.appendChild(header);
    inner.appendChild(tabsDiv);
    inner.appendChild(grid);
    panel.appendChild(inner);
    document.body.appendChild(panel);

    // Close button
    qs('#decor-shop-close').addEventListener('click', closeDecorShop);

    // Click outside closes
    panel.addEventListener('click', function (e) {
      if (e.target === panel) closeDecorShop();
    });

    // Inject toast container if not present
    if (!qs('#decor-toast-container')) {
      document.body.appendChild(el('div', {id:'decor-toast-container'}));
    }
  }

  function openDecorShop() {
    buildShopDOM();
    var panel = qs('#decor-shop-panel');
    if (panel) panel.classList.add('open');
    var overlay = qs('#decor-shop-overlay');
    if (overlay) overlay.classList.remove('hidden');
    // Set active tab to current bg
    var app = document.getElementById('app');
    if (app) app.classList.add('decor-shop-open');
    var curBg = (app && app.getAttribute('data-bg')) || 'home';
    currentShopBg = curBg;
    qsAll('.decor-tab-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === curBg);
    });
    var shopStars = qs('#decor-shop-stars-display');
    if (shopStars) shopStars.textContent = '⭐ ' + getStars();
    setDecorActiveTab(curBg);
    updateDecorShopStars();
    renderShop(currentShopBg);
  }

  function closeDecorShop() {
    var panel = qs('#decor-shop-panel');
    if (panel) panel.classList.remove('open');
    var overlay = qs('#decor-shop-overlay');
    if (overlay) overlay.classList.add('hidden');
    var app = document.getElementById('app');
    if (app) app.classList.remove('decor-shop-open');
  }

  function renderShop(bgName) {
    var grid = qs('#decor-shop-grid');
    if (!grid) return;
    grid.innerHTML = '';

    var owned   = getOwnedDecor();
    var placed  = getPlacedDecor();
    var items   = DECOR_ITEMS.filter(function (i) { return i.bg === bgName; });

    if (items.length === 0) {
      grid.appendChild(el('p', {
        cls: 'shop-empty',
        text: 'Chưa có đồ cho khu vực này.',
        style: 'grid-column:1/-1;text-align:center;color:#999;font-size:clamp(13px,2.5vw,18px);padding:clamp(16px,4vw,32px) 0;'
      }));
      return;
    }

    items.forEach(function (item) {
      var isOwned  = owned.indexOf(item.id) !== -1;
      var isPlaced = placed[item.slot] && placed[item.slot].id === item.id;

      var card = el('div', {cls: 'shop-item-card' + (isPlaced ? ' placed' : isOwned ? ' owned' : '')});

      card.appendChild(createDecorVisual(item, item.asset ? 'item-asset' : 'item-emoji'));
      card.appendChild(el('span', {cls:'item-name',  text:item.name}));
      card.appendChild(el('span', {cls:'item-desc',  text:item.desc}));

      var costEl = el('span', {cls:'item-cost'});
      if (isOwned) {
        costEl.textContent = isPlaced ? 'Đã đặt ✓' : 'Đã có ✓';
      } else {
        costEl.textContent = '⭐ ' + item.cost;
      }
      card.appendChild(costEl);

      // Level badge
      if (item.level > 0) {
        card.appendChild(el('span', {cls:'item-badge', text:'Lv' + item.level}));
      }

      // Button
      var btn;
      if (isPlaced) {
        btn = el('button', {cls:'buy-btn placed-btn', text:'Đang dùng ✓'});
        btn.disabled = true;
      } else if (isOwned) {
        btn = el('button', {cls:'buy-btn owned-btn', text:'Trang trí lại'});
        btn.addEventListener('click', function () { placeItem(item.id); renderShop(currentShopBg); });
      } else {
        btn = el('button', {cls:'buy-btn', text:'Mua ' + item.cost + ' ⭐'});
        btn.addEventListener('click', function () { buyItem(item.id); });
      }
      card.appendChild(btn);
      grid.appendChild(card);
    });
  }

  /* =========================================================
     TOAST
  ========================================================= */
  function showToast(msg, type) {
    if (!qs('#decor-toast-container')) {
      document.body.appendChild(el('div', {id:'decor-toast-container'}));
    }
    var container = qs('#decor-toast-container');
    var toast = el('div', {cls:'decor-toast ' + (type || 'info'), text:msg});
    container.appendChild(toast);
    setTimeout(function () {
      toast.style.animation = 'toastOut .4s ease forwards';
      setTimeout(function () {
        toast.parentNode && toast.parentNode.removeChild(toast);
      }, 420);
    }, 2600);
  }

  /* =========================================================
     VYVY LEVEL SYSTEM
  ========================================================= */
  function getVyvyLevel() {
    return parseInt(localStorage.getItem(window.DECOR_SK.VYVY_LEVEL) || '1', 10) || 1;
  }

  function checkLevelUp() {
    var stars = getStars();
    var currentLv = getVyvyLevel();
    var newLv = 1;
    for (var i = VYVY_LEVELS.length - 1; i >= 0; i--) {
      if (stars >= VYVY_LEVELS[i].minStars) { newLv = VYVY_LEVELS[i].level; break; }
    }
    if (newLv > currentLv) {
      localStorage.setItem(window.DECOR_SK.VYVY_LEVEL, String(newLv));
      showLevelUp(newLv);
      updateVyvyAppearance(newLv);
    }
  }

  function updateVyvyAppearance(level) {
    var avatar = document.getElementById('vyvy-avatar');
    if (avatar) avatar.setAttribute('data-level', String(level));

    // Also update any level indicator elements
    var lvData = VYVY_LEVELS[level - 1] || VYVY_LEVELS[0];
    qsAll('[data-vyvy-level-name]').forEach(function (el) {
      el.textContent = lvData.badge + ' ' + lvData.name;
    });
    qsAll('[data-vyvy-level-num]').forEach(function (el) {
      el.textContent = String(level);
    });

    // Update outfit if one is equipped
    var outfit = localStorage.getItem(window.DECOR_SK.VYVY_OUTFIT);
    if (outfit) {
      var outfitItem = DECOR_ITEMS.filter(function (i) { return i.id === outfit; })[0];
      if (outfitItem) {
        qsAll('[data-vyvy-outfit]').forEach(function (el) {
          el.textContent = outfitItem.emoji;
        });
      }
    }
  }

  function showLevelUp(level) {
    var lvData = VYVY_LEVELS[level - 1] || VYVY_LEVELS[0];
    buildLevelUpOverlay();
    var overlay = qs('#level-up-overlay');
    if (!overlay) return;

    var badge = qs('#lu-badge', overlay);
    var title = qs('#lu-title', overlay);
    var name  = qs('#lu-name',  overlay);
    if (badge) badge.textContent = lvData.badge;
    if (title) title.textContent = 'Lên cấp ' + level + '! 🎉';
    if (name)  name.textContent  = lvData.name;

    overlay.classList.add('show');

    // Spawn star burst
    spawnStarBurst(10);
  }

  function buildLevelUpOverlay() {
    if (qs('#level-up-overlay')) return;
    var overlay = el('div', {id:'level-up-overlay'});
    var card = el('div', {id:'level-up-card'}, [
      el('div', {cls:'lu-badge', id:'lu-badge', text:'⭐'}),
      el('div', {cls:'lu-title', id:'lu-title', text:'Lên cấp!'}),
      el('div', {cls:'lu-name',  id:'lu-name',  text:''}),
      (function () {
        var btn = el('button', {cls:'lu-close', text:'Tiếp tục học thôi! 🚀'});
        btn.addEventListener('click', function () {
          overlay.classList.remove('show');
        });
        return btn;
      })(),
    ]);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.classList.remove('show');
    });
  }

  /* =========================================================
     EXERCISE STATS
  ========================================================= */
  function getExerciseStats() {
    try {
      return JSON.parse(
        localStorage.getItem(window.DECOR_SK.EXERCISE_STATS) ||
        '{"correct":0,"total":0,"streak":0}'
      );
    } catch (e) {
      return {correct: 0, total: 0, streak: 0};
    }
  }

  function recordExerciseResult(correct) {
    var stats = getExerciseStats();
    stats.total++;
    if (correct) {
      stats.correct++;
      stats.streak++;
      var starsEarned = stats.streak >= 5 ? 3 : stats.streak >= 3 ? 2 : 1;
      addStars(starsEarned);
      showExerciseFeedback(true, starsEarned);
    } else {
      stats.streak = 0;
      showExerciseFeedback(false, 0);
    }
    localStorage.setItem(window.DECOR_SK.EXERCISE_STATS, JSON.stringify(stats));
    updateStreakBar();
  }

  function showExerciseFeedback(correct, stars) {
    var fx = document.createElement('div');
    fx.className = 'exercise-result-fx';
    fx.textContent = correct ? (stars >= 3 ? '🌟' : stars >= 2 ? '⭐' : '✅') : '❌';
    document.body.appendChild(fx);
    setTimeout(function () { fx.parentNode && fx.parentNode.removeChild(fx); }, 850);
  }

  /* =========================================================
     MULTIPLE CHOICE EXERCISE BUTTONS
  ========================================================= */
  /**
   * Renders a multiple-choice exercise widget into a container element.
   * @param {HTMLElement} container  - target DOM node
   * @param {Object}      exercise   - {question, choices:[{id,text,correct}], onAnswer}
   */
  function renderMultipleChoice(container, exercise) {
    if (!container || !exercise) return;
    container.innerHTML = '';

    // Question
    var qEl = el('div', {
      cls:   'mc-question',
      html:  exercise.question,
      style: 'font-size:clamp(15px,3.2vw,22px);font-weight:700;color:#263238;margin-bottom:clamp(12px,3vw,20px);'
    });
    container.appendChild(qEl);

    var answeredFlag = false;
    var grid = el('div', {
      cls:   'mc-choices-grid',
      style: 'display:grid;grid-template-columns:1fr 1fr;gap:clamp(8px,2vw,14px);'
    });

    exercise.choices.forEach(function (choice) {
      var btn = el('button', {
        cls:   'mc-choice-btn',
        html:  choice.text,
        style: [
          'min-height:clamp(44px,8vw,60px);',
          'padding:clamp(8px,2vw,14px) clamp(10px,2.5vw,18px);',
          'border:2.5px solid #C9A0FF;',
          'border-radius:clamp(10px,2.5vw,18px);',
          'background:#fff;cursor:pointer;',
          'font-size:clamp(13px,2.8vw,18px);font-weight:600;',
          'transition:background .2s,border-color .2s,transform .15s;',
          'width:100%;text-align:left;',
        ].join('')
      });

      btn.addEventListener('click', function () {
        if (answeredFlag) return;
        answeredFlag = true;

        qsAll('.mc-choice-btn', container).forEach(function (b) {
          b.disabled = true;
        });

        if (choice.correct) {
          btn.style.background = '#A5D6A7';
          btn.style.borderColor = '#4CAF50';
        } else {
          btn.style.background = '#FFCDD2';
          btn.style.borderColor = '#F44336';
          // Highlight correct
          qsAll('.mc-choice-btn', container).forEach(function (b, idx) {
            if (exercise.choices[idx] && exercise.choices[idx].correct) {
              b.style.background = '#A5D6A7';
              b.style.borderColor = '#4CAF50';
            }
          });
        }

        recordExerciseResult(!!choice.correct);

        if (typeof exercise.onAnswer === 'function') {
          setTimeout(function () { exercise.onAnswer(!!choice.correct); }, 900);
        }
      });

      grid.appendChild(btn);
    });

    container.appendChild(grid);
  }

  /* =========================================================
     EXERCISE PROGRESS TRACKER
  ========================================================= */
  /**
   * Renders a progress tracker (list of exercise items with status).
   * @param {HTMLElement} container
   * @param {Array}       items  - [{id, label, done:bool, stars:N}]
   */
  function renderExerciseProgress(container, items) {
    if (!container) return;
    container.innerHTML = '';

    var wrapStyle = [
      'display:flex;flex-direction:column;gap:clamp(6px,1.5vw,10px);',
    ].join('');
    var wrap = el('div', {style: wrapStyle});

    items.forEach(function (item) {
      var row = el('div', {
        style: [
          'display:flex;align-items:center;gap:clamp(8px,2vw,14px);',
          'padding:clamp(8px,2vw,12px) clamp(12px,3vw,20px);',
          'background:' + (item.done ? '#F1FAF1' : '#fff') + ';',
          'border-radius:clamp(8px,2vw,14px);',
          'border:2px solid ' + (item.done ? '#A5D6A7' : '#eee') + ';',
          'font-size:clamp(13px,2.8vw,18px);',
        ].join('')
      });
      row.appendChild(el('span', {text: item.done ? '✅' : '⬜', style: 'font-size:clamp(16px,3.5vw,22px);'}));
      row.appendChild(el('span', {text: item.label, style: 'flex:1;font-weight:600;color:#263238;'}));
      if (item.stars) {
        row.appendChild(el('span', {text: '⭐' + item.stars, style: 'font-weight:700;color:#FF8FAB;font-size:clamp(12px,2.5vw,16px);'}));
      }
      wrap.appendChild(row);
    });

    container.appendChild(wrap);

    // Summary
    var done  = items.filter(function (i) { return i.done; }).length;
    var total = items.length;
    var pct   = total > 0 ? Math.round((done / total) * 100) : 0;

    var summaryWrap = el('div', {style: 'margin-top:clamp(10px,2.5vw,18px);'});
    var barOuter = el('div', {style: 'height:clamp(8px,1.8vw,14px);background:#eee;border-radius:999px;overflow:hidden;'});
    var barFill  = el('div', {style: 'height:100%;width:' + pct + '%;background:linear-gradient(90deg,#FF8FAB,#C9A0FF);border-radius:999px;transition:width .5s ease;'});
    barOuter.appendChild(barFill);
    summaryWrap.appendChild(barOuter);
    summaryWrap.appendChild(el('div', {
      text: done + '/' + total + ' bài hoàn thành (' + pct + '%)',
      style: 'text-align:right;font-size:clamp(11px,2.2vw,15px);color:#666;margin-top:clamp(4px,1vw,8px);font-weight:600;'
    }));
    container.appendChild(summaryWrap);
  }

  /* =========================================================
     STREAK BAR INJECT (auto, if not in HTML)
  ========================================================= */
  function ensureStreakBar() {
    if (qs('#streak-bar-wrap')) return;
    // Try to find a stats container
    var statsEl = qs('#exercise-stats, #stats-bar, #streak-container');
    if (!statsEl) return;
    var wrap = el('div', {id:'streak-bar-wrap'}, [
      el('span', {text:'🔥', style:'font-size:clamp(16px,3.5vw,22px);'}),
      (function () {
        var bar = el('div', {id:'streak-bar'});
        bar.appendChild(el('div', {id:'streak-bar-fill', style:'width:0%;'}));
        return bar;
      })(),
      el('span', {id:'streak-label', text:'0'}),
    ]);
    statsEl.appendChild(wrap);
  }

  /* =========================================================
     OUTFIT EQUIP
  ========================================================= */
  function equipOutfit(itemId) {
    var item = DECOR_ITEMS.filter(function (i) { return i.id === itemId && i.slot === 'vyvy-outfit'; })[0];
    if (!item) return;
    var owned = getOwnedDecor();
    if (owned.indexOf(itemId) === -1) {
      showToast('Chưa mua trang phục này!', 'warning');
      return;
    }
    localStorage.setItem(window.DECOR_SK.VYVY_OUTFIT, itemId);
    qsAll('[data-vyvy-outfit]').forEach(function (el) {
      el.textContent = item.emoji;
    });
    showToast('VyVy mặc ' + item.name + ' rồi! ' + item.emoji, 'success');
  }

  /* =========================================================
     STAR DISPLAY AUTO-INIT
     Finds existing star counter elements and marks them up.
  ========================================================= */
  function patchExistingStarElements() {
    var candidates = qsAll('#star-count, #stars-count, #star-balance, #shop-balance-stars, #decor-shop-star-count, .star-count, [class*="star-count"]');
    candidates.forEach(function (node) {
      if (!node.hasAttribute('data-star-count')) {
        node.setAttribute('data-star-count', 'true');
      }
    });
  }

  /* =========================================================
     PANEL BG WATCHER
     Watches for panel changes and fires setBg accordingly.
  ========================================================= */
  var BG_PANEL_MAP = {
    'panel-learn':    'learn',
    'panel-practice': 'practice',
    'panel-games':    'games',
    'panel-music':    'music',
    'panel-drawing':  'drawing',
    'panel-reading':  'reading',
    'panel-home':     'home',
  };

  function watchPanelChanges() {
    // Observe class changes on known panel wrappers
    var app = document.getElementById('app');
    if (!app || !window.MutationObserver) return;

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === 'attributes' && m.attributeName === 'data-panel') {
          var panel = app.getAttribute('data-panel') || '';
          var bg = BG_PANEL_MAP[panel] || BG_PANEL_MAP['panel-' + panel] || 'home';
          setBg(bg);
        }
      });
    });
    observer.observe(app, {attributes: true, attributeFilter: ['data-panel']});

    // Also listen for show/hide of known panel elements
    Object.keys(BG_PANEL_MAP).forEach(function (panelId) {
      var panelEl = qs('#' + panelId);
      if (!panelEl) return;
      var panelObserver = new MutationObserver(function () {
        var isVisible = !panelEl.hidden &&
          panelEl.style.display !== 'none' &&
          !panelEl.classList.contains('hidden');
        if (isVisible) setBg(BG_PANEL_MAP[panelId]);
      });
      panelObserver.observe(panelEl, {attributes: true, attributeFilter: ['class', 'style', 'hidden']});
    });
  }

  /* =========================================================
     SHOP TRIGGER BUTTON (inject if not present)
  ========================================================= */
  function ensureShopTriggerButton() {
    if (qs('#decor-shop-btn')) return;
    var btn = el('button', {
      id:    'decor-shop-btn',
      text:  '🛍️',
      title: 'Cửa hàng trang trí',
      style: [
        'position:fixed;',
        'bottom:clamp(16px,4vw,28px);',
        'right:clamp(16px,4vw,28px);',
        'z-index:7000;',
        'width:clamp(44px,10vw,62px);',
        'height:clamp(44px,10vw,62px);',
        'border-radius:50%;',
        'border:none;',
        'background:#C9A0FF;',
        'color:#fff;',
        'font-size:clamp(18px,4vw,28px);',
        'cursor:pointer;',
        'box-shadow:0 4px 20px rgba(201,160,255,.5);',
        'transition:transform .2s,box-shadow .2s;',
        'display:flex;align-items:center;justify-content:center;',
      ].join('')
    });
    btn.addEventListener('mouseenter', function () {
      btn.style.transform = 'scale(1.12)';
      btn.style.boxShadow = '0 6px 28px rgba(201,160,255,.7)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 4px 20px rgba(201,160,255,.5)';
    });
    btn.addEventListener('click', openDecorShop);
    document.body.appendChild(btn);
  }

  /* =========================================================
     INIT
  ========================================================= */
  function initDecor() {
    initDecorLayer();
    patchExistingStarElements();
    updateStarDisplay();
    updateVyvyAppearance(getVyvyLevel());
    ensureStreakBar();
    buildLevelUpOverlay();

    var savedBg = localStorage.getItem('vyvy_current_bg') || 'home';
    setBg(savedBg);

    watchPanelChanges();
    ensureShopTriggerButton();

    // Toast container
    if (!qs('#decor-toast-container')) {
      document.body.appendChild(el('div', {id:'decor-toast-container'}));
    }
  }

  /* =========================================================
     PUBLIC API
  ========================================================= */
  window.VyvyDecor = {
    // Core
    setBg:                setBg,
    addStars:             addStars,
    spendStars:           spendStars,
    getStars:             getStars,
    updateStarDisplay:    updateStarDisplay,

    // Shop
    openShop:             openDecorShop,
    closeShop:            closeDecorShop,
    renderShop:           renderShop,
    buyItem:              buyItem,
    placeItem:            placeItem,
    removeItem:           removeItem,
    equipOutfit:          equipOutfit,

    // Decor layer
    updateDecorLayer:     updateDecorLayer,
    initDecorLayer:       initDecorLayer,

    // Level
    getVyvyLevel:         getVyvyLevel,
    checkLevelUp:         checkLevelUp,
    showLevelUp:          showLevelUp,
    updateVyvyAppearance: updateVyvyAppearance,

    // Exercise
    recordExerciseResult: recordExerciseResult,
    renderMultipleChoice: renderMultipleChoice,
    renderExerciseProgress: renderExerciseProgress,
    getExerciseStats:     getExerciseStats,

    // Toast
    showToast:            showToast,

    // Data (read-only refs)
    DECOR_ITEMS:   DECOR_ITEMS,
    VYVY_LEVELS:   VYVY_LEVELS,
  };

  /* =========================================================
     BOOT
  ========================================================= */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDecor);
  } else {
    initDecor();
  }

})();
