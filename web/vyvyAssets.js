/**
 * vyvyAssets.js — VyVy Asset Manifest (Wave 2)
 * Maps raw PM assets and derived crops to app-ready paths.
 * Raw assets untouched in asset/background/ and asset/reference/.
 * Derived assets in web/assets/vyvy/derived/.
 */
var VYVY_ASSETS = {
  backgrounds: {
    home:     { id:'bg-home',     type:'background', source_raw:'asset/background/5b5b8666-e57d-49d9-9d41-a8f01f97de40.png', path:'assets/vyvy/backgrounds/home-study-room.png',     screen:'home',     notes:'Warm study room' },
    learn:    { id:'bg-learn',    type:'background', source_raw:'asset/background/c9d338c7-7b64-43d1-a55b-a6a5f5e897f0.png', path:'assets/vyvy/backgrounds/learn-open-book.png',     screen:'learn',    notes:'Open book desk' },
    practice: { id:'bg-practice', type:'background', source_raw:'asset/background/1ca174fd-78d4-4929-b8e3-8cf14f038b5f.png', path:'assets/vyvy/backgrounds/practice-notebook.png',   screen:'practice', notes:'Notebook exercise' },
    quiz:     { id:'bg-quiz',     type:'background', source_raw:'asset/background/bdb4c44f-eebf-4c83-a35c-465a11bcc517.png', path:'assets/vyvy/backgrounds/quiz-night.png',          screen:'quiz',     notes:'Dark night game corner' },
    reading:  { id:'bg-reading',  type:'background', source_raw:'asset/background/e8919408-42c8-4fd1-8be2-328d2c9a6cd5.png', path:'assets/vyvy/backgrounds/reading-bedtime.png',     screen:'reading',  notes:'Calm bedtime' }
  },

  sprites: {
    idle:       { id:'vyvy_idle',       type:'vyvy_sprite', source_raw:'asset/reference/642ebb9e-b4f7-4738-b835-10a3fe26dcaa.png', path:'assets/vyvy/derived/vyvy_idle.png',       screen:'home',     quality:'good',    notes:'Default idle pose' },
    happy_clap: { id:'vyvy_happy_clap', type:'vyvy_sprite', source_raw:'asset/reference/290280e8-9ada-432a-bcc6-55d60748e074.png', path:'assets/vyvy/derived/vyvy_happy_clap.png', screen:'practice', quality:'good',    notes:'Happy/clap reaction' },
    thinking:   { id:'vyvy_thinking',   type:'vyvy_sprite', source_raw:'asset/reference/c9abdefc-7eb6-44f9-96db-13b9d455f0d6.png', path:'assets/vyvy/derived/vyvy_thinking.png',   screen:'quiz',     quality:'good',    notes:'Thinking/hint pose' },
    supportive: { id:'vyvy_supportive', type:'vyvy_sprite', source_raw:'asset/reference/5bc5cf35-53a4-43f0-b1ff-1a1712b22921.png', path:'assets/vyvy/derived/vyvy_supportive.png', screen:'practice', quality:'usable',  notes:'Supportive wrong answer' },
    celebrate:  { id:'vyvy_celebrate',  type:'vyvy_sprite', source_raw:'asset/reference/a8c62348-3df9-4c42-8179-c114408da249.png', path:'assets/vyvy/derived/vyvy_celebrate.png',  screen:'reward',   quality:'usable',  notes:'Celebrate/reward' },
    reading:    { id:'vyvy_reading',    type:'vyvy_sprite', source_raw:'asset/reference/8937d96a-312c-498a-be2f-c82bb5e11578.png', path:'assets/vyvy/derived/vyvy_reading.png',    screen:'reading',  quality:'usable',  notes:'Reading pose' }
  },

  decorations: {
    star_coin:      { id:'star_coin',      type:'decoration', source_raw:'asset/reference/6f03c145-dc88-4d24-a5ab-3c4ce1a4bf94.png', path:'assets/vyvy/derived/star_coin.png',      slot:'reward',     cost:0,  quality:'usable', notes:'Star coin reward icon' },
    desk_lamp:      { id:'desk_lamp',      type:'decoration', source_raw:'asset/reference/6c022d4e-8878-40c8-a70e-f1675c878840.png', path:'assets/vyvy/derived/desk_lamp.png',      slot:'desk-lamp',  cost:5,  quality:'usable', notes:'Desk lamp decoration' },
    plant:          { id:'plant',          type:'decoration', source_raw:'asset/reference/adf8d50f-6511-45d9-a3a3-4e5850be8ec8.png', path:'assets/vyvy/derived/plant.png',          slot:'desk-plant', cost:5,  quality:'usable', notes:'Desk plant' },
    rug:            { id:'rug',            type:'decoration', source_raw:'asset/reference/1f8767f7-4657-46c8-aee1-8dd1ddf359ba.png', path:'assets/vyvy/derived/rug.png',            slot:'floor-rug',  cost:8,  quality:'usable', notes:'Floor rug' },
    puppy_plush:    { id:'puppy_plush',    type:'decoration', source_raw:'asset/reference/bec2ce62-6086-415e-9d7e-c4098c3068df.png', path:'assets/vyvy/derived/puppy_plush.png',    slot:'pet',        cost:30, quality:'usable', notes:'Puppy plush toy' },
    bookshelf:      { id:'bookshelf',      type:'decoration', source_raw:'asset/reference/7eef0500-df01-4ff3-b8b9-0bc9e8f0ed57.png', path:'assets/vyvy/derived/bookshelf.png',      slot:'bookshelf',  cost:8,  quality:'usable', notes:'Bookshelf decoration' },
    trophy:         { id:'trophy',         type:'decoration', source_raw:'asset/reference/00d61f36-eca5-4d5a-b3c7-0b96225ade27.png', path:'assets/vyvy/derived/trophy.png',         slot:'reward',     cost:20, quality:'usable', notes:'Trophy/medal' },
    treasure_chest: { id:'treasure_chest', type:'decoration', source_raw:'asset/reference/43d3abf5-d584-4605-aa75-096fc81a35c6.png', path:'assets/vyvy/derived/treasure_chest.png', slot:'reward',     cost:15, quality:'usable', notes:'Treasure chest' }
  },

  getSprite: function(name) {
    return this.sprites[name] || this.sprites.idle;
  },

  getDecoration: function(name) {
    return this.decorations[name] || null;
  },

  getAllDecorations: function() {
    var result = [];
    for (var k in this.decorations) {
      if (this.decorations.hasOwnProperty(k)) result.push(this.decorations[k]);
    }
    return result;
  }
};

if (typeof window !== 'undefined') {
  window.VYVY_ASSETS = VYVY_ASSETS;
}
