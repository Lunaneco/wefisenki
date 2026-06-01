(function () {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const sidePanel = document.getElementById("side-panel");
  const rosterRail = document.getElementById("roster-rail");
  const quickActions = document.getElementById("quick-actions");
  const resourceBar = document.getElementById("resource-bar");
  const viewTitle = document.getElementById("view-title");
  const battleClock = document.getElementById("battle-clock");
  const chapterLabel = document.getElementById("chapter-label");
  const mapHotspots = document.getElementById("map-hotspots");
  const battleOverlayControls = document.getElementById("battle-overlay-controls");

  const CW = canvas.width;
  const CH = canvas.height;
  const STORAGE_KEY = "wefi-sengoku-save-v1";
  const DATA_VERSION = "20260531-stageplanet18";
  const STAGE_MAP_SOURCE = { w: 941, h: 1672 };
  const STAGE_ENEMY_SLOT_COUNT = 5;
  const STAGE_NORMAL_ENEMY_COUNT = 4;
  const SECRET_LINE_ALLY_ID = "line";
  const SECRET_LINE_STAGE_ID = "secret-line";
  const SECRET_TEN_ALLY_ID = "ten";
  const SECRET_TEN_STAGE_ID = "secret-ten";
  const SECRET_BAKUNIKI_ALLY_ID = "bakuniki";
  const SECRET_BAKUNIKI_STAGE_ID = "secret-bakuniki";
  const FINAL_BOSS_STAGE_ID = "final-darkrive22";
  const CLEAR_RESULT_IMAGE = "assets/clear.png";
  const SECRET_STAGE_TAP_RADIUS = 32;
  const SECRET_UNLOCK_ALLY_IDS = new Set([SECRET_LINE_ALLY_ID, SECRET_TEN_ALLY_ID, SECRET_BAKUNIKI_ALLY_ID]);
  const LINE_STAGE_INTRO = "お前ら頭WeFiなんじゃねえの！？";
  const LINE_STAGE_CLEAR = "Wefiの全てを否定しているわけではない、一般論としての意見を言っているだけだ。そしてENERGYは俺のパワーになるかもしれないから、ついて行ってやるよ";
  const TEN_STAGE_INTRO = "私の呪術に踊るが良い！！！！！";
  const TEN_STAGE_CLEAR = "俺の財宝か？探せ。この世の全てを置いてきた。俺か？ならついていってやる。";
  const BAKUNIKI_STAGE_INTRO = "ふぉふぉふぉ、よくぞここまで来ましたね、私に勝てたら、力を貸して差し上げましょう";
  const BAKUNIKI_STAGE_CLEAR = "約束通り、あなた達と共に参りましょう。ぼんさいさん、マサルさん、しばらくそちらをよろしくお願いします";
  const DARKRIVE_STAGE_INTRO = "お前らの地球を俺によこせ！！地球のWefiの全てを俺の手中に抑えて、私が全惑星を支配してくれる！！";
  const DARKRIVE_STAGE_CLEAR = [
    { speaker: "ダークリーヴ２２", text: "ぐはああああ、ここまでに強いとは・・・これがWefiの力だということか" },
    { speaker: "Wefi戦士", text: "違う！！！これは地球という惑星で育ったことで育まれた力だ！！" },
    { speaker: "ダークリーヴ２２", text: "くそぉーーー、勝最初から、かてるはずがなかったのか・・・" },
    { speaker: "ナレーション", text: "ダークリーヴ２２消滅" },
    { speaker: "Wefi戦士", text: "みんな終わったな、地球に帰ろう！！" }
  ];

  // === オープニング会話定義 ===
  const OPENING_DIALOGUES = [
    { speaker: "ナレーション", text: "時は２２世紀、地球はwefiに溢れていた。秩序を保っているのが、ぼんさいさん、マサルさん、バクニキさんのWefi3賢人", portrait: null },
    { speaker: "ナレーション", text: "地球のWefi人は幸せな生活を送っていた。だが、そんな地球にあちこちの惑星人が目をつけていた", portrait: null },
    { speaker: "ぼんさいさん", text: "いよいよ危ういですね", portrait: null },
    { speaker: "マサルさん", text: "今こそ、Wefi戦士達に侵略してくる惑星人を諌めに行ってもらいましょうか", portrait: null }
  ];

  // === へへへ覚醒試練ステージ定義 ===
  const KAKUSEI_STAGE = {
    id: "hehehe-kakusei",
    name: "へへへ覚醒戦闘",
    region: "HEHEHE LAND",
    rank: 9,
    difficulty: "覚醒試練",
    power: 38000,
    reward: { wfi: 0, energy: 0, food: 0 },
    x: 0,
    y: 0,
    mapAsset: "assets/maps/eventhehehehehekakusei.png",
    enemyAsset: "assets/enemies/heheheland.png",
    introDialogue: [
      { speaker: "へへへへへ", text: "ここはどこと？あなたは誰たい？？" },
      { speaker: "？？？", text: "汝の力を示すたい！！" }
    ],
    dialogueSpeaker: "へへへへへ"
  };

  // 三賢人の時間巻き戻しセリフ
  const SAGE_RESTART_DIALOGUE = "やれやれ、時間を戻して頑張り直してもらいますか、ステーキングで貯めた時間Wefiよ、あの時に時間を戻しなさい。";

  // WFI消費でレベルアップするキャラID
  const WFI_LEVEL_ALLY_IDS = new Set(["hehehehehe", "kamado", "harulucky", "shinji_wolf", "sakamu_tengu", "okuribito_chan", "usamaru", "sue", "eppa", "bakuniki", "ten"]);
  // Energy消費でレベルアップするキャラID
  const ENERGY_LEVEL_ALLY_IDS = new Set(["nyannmichan", "nyanruna", "line"]);
  // キャラクター最大レベル
  const ALLY_MAX_LEVEL = 9;

  // 三すくみ属性タイプ
  const RANGE_MELEE = "melee";
  const RANGE_RANGED = "ranged";
  const RANGE_MAGIC = "magic";
  // 敵タイプ→属性マッピング（近接→遠距離→魔法→近接の三すくみ）
  const ENEMY_RANGE_MAP = {
    ashigaru: RANGE_MELEE,
    ninja: RANGE_MELEE,
    cavalry: RANGE_MELEE,
    rifleman: RANGE_RANGED,
    busho: RANGE_MAGIC
  };
  // 味方攻撃タイプ→属性マッピング
  const ALLY_RANGE_MAP = {
    melee: RANGE_MELEE,
    melee_area: RANGE_MELEE,
    ranged_beam: RANGE_RANGED,
    ranged_golf: RANGE_RANGED,
    ranged_rifle: RANGE_RANGED,
    ranged_magic: RANGE_MAGIC,
    midrange_splash: RANGE_MAGIC,
    midrange_chain: RANGE_MAGIC,
    midrange_wfi: RANGE_MAGIC,
    hybrid: RANGE_MELEE,
    hybrid_duo: RANGE_MAGIC
  };

  const ASSETS = {
    map: "assets/maps/stagemap.png",
    battle: "assets/maps/stage1.png",
    scenery: "assets/maps/stage1.png",
    logistics: "assets/logistics/logistics_status_sheet.png",
    ui: "assets/ui/ui_core_sheet.png"
  };

  const ALLY_RENDER_PROFILES = {
    hehehehehe: { nativeFacing: -1, boxW: 70, boxH: 92 },
    shinji_wolf: { nativeFacing: -1, boxW: 64, boxH: 82, attackPreserveAspect: true, attackAnchorXRatio: 0.62 },
    okuribito_chan: { nativeFacing: -1, boxW: 62, boxH: 84 },
    sakamu_tengu: { nativeFacing: -1, boxW: 60, boxH: 82 },
    harulucky: { nativeFacing: 1, boxW: 62, boxH: 82 },
    nyanruna: { nativeFacing: -1, boxW: 64, boxH: 84 },
    kamado: { nativeFacing: -1, boxW: 66, boxH: 90 },
    nyannmichan: { nativeFacing: 1, boxW: 62, boxH: 82 },
    usamaru: { nativeFacing: 1, boxW: 72, boxH: 80 },
    bakuniki: {
      nativeFacing: -1,
      boxW: 66,
      boxH: 86,
      attackPreserveAspect: true,
      attackAnchorXRatio: 0.35,
      skillPreserveAspect: true,
      skillAnchorXRatio: 0.48
    },
    eppa: {
      nativeFacing: -1,
      boxW: 62,
      boxH: 82,
      skillPreserveAspect: true,
      skillAnchorXRatio: 0.28
    },
    sue: {
      nativeFacing: -1,
      boxW: 64,
      boxH: 86,
      attackPreserveAspect: true,
      attackAnchorXRatio: 0.42,
      skillPreserveAspect: true,
      skillAnchorXRatio: 0.5
    },
    ten: {
      nativeFacing: 1,
      boxW: 64,
      boxH: 86,
      attackPreserveAspect: true,
      attackAnchorXRatio: 0.34,
      skillPreserveAspect: true,
      skillAnchorXRatio: 0.38
    }
  };

  const STAGES = [
    { id: 1, name: "クラッシュネスト", region: "CRASH NEST", rank: 1, difficulty: "初級", power: 2500, reward: { wfi: 360, energy: 130, food: 18 }, x: 292, y: 130 },
    { id: 2, name: "ルインドリレー", region: "RUINED RELAY", rank: 2, difficulty: "初級", power: 3200, reward: { wfi: 420, energy: 150, food: 20 }, x: 686, y: 120 },
    { id: 3, name: "トキシックマイア", region: "TOXIC MIRE", rank: 3, difficulty: "初級", power: 4200, reward: { wfi: 480, energy: 170, food: 22 }, x: 290, y: 370 },
    { id: 4, name: "サンドリフト", region: "SAND RIFT", rank: 4, difficulty: "初級", power: 5500, reward: { wfi: 560, energy: 200, food: 24 }, x: 684, y: 382 },
    { id: 5, name: "フローズンサテライト", region: "FROZEN SATELLITE", rank: 5, difficulty: "中級", power: 7000, reward: { wfi: 660, energy: 230, food: 26 }, x: 287, y: 596 },
    { id: 6, name: "ネオンハイヴ", region: "NEON HIVE", rank: 6, difficulty: "中級", power: 8800, reward: { wfi: 780, energy: 270, food: 28 }, x: 690, y: 600 },
    { id: 7, name: "バイオラボブリーチ", region: "BIO-LAB BREACH", rank: 7, difficulty: "中級", power: 11000, reward: { wfi: 920, energy: 320, food: 30 }, x: 285, y: 827 },
    { id: 8, name: "マグマコア", region: "MAGMA CORE", rank: 8, difficulty: "中級", power: 13500, reward: { wfi: 1080, energy: 380, food: 32 }, x: 690, y: 825 },
    { id: 9, name: "アビサルオービット", region: "ABYSSAL ORBIT", rank: 9, difficulty: "中級", power: 16500, reward: { wfi: 1260, energy: 440, food: 34 }, x: 285, y: 1042 },
    { id: 10, name: "ファントムネビュラ", region: "PHANTOM NEBULA", rank: 10, difficulty: "中級", power: 20000, reward: { wfi: 1460, energy: 500, food: 36 }, x: 690, y: 1050 },
    { id: 11, name: "ウォーファクトリー", region: "WAR FACTORY", rank: 11, difficulty: "上級", power: 24000, reward: { wfi: 1700, energy: 580, food: 38 }, x: 286, y: 1276 },
    { id: 12, name: "サイオニックカテドラル", region: "PSIONIC CATHEDRAL", rank: 12, difficulty: "上級", power: 28800, reward: { wfi: 1960, energy: 670, food: 40 }, x: 690, y: 1276 },
    { id: 13, name: "ヴォイドゲート", region: "VOID GATE", rank: 13, difficulty: "上級", power: 34000, reward: { wfi: 2260, energy: 770, food: 42 }, x: 286, y: 1468 },
    { id: 14, name: "エンペラーコルテックス", region: "EMPEROR CORTEX", rank: 14, difficulty: "最上級", power: 40000, reward: { wfi: 2600, energy: 880, food: 45 }, x: 690, y: 1492 }
  ].map((stage) => ({
    ...stage,
    mapAsset: stageMapAsset(stage.id),
    enemyAsset: stageEnemyAsset(stage.id)
  }));
  const SECRET_LINE_STAGE = {
    id: SECRET_LINE_STAGE_ID,
    name: "シークレットLINE",
    region: "HIDDEN LINE",
    rank: 5,
    difficulty: "隠しボス",
    power: 32000,
    reward: { wfi: 1800, energy: 520, food: 36 },
    x: 790,
    y: 510,
    mapAsset: "assets/maps/secretstageline.png",
    enemyAsset: null,
    secret: true,
    secretBossAllyId: SECRET_LINE_ALLY_ID,
    unlockAllyId: SECRET_LINE_ALLY_ID,
    dialogueSpeaker: "LINE",
    introDialogue: LINE_STAGE_INTRO,
    clearDialogue: LINE_STAGE_CLEAR
  };
  const SECRET_TEN_STAGE = {
    id: SECRET_TEN_STAGE_ID,
    name: "シークレットプリンセス・テン",
    region: "HIDDEN PRINCESS TEN",
    rank: 5,
    difficulty: "隠しボス",
    power: 34000,
    reward: { wfi: 1900, energy: 560, food: 38 },
    x: 84,
    y: 564,
    mapAsset: "assets/maps/secretstageprincessten.png",
    enemyAsset: null,
    secret: true,
    secretBossAllyId: SECRET_TEN_ALLY_ID,
    unlockAllyId: SECRET_TEN_ALLY_ID,
    dialogueSpeaker: "プリンセス・テン",
    introDialogue: TEN_STAGE_INTRO,
    clearDialogue: TEN_STAGE_CLEAR
  };
  const SECRET_BAKUNIKI_STAGE = {
    id: SECRET_BAKUNIKI_STAGE_ID,
    name: "シークレットバクニキ",
    region: "HIDDEN BAKUNIKI",
    rank: 6,
    difficulty: "最終隠しボス",
    power: 42000,
    reward: { wfi: 12600, energy: 760, food: 48 },
    x: 888,
    y: 933,
    mapAsset: "assets/maps/secretstagebakuniki.png",
    enemyAsset: null,
    secret: true,
    secretBossAllyId: SECRET_BAKUNIKI_ALLY_ID,
    unlockAllyId: SECRET_BAKUNIKI_ALLY_ID,
    unlockCondition: "all-allies",
    revealWhenAvailable: true,
    dialogueSpeaker: "バクニキ",
    introDialogue: BAKUNIKI_STAGE_INTRO,
    clearDialogue: BAKUNIKI_STAGE_CLEAR
  };
  const FINAL_BOSS_STAGE = {
    id: FINAL_BOSS_STAGE_ID,
    name: "ダークリーヴ２２",
    region: "DARKRIVE CORE",
    rank: 9,
    difficulty: "ラスボス",
    power: 68000,
    reward: { wfi: 22000, energy: 1600, food: 80 },
    x: 102,
    y: 1278,
    mapAsset: "assets/maps/darkriveboss.png",
    enemyAsset: "assets/enemies/darkrive.png",
    secret: true,
    finalBoss: true,
    unlockCondition: "all-stages-cleared",
    revealWhenAvailable: true,
    dialogueSpeaker: "ダークリーヴ２２",
    introDialogue: DARKRIVE_STAGE_INTRO,
    clearDialogue: DARKRIVE_STAGE_CLEAR
  };
  const SECRET_STAGES = [SECRET_LINE_STAGE, SECRET_TEN_STAGE, SECRET_BAKUNIKI_STAGE, FINAL_BOSS_STAGE];
  const STAGE_ENEMY_FRAMES = {
    1: [
      { x: 32, y: 258, w: 191, h: 158 },
      { x: 264, y: 210, w: 185, h: 205 },
      { x: 473, y: 253, w: 263, h: 164 },
      { x: 777, y: 200, w: 138, h: 215 },
      { x: 947, y: 18, w: 488, h: 403 }
    ],
    2: [
      { x: 8, y: 277, w: 130, h: 176 },
      { x: 150, y: 269, w: 239, h: 202 },
      { x: 407, y: 229, w: 212, h: 240 },
      { x: 655, y: 205, w: 252, h: 264 },
      { x: 914, y: 26, w: 479, h: 442 }
    ],
    3: [
      { x: 10, y: 305, w: 221, h: 143 },
      { x: 252, y: 263, w: 239, h: 182 },
      { x: 505, y: 232, w: 177, h: 207 },
      { x: 716, y: 187, w: 225, h: 259 },
      { x: 951, y: 19, w: 486, h: 435 }
    ],
    4: [
      { x: 14, y: 290, w: 217, h: 152 },
      { x: 230, y: 249, w: 281, h: 186 },
      { x: 537, y: 176, w: 182, h: 257 },
      { x: 750, y: 183, w: 124, h: 241 },
      { x: 897, y: 2, w: 546, h: 459 }
    ],
    5: [
      { x: 41, y: 261, w: 200, h: 142 },
      { x: 263, y: 209, w: 162, h: 190 },
      { x: 463, y: 223, w: 253, h: 183 },
      { x: 753, y: 172, w: 195, h: 232 },
      { x: 971, y: 26, w: 448, h: 378 }
    ],
    6: [
      { x: 4, y: 315, w: 205, h: 160 },
      { x: 219, y: 281, w: 194, h: 193 },
      { x: 405, y: 254, w: 228, h: 224 },
      { x: 640, y: 222, w: 310, h: 256 },
      { x: 951, y: 39, w: 437, h: 437 }
    ],
    7: [
      { x: 24, y: 304, w: 182, h: 132 },
      { x: 232, y: 191, w: 231, h: 247 },
      { x: 473, y: 211, w: 214, h: 209 },
      { x: 704, y: 209, w: 203, h: 227 },
      { x: 910, y: 10, w: 516, h: 431 }
    ],
    8: [
      { x: 22, y: 270, w: 170, h: 145 },
      { x: 204, y: 255, w: 250, h: 159 },
      { x: 465, y: 201, w: 188, h: 214 },
      { x: 675, y: 153, w: 263, h: 261 },
      { x: 938, y: 26, w: 496, h: 392 }
    ],
    9: [
      { x: 43, y: 246, w: 185, h: 235 },
      { x: 249, y: 267, w: 233, h: 212 },
      { x: 497, y: 245, w: 185, h: 239 },
      { x: 709, y: 245, w: 220, h: 239 },
      { x: 912, y: 22, w: 522, h: 461 }
    ],
    10: [
      { x: 49, y: 210, w: 97, h: 210 },
      { x: 191, y: 159, w: 233, h: 279 },
      { x: 457, y: 46, w: 171, h: 375 },
      { x: 642, y: 0, w: 286, h: 473 },
      { x: 914, y: 0, w: 501, h: 473 }
    ],
    11: [
      { x: 11, y: 345, w: 148, h: 123 },
      { x: 197, y: 291, w: 145, h: 172 },
      { x: 395, y: 299, w: 177, h: 166 },
      { x: 599, y: 249, w: 233, h: 217 },
      { x: 845, y: 11, w: 559, h: 454 }
    ],
    12: [
      { x: 48, y: 337, w: 110, h: 160 },
      { x: 207, y: 284, w: 148, h: 222 },
      { x: 399, y: 56, w: 200, h: 455 },
      { x: 627, y: 264, w: 182, h: 247 },
      { x: 857, y: 9, w: 543, h: 555 }
    ],
    13: [
      { x: 30, y: 310, w: 134, h: 163 },
      { x: 187, y: 291, w: 257, h: 184 },
      { x: 472, y: 218, w: 159, h: 247 },
      { x: 658, y: 154, w: 203, h: 321 },
      { x: 877, y: 13, w: 519, h: 458 }
    ],
    14: [
      { x: 2, y: 364, w: 173, h: 136 },
      { x: 197, y: 237, w: 177, h: 256 },
      { x: 375, y: 224, w: 194, h: 276 },
      { x: 597, y: 202, w: 242, h: 298 },
      { x: 857, y: 3, w: 566, h: 498 }
    ],
    "hehehe-kakusei": [
      { x: 42, y: 314, w: 204, h: 312 },
      { x: 294, y: 354, w: 282, h: 267 },
      { x: 628, y: 257, w: 246, h: 372 },
      { x: 966, y: 302, w: 330, h: 323 },
      { x: 1297, y: 244, w: 368, h: 357 }
    ]
  };
  const enemyFrameCache = new Map();

  const state = {
    view: "map",
    ready: false,
    allies: [],
    skills: [],
    skillById: new Map(),
    images: new Map(),
    selectedStageId: 1,
    selectedAllyId: "",
    unlockedAllyIds: new Set(),
    unlockedStageId: 1,
    clearedStages: new Set(),
    resources: {
      wfi: 0,
      energy: 0,
      food: 0
    },
    battle: null,
    log: [],
    lastTime: 0,
    domTime: 0,
    autoSkill: false,
    // オープニング・キャラ選択管理
    openingDone: false,
    charSelectDone: false,
    openingStep: 0,
    // 時間巻き戻しフェーズ管理
    timeRewindPhase: false,
    pendingRestartStage: null,
    // キャラクターレベル管理（allyId→level）
    charLevels: {},
    showJoinCardAlly: null,
    pendingRestartOnClose: false,
    joinAllySelectPhase: false,
    heheheheheAwakened: false
  };
  const runtimeBaseAllies = new Map();
  const runtimeBaseSkills = new Map();
  // デバッグ用にグローバルへ公開（リリース前に削除すること）
  window.wfiDebugState = state;

  const battlePointer = {
    active: false,
    moved: false,
    lastX: 0,
    lastY: 0
  };
  const battleKeys = new Set();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function formatNum(value) {
    return Math.round(value).toLocaleString("ja-JP");
  }

  function stageMapAsset(id) {
    return `assets/maps/stage${id}.png`;
  }

  function stageEnemyAsset(id) {
    return `assets/enemies/stage${id}enemy.png`;
  }

  function heheheheAwakenedSlice(id) {
    return `assets/characters/hehehehehe覚醒/hehehehehesheet_slices/hehehehehesheet_slices/hehehehehesheet_${id}.png`;
  }

  function stageById(id) {
    return STAGES.find((stage) => stage.id === id) || STAGES[0];
  }

  function skillById(id) {
    return state.skillById.get(id);
  }

  function selectedStage() {
    return stageById(state.selectedStageId);
  }

  function allyById(id) {
    return state.allies.find((ally) => ally.id === id) || null;
  }

  function defaultUnlockedAllyIds() {
    return new Set(state.allies
      .map((ally) => ally.id)
      .filter((id) => !SECRET_UNLOCK_ALLY_IDS.has(id)));
  }

  function isAllyUnlocked(allyOrId) {
    const id = typeof allyOrId === "string" ? allyOrId : allyOrId?.id;
    return !!id && state.unlockedAllyIds.has(id);
  }

  function playableAllies() {
    return state.allies.filter(isAllyUnlocked);
  }

  function secretStageForUnlockAlly(allyId) {
    return SECRET_STAGES.find((stage) => stage.unlockAllyId === allyId) || null;
  }

  function canRestoreUnlockedAlly(allyId, clearedStageIds) {
    const secretStage = secretStageForUnlockAlly(allyId);
    return !secretStage || clearedStageIds.has(secretStage.id);
  }

  function isSecretStageAvailable(stage) {
    if (stage.unlockCondition === "all-allies") {
      return state.allies.every((ally) => ally.id === stage.unlockAllyId || isAllyUnlocked(ally.id));
    }
    if (stage.unlockCondition === "all-stages-cleared") {
      return allNormalStagesCleared();
    }
    return true;
  }

  function firstPlayableAlly() {
    return playableAllies()[0] || state.allies[0] || null;
  }

  function ensureSelectedAllyUnlocked() {
    if (!state.charSelectDone) return;
    if (isAllyUnlocked(state.selectedAllyId)) return;
    const first = firstPlayableAlly();
    if (first) state.selectedAllyId = first.id;
  }

  function selectedAlly() {
    return playableAllies().find((ally) => ally.id === state.selectedAllyId) || firstPlayableAlly();
  }

  function isStageUnlocked(stage) {
    return true;
  }

  function isStageCleared(stage) {
    return state.clearedStages.has(stage.id);
  }

  function allNormalStagesCleared() {
    return STAGES.every((stage) => isStageCleared(stage));
  }

  function addLog(message) {
    state.log.unshift({ message, time: Date.now() });
    state.log = state.log.slice(0, 12);
  }

  function cloneData(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function rememberBaseRuntimeData() {
    runtimeBaseAllies.clear();
    runtimeBaseSkills.clear();
    state.allies.forEach((ally) => runtimeBaseAllies.set(ally.id, cloneData(ally)));
    state.skills.forEach((skill) => runtimeBaseSkills.set(skill.id, cloneData(skill)));
  }

  function restoreRuntimeObject(target, snapshot) {
    Object.keys(target).forEach((key) => delete target[key]);
    Object.assign(target, cloneData(snapshot));
  }

  function restoreHeheheheNormal(options = {}) {
    state.heheheheheAwakened = false;
    const ally = allyById("hehehehehe");
    const baseAlly = runtimeBaseAllies.get("hehehehehe");
    if (ally && baseAlly) {
      restoreRuntimeObject(ally, baseAlly);
      applyLevelToAlly(ally);
      ally.hp = options.fullHp ? ally.maxHp : Math.min(ally.hp, ally.maxHp);
      ally.shield = 0;
      ally.skillGauge = 0;
      ally.cooldowns = {};
      ally.buffs = {};
      ally.anim = "idle";
      ally.animUntil = 0;
    }

    const skill = skillById("high_blood_pressure");
    const baseSkill = runtimeBaseSkills.get("high_blood_pressure");
    if (skill && baseSkill) {
      restoreRuntimeObject(skill, baseSkill);
    }
  }

  function bundledJson(url) {
    const bundled = window.WEFI_SENGOKU_DATA;
    if (!bundled) return null;
    if (url.endsWith("data/allies.json")) return cloneData(bundled.allies);
    if (url.endsWith("data/skills.json")) return cloneData(bundled.skills);
    return null;
  }

  async function loadJson(url) {
    if (window.location.protocol === "file:") {
      const bundled = bundledJson(url);
      if (bundled) return bundled;
    }

    try {
      const fetchUrl = window.location.protocol === "file:" ? url : `${url}?v=${DATA_VERSION}`;
      const response = await fetch(fetchUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      return response.json();
    } catch (error) {
      const bundled = bundledJson(url);
      if (bundled) return bundled;
      throw error;
    }
  }

  function loadImage(src) {
    if (!src) return Promise.resolve(null);
    if (state.images.has(src)) return Promise.resolve(state.images.get(src));

    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        state.images.set(src, image);
        resolve(image);
      };
      image.onerror = () => {
        state.images.set(src, null);
        resolve(null);
      };
      const cacheSafeSrc = window.location.protocol === "file:" || src.includes("?") || /^(data:|blob:)/.test(src)
        ? src
        : `${src}?v=${DATA_VERSION}`;
      image.src = cacheSafeSrc;
    });
  }

  function image(src) {
    return state.images.get(src) || null;
  }

  function collectPaths(value, out = new Set()) {
    if (Array.isArray(value)) {
      value.forEach((item) => collectPaths(item, out));
    } else if (value && typeof value === "object") {
      Object.values(value).forEach((item) => collectPaths(item, out));
    } else if (typeof value === "string" && /\.(png|jpg|jpeg)$/i.test(value)) {
      out.add(value);
    }
    return out;
  }

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  function storageRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Saving is optional for direct file launches.
    }
  }

  function saveGame() {
    ensureSelectedAllyUnlocked();
    const payload = {
      unlockedStageId: state.unlockedStageId,
      selectedStageId: state.selectedStageId,
      selectedAllyId: state.selectedAllyId,
      unlockedAllyIds: Array.from(state.unlockedAllyIds),
      resources: state.resources,
      clearedStages: Array.from(state.clearedStages),
      // 追加データ
      charLevels: state.charLevels,
      openingDone: state.openingDone,
      charSelectDone: state.charSelectDone,
      heheheheheAwakened: state.heheheheheAwakened
    };
    const saved = storageSet(STORAGE_KEY, JSON.stringify(payload));
    addLog(saved ? "進行状況を保存しました。" : "この起動方法では保存が使えません。");
  }

  function loadSave() {
    const raw = storageGet(STORAGE_KEY);
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      state.unlockedStageId = clamp(Number(payload.unlockedStageId) || 1, 1, STAGES.length);
      state.selectedStageId = clamp(Number(payload.selectedStageId) || state.unlockedStageId, 1, STAGES.length);
      state.selectedAllyId = payload.selectedAllyId || state.selectedAllyId;
      const clearedStageIds = new Set(payload.clearedStages || []);
      if (Array.isArray(payload.unlockedAllyIds)) {
        const knownIds = new Set(state.allies.map((ally) => ally.id));
        state.unlockedAllyIds = new Set(
          payload.unlockedAllyIds.filter((id) => knownIds.has(id) && canRestoreUnlockedAlly(id, clearedStageIds))
        );
      }
      state.resources = { ...state.resources, ...(payload.resources || {}) };
      state.clearedStages = clearedStageIds;
      // キャラレベル・オープニングフラグを復元
      if (payload.charLevels && typeof payload.charLevels === "object") {
        state.charLevels = payload.charLevels;
      }
      state.openingDone = !!payload.openingDone;
      state.charSelectDone = !!payload.charSelectDone;
      state.heheheheheAwakened = !!payload.heheheheheAwakened && clearedStageIds.has(KAKUSEI_STAGE.id);
      // 既存セーブ（進行実績あり）にはオープニングをスキップ
      if (!payload.openingDone && (clearedStageIds.size > 0 || (Array.isArray(payload.unlockedAllyIds) && payload.unlockedAllyIds.length > 0))) {
        state.openingDone = true;
        state.charSelectDone = true;
      }
      ensureSelectedAllyUnlocked();
    } catch {
      storageRemove(STORAGE_KEY);
    }
  }

  function resetSave() {
    storageRemove(STORAGE_KEY);
    state.unlockedStageId = 1;
    state.selectedStageId = 1;
    state.unlockedAllyIds = new Set();
    state.selectedAllyId = "";
    state.clearedStages = new Set();
    state.resources = { wfi: 0, energy: 0, food: 0 };
    state.battle = null;
    state.view = "map";
    // 追加フィールドのリセット
    state.charLevels = {};
    state.openingDone = false;
    state.charSelectDone = false;
    state.openingStep = 0;
    state.timeRewindPhase = false;
    state.pendingRestartStage = null;
    state.showJoinCardAlly = null;
    state.pendingRestartOnClose = false;
    state.joinAllySelectPhase = false;
    restoreHeheheheNormal({ fullHp: true });
    // 全キャラのHPをリセット
    state.allies.forEach((ally) => {
      ally.maxHp = ally.stats.hp;
      ally.hp = ally.maxHp;
    });
    addLog("進行状況を初期化しました。");
  }

  function startNewGamePlus() {
    try {
      window.localStorage.setItem("wfi_cheat_clear_tested", "true");
    } catch (e) {}
    state.battle = null;
    state.view = "map";
    state.clearedStages = new Set();
    state.unlockedStageId = 1;
    state.selectedStageId = 1;
    state.openingDone = true;
    state.charSelectDone = true;
    state.joinAllySelectPhase = false;
    state.timeRewindPhase = false;
    state.pendingRestartStage = null;
    state.pendingRestartOnClose = false;
    state.showJoinCardAlly = null;
    restoreHeheheheNormal({ fullHp: true });
    applyAllLevels();
    state.allies.forEach((ally) => {
      ally.hp = ally.maxHp;
      ally.shield = 0;
      ally.skillGauge = 0;
      ally.cooldowns = {};
      ally.buffs = {};
    });
    ensureSelectedAllyUnlocked();
    addLog("強くてニューゲーム開始。力を引き継いでステージ1から再出撃できます。");
    saveGame();
    setView("map");
    renderDom(true);
  }

  function buildRuntimeAlly(ally) {
    return {
      ...ally,
      skillIds: ally.primarySkillId ? [ally.primarySkillId] : (ally.skillIds ? [ally.skillIds[0]] : []),
      maxHp: ally.stats.hp,
      hp: ally.stats.hp,
      shield: 0,
      skillGauge: 0,
      homeX: 0,
      homeY: 0,
      attackTimer: 0,
      cooldowns: {},
      buffs: {},
      battleX: 0,
      battleY: 0,
      facing: 1,
      visualDirection: "front",
      activeEffectPath: null,
      activeEffectKind: null,
      anim: "idle",
      animUntil: 0
    };
  }

  // レベル補正倍率を返す（Lv1=1.0、Lv9=3.00）
  function levelMultiplier(level) {
    return 1 + (Math.max(1, Math.min(ALLY_MAX_LEVEL, level)) - 1) * 0.25;
  }

  // キャラクターの現在レベルを取得
  function allyLevel(allyId) {
    return state.charLevels[allyId] || 1;
  }

  // レベル補正をキャラに適用する
  function applyLevelToAlly(ally) {
    const level = allyLevel(ally.id);
    const mult = levelMultiplier(level);
    ally.maxHp = Math.round(ally.stats.hp * mult);
    if (ally.hp > ally.maxHp) ally.hp = ally.maxHp;
  }

  // 全キャラクターにレベル補正を適用する
  function applyAllLevels() {
    state.allies.forEach(applyLevelToAlly);
  }

  // スキルを使用できるか（Lv3以上かつゲージ満タン）
  function canUseSkill(ally) {
    return allyLevel(ally.id) >= 3 && (ally.skillGauge || 0) >= 100;
  }

  // レベルアップ処理
  function levelUpAlly(allyId) {
    const ally = allyById(allyId);
    if (!ally || !isAllyUnlocked(allyId)) return;
    const currentLevel = allyLevel(allyId);
    if (currentLevel >= ALLY_MAX_LEVEL) {
      addLog(`${ally.name} は最大レベルに達しています。`);
      return;
    }
    const nextLevel = currentLevel + 1;
    if (WFI_LEVEL_ALLY_IDS.has(allyId)) {
      let cost = 0;
      if (currentLevel === 1) {
        cost = 100;
      } else if (currentLevel === 2) {
        cost = 500;
      } else {
        cost = nextLevel * 500;
      }
      if (state.resources.wfi < cost) {
        addLog(`WFIが足りません（必要: ${formatNum(cost)} WFI）。`);
        return;
      }
      state.resources.wfi -= cost;
    } else if (ENERGY_LEVEL_ALLY_IDS.has(allyId)) {
      const cost = nextLevel * 300;
      if (state.resources.energy < cost) {
        addLog(`Energyが足りません（必要: ${formatNum(cost)} Energy）。`);
        return;
      }
      state.resources.energy -= cost;
    } else {
      addLog(`${ally.name} のレベルアップ通貨が不明です。`);
      return;
    }
    state.charLevels[allyId] = nextLevel;
    applyLevelToAlly(ally);
    addLog(`${ally.name} が Lv${nextLevel} になりました！`);
    if (nextLevel === 3) addLog(`${ally.name} はスキルが使えるようになりました！`);
  }

  // 三すくみ属性を取得（敵）
  function enemyRangeType(enemy) {
    return ENEMY_RANGE_MAP[enemy.type] || RANGE_MELEE;
  }

  // 三すくみ属性を取得（味方）
  function allyRangeType(ally) {
    return ALLY_RANGE_MAP[ally.attackType] || RANGE_MELEE;
  }

  // 三すくみダメージ倍率（近接→遠距離、遠距離→魔法、魔法→近接が有利）
  function triangleMultiplier(attackerType, defenderType) {
    if (
      (attackerType === RANGE_MELEE && defenderType === RANGE_RANGED) ||
      (attackerType === RANGE_RANGED && defenderType === RANGE_MAGIC) ||
      (attackerType === RANGE_MAGIC && defenderType === RANGE_MELEE)
    ) return 1.25;
    if (
      (attackerType === RANGE_RANGED && defenderType === RANGE_MELEE) ||
      (attackerType === RANGE_MAGIC && defenderType === RANGE_RANGED) ||
      (attackerType === RANGE_MELEE && defenderType === RANGE_MAGIC)
    ) return 0.8;
    return 1.0;
  }

  // 食料でHP回復（単体、食料10消費でHP20%回復）
  function healAlly(allyId) {
    const ally = allyById(allyId);
    if (!ally || !isAllyUnlocked(allyId)) return;
    if (ally.hp >= ally.maxHp) {
      addLog(`${ally.name} のHPはすでに最大です。`);
      return;
    }
    const foodCost = 10;
    if (state.resources.food < foodCost) {
      addLog(`食料が足りません（食料${foodCost}必要）。`);
      return;
    }
    state.resources.food -= foodCost;
    const healAmount = Math.round(ally.maxHp * 0.2);
    ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
    addLog(`${ally.name} を回復（+${formatNum(healAmount)} HP）。`);
  }

  // 食料で全員HP回復（食料30消費でHP20%回復）
  function healAllAllies() {
    const foodCost = 30;
    if (state.resources.food < foodCost) {
      addLog(`食料が足りません（全員回復には食料${foodCost}必要）。`);
      return;
    }
    state.resources.food -= foodCost;
    playableAllies().forEach((ally) => {
      const healAmount = Math.round(ally.maxHp * 0.2);
      ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
    });
    addLog("全員のHPを回復しました。");
  }

  // オープニングを１ステップ進める
  function advanceOpening() {
    if (state.openingStep < OPENING_DIALOGUES.length - 1) {
      state.openingStep += 1;
    } else {
      state.openingDone = true;
    }
  }

  // キャラ選択を確定する
  function confirmCharSelect(allyId) {
    state.selectedAllyId = allyId;
    const ally = allyById(allyId);

    if (state.joinAllySelectPhase) {
      // 通常ステージクリア後の仲間選択確定
      const unlocked = unlockAlly(allyId);
      if (unlocked) {
        state.showJoinCardAlly = allyJoinProfile(unlocked);
      }
      state.joinAllySelectPhase = false;
      saveGame();
      // setViewはブロックを越えた後に呼び出す
      state.view = "map";
      document.querySelectorAll(".tab-button").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.view === "map");
      });
      addLog(`${ally?.name || allyId} が仲間に加わりました！`);
      return;
    }

    if (ally) {
      state.showJoinCardAlly = allyJoinProfile(ally);
    }

    if (state.timeRewindPhase) {
      // 時間巻き戻し後のリスタート：アンロックキャラをリセットして選んだ1人のみにする
      state.unlockedAllyIds.clear();
      state.unlockedAllyIds.add(allyId);

      if (ally) {
        ally.hp = ally.maxHp;
        ally.shield = 0;
        ally.skillGauge = 0;
      }

      state.pendingRestartOnClose = true;
      state.timeRewindPhase = false;
      addLog("時間が巻き戻りました。");
    } else {
      // 初回キャラ選択完了
      state.unlockedAllyIds.clear();
      state.unlockedAllyIds.add(allyId);

      state.charSelectDone = true;
      saveGame();
      // setViewはブロックを越えた後に呼び出す
      state.view = "map";
      document.querySelectorAll(".tab-button").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.view === "map");
      });
      addLog(`${ally?.name || allyId} を選択しました。出撃準備完了！`);
    }
  }

  function applyHeheheheKakusei() {
    if (!state.heheheheheAwakened) return;

    const ally = allyById("hehehehehe");
    if (ally) {
      if (!runtimeBaseAllies.has(ally.id)) {
        runtimeBaseAllies.set(ally.id, cloneData(ally));
      }
      ally.name = "へへへへへ覚醒";
      ally.job = "専業主婦";
      ally.personality = "趣味：素手で原油を掘り当てる";
      ally.stats.attack = 760;

      ally.assets.root = "assets/characters/hehehehehe覚醒";
      ally.assets.source = "assets/characters/hehehehehe覚醒/hehehehehesheet.png";
      ally.assets.contactSheet = "assets/characters/hehehehehe覚醒/hehehehehesheet.png";
      ally.assets.manifest = "assets/characters/hehehehehe覚醒/hehehehehesheet_slices/sprites.json";
      ally.assets.defaultSprite = heheheheAwakenedSlice(3);
      ally.assets.portrait = heheheheAwakenedSlice(41);

      ally.assets.directions = {
        front: heheheheAwakenedSlice(3),
        left: heheheheAwakenedSlice(4),
        right: heheheheAwakenedSlice(5),
        back: heheheheAwakenedSlice(6)
      };

      ally.assets.faces = [
        heheheheAwakenedSlice(41)
      ];

      ally.assets.animations = {
        idle: {
          fps: 6,
          loop: true,
          frames: [
            heheheheAwakenedSlice(7),
            heheheheAwakenedSlice(8),
            heheheheAwakenedSlice(9),
            heheheheAwakenedSlice(10)
          ]
        },
        walk: {
          fps: 10,
          loop: true,
          frames: [
            heheheheAwakenedSlice(13),
            heheheheAwakenedSlice(14),
            heheheheAwakenedSlice(15),
            heheheheAwakenedSlice(17),
            heheheheAwakenedSlice(18),
            heheheheAwakenedSlice(22)
          ]
        },
        attack: {
          fps: 11,
          loop: false,
          frames: [
            heheheheAwakenedSlice(19),
            heheheheAwakenedSlice(20),
            heheheheAwakenedSlice(21),
            heheheheAwakenedSlice(16)
          ]
        },
        skill: {
          fps: 8,
          loop: false,
          frames: [
            heheheheAwakenedSlice(28),
            heheheheAwakenedSlice(25),
            heheheheAwakenedSlice(29),
            heheheheAwakenedSlice(24),
            heheheheAwakenedSlice(26),
            heheheheAwakenedSlice(30)
          ]
        },
        damage: {
          fps: 1,
          loop: false,
          frames: [
            heheheheAwakenedSlice(43)
          ]
        },
        down: {
          fps: 1,
          loop: false,
          frames: [
            heheheheAwakenedSlice(47)
          ]
        },
        victory: {
          fps: 1,
          loop: false,
          frames: [
            heheheheAwakenedSlice(40)
          ]
        }
      };

      ally.assets.signatureItems = [
        heheheheAwakenedSlice(42),
        heheheheAwakenedSlice(44),
        heheheheAwakenedSlice(45),
        heheheheAwakenedSlice(46)
      ];

      ally.assets.effects = [
        heheheheAwakenedSlice(52),
        heheheheAwakenedSlice(53),
        heheheheAwakenedSlice(54),
        heheheheAwakenedSlice(55),
        heheheheAwakenedSlice(56),
        heheheheAwakenedSlice(57),
        heheheheAwakenedSlice(58),
        heheheheAwakenedSlice(59),
        heheheheAwakenedSlice(60),
        heheheheAwakenedSlice(61),
        heheheheAwakenedSlice(67),
        heheheheAwakenedSlice(68)
      ];

      applyLevelToAlly(ally);
      ally.hp = ally.maxHp;
    }

    const skill = skillById("high_blood_pressure");
    if (skill) {
      if (!runtimeBaseSkills.has(skill.id)) {
        runtimeBaseSkills.set(skill.id, cloneData(skill));
      }
      skill.name = "パワーオブオイルショック";
      skill.description = "素手で原油を掘り当ててオイルショックを引き起こし、周囲の敵に範囲ダメージを与える。自身は攻撃力が上がるが、短時間HPを消耗する。";

      skill.assets.icon = heheheheAwakenedSlice(42);

      skill.assets.characterFrames = [
        heheheheAwakenedSlice(28),
        heheheheAwakenedSlice(25),
        heheheheAwakenedSlice(29),
        heheheheAwakenedSlice(24),
        heheheheAwakenedSlice(26),
        heheheheAwakenedSlice(30)
      ];

      skill.assets.effectFrames = [
        heheheheAwakenedSlice(57),
        heheheheAwakenedSlice(58),
        heheheheAwakenedSlice(59),
        heheheheAwakenedSlice(60),
        heheheheAwakenedSlice(61),
        heheheheAwakenedSlice(67),
        heheheheAwakenedSlice(68)
      ];
    }
  }

  async function boot() {
    try {
      const [alliesData, skillsData] = await Promise.all([
        loadJson("data/allies.json"),
        loadJson("data/skills.json")
      ]);

      state.allies = alliesData.allies.map(buildRuntimeAlly);
      state.skills = skillsData.skills;
      state.skillById = new Map(state.skills.map((skill) => [skill.id, skill]));
      rememberBaseRuntimeData();
      state.unlockedAllyIds = new Set();
      state.selectedAllyId = "";

      loadSave();



      applyHeheheheKakusei();
      // セーブデータのレベルを全キャラに適用
      applyAllLevels();
      // セッション開始時はHPをレベル補正後の最大値にセット
      state.allies.forEach((ally) => { ally.hp = ally.maxHp; });
      ensureSelectedAllyUnlocked();

      const imagePaths = new Set(Object.values(ASSETS));
      STAGES.forEach((stage) => {
        imagePaths.add(stage.mapAsset);
        imagePaths.add(stage.enemyAsset);
      });
      SECRET_STAGES.forEach((stage) => {
        imagePaths.add(stage.mapAsset);
        if (stage.enemyAsset) imagePaths.add(stage.enemyAsset);
      });
      // オープニング立ち絵の画像を事前ロード
      OPENING_DIALOGUES.forEach((d) => { if (d.portrait) imagePaths.add(d.portrait); });
      imagePaths.add("assets/characters/3kenzin.jpg");

      // へへへ覚醒戦闘用のアセットを事前ロード
      imagePaths.add(KAKUSEI_STAGE.mapAsset);
      imagePaths.add(KAKUSEI_STAGE.enemyAsset);

      // 覚醒後のへへへへへは hehehehehesheet_slices のライオン型素材を使う
      imagePaths.add("assets/characters/hehehehehe覚醒/hehehehehesheet.png");
      [
        3, 4, 5, 6,
        7, 8, 9, 10,
        13, 14, 15, 17, 18, 22,
        19, 20, 21, 16,
        28, 25, 29, 24, 26, 30,
        40, 41, 42, 43, 44, 45, 46, 47,
        52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 67, 68
      ].forEach((id) => imagePaths.add(heheheheAwakenedSlice(id)));

      collectPaths(alliesData, imagePaths);
      collectPaths(skillsData, imagePaths);
      await Promise.all(Array.from(imagePaths).map(loadImage));

      bindEvents();
      state.ready = true;
      addLog("ステージマップを展開しました。");
      // オープニング完了済みの場合のみマップに遷移
      if (state.openingDone && state.charSelectDone) {
        state.view = "map";
        document.querySelectorAll(".tab-button").forEach((btn) => {
          btn.classList.toggle("is-active", btn.dataset.view === "map");
        });
      }



      requestAnimationFrame(loop);
    } catch (error) {
      sidePanel.innerHTML = `<div class="panel-title"><div><h2>読み込み失敗</h2><p>${escapeHtml(error.message)}</p></div></div>`;
    }
  }

  function bindEvents() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });

    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("pointerdown", handleBattlePointerDown);
    canvas.addEventListener("pointermove", handleBattlePointerMove);
    canvas.addEventListener("pointerup", handleBattlePointerUp);
    canvas.addEventListener("pointercancel", handleBattlePointerUp);
    canvas.addEventListener("wheel", handleBattleWheel, { passive: false });
    document.addEventListener("keydown", handleBattleKeyDown);
    document.addEventListener("keyup", handleBattleKeyUp);

    rosterRail.addEventListener("click", (event) => {
      const button = event.target.closest("[data-ally-id]");
      if (!button) return;
      if (state.view === "battle" && state.battle && !state.battle.result) {
        selectBattleAlly(button.dataset.allyId);
      } else {
        state.selectedAllyId = button.dataset.allyId;
        if (state.view !== "battle") setView("roster");
      }
      renderDom(true);
    });

    quickActions.addEventListener("click", handleActionClick);
    sidePanel.addEventListener("click", handleActionClick);
    if (mapHotspots) mapHotspots.addEventListener("click", handleActionClick);
    if (battleOverlayControls) battleOverlayControls.addEventListener("click", handleActionClick);
  }

  function setView(view) {
    // オープニング・キャラ選択・仲間選択・時間巻き戻し中はビュー切り替えを制限
    // ただし、マップビュー（キャラ選択画面のベースビュー）への切り替えは許可する
    if (!state.openingDone || !state.charSelectDone || state.timeRewindPhase || state.joinAllySelectPhase) {
      if (view !== "map") {
        return;
      }
    }
    if (view === "map" && state.battle?.result) {
      state.battle = null;
    }
    if (view === "battle" && !state.battle) {
      state.view = "battle";
    } else {
      state.view = view;
    }
    if (state.view !== "battle") battleKeys.clear();

    document.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === state.view);
    });
    renderDom(true);
  }

  function handleActionClick(event) {
    // 加入説明画面が表示されている場合、サイドパネル内のどこをクリックしても閉じるようにする
    if (state.showJoinCardAlly) {
      state.showJoinCardAlly = null;
      if (state.pendingRestartOnClose) {
        state.pendingRestartOnClose = false;
        const stage = state.pendingRestartStage;
        state.pendingRestartStage = null;
        state.selectedStageId = 1;
        addLog("最初のステージの戦闘準備画面に戻ります。");
        setView("map");
        renderDom(true);
      } else {
        setView("map");
        renderDom(true);
      }
      return;
    }

    const button = event.target.closest("[data-action]");
    const action = button?.dataset.action || "";

    // 戦闘結果（リザルト）画面が表示されている場合、サイドパネル内のどこをクリックしても進むようにする
    if (state.view === "battle" && state.battle?.result && !state.battle.dialogue) {
      const result = state.battle.result;
      if (result.newGamePlus) {
        startNewGamePlus();
      } else if (action === "continue-map") {
        state.battle = null;
        setView("map");
        renderDom(true);
      } else if (result.needsAllySelect) {
        state.battle = null;
        state.joinAllySelectPhase = true;
        state.selectedAllyId = "";
        setView("map");
        renderDom(true);
      } else {
        state.battle = null;
        setView("map");
        renderDom(true);
      }
      return;
    }

    if (!button) return;

    if (action === "start-battle") {
      startBattle(selectedStage());
    } else if (action === "start-kakusei-event") {
      startBattle(KAKUSEI_STAGE);
    } else if (action === "select-stage") {
      state.selectedStageId = Number(button.dataset.stageId);
      renderDom(true);
    } else if (action === "next-stage") {
      state.selectedStageId = clamp(state.selectedStageId + 1, 1, STAGES.length);
      renderDom(true);
    } else if (action === "use-skill") {
      useSkill(button.dataset.skillId, button.dataset.allyId);
      renderDom(true);
    } else if (action === "manual-attack") {
      manualAttack();
      renderDom(true);
    } else if (action === "primary-skill") {
      const ally = activeBattleAlly();
      const skill = ally ? activeSkillForAlly(ally) : null;
      if (ally && skill) useSkill(skill.id, ally.id);
      renderDom(true);
    } else if (action === "pause") {
      if (state.battle) state.battle.paused = !state.battle.paused;
      renderDom(true);
    } else if (action === "advance-dialogue") {
      advanceBattleDialogue();
      renderDom(true);
    } else if (action === "auto-skill") {
      state.autoSkill = !state.autoSkill;
      renderDom(true);
    } else if (action === "drone") {
      useDroneSupport();
      renderDom(true);
    } else if (action === "retreat") {
      retreatBattle();
      renderDom(true);
    } else if (action === "logistics") {
      buyLogistics(button.dataset.item);
      renderDom(true);
    } else if (action === "save") {
      saveGame();
      renderDom(true);
    } else if (action === "reset") {
      if (window.confirm("本当にデータを初期化して最初から始めますか？")) {
        resetSave();
        renderDom(true);
      }
    } else if (action === "new-game-plus") {
      startNewGamePlus();
    } else if (action === "go-ally-select") {
      state.battle = null;
      state.joinAllySelectPhase = true;
      state.selectedAllyId = "";
      setView("map");
      renderDom(true);
    } else if (action === "close-join-card") {
      state.showJoinCardAlly = null;
      if (state.pendingRestartOnClose) {
        state.pendingRestartOnClose = false;
        const stage = state.pendingRestartStage;
        state.pendingRestartStage = null;
        state.selectedStageId = 1;
        addLog("最初のステージの戦闘準備画面に戻ります。");
        setView("map");
        renderDom(true);
      } else {
        setView("map");
        renderDom(true);
      }
    } else if (action === "continue-map") {
      state.battle = null;
      setView("map");
    } else if (action === "level-up") {
      levelUpAlly(button.dataset.allyId);
      renderDom(true);
    } else if (action === "heal-ally") {
      healAlly(button.dataset.allyId);
      renderDom(true);
    } else if (action === "show-skill-effect") {
      const skill = skillById(button.dataset.skillId);
      if (skill) {
        alert(`${skill.name}\n\n${skill.description || "効果情報はありません。"}`);
      }
    } else if (action === "heal-all") {
      healAllAllies();
      renderDom(true);
    } else if (action === "char-pick") {
      confirmCharSelect(button.dataset.allyId);
      renderDom(true);
    }
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CW,
      y: ((event.clientY - rect.top) / rect.height) * CH
    };
  }

  function handleCanvasClick(event) {
    if (battlePointer.moved) {
      battlePointer.moved = false;
      return;
    }
    const { x, y } = canvasPoint(event);

    // 加入オーバーレイ表示中はタップで閉じる
    if (state.showJoinCardAlly) {
      state.showJoinCardAlly = null;
      if (state.pendingRestartOnClose) {
        state.pendingRestartOnClose = false;
        const stage = state.pendingRestartStage;
        state.pendingRestartStage = null;
        state.selectedStageId = 1;
        addLog("最初のステージの戦闘準備画面に戻ります。");
        setView("map");
        renderDom(true);
      } else {
        setView("map");
        renderDom(true);
      }
      return;
    }

    // オープニング中はタップで次のセリフへ
    if (!state.openingDone) {
      advanceOpening();
      renderDom(true);
      return;
    }

    // キャラ選択フェーズ中（初回・時間巻き戻し後・ステージクリア後の仲間選択）
    if (!state.charSelectDone || state.timeRewindPhase || state.joinAllySelectPhase) {
      const picked = charPickAllyAtPoint(x, y);
      if (picked) {
        state.selectedAllyId = picked.id;
        renderDom(true);
      }
      return;
    }

    // 戦闘結果（リザルト）画面が表示されている時はタップで進む（会話ダイアログが無い場合のみ）
    if (state.view === "battle" && state.battle?.result && !state.battle.dialogue) {
      const result = state.battle.result;
      if (result.newGamePlus) {
        startNewGamePlus();
        return;
      }
      if (result.needsAllySelect) {
        state.battle = null;
        state.joinAllySelectPhase = true;
        state.selectedAllyId = "";
        setView("map");
        renderDom(true);
      } else {
        state.battle = null;
        setView("map");
        renderDom(true);
      }
      return;
    }

    if (state.view === "battle" && state.battle?.dialogue) {
      advanceBattleDialogue();
      renderDom(true);
      return;
    }

    if (state.view === "map") {
      const secretStage = secretStageAtCanvasPoint(x, y);
      if (secretStage) {
        startBattle(secretStage);
        renderDom(true);
        return;
      }

      let closest = null;
      let closestDist = 999;
      for (const stage of STAGES) {
        const point = stageCanvasPoint(stage);
        const dist = Math.hypot(x - point.x, y - point.y);
        if (dist < closestDist) {
          closest = stage;
          closestDist = dist;
        }
      }
      if (closest && closestDist < 34) {
        state.selectedStageId = closest.id;
        renderDom(true);
      }
    }
  }

  function secretStageAtCanvasPoint(x, y) {
    for (const stage of SECRET_STAGES) {
      if (!isSecretStageAvailable(stage)) continue;
      if (isStageCleared(stage)) continue;
      const point = stageCanvasPoint(stage);
      if (Math.hypot(x - point.x, y - point.y) <= SECRET_STAGE_TAP_RADIUS) {
        return stage;
      }
    }
    return null;
  }

  function handleBattlePointerDown(event) {
    if (state.view !== "battle" || !state.battle || state.battle.result || state.battle.dialogue) return;
    const point = canvasPoint(event);
    battlePointer.active = true;
    battlePointer.moved = false;
    battlePointer.lastX = point.x;
    battlePointer.lastY = point.y;
    canvas.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function handleBattlePointerMove(event) {
    if (!battlePointer.active || state.view !== "battle" || !state.battle || state.battle.result || state.battle.dialogue) return;
    const point = canvasPoint(event);
    const dx = point.x - battlePointer.lastX;
    const dy = point.y - battlePointer.lastY;
    if (Math.hypot(dx, dy) > 1) {
      nudgeBattleMove(dx, dy);
      battlePointer.moved = true;
    }
    battlePointer.lastX = point.x;
    battlePointer.lastY = point.y;
    event.preventDefault();
  }

  function handleBattlePointerUp(event) {
    if (!battlePointer.active) return;
    battlePointer.active = false;
    canvas.releasePointerCapture?.(event.pointerId);
  }

  function handleBattleWheel(event) {
    if (state.view !== "battle" || !state.battle || state.battle.result || state.battle.dialogue) return;
    nudgeBattleMove(event.deltaX * 0.45, event.deltaY * 0.45);
    event.preventDefault();
  }

  function movementKey(key) {
    const normalized = key.length === 1 ? key.toLowerCase() : key;
    return {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      a: "left",
      d: "right",
      w: "up",
      s: "down"
    }[normalized] || null;
  }

  function handleBattleKeyDown(event) {
    if (state.view !== "battle" || !state.battle || state.battle.result || state.battle.dialogue) return;

    const normalizedKey = event.key.toLowerCase();
    if (normalizedKey === "z") {
      manualAttack();
      renderDom(true);
      event.preventDefault();
      return;
    }
    if (normalizedKey === "x") {
      const ally = activeBattleAlly();
      const skill = ally ? activeSkillForAlly(ally) : null;
      if (ally && skill) {
        useSkill(skill.id, ally.id);
        renderDom(true);
      }
      event.preventDefault();
      return;
    }

    const key = movementKey(event.key);
    if (!key) return;
    battleKeys.add(key);
    const step = 16;
    if (key === "left") nudgeBattleMove(-step, 0);
    if (key === "right") nudgeBattleMove(step, 0);
    if (key === "up") nudgeBattleMove(0, -step);
    if (key === "down") nudgeBattleMove(0, step);
    event.preventDefault();
  }

  function handleBattleKeyUp(event) {
    const key = movementKey(event.key);
    if (!key) return;
    battleKeys.delete(key);
    if (state.view === "battle") event.preventDefault();
  }

  function activeBattleAlly() {
    const battle = state.battle;
    if (!battle) return selectedAlly();
    return playableAllies().find((ally) => ally.id === battle.activeAllyId) || selectedAlly();
  }

  function activeSkillForAlly(ally) {
    return (ally?.skillIds || [])
      .map(skillById)
      .find((skill) => skill && skill.kind === "active");
  }

  function ensureActiveBattleAlly() {
    const battle = state.battle;
    if (!battle) return null;
    let ally = activeBattleAlly();
    if (ally && ally.hp > 0) return ally;

    ally = playableAllies().find((item) => item.hp > 0) || null;
    if (!ally) return null;
    battle.activeAllyId = ally.id;
    state.selectedAllyId = ally.id;
    const x = Number.isFinite(battle.moveTargetX) ? battle.moveTargetX : 96;
    const y = Number.isFinite(battle.moveTargetY) ? battle.moveTargetY : 292;
    ally.battleX = x;
    ally.battleY = y;
    ally.visualDirection = "front";
    setBattleMoveTarget(x, y);
    addLog(`${ally.name} が前線に出ました。`);
    return ally;
  }

  function selectBattleAlly(allyId) {
    const battle = state.battle;
    const next = playableAllies().find((ally) => ally.id === allyId);
    if (!next) return;
    if (!battle || battle.result) {
      state.selectedAllyId = next.id;
      return;
    }
    if (next.hp <= 0) {
      addLog(`${next.name} は戦闘不能です。`);
      return;
    }

    const current = activeBattleAlly();
    const x = Number.isFinite(current?.battleX) ? current.battleX : battle.moveTargetX || 96;
    const y = Number.isFinite(current?.battleY) ? current.battleY : battle.moveTargetY || 292;
    next.battleX = x;
    next.battleY = y;
    next.visualDirection = current?.visualDirection || "front";
    next.moving = false;
    next.anim = "idle";
    next.animUntil = battle.elapsed + 0.25;
    battle.activeAllyId = next.id;
    state.selectedAllyId = next.id;
    setBattleMoveTarget(x, y);
    addParticle(x, y - 58, "CHANGE", "#55afd7", 0.75);
    addLog(`${next.name} に交代。`);
  }

  function setBattleMoveTarget(x, y) {
    const battle = state.battle;
    if (!battle) return;
    const bounds = allyBattleBounds();
    battle.moveTargetX = clamp(x, bounds.minX, bounds.maxX);
    battle.moveTargetY = clamp(y, bounds.minY, bounds.maxY);
  }

  function nudgeBattleMove(dx, dy) {
    const battle = state.battle;
    const ally = ensureActiveBattleAlly();
    if (!battle || !ally) return;
    const baseX = Number.isFinite(battle.moveTargetX) ? battle.moveTargetX : ally.battleX;
    const baseY = Number.isFinite(battle.moveTargetY) ? battle.moveTargetY : ally.battleY;
    setBattleMoveTarget(baseX + dx, baseY + dy);
  }

  function updateKeyboardMovement(dt) {
    if (battleKeys.size === 0) return;
    const ally = ensureActiveBattleAlly();
    if (!ally) return;
    let dx = 0;
    let dy = 0;
    if (battleKeys.has("left")) dx -= 1;
    if (battleKeys.has("right")) dx += 1;
    if (battleKeys.has("up")) dy -= 1;
    if (battleKeys.has("down")) dy += 1;
    const mag = Math.hypot(dx, dy);
    if (!mag) return;
    const speed = 158 + ally.stats.speed * 0.42;
    nudgeBattleMove((dx / mag) * speed * dt, (dy / mag) * speed * dt);
  }

  function isSingleBossStage(stage) {
    return !!(stage?.secretBossAllyId || stage?.finalBoss);
  }

  function createBattleDialogue(dialogueInput, defaultSpeaker, options = {}) {
    if (!dialogueInput) return null;
    const finalButtonLabel = options.finalButtonLabel || "進む";
    const nextButtonLabel = options.nextButtonLabel || "次へ";
    const releasePauseOnFinal = !!options.releasePauseOnFinal;
    const list = Array.isArray(dialogueInput)
      ? dialogueInput.map((item) => typeof item === "string" ? { speaker: defaultSpeaker, text: item } : item)
      : [{ speaker: defaultSpeaker, text: dialogueInput }];
    const first = list[0];
    const isLast = list.length === 1;
    return {
      dialogues: list,
      dialogueIndex: 0,
      speaker: first.speaker || defaultSpeaker,
      text: first.text,
      buttonLabel: isLast ? finalButtonLabel : nextButtonLabel,
      finalButtonLabel,
      nextButtonLabel,
      releasePause: isLast && releasePauseOnFinal,
      releasePauseOnFinal
    };
  }

  function createStageBoss(stage) {
    if (stage.finalBoss) return createFinalBoss(stage);
    if (stage.secretBossAllyId) return createSecretBoss(stage);
    return null;
  }

  function startBattle(stage, options = {}) {
    if (isStageCleared(stage)) {
      addLog("このステージはすでに制圧済みです。");
      return;
    }
    ensureSelectedAllyUnlocked();
    const allies = playableAllies();
    const positions = allyPositions(allies.length);
    allies.forEach((ally, index) => {
      const home = positions[index] || { x: 70 + (index % 5) * 62, y: index < 5 ? 184 : 372 };
      // HPはステージ間で引き継ぐ（skipHpResetの場合はconfirmCharSelectで全回復済み）
      ally.shield = 0;
      ally.attackTimer = index * 0.18;
      ally.cooldowns = {};
      ally.buffs = {};
      ally.skillGauge = 0;
      ally.homeX = home.x;
      ally.homeY = home.y;
      ally.battleX = home.x;
      ally.battleY = home.y;
      ally.visualDirection = "front";
      ally.movePhase = index * 0.73;
      ally.moving = false;
      ally.anim = "idle";
      ally.animUntil = 0;
    });

    const lead = selectedAlly();
    const leadX = 96;
    const leadY = 292;
    if (lead) {
      lead.battleX = leadX;
      lead.battleY = leadY;
      lead.homeX = leadX;
      lead.homeY = leadY;
    }

    const bossEnemy = createStageBoss(stage);
    let maxWave = bossEnemy ? 1 : clamp(stage.rank + 2, 3, 5);
    let waveTarget = currentWaveTarget({ stage, wave: 1 });
    if (stage.id === "hehehe-kakusei") {
      maxWave = 1;
      waveTarget = 5;
    }

    const introDialogue = createBattleDialogue(stage.introDialogue, stage.dialogueSpeaker || "LINE", {
      finalButtonLabel: "戦闘開始",
      releasePauseOnFinal: true
    });
    state.battle = {
      stage,
      wave: 1,
      maxWave,
      elapsed: 0,
      spawnTimer: bossEnemy ? 999 : 0.2,
      spawned: bossEnemy ? 1 : 0,
      killed: 0,
      waveTarget: waveTarget,
      enemies: bossEnemy ? [bossEnemy] : [],
      particles: [],
      projectiles: [],
      baseHp: 12500,
      baseMaxHp: 12500,
      activeAllyId: lead?.id || allies[0]?.id,
      moveTargetX: leadX,
      moveTargetY: leadY,
      paused: !!introDialogue,
      dialogue: introDialogue,
      result: null
    };

    state.view = "battle";
    addLog(`${stage.name} へ出撃しました。`);
    if (introDialogue) addLog(`${introDialogue.speaker}: ${introDialogue.text}`);
    setView("battle");
  }

  function advanceBattleDialogue() {
    const battle = state.battle;
    if (!battle?.dialogue) return;
    const dialogue = battle.dialogue;

    // 複数ダイアログの進行
    if (dialogue.dialogues && dialogue.dialogueIndex < dialogue.dialogues.length - 1) {
      dialogue.dialogueIndex += 1;
      const nextD = dialogue.dialogues[dialogue.dialogueIndex];
      dialogue.speaker = nextD.speaker;
      dialogue.text = nextD.text;
      const isLastDialogue = dialogue.dialogueIndex === dialogue.dialogues.length - 1;
      dialogue.buttonLabel = isLastDialogue ? (dialogue.finalButtonLabel || "進む") : (dialogue.nextButtonLabel || "次へ");
      dialogue.releasePause = isLastDialogue && !!dialogue.releasePauseOnFinal;
      addLog(`${dialogue.speaker}: ${dialogue.text}`);
      return;
    }

    const isSageRestart = dialogue.sageRestart;
    const releasePause = dialogue.releasePause;
    battle.dialogue = null;
    if (isSageRestart) {
      // 時間巻き戻しフェーズへ移行
      state.timeRewindPhase = true;
      state.pendingRestartStage = battle.stage;
      state.battle = null;
      state.view = "map";
      // アンロックキャラをリセット
      state.unlockedAllyIds.clear();
      state.selectedAllyId = "";
      // クリアしたステージを初期化し、解放ステージIDと選択ステージを1に戻す
      state.clearedStages.clear();
      state.unlockedStageId = 1;
      state.selectedStageId = 1;
    } else if (releasePause && !battle.result) {
      battle.paused = false;
    }
  }

  function retreatBattle() {
    if (!state.battle || state.battle.result) return;
    state.resources.energy = Math.max(0, state.resources.energy - 120);
    state.battle.result = {
      victory: false,
      title: "撤退",
      message: "補給線を維持しながら戦場を離脱しました。Energyを120消費。"
    };
    addLog("全軍撤退しました。");
  }

  function finishBattle(victory) {
    const battle = state.battle;
    if (!battle || battle.result) return;

    if (victory) {
      if (battle.stage.id === "hehehe-kakusei") {
        state.heheheheheAwakened = true;
        state.clearedStages.add(KAKUSEI_STAGE.id);
        applyHeheheheKakusei();
        battle.result = {
          victory: true,
          title: "覚醒完了",
          message: "へへへへへが覚醒しました！",
          joinAlly: null,
          needsAllySelect: false
        };
        addLog("へへへへへが覚醒し、新たな力を手に入れました！");
        saveGame();
        return;
      }

      const reward = battle.stage.reward;
      state.resources.wfi += reward.wfi;
      state.resources.energy = Math.min(15000, state.resources.energy + reward.energy);
      state.resources.food += reward.food;
      state.clearedStages.add(battle.stage.id);
      let joinedAlly = null;
      let needsAllySelect = false;
      if (battle.stage.unlockAllyId) {
        joinedAlly = unlockAlly(battle.stage.unlockAllyId);
      } else if (!battle.stage.secret) {
        // 通常ステージクリア時、まだアンロックされていない隠しキャラ以外の通常キャラを自分で選べるようにする
        const lockedNormalAllies = state.allies.filter(
          (ally) => !SECRET_UNLOCK_ALLY_IDS.has(ally.id) && !isAllyUnlocked(ally.id)
        );
        if (lockedNormalAllies.length > 0) {
          needsAllySelect = true;
        }
      }
      if (!battle.stage.secret) {
        state.unlockedStageId = Math.max(state.unlockedStageId, clamp(battle.stage.id + 1, 1, STAGES.length));
      }
      const resultTitle = battle.stage.finalBoss
        ? "クリア"
        : (needsAllySelect ? "仲間選択" : (joinedAlly ? "仲間加入" : "勝利"));
      const resultMessage = battle.stage.finalBoss
        ? `ダークリーヴ２２を撃破。地球は守られました。WFI +${reward.wfi} / Energy +${reward.energy} / 食料 +${reward.food}`
        : `WFI +${reward.wfi} / Energy +${reward.energy} / 食料 +${reward.food}${joinedAlly ? ` / ${joinedAlly.name} 加入` : (needsAllySelect ? " / 新たな仲間を選択可能になりました！" : "")}`;
      battle.result = {
        victory: true,
        title: resultTitle,
        message: resultMessage,
        joinAlly: joinedAlly ? allyJoinProfile(joinedAlly) : null,
        needsAllySelect: needsAllySelect,
        newGamePlus: !!battle.stage.finalBoss,
        clearScreen: !!battle.stage.finalBoss,
        clearImage: battle.stage.finalBoss ? CLEAR_RESULT_IMAGE : "",
        tapped: false
      };
      if (battle.stage.finalBoss) {
        loadImage(CLEAR_RESULT_IMAGE).then(() => renderDom(true));
      }
      if (battle.stage.clearDialogue) {
        battle.dialogue = createBattleDialogue(
          battle.stage.clearDialogue,
          battle.stage.dialogueSpeaker || joinedAlly?.name || "LINE",
          { finalButtonLabel: battle.stage.finalBoss ? "クリア画面へ" : "閉じる", releasePauseOnFinal: false }
        );
        addLog(`${battle.dialogue.speaker}: ${battle.dialogue.text}`);
      }
      addLog(`${battle.stage.name} を撃破しました。`);
      saveGame();
    } else {
      if (battle.stage.id === "hehehe-kakusei") {
        addLog("覚醒の試練に失敗しました。");
        battle.result = {
          victory: false,
          title: "敗北",
          message: "試練を乗り越えられませんでした。部隊を鍛え直して再挑戦しましょう。"
        };
        battle.paused = false;
        return;
      }

      // 三賢人の時間巻き戻し演出を起動
      addLog(`${battle.stage.name} で全滅しました。`);
      battle.result = { victory: false, title: "全滅", message: "三賢人が時間を巻き戻します...", sageRestart: true };
      battle.paused = true;
      battle.dialogue = {
        speaker: "三賢人",
        text: SAGE_RESTART_DIALOGUE,
        buttonLabel: "時間を戻す",
        releasePause: false,
        sageRestart: true
      };
    }
  }

  function unlockAlly(allyId) {
    const ally = allyById(allyId);
    if (!ally || isAllyUnlocked(ally.id)) return null;
    state.unlockedAllyIds.add(ally.id);
    ally.hp = ally.maxHp || ally.stats.hp;
    ally.skillGauge = 0;
    state.selectedAllyId = ally.id;
    addLog(`${ally.name} が味方になりました。`);
    return ally;
  }

  function allyJoinProfile(ally) {
    const primarySkill = skillById(ally.primarySkillId);
    const feature = [ally.job, ally.roleLabel].filter(Boolean).join(" / ");
    const description = ally.personality
      || ally.attackDescription
      || `${ally.roleLabel || "前線支援"}を得意とする${ally.job || "新しい仲間"}。${primarySkill ? `${primarySkill.name}で戦況を動かします。` : ""}`;
    return {
      id: ally.id,
      name: ally.name,
      portrait: ally.assets?.portrait || ally.assets?.defaultSprite,
      feature,
      description,
      quote: ally.quote || "",
      stats: `HP ${formatNum(ally.stats.hp)} / ATK ${formatNum(ally.stats.attack)} / DEF ${formatNum(ally.stats.defense)} / SPD ${formatNum(ally.stats.speed)}`
    };
  }

  function currentWaveTarget(battle) {
    if (isSingleBossStage(battle.stage)) return 1;
    const rank = battle.stage.rank;
    const base = 5 + rank * 1.5 + (battle.wave - 1) * 1.5;
    let target = Math.round(base * 1.2 + rank * 0.5 + battle.wave);
    if (rank <= 4) {
      target = Math.round(target * 0.6);
    } else if (rank <= 10) {
      target = Math.round(target * 0.8);
    }
    return clamp(target, 5, 30);
  }

  function enemyActiveLimit(battle) {
    const rank = battle.stage.rank;
    let limit = 6 + rank * 1.2 + battle.wave * 1.2;
    if (rank <= 4) {
      limit = Math.round(limit * 0.6);
    } else if (rank <= 10) {
      limit = Math.round(limit * 0.8);
    } else {
      limit = Math.round(limit);
    }
    return clamp(limit, 3, 20);
  }

  function enemySpawnBatchSize(battle) {
    const remaining = battle.waveTarget - battle.spawned;
    const openSlots = enemyActiveLimit(battle) - battle.enemies.length;
    if (remaining <= 0 || openSlots <= 0) return 0;
    const rankBonus = battle.stage.rank >= 3 ? 1 : 0;
    const waveBonus = battle.wave >= 3 ? 1 : 0;
    const surge = Math.random() < 0.45 + battle.stage.rank * 0.06 ? 1 : 0;
    return clamp(1 + rankBonus + waveBonus + surge, 1, Math.min(4, remaining, openSlots));
  }

  function enemySpawnInterval(battle, batchSize) {
    const pressure = 1.0 - battle.stage.rank * 0.075 - battle.wave * 0.035 - Math.max(0, batchSize - 1) * 0.06;
    return clamp(pressure, 0.34, 0.92);
  }

  function battleBounds() {
    return { minX: 34, maxX: 366, minY: 116, maxY: 468 };
  }

  function allyBattleBounds() {
    return { minX: 54, maxX: 366, minY: 154, maxY: 472 };
  }

  function clampToBattlefield(unit, margin = 0) {
    const bounds = battleBounds();
    unit.battleX = clamp(unit.battleX, bounds.minX + margin, bounds.maxX - margin);
    unit.battleY = clamp(unit.battleY, bounds.minY + margin, bounds.maxY - margin);
  }

  function clampAllyToBattlefield(ally) {
    const bounds = allyBattleBounds();
    ally.battleX = clamp(ally.battleX, bounds.minX, bounds.maxX);
    ally.battleY = clamp(ally.battleY, bounds.minY, bounds.maxY);
  }

  function isRangedAlly(ally) {
    return /ranged|midrange|rifle|beam|magic|throw|chain/.test(ally.attackType || "");
  }

  function usesProjectileAttack(ally) {
    return /ranged|midrange|rifle|beam|magic|throw|chain|golf|splash|hybrid/.test(ally.attackType || "");
  }

  function allyAttackRange(ally) {
    if (isRangedAlly(ally)) return 166;
    if ((ally.attackType || "").includes("hybrid")) return 118;
    return 76;
  }

  function moveToward(unit, targetX, targetY, speed, dt) {
    const dx = targetX - unit.battleX;
    const dy = targetY - unit.battleY;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return false;
    const step = Math.min(dist, speed * dt);
    unit.battleX += (dx / dist) * step;
    unit.battleY += (dy / dist) * step;
    return step > 0.2;
  }

  function battleUnitX(unit) {
    return Number.isFinite(unit.battleX) ? unit.battleX : unit.x;
  }

  function battleUnitY(unit) {
    return Number.isFinite(unit.battleY) ? unit.battleY : unit.y;
  }

  function setBattleUnitPosition(unit, x, y) {
    unit.battleX = x;
    unit.battleY = y;
    if (Object.prototype.hasOwnProperty.call(unit, "x")) unit.x = x;
    if (Object.prototype.hasOwnProperty.call(unit, "y")) unit.y = y;
  }

  function resolveBattleCrowding() {
    const battle = state.battle;
    if (!battle) return;
    const bounds = battleBounds();
    const units = [];

    const active = activeBattleAlly();
    if (active && active.hp > 0) {
      units.push({
        unit: active,
        team: "ally",
        radius: 27,
        weight: 1.45
      });
    }

    battle.enemies.forEach((enemy) => {
      if (enemy.hp <= 0) return;
      units.push({
        unit: enemy,
        team: "enemy",
        radius: enemy.elite ? 30 : 23,
        weight: enemy.elite ? 1.85 : 0.95
      });
    });

    for (let pass = 0; pass < 5; pass += 1) {
      for (let i = 0; i < units.length; i += 1) {
        for (let j = i + 1; j < units.length; j += 1) {
          const a = units[i];
          const b = units[j];
          const ax = battleUnitX(a.unit);
          const ay = battleUnitY(a.unit);
          const bx = battleUnitX(b.unit);
          const by = battleUnitY(b.unit);
          let dx = ax - bx;
          let dy = ay - by;
          let dist = Math.hypot(dx, dy);
          if (dist < 0.01) {
            const angle = ((i * 31 + j * 17 + pass * 13) % 360) * Math.PI / 180;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            dist = 1;
          }

          const crossTeamEase = a.team === b.team ? 1 : 0.95;
          const minDist = (a.radius + b.radius) * crossTeamEase;
          if (dist >= minDist) continue;

          const overlap = (minDist - dist) * 0.72;
          const nx = dx / dist;
          const ny = dy / dist;
          const totalWeight = a.weight + b.weight;
          const aMove = overlap * (b.weight / totalWeight);
          const bMove = overlap * (a.weight / totalWeight);

          const nextAx = clamp(ax + nx * aMove, bounds.minX + a.radius, bounds.maxX - a.radius);
          const nextAy = clamp(ay + ny * aMove, bounds.minY + a.radius, bounds.maxY - a.radius);
          const nextBx = clamp(bx - nx * bMove, bounds.minX + b.radius, bounds.maxX - b.radius);
          const nextBy = clamp(by - ny * bMove, bounds.minY + b.radius, bounds.maxY - b.radius);

          setBattleUnitPosition(a.unit, nextAx, nextAy);
          setBattleUnitPosition(b.unit, nextBx, nextBy);
        }
      }
    }
  }

  function createEnemy(battle, spawnIndex = battle.spawned) {
    const rank = battle.stage.rank;
    const wave = battle.wave;
    const pool = ["ashigaru", "ninja", "cavalry", "rifleman"];
    const elite = battle.wave === battle.maxWave && spawnIndex >= battle.waveTarget - 1;
    const type = elite ? "busho" : pool[Math.floor(Math.random() * pool.length)];
    const spriteIndex = elite ? STAGE_ENEMY_SLOT_COUNT - 1 : pool.indexOf(type);
    
    let baseHp = 200 + rank * 60 + wave * 40;
    if (rank <= 4) {
      if (battle.stage.id === 1 || battle.stage.id === 2) {
        baseHp = baseHp * 0.45;
      } else {
        baseHp = baseHp * 0.55;
      }
    } else if (rank <= 10) {
      baseHp = baseHp * 0.75;
    } else if (rank <= 13) {
      baseHp = baseHp * 0.9;
    }

    let baseAttack = elite ? 140 + rank * 25 : 50 + rank * 12;
    if (rank <= 4) {
      baseAttack = baseAttack * 0.55;
    } else if (rank <= 10) {
      baseAttack = baseAttack * 0.75;
    } else if (rank <= 13) {
      baseAttack = baseAttack * 0.9;
    }

    const bounds = battleBounds();
    const laneCount = 9;
    const lane = spawnIndex % laneCount;
    const laneStep = (bounds.maxY - bounds.minY) / (laneCount - 1);
    const y = clamp(bounds.minY + lane * laneStep + (Math.random() - 0.5) * 20, bounds.minY + 12, bounds.maxY - 12);
    const spawnX = clamp(bounds.maxX - 20 + Math.random() * 24 - (spawnIndex % 3) * 10, bounds.minX + 24, bounds.maxX - 4);
    const laneOffset = (lane - Math.floor(laneCount / 2)) * 9 + (Math.random() - 0.5) * 10;
    return {
      id: `enemy-${Date.now()}-${Math.random()}`,
      type,
      spriteKey: type,
      spriteIndex,
      spriteSeed: Math.random() * 10,
      engageSlot: spawnIndex % 14,
      x: spawnX,
      y,
      battleX: spawnX,
      battleY: y,
      laneOffset,
      maxHp: elite ? baseHp * 3.7 : baseHp * 1.24,
      hp: elite ? baseHp * 3.7 : baseHp * 1.24,
      attack: baseAttack,
      speed: elite ? 10 : 18 + Math.random() * 12,
      attackTimer: 1.2 + Math.random(),
      status: {},
      elite
    };
  }

  function createSecretBoss(stage) {
    const bounds = battleBounds();
    const x = clamp(334, bounds.minX + 28, bounds.maxX - 12);
    const y = clamp(302, bounds.minY + 32, bounds.maxY - 28);
    const maxHp = 5400 + stage.rank * 620;
    const bossAlly = allyById(stage.secretBossAllyId);
    const meleeOnly = bossAlly && !usesProjectileAttack(bossAlly);
    return {
      id: `${stage.id}-boss`,
      type: meleeOnly ? "ashigaru" : "busho",
      spriteKey: meleeOnly ? "ashigaru" : "busho",
      spriteIndex: STAGE_ENEMY_SLOT_COUNT - 1,
      allyBossId: stage.secretBossAllyId,
      meleeOnly,
      engageSlot: 7,
      x,
      y,
      battleX: x,
      battleY: y,
      laneOffset: 0,
      maxHp,
      hp: maxHp,
      attack: 185 + stage.rank * 28,
      speed: meleeOnly ? 18 : 8,
      attackTimer: 1.05,
      status: {},
      elite: true
    };
  }

  function createFinalBoss(stage) {
    const bounds = battleBounds();
    const x = clamp(300, bounds.minX + 40, bounds.maxX - 34);
    const y = clamp(324, bounds.minY + 72, bounds.maxY - 28);
    const maxHp = 36000;
    return {
      id: `${stage.id}-boss`,
      type: "busho",
      spriteKey: "darkrive22",
      spriteIndex: STAGE_ENEMY_SLOT_COUNT - 1,
      asset: stage.enemyAsset,
      finalBoss: true,
      finalBossPhase: 1,
      drawBox: { w: 176, h: 132 },
      engageSlot: 7,
      x,
      y,
      battleX: x,
      battleY: y,
      laneOffset: 0,
      maxHp,
      hp: maxHp,
      attack: 260,
      speed: 10,
      attackTimer: 0.85,
      status: {},
      elite: true
    };
  }

  function finalBossAttackProfile(enemy) {
    const ratio = enemy.maxHp ? enemy.hp / enemy.maxHp : 1;
    if (ratio <= 0.25) {
      return {
        phase: 4,
        label: "DARKRIVE OVERLOAD",
        color: "#ff4be8",
        attackMult: 1.45,
        interval: 0.48,
        range: 360,
        speed: 20,
        shots: 4,
        pulseDamage: 170,
        pulseRadius: 210
      };
    }
    if (ratio <= 0.5) {
      return {
        phase: 3,
        label: "PLANET BREAK",
        color: "#ff6b4b",
        attackMult: 1.25,
        interval: 0.62,
        range: 340,
        speed: 17,
        shots: 3,
        pulseDamage: 110,
        pulseRadius: 170
      };
    }
    if (ratio <= 0.75) {
      return {
        phase: 2,
        label: "Wefi DRAIN",
        color: "#b568ff",
        attackMult: 1.08,
        interval: 0.76,
        range: 330,
        speed: 14,
        shots: 2,
        pulseDamage: 0,
        pulseRadius: 0
      };
    }
    return {
      phase: 1,
      label: "DARK ORB",
      color: "#8f55ff",
      attackMult: 1,
      interval: 0.92,
      range: 320,
      speed: 10,
      shots: 1,
      pulseDamage: 0,
      pulseRadius: 0
    };
  }

  function updateFinalBossPhase(enemy) {
    const profile = finalBossAttackProfile(enemy);
    if (enemy.finalBossPhase !== profile.phase) {
      enemy.finalBossPhase = profile.phase;
      enemy.attackTimer = Math.min(enemy.attackTimer || profile.interval, 0.28);
      addLog(`ダークリーヴ２２の攻撃が変化: ${profile.label}`);
      addParticle(enemy.battleX, enemy.battleY - 120, profile.label, profile.color, 1.1);
    }
    enemy.speed = profile.speed;
    return profile;
  }

  function performFinalBossAttack(enemy, target, baseDamage, profile) {
    const offsets = {
      1: [0],
      2: [-28, 28],
      3: [-44, 0, 44],
      4: [-58, -18, 22, 62]
    }[profile.shots] || [0];

    offsets.forEach((offset, index) => {
      addEnemyProjectile(enemy, target, Math.round(baseDamage * (index === 0 ? 1 : 0.72)), {
        targetOffsetX: offset,
        targetOffsetY: index % 2 ? 14 : -10,
        delay: index * 0.07,
        color: profile.color,
        core: profile.phase >= 3 ? "#fff1ff" : "#ead9ff",
        size: profile.phase >= 3 ? 18 : 15,
        trail: profile.phase >= 3 ? 10 : 8,
        beam: profile.phase >= 3,
        arc: profile.phase >= 3 ? 0 : 0.08,
        startOffsetX: -42,
        startOffsetY: -86
      });
    });

    if (profile.pulseDamage > 0) {
      playableAllies().forEach((ally) => {
        if (ally.hp <= 0) return;
        const dist = Math.hypot(ally.battleX - enemy.battleX, ally.battleY - enemy.battleY);
        if (dist > profile.pulseRadius) return;
        const pulseDamage = Math.round(profile.pulseDamage * (profile.phase >= 4 ? 1.15 : 1));
        damageAlly(ally, pulseDamage);
        addParticle(ally.battleX, ally.battleY - 58, pulseDamage, profile.color, 0.72);
      });
      addParticle(enemy.battleX, enemy.battleY - 84, "DARK PULSE", profile.color, 0.75);
    }
  }

  function updateBattle(dt) {
    const battle = state.battle;
    if (!battle || battle.paused || battle.result) return;

    battle.elapsed += dt;
    battle.spawnTimer -= dt;
    battle.waveTarget = currentWaveTarget(battle);
    updateKeyboardMovement(dt);

    if (battle.spawned < battle.waveTarget && battle.spawnTimer <= 0) {
      const batchSize = enemySpawnBatchSize(battle);
      if (batchSize > 0) {
        for (let i = 0; i < batchSize; i += 1) {
          battle.enemies.push(createEnemy(battle, battle.spawned + i));
        }
        battle.spawned += batchSize;
        battle.spawnTimer = enemySpawnInterval(battle, batchSize);
      } else {
        battle.spawnTimer = 0.22;
      }
    }

    updateAllies(dt);
    updateEnemies(dt);
    resolveBattleCrowding();
    updateProjectiles(dt);
    updateParticles(dt);
    maybeAutoSkill();

    battle.enemies = battle.enemies.filter((enemy) => {
      if (enemy.hp > 0) return true;
      battle.killed += 1;
      state.resources.wfi += enemy.elite ? 25 : 6;
      addParticle(enemy.x, enemy.y - 26, enemy.elite ? "+25 WFI" : "+6", "#f4c75e", 1);
      return false;
    });

    if (battle.spawned >= battle.waveTarget && battle.enemies.length === 0) {
      if (battle.wave >= battle.maxWave) {
        finishBattle(true);
      } else {
        battle.wave += 1;
        battle.spawned = 0;
        battle.spawnTimer = 1.1;
        addLog(`Wave ${battle.wave} 接近。`);
      }
    }

    if (battle.baseHp <= 0 || playableAllies().every((ally) => ally.hp <= 0)) {
      finishBattle(false);
    }
  }

  function updateAllies(dt) {
    const battle = state.battle;
    if (!battle) return;

    playableAllies().forEach((ally) => {
      Object.keys(ally.cooldowns).forEach((skillId) => {
        ally.cooldowns[skillId] = Math.max(0, ally.cooldowns[skillId] - dt);
      });
    });

    const ally = ensureActiveBattleAlly();
    if (!ally || ally.hp <= 0) return;

    if (!Number.isFinite(ally.battleX) || !Number.isFinite(ally.battleY)) {
      ally.battleX = battle.moveTargetX || 96;
      ally.battleY = battle.moveTargetY || 292;
    }

    setBattleMoveTarget(
      Number.isFinite(battle.moveTargetX) ? battle.moveTargetX : ally.battleX,
      Number.isFinite(battle.moveTargetY) ? battle.moveTargetY : ally.battleY
    );

    ally.skillGauge = clamp((ally.skillGauge || 0) + dt * (7.5 + ally.stats.speed / 46), 0, 100);
    ally.attackTimer = Math.max(0, ally.attackTimer - dt);

    const moveSpeed = 130 + ally.stats.speed * 0.52;
    const beforeX = ally.battleX;
    const beforeY = ally.battleY;
    ally.moving = moveToward(ally, battle.moveTargetX, battle.moveTargetY, moveSpeed, dt);
    clampAllyToBattlefield(ally);
    const moveDx = ally.battleX - beforeX;
    const moveDy = ally.battleY - beforeY;
    if (Math.abs(moveDx) > 0.05) ally.facing = moveDx >= 0 ? 1 : -1;
    ally.moveAngle = Math.atan2(moveDy, moveDx || 0.001);
    if (Math.hypot(moveDx, moveDy) > 0.05) {
      ally.visualDirection = directionFromMotion(moveDx, moveDy, ally.visualDirection);
    }
    if (ally.moving && battle.elapsed >= ally.animUntil) ally.anim = "walk";
    if (!ally.moving && battle.elapsed >= ally.animUntil) {
      ally.anim = "idle";
    }
  }

  function directionFromMotion(dx, dy, fallback = "front") {
    if (Math.abs(dy) > Math.abs(dx) * 1.2) return dy < 0 ? "back" : "front";
    if (Math.abs(dx) > 0.05) return dx >= 0 ? "right" : "left";
    return fallback;
  }

  function manualAttack() {
    const battle = state.battle;
    const ally = ensureActiveBattleAlly();
    if (!battle || battle.result || battle.paused || !ally) return;
    if (ally.hp <= 0) {
      addLog(`${ally.name} は戦闘不能です。`);
      return;
    }
    if (ally.attackTimer > 0) {
      addLog("攻撃準備中です。");
      return;
    }

    const target = nearestEnemy(ally.battleX, ally.battleY);
    const range = allyAttackRange(ally);
    const dist = target ? Math.hypot(target.x - ally.battleX, target.y - ally.battleY) : 999;
    if (!target || dist > range) {
      addLog("敵が射程内にいません。");
      addParticle(ally.battleX, ally.battleY - 56, "MISS", "#f2cc7a", 0.65);
      ally.attackTimer = 0.28;
      return;
    }

    const mult = levelMultiplier(allyLevel(ally.id));
    let baseDamage = (ally.stats.attack * mult) * 0.62;
    if (ally.buffs.attack > 0) baseDamage *= 1.22;
    if (ally.id === "okuribito_chan") {
      baseDamage *= 1 + Math.min(0.35, (battle.elapsed || 0) * 0.005);
    }
    // 三すくみ属性補正
    baseDamage *= triangleMultiplier(allyRangeType(ally), enemyRangeType(target));
    const crit = Math.random() < (ally.buffs.lucky ? 0.24 : 0.1);
    const damage = baseDamage * (crit ? 1.85 : 1);
    target.hp -= damage;
    ally.skillGauge = clamp((ally.skillGauge || 0) + (crit ? 18 : 12), 0, 100);
    ally.facing = target.x >= ally.battleX ? 1 : -1;
    ally.attackTargetX = target.x;
    ally.attackTargetY = target.y;
    const effectPath = pickAllyProjectileAsset(ally, "attack") || pickAllyEffectAsset(ally, "attack");
    ally.activeEffectPath = effectPath;
    ally.activeEffectKind = "attack";
    ally.anim = "attack";
    ally.animUntil = battle.elapsed + 0.52;
    if (usesProjectileAttack(ally)) {
      addProjectile(ally, target, "attack", effectPath);
    }
    addParticle(target.x, target.y - 24, crit ? `CRIT ${Math.round(damage)}` : Math.round(damage), crit ? "#ffd24f" : "#f2f0dc", 0.7);

    if (ally.id === "kamado") {
      addParticle(ally.battleX + 26, ally.battleY - 42, "無駄無駄", "#8ef56e", 0.8);
    }

    ally.attackTimer = Math.max(0.32, 1.04 - ally.stats.speed / 180);
  }

  function updateEnemies(dt) {
    const battle = state.battle;
    for (const enemy of battle.enemies) {
      tickStatus(enemy, dt);
      if (enemy.status.sleep > 0 || enemy.status.stun > 0 || enemy.status.lock > 0) continue;

      enemy.battleX = Number.isFinite(enemy.battleX) ? enemy.battleX : enemy.x;
      enemy.battleY = Number.isFinite(enemy.battleY) ? enemy.battleY : enemy.y;
      const target = targetAlly(enemy);
      const finalBossProfile = enemy.finalBoss ? updateFinalBossPhase(enemy) : null;
      const isRanged = !enemy.meleeOnly && (enemy.type === "archer" || enemy.type === "rifleman" || enemy.type === "busho");
      const enemyRange = finalBossProfile
        ? finalBossProfile.range
        : (isRanged ? (enemy.type === "busho" ? 320 : enemy.type === "rifleman" ? 280 : 220) : (enemy.elite ? 120 : 100));
      const dist = target ? Math.hypot(enemy.battleX - target.battleX, enemy.battleY - target.battleY) : 999;
      if (target && dist <= enemyRange) {
        enemy.attackTimer -= dt;
        if (enemy.attackTimer <= 0) {
          // 三すくみ属性補正を適用して敵の攻撃ダメージを決定
          const triMult = triangleMultiplier(enemyRangeType(enemy), allyRangeType(target));
          const enemyDmg = Math.round(enemy.attack * triMult * (finalBossProfile?.attackMult || 1));
          if (finalBossProfile) {
            performFinalBossAttack(enemy, target, enemyDmg, finalBossProfile);
          } else if (isRanged) {
            // 遠距離攻撃の場合は、即座にダメージを与えず弾オブジェクト生成時にダメージ量を渡す
            addEnemyProjectile(enemy, target, enemyDmg);
          } else {
            // 近接攻撃の場合は即座にダメージを適用
            damageAlly(target, enemyDmg);
            addParticle(target.battleX, target.battleY - 52, enemyDmg, "#ff6b4b", 0.65);
            target.skillGauge = clamp((target.skillGauge || 0) + 5, 0, 100);
          }
          enemy.attackTimer = finalBossProfile ? finalBossProfile.interval : (enemy.elite ? 0.9 : 1.35);
        }
      } else {
        const speed = enemy.speed * (enemy.status.slow > 0 ? 0.45 : 1);
        if (target) {
          const slot = enemy.engageSlot || 0;
          const slotColumn = Math.floor(slot / 7);
          const slotRow = (slot % 7) - 3;
          const desiredX = target.battleX + enemyRange * 0.62 + slotColumn * 28 + (slot % 2 ? 8 : -6);
          const desiredY = clamp(target.battleY + slotRow * 22 + (enemy.laneOffset || 0) * 0.35, battleBounds().minY + 16, battleBounds().maxY - 16);
          moveToward(enemy, desiredX, desiredY, speed, dt);
        } else {
          enemy.battleX -= speed * dt;
        }
        const bounds = battleBounds();
        enemy.battleX = clamp(enemy.battleX, bounds.minX, bounds.maxX);
        enemy.battleY = clamp(enemy.battleY, bounds.minY, bounds.maxY);
        enemy.x = enemy.battleX;
        enemy.y = enemy.battleY;
        if (enemy.x <= bounds.minX + 0.5) {
          battle.baseHp -= enemy.attack * dt * 0.5;
        }
      }
    }
  }

  function tickStatus(enemy, dt) {
    for (const key of Object.keys(enemy.status)) {
      enemy.status[key] = Math.max(0, enemy.status[key] - dt);
    }
    if (enemy.status.poison > 0) {
      enemy.hp -= 18 * dt;
    }
  }

  function damageAlly(ally, amount) {
    if (ally.shield > 0) {
      const used = Math.min(ally.shield, amount);
      ally.shield -= used;
      amount -= used;
    }
    ally.hp = Math.max(0, ally.hp - amount);
    if (ally.hp <= 0) {
      addLog(`${ally.name} が戦闘不能。`);
    }
  }

  function targetAlly(enemy) {
    const ally = ensureActiveBattleAlly();
    return ally && ally.hp > 0 ? ally : null;
  }

  function enemyProjectileHitCandidates(projectile) {
    if (projectile.finalBoss) {
      return playableAllies().filter((ally) => ally.hp > 0);
    }
    const active = activeBattleAlly();
    return active && active.hp > 0 ? [active] : [];
  }

  function nearestEnemy(x, y) {
    const battle = state.battle;
    if (!battle || battle.enemies.length === 0) return null;
    return battle.enemies.reduce((best, enemy) => {
      const dist = Math.hypot(battleUnitX(enemy) - x, battleUnitY(enemy) - y);
      const bestDist = Math.hypot(battleUnitX(best) - x, battleUnitY(best) - y);
      return dist < bestDist ? enemy : best;
    }, battle.enemies[0]);
  }

  function useSkill(skillId, allyId) {
    const ally = playableAllies().find((item) => item.id === allyId);
    const skill = skillById(skillId);
    const battle = state.battle;
    if (!ally || !skill) return;
    if (!battle || battle.result) {
      addLog("戦闘中のみスキルを使えます。");
      return;
    }
    if (skill.kind !== "active") {
      addLog(`${skill.name} はパッシブです。`);
      return;
    }
    if (ally.hp <= 0) {
      addLog(`${ally.name} は戦闘不能です。`);
      return;
    }
    if (allyLevel(ally.id) < 3) {
      addLog(`${ally.name} はLv3以上になるとスキルが使えます（現在Lv${allyLevel(ally.id)}）。`);
      return;
    }
    if ((ally.skillGauge || 0) < 100) {
      addLog(`${ally.name} の技ゲージがまだ溜まっていません。`);
      return;
    }

    ally.skillGauge = 0;
    ally.cooldowns[skill.id] = 0;
    const target = nearestEnemy(ally.battleX, ally.battleY);
    if (target) {
      ally.facing = target.x >= ally.battleX ? 1 : -1;
      ally.attackTargetX = target.x;
      ally.attackTargetY = target.y;
    }
    ally.activeEffectPath = pickAllyEffectAsset(ally, "skill", skill);
    ally.activeEffectKind = "skill";
    ally.anim = "skill";
    ally.animUntil = battle.elapsed + 1.0;

    applySkillEffects(skill, ally);
    addLog(`${ally.name}: ${skill.name}`);

    if (ally.id === "kamado") {
      addLog(ally.quote);
      addParticle(ally.battleX + 28, ally.battleY - 58, "無駄無駄無駄無駄", "#9eff72", 1.15);
    }
  }

  function applySkillEffects(skill, ally) {
    const battle = state.battle;
    const targets = selectSkillTargets(skill, ally);
    
    // バクニキが加入（アンロック）している場合は効果を2倍にする
    const isBakunikiUnlocked = isAllyUnlocked("bakuniki");
    const skillMult = isBakunikiUnlocked ? 2 : 1;

    for (const effect of skill.effects || []) {
      if (effect.type === "damage") {
        const damageTargets = targets.slice(0, effect.area === "all_enemies" ? targets.length : Math.max(1, Math.min(targets.length, 5)));
        damageTargets.forEach((enemy) => {
          const mult = levelMultiplier(allyLevel(ally.id));
          // ダメージを2倍に補正
          const damage = effect.power * (1 + (ally.stats.attack * mult) / 1500) * skillMult;
          enemy.hp -= damage;
          addParticle(enemy.x, enemy.y - 28, Math.round(damage), "#ffe6a6", 0.8);
        });
        if (usesProjectileAttack(ally)) {
          const projectileAsset = pickAllyProjectileAsset(ally, "skill", skill) || pickAllyEffectAsset(ally, "skill", skill);
          damageTargets.slice(0, 6).forEach((enemy, index) => {
            addProjectile(ally, enemy, "skill", projectileAsset, {
              delay: index * 0.045,
              durationScale: 1.14,
              sizeScale: 1.16
            });
          });
        }
      } else if (effect.type === "status") {
        targets.forEach((enemy) => {
          if (Math.random() <= (effect.chance ?? 1)) {
            // 状態異常の付与時間を2倍に補正
            const duration = (effect.durationSec || 3) * skillMult;
            enemy.status[effect.statusId] = Math.max(enemy.status[effect.statusId] || 0, duration);
            addParticle(enemy.x, enemy.y - 46, statusLabel(effect.statusId), statusColor(effect.statusId), 0.9);
          }
        });
      } else if (effect.type === "debuff") {
        targets.forEach((enemy) => {
          // デバフの付与時間を2倍に補正
          const duration = (effect.durationSec || 5) * skillMult;
          enemy.status.slow = Math.max(enemy.status.slow || 0, duration);
        });
      } else if (effect.type === "heal") {
        const healTargets = effect.target === "lowest_hp_ally"
          ? [lowestHpAlly()]
          : playableAllies().filter((item) => item.hp > 0);
        healTargets.filter(Boolean).forEach((target) => {
          // 回復量を2倍に補正
          const healAmount = effect.power * skillMult;
          target.hp = Math.min(target.maxHp, target.hp + healAmount);
          addParticle(target.battleX, target.battleY - 48, `+${Math.round(healAmount)}`, "#72e981", 0.8);
        });
      } else if (effect.type === "gauge_gain") {
        const gaugeTargets = effect.target === "lowest_hp_ally"
          ? [lowestHpAlly()]
          : playableAllies().filter((item) => item.hp > 0);
        gaugeTargets.filter(Boolean).forEach((target) => {
          // ゲージ獲得量を2倍に補正
          const amount = effect.amount * skillMult;
          target.skillGauge = Math.min(100, (target.skillGauge || 0) + amount);
          addParticle(target.battleX + 22, target.battleY - 52, `+${Math.round(amount)}% 技`, "#79d7ff", 0.82);
        });
      } else if (effect.type === "shield") {
        const shieldTargets = effect.target === "lowest_hp_ally"
          ? [lowestHpAlly()]
          : playableAllies().filter((item) => item.hp > 0);
        shieldTargets.filter(Boolean).forEach((target) => {
          // シールド耐久値を2倍に補正
          const shieldPower = effect.power * skillMult;
          target.shield = Math.max(target.shield, shieldPower);
        });
      } else if (effect.type === "buff") {
        if (effect.stat === "attack" && effect.target === "self") {
          // バフの継続時間を2倍に補正
          const duration = (effect.durationSec || 8) * skillMult;
          ally.buffs.attack = Math.max(ally.buffs.attack || 0, duration);
        }
        if (effect.stat === "critical_rate") {
          playableAllies().forEach((target) => {
            // バフの継続時間を2倍に補正
            const duration = (effect.durationSec || 8) * skillMult;
            target.buffs.lucky = Math.max(target.buffs.lucky || 0, duration);
          });
        }
        if (effect.stat === "energy_efficiency") {
          // エネルギーの獲得量を2倍に補正
          const energyGain = 70 * skillMult;
          state.resources.energy = Math.min(15000, state.resources.energy + energyGain);
        }
      } else if (effect.type === "resource_gain") {
        // リソース獲得量を2倍に補正
        const gainAmount = effect.amount * skillMult;
        state.resources[effect.resource] = (state.resources[effect.resource] || 0) + gainAmount;
        addParticle(ally.battleX, ally.battleY - 60, `+${gainAmount} ${effect.resource.toUpperCase()}`, "#f0c461", 1);
      } else if (effect.type === "self_dot") {
        // 自傷ダメージはデメリットなので2倍化の対象外とする
        const drain = Math.abs(effect.amount || 0) * (effect.durationSec || 1) * ally.maxHp;
        ally.hp = Math.max(1, ally.hp - drain);
        addParticle(ally.battleX, ally.battleY - 56, `-${Math.round(drain)}`, "#ff755c", 0.8);
      } else if (effect.type === "cleanse") {
        playableAllies().forEach((target) => {
          target.buffs.poison = 0;
        });
      }
    }

    drawSkillImageBurst(skill, ally, targets);
  }

  function selectSkillTargets(skill, ally) {
    const battle = state.battle;
    if (!battle) return [];
    const enemies = battle.enemies.slice().sort((a, b) => Math.hypot(a.x - ally.battleX, a.y - ally.battleY) - Math.hypot(b.x - ally.battleX, b.y - ally.battleY));
    if (skill.target === "enemy_all" || skill.target === "enemy_all_ally_team") return enemies;
    if (skill.target === "enemy_area_ally_team") return enemies.slice(0, 6);
    if (skill.target === "enemy_line") return enemies.filter((enemy) => Math.abs(enemy.y - ally.battleY) < 110).slice(0, 5);
    return enemies.slice(0, 4);
  }

  function lowestHpAlly() {
    const alive = playableAllies().filter((ally) => ally.hp > 0);
    if (alive.length === 0) return null;
    return alive.reduce((lowest, ally) => (ally.hp / ally.maxHp < lowest.hp / lowest.maxHp ? ally : lowest), alive[0]);
  }

  function drawSkillImageBurst(skill, ally, targets) {
    const effectFrame = skill.assets?.effectFrames?.[0];
    const x = targets[0]?.x || ally.battleX + 90;
    const y = targets[0]?.y || ally.battleY - 50;
    addParticle(x, y, skill.name, "#f6d58c", 1.2, effectFrame);
  }

  function statusLabel(statusId) {
    return {
      sleep: "睡眠",
      stun: "気絶",
      poison: "毒",
      confusion: "混乱",
      lock: "ロック",
      pressure: "圧力",
      slow: "鈍化",
      flee: "逃走"
    }[statusId] || statusId;
  }

  function statusColor(statusId) {
    return {
      sleep: "#84b9ff",
      stun: "#ffd24f",
      poison: "#a4f26c",
      confusion: "#cd80ff",
      lock: "#ff8bd4",
      pressure: "#ff755c",
      slow: "#87d0ff",
      flee: "#ffb36c"
    }[statusId] || "#ffffff";
  }

  function useDroneSupport() {
    const battle = state.battle;
    if (!battle || battle.result) return;
    if (state.resources.energy < 120) {
      addLog("補給ドローンのEnergyが足りません。");
      return;
    }
    state.resources.energy -= 120;
    battle.enemies.forEach((enemy) => {
      enemy.hp -= 180;
      enemy.status.stun = Math.max(enemy.status.stun || 0, 1.2);
      addParticle(enemy.x, enemy.y - 28, "DRONE", "#78e7ff", 0.8);
    });
    addLog("補給ドローン支援を要請しました。");
  }

  function maybeAutoSkill() {
    if (!state.autoSkill || !state.battle || state.battle.enemies.length < 3) return;
    for (const ally of playableAllies()) {
      const activeSkill = (ally.skillIds || [])
        .map(skillById)
        .find((skill) => skill && skill.kind === "active");
      if (!activeSkill) continue;
      if (canUseSkill(ally) && ally.hp > 0) {
        useSkill(activeSkill.id, ally.id);
        break;
      }
    }
  }

  function buyLogistics(item) {
    const options = {
      energy: { costResource: "wfi", cost: 250, resource: "energy", amount: 600, label: "Energy" },
      food: { costResource: "wfi", cost: 160, resource: "food", amount: 28, label: "食料" },
      wfi: { costResource: "energy", cost: 600, resource: "wfi", amount: 200, label: "WFI" }
    };
    const option = options[item];
    if (!option) return;
    if (state.resources[option.costResource] < option.cost) {
      addLog(`${option.costResource === "energy" ? "Energy" : "WFI"}が足りません。`);
      return;
    }
    state.resources[option.costResource] -= option.cost;
    state.resources[option.resource] += option.amount;
    addLog(`${option.label} を補給しました。`);
  }

  function addParticle(x, y, text, color, ttl, imagePath = null) {
    const battle = state.battle;
    if (!battle) return;
    battle.particles.push({
      x,
      y,
      text: String(text),
      color,
      ttl,
      maxTtl: ttl,
      imagePath,
      vx: (Math.random() - 0.5) * 20,
      vy: -22 - Math.random() * 14
    });
  }

  function addProjectile(ally, target, kind = "attack", imagePath = null, options = {}) {
    const battle = state.battle;
    if (!battle || !ally || !target) return;
    const style = projectileStyleForAlly(ally, kind);
    const facing = ally.facing || (battleUnitX(target) >= ally.battleX ? 1 : -1);
    const startX = ally.battleX + facing * (kind === "skill" ? 22 : 18);
    const startY = ally.battleY - (kind === "skill" ? 56 : 46);
    const endX = battleUnitX(target);
    const endY = battleUnitY(target) - (target.elite ? 42 : 34);
    const dist = Math.hypot(endX - startX, endY - startY);
    const duration = clamp(
      style.duration * (options.durationScale || 1) * clamp(dist / 110, 0.82, 1.28),
      0.18,
      0.68
    );

    battle.projectiles.push({
      x1: startX,
      y1: startY,
      x2: endX,
      y2: endY,
      age: -(options.delay || 0),
      duration,
      arc: style.arc,
      color: style.color,
      core: style.core,
      size: style.size * (options.sizeScale || 1),
      trail: style.trail,
      lineWidth: style.lineWidth,
      beam: style.beam,
      spin: style.spin,
      imagePath,
      kind
    });
  }

  function addEnemyProjectile(enemy, target, damage, options = {}) {
    const battle = state.battle;
    if (!battle || !enemy || !target) return;

    let color = "#ff6b4b";
    let core = "#ffe3d9";
    let size = 8;
    let trail = 4;
    let beam = false;
    let arc = 0.12;

    if (enemy.type === "archer") {
      color = "#c035d8";
      core = "#f3d9ff";
      size = 12;
      trail = 4;
      arc = 0.28;
    } else if (enemy.type === "rifleman") {
      color = "#3bd8c0";
      core = "#d9fff3";
      size = 10;
      trail = 6;
      beam = true;
      arc = 0;
    } else if (enemy.type === "busho") {
      color = "#ff3b8c";
      core = "#ffd9e8";
      size = 16;
      trail = 8;
      beam = true;
      arc = 0;
    }
    color = options.color || color;
    core = options.core || core;
    size = options.size || size;
    trail = options.trail || trail;
    beam = Object.prototype.hasOwnProperty.call(options, "beam") ? options.beam : beam;
    arc = Object.prototype.hasOwnProperty.call(options, "arc") ? options.arc : arc;

    const startX = enemy.battleX + (options.startOffsetX ?? -18);
    const startY = enemy.battleY + (options.startOffsetY ?? -46);
    const endX = target.battleX + (options.targetOffsetX || 0);
    const endY = target.battleY - 34 + (options.targetOffsetY || 0);
    const dist = Math.hypot(endX - startX, endY - startY);
    const duration = clamp(0.32 * clamp(dist / 110, 0.82, 1.28), 0.18, 0.68);

    battle.projectiles.push({
      x1: startX,
      y1: startY,
      x2: endX,
      y2: endY,
      age: -(options.delay || 0),
      duration,
      arc,
      color,
      core,
      size,
      trail,
      lineWidth: size * 0.42,
      beam,
      spin: 0.12,
      imagePath: null,
      kind: "enemy_attack",
      damage,
      finalBoss: !!enemy.finalBoss,
      hasHit: false
    });
  }

  function projectileStyleForAlly(ally, kind) {
    const type = ally.attackType || "";
    const skillScale = kind === "skill" ? 1.18 : 1;
    const style = {
      color: "#ffe2a1",
      core: "#fff6cf",
      size: 26 * skillScale,
      arc: 12,
      duration: 0.34,
      trail: 5,
      lineWidth: 3,
      beam: false,
      spin: 0.7
    };

    if (type.includes("beam")) {
      Object.assign(style, { color: "#9af4ff", core: "#ffffff", size: 38 * skillScale, arc: 0, duration: 0.24, trail: 8, lineWidth: 5, beam: true, spin: 0.2 });
    } else if (type.includes("rifle")) {
      Object.assign(style, { color: "#ffad54", core: "#fff3a6", size: 18 * skillScale, arc: 0, duration: 0.22, trail: 8, lineWidth: 2.5, spin: 0.15 });
    } else if (type.includes("golf")) {
      Object.assign(style, { color: "#eaff9b", core: "#ffffff", size: 20 * skillScale, arc: 30, duration: 0.42, trail: 5, lineWidth: 3, spin: 1.4 });
    } else if (type.includes("magic")) {
      Object.assign(style, { color: "#88eaff", core: "#d7fbff", size: 32 * skillScale, arc: 20, duration: 0.38, trail: 6, lineWidth: 3.5, spin: 0.9 });
    } else if (type.includes("wfi") || ally.id === "kamado") {
      Object.assign(style, { color: "#9eff72", core: "#ffe15a", size: 30 * skillScale, arc: 16, duration: 0.36, trail: 6, lineWidth: 3.5, spin: 1.5 });
    } else if (type.includes("chain")) {
      Object.assign(style, { color: "#79f2cf", core: "#f6d56d", size: 28 * skillScale, arc: 10, duration: 0.35, trail: 6, lineWidth: 3.5, spin: 0.65 });
    } else if (type.includes("splash")) {
      Object.assign(style, { color: "#b978ff", core: "#9fff72", size: 30 * skillScale, arc: 22, duration: 0.39, trail: 5, lineWidth: 3.5, spin: 0.85 });
    } else if (type.includes("hybrid")) {
      Object.assign(style, { color: "#f7d269", core: "#fff5b6", size: 26 * skillScale, arc: 18, duration: 0.36, trail: 5, lineWidth: 3, spin: 1.1 });
    }

    return style;
  }

  function updateProjectiles(dt) {
    const battle = state.battle;
    if (!battle) return;
    battle.projectiles.forEach((projectile) => {
      projectile.age += dt;

      // 敵の遠距離攻撃弾であり、まだヒットしていない場合
      if (projectile.kind === "enemy_attack" && !projectile.hasHit && projectile.age >= 0) {
        // 弾の現在の進捗割合
        const t = clamp(projectile.age / projectile.duration, 0, 1);
        const p = projectilePoint(projectile, t);

        // 通常ステージでは画面上の前線キャラだけを判定し、控えには被弾させない。
        // ラスボス弾だけは全体攻撃演出として従来通り全員判定にする。
        const hitRadius = 24;
        for (const ally of enemyProjectileHitCandidates(projectile)) {
          const allyCenterX = ally.battleX;
          const allyCenterY = ally.battleY - 34; // キャラの腰・胸あたりの高さ

          const dist = Math.hypot(p.x - allyCenterX, p.y - allyCenterY);
          if (dist <= hitRadius) {
            // 当たり判定成功、ダメージとエフェクトを適用
            damageAlly(ally, projectile.damage);
            addParticle(ally.battleX, ally.battleY - 52, projectile.damage, "#ff6b4b", 0.65);
            ally.skillGauge = clamp((ally.skillGauge || 0) + 5, 0, 100);

            projectile.hasHit = true;
            // ヒットしたら弾の寿命を終了させて即座に消滅させる
            projectile.age = projectile.duration + 0.2;
            break;
          }
        }
      }
    });
    battle.projectiles = battle.projectiles.filter((projectile) => projectile.age <= projectile.duration + 0.16);
  }

  function updateParticles(dt) {
    const battle = state.battle;
    battle.particles.forEach((particle) => {
      particle.ttl -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    });
    battle.particles = battle.particles.filter((particle) => particle.ttl > 0);

    playableAllies().forEach((ally) => {
      Object.keys(ally.buffs).forEach((key) => {
        ally.buffs[key] = Math.max(0, ally.buffs[key] - dt);
      });
    });
  }

  function allyPositions(count = playableAllies().length) {
    if (count > 9) {
      const columns = Math.min(6, Math.ceil(count / 2));
      const rows = Math.ceil(count / columns);
      const gapX = Math.min(62, (CW - 68) / Math.max(1, columns - 1));
      const startX = (CW - gapX * (columns - 1)) / 2;
      const topY = rows > 2 ? 156 : 184;
      const gapY = rows > 2 ? 118 : 188;
      return Array.from({ length: count }, (_, index) => ({
        x: startX + (index % columns) * gapX,
        y: topY + Math.floor(index / columns) * gapY
      }));
    }

    return [
      { x: 68, y: 178 },
      { x: 145, y: 178 },
      { x: 222, y: 178 },
      { x: 68, y: 302 },
      { x: 145, y: 302 },
      { x: 222, y: 302 },
      { x: 68, y: 426 },
      { x: 145, y: 426 },
      { x: 222, y: 426 }
    ];
  }

  function loop(time) {
    if (!state.ready) return;
    const dt = Math.min(0.05, (time - (state.lastTime || time)) / 1000);
    state.lastTime = time;

    if (state.view === "battle") updateBattle(dt);
    renderCanvas();

    if (time - state.domTime > 250) {
      renderDom(false);
      state.domTime = time;
    }

    requestAnimationFrame(loop);
  }

  function renderCanvas() {
    ctx.clearRect(0, 0, CW, CH);
    if (!state.ready) {
      drawLoading();
      return;
    }
    // オープニング会話中
    if (!state.openingDone) {
      drawOpeningScreen();
      return;
    }
    // キャラ選択画面（初回、時間巻き戻し後、またはステージクリア後仲間選択）
    if (!state.charSelectDone || state.timeRewindPhase || state.joinAllySelectPhase) {
      drawCharPickScreen();
      return;
    }
    if (state.view === "map") {
      drawMap();
    } else if (state.view === "battle") {
      drawBattle();
    } else if (state.view === "roster") {
      drawRosterPreview();
    } else {
      drawLogisticsPreview();
    }

    // 加入オーバーレイ表示中（最前面に重ねる）
    if (state.showJoinCardAlly) {
      drawJoinResultOverlay({ joinAlly: state.showJoinCardAlly });
    }
  }

  function drawLoading() {
    ctx.fillStyle = "#080a0a";
    ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = "#f5edd7";
    ctx.font = "16px sans-serif";
    ctx.fillText("Loading...", 170, 280);
  }

  // オープニング画面の描画
  function drawOpeningScreen() {
    const boxY = CH - 192;
    const imageTop = 56;
    const imageBottom = boxY - 10;
    const imageAreaH = Math.max(1, imageBottom - imageTop);
    const imageAreaW = CW - 36;
    const bg = image("assets/characters/3kenzin.jpg");

    ctx.fillStyle = "#030508";
    ctx.fillRect(0, 0, CW, CH);

    if (bg) {
      const scale = Math.min(imageAreaW / bg.naturalWidth, imageAreaH / bg.naturalHeight);
      const drawW = bg.naturalWidth * scale;
      const drawH = bg.naturalHeight * scale;
      const drawX = (CW - drawW) / 2;
      const drawY = imageTop + (imageAreaH - drawH) / 2;
      ctx.drawImage(bg, drawX, drawY, drawW, drawH);
    } else {
      // 星空風エフェクト（フォールバック）
      const t = (state.lastTime || 0) / 1000;
      for (let i = 0; i < 48; i += 1) {
        const sx = ((i * 137 + 47) % CW);
        const sy = imageTop + ((i * 89 + 31) % imageAreaH);
        const alpha = 0.3 + 0.3 * Math.sin(t * 0.7 + i * 0.8);
        ctx.fillStyle = `rgba(200, 220, 255, ${alpha.toFixed(2)})`;
        ctx.fillRect(sx, sy, 1, 1);
      }
    }

    const step = Math.min(state.openingStep, OPENING_DIALOGUES.length - 1);
    const dialogue = OPENING_DIALOGUES[step];
    if (!dialogue) return;

    // タイトル
    ctx.fillStyle = "rgba(8, 12, 20, 0.82)";
    ctx.fillRect(0, 0, CW, 52);
    ctx.fillStyle = "#ffe2a1";
    ctx.font = "700 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("WeFi戦記 - 序章", CW / 2, 26);

    // ダイアログボックス
    ctx.fillStyle = "rgba(5, 8, 16, 0.93)";
    ctx.fillRect(14, boxY, CW - 28, 178);
    ctx.strokeStyle = "#55afd7";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(14, boxY, CW - 28, 178);

    // 話者名
    ctx.fillStyle = "#79d7ff";
    ctx.font = "700 15px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(dialogue.speaker, 28, boxY + 24);

    // セリフ
    ctx.fillStyle = "#f5edd7";
    ctx.font = "15px sans-serif";
    wrapCanvasText(dialogue.text, 28, boxY + 54, CW - 56, 21);

    // 進むボタン
    const isLast = state.openingStep >= OPENING_DIALOGUES.length - 1;
    ctx.fillStyle = "rgba(85, 175, 215, 0.22)";
    ctx.fillRect(CW - 144, boxY + 144, 124, 26);
    ctx.strokeStyle = "rgba(85, 175, 215, 0.85)";
    ctx.lineWidth = 1;
    ctx.strokeRect(CW - 144, boxY + 144, 124, 26);
    ctx.fillStyle = "#d9efff";
    ctx.font = "700 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(isLast ? "キャラを選ぶ →" : "次へ →", CW - 82, boxY + 161);

    // 進捗ドット
    for (let i = 0; i < OPENING_DIALOGUES.length; i += 1) {
      ctx.fillStyle = i === step ? "#ffe2a1" : "rgba(255, 226, 161, 0.3)";
      ctx.beginPath();
      ctx.arc(CW / 2 - (OPENING_DIALOGUES.length - 1) * 9 + i * 18, boxY + 14, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function chooseableAllies() {
    if (state.joinAllySelectPhase) {
      // 未アンロックの隠しキャラ以外の通常キャラクター
      return state.allies.filter((ally) => !SECRET_UNLOCK_ALLY_IDS.has(ally.id) && !isAllyUnlocked(ally.id));
    }
    // 隠しキャラ以外のすべてのキャラクター
    return state.allies.filter((ally) => !SECRET_UNLOCK_ALLY_IDS.has(ally.id));
  }

  // キャラ選択画面のレイアウト計算
  function charPickLayout() {
    const allies = chooseableAllies();
    const cols = 4;
    const tileW = 88;
    const tileH = 108;
    const gapX = (CW - cols * tileW) / (cols + 1);
    const startX = gapX + tileW / 2;
    const startY = 114;
    const rowGap = 10;
    return allies.map((ally, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (tileW + gapX);
      const y = startY + row * (tileH + rowGap);
      return { ally, x, y, w: tileW, h: tileH };
    });
  }

  // キャンバス座標から選択キャラを返す
  function charPickAllyAtPoint(px, py) {
    const layout = charPickLayout();
    for (const entry of layout) {
      const hw = entry.w / 2;
      const hh = entry.h / 2;
      if (px >= entry.x - hw && px <= entry.x + hw && py >= entry.y - hh && py <= entry.y + hh) {
        return entry.ally;
      }
    }
    // 確定ボタンの座標もチェック
    const btnY = CH - 50;
    if (px >= CW / 2 - 94 && px <= CW / 2 + 94 && py >= btnY && py <= btnY + 34) {
      const ally = state.selectedAllyId ? allyById(state.selectedAllyId) : null;
      if (ally) confirmCharSelect(ally.id);
    }
    return null;
  }

  // キャラ選択画面の描画
  function drawCharPickScreen() {
    ctx.fillStyle = "#020408";
    ctx.fillRect(0, 0, CW, CH);

    // ヘッダーバー
    ctx.fillStyle = "rgba(8, 12, 20, 0.88)";
    ctx.fillRect(0, 0, CW, 82);
    ctx.fillStyle = "#ffe2a1";
    ctx.font = "700 18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const title = state.joinAllySelectPhase
      ? "仲間に迎えるWefi戦士を選べ"
      : (state.timeRewindPhase ? "再出撃するWefi戦士を選べ" : "Wefi戦士を選べ");
    ctx.fillText(title, CW / 2, 30);
    ctx.fillStyle = "#79d7ff";
    ctx.font = "13px sans-serif";
    const subTitle = state.joinAllySelectPhase
      ? "未アンロックの戦士から1人を選択"
      : (state.timeRewindPhase ? "巧んで巻き戻し—全員HP全回復" : "隠しキャラ以外から1人を選択");
    ctx.fillText(subTitle, CW / 2, 56);

    // キャラタイル
    const layout = charPickLayout();
    layout.forEach(({ ally, x, y, w, h }) => {
      const isSelected = ally.id === state.selectedAllyId;
      const hw = w / 2;
      const hh = h / 2;

      // タイル背景
      ctx.fillStyle = isSelected ? "rgba(85, 175, 215, 0.28)" : "rgba(10, 18, 30, 0.88)";
      ctx.fillRect(x - hw, y - hh, w, h);
      ctx.strokeStyle = isSelected ? "#55afd7" : "rgba(216, 161, 60, 0.3)";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(x - hw, y - hh, w, h);

      // キャラスプライト
      drawSprite(ally.assets.defaultSprite, x, y + hh - 22, w - 6, h - 30, 1);

      // 名前
      ctx.fillStyle = isSelected ? "#ffe2a1" : "#f5edd7";
      ctx.font = isSelected ? "700 11px sans-serif" : "11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      const nameShort = Array.from(ally.name).length > 7 ? `${Array.from(ally.name).slice(0, 6).join("")}…` : ally.name;
      ctx.fillText(nameShort, x, y + hh - 5);

      // レベルバッジ
      const lv = allyLevel(ally.id);
      ctx.fillStyle = isSelected ? "#ffe2a1" : "rgba(85, 175, 215, 0.7)";
      ctx.font = "700 10px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`Lv${lv}`, x + hw - 3, y - hh + 12);
    });

    // 確定ボタン
    if (state.selectedAllyId) {
      const selAlly = allyById(state.selectedAllyId);
      if (selAlly) {
        const btnY = CH - 50;
        ctx.fillStyle = "rgba(85, 175, 215, 0.3)";
        ctx.fillRect(CW / 2 - 94, btnY, 188, 34);
        ctx.strokeStyle = "#55afd7";
        ctx.lineWidth = 2;
        ctx.strokeRect(CW / 2 - 94, btnY, 188, 34);
        ctx.fillStyle = "#d9efff";
        ctx.font = "700 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const rawBtnText = state.joinAllySelectPhase
          ? `${selAlly.name} を仲間に迎える！`
          : (state.timeRewindPhase
            ? `${selAlly.name} で再出撃！`
            : `${selAlly.name} を選ぶ！`);
        const btnText = Array.from(rawBtnText).length > 18 ? Array.from(rawBtnText).slice(0, 17).join("") + "…" : rawBtnText;
        ctx.fillText(btnText, CW / 2, btnY + 17);
      }
    }
  }

  function getMapRect() {
    const img = image(ASSETS.map);
    if (!img) return { x: 0, y: 0, w: CW, h: CH };
    const scale = Math.min(CW / img.naturalWidth, CH / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    return {
      x: (CW - w) / 2,
      y: (CH - h) / 2,
      w,
      h,
      sourceW: img.naturalWidth || STAGE_MAP_SOURCE.w,
      sourceH: img.naturalHeight || STAGE_MAP_SOURCE.h
    };
  }

  function drawMap() {
    ctx.fillStyle = "#03060d";
    ctx.fillRect(0, 0, CW, CH);
    const img = image(ASSETS.map);
    const rect = getMapRect();
    if (img) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
    ctx.fillStyle = "rgba(3, 5, 10, 0.05)";
    ctx.fillRect(0, 0, CW, CH);
    drawSecretStageGlows();
  }

  function drawSecretStageGlows() {
    SECRET_STAGES
      .filter((stage) => stage.revealWhenAvailable && isSecretStageAvailable(stage) && !isStageCleared(stage))
      .forEach((stage, index) => {
        const point = stageCanvasPoint(stage);
        const t = ((state.lastTime || performance.now()) / 1000) + index * 0.33;
        const pulse = (Math.sin(t * 3.2) + 1) / 2;
        const radius = 16 + pulse * 8;

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 7; i += 1) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius + i * 3.5, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${(t * 92 + i * 48) % 360}, 96%, 64%, ${0.68 - i * 0.065})`;
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }
        ctx.fillStyle = `hsla(${(t * 112) % 360}, 98%, 68%, 0.28)`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 10 + pulse * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
  }

  function rankColor(rank) {
    return ["#6bbb4d", "#4ca8df", "#a75ada", "#d85a35"][rank - 1] || "#6bbb4d";
  }

  function drawStagePin(stage, x, y) {
    const unlocked = isStageUnlocked(stage);
    const selected = stage.id === state.selectedStageId;
    const cleared = isStageCleared(stage);
    const radius = selected ? 19 : 15;
    const color = unlocked ? rankColor(stage.rank) : "#4a4e52";

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowBlur = selected ? 14 : 8;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
    ctx.fillStyle = selected ? "rgba(255, 226, 161, 0.3)" : "rgba(4, 6, 7, 0.72)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = selected ? 3 : 2;
    ctx.strokeStyle = selected ? "#ffe2a1" : cleared ? "#b2f299" : "#1a1f20";
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = unlocked ? "#d6a46a" : "#6d7276";
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.72, y - 2);
    ctx.lineTo(x - radius * 0.45, y - radius * 0.72);
    ctx.lineTo(x + radius * 0.45, y - radius * 0.72);
    ctx.lineTo(x + radius * 0.72, y - 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = unlocked ? "#e9c99f" : "#a3a8aa";
    ctx.beginPath();
    ctx.arc(x, y + 3, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#161717";
    ctx.fillRect(x - 6, y + 1, 4, 3);
    ctx.fillRect(x + 2, y + 1, 4, 3);
    ctx.fillRect(x - 2, y + 7, 4, 2);

    ctx.fillStyle = "#fff3c8";
    ctx.font = selected ? "700 14px sans-serif" : "700 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(stage.id), x, y - radius - 10);

    if (selected) {
      const label = stage.name.length > 5 ? `${stage.name.slice(0, 5)}…` : stage.name;
      ctx.fillStyle = "rgba(7, 9, 9, 0.86)";
      ctx.fillRect(x - 42, y + radius + 5, 84, 22);
      ctx.strokeStyle = "rgba(216, 161, 60, 0.7)";
      ctx.strokeRect(x - 42, y + radius + 5, 84, 22);
      ctx.fillStyle = "#ffe2a1";
      ctx.font = "700 13px sans-serif";
      ctx.fillText(label, x, y + radius + 17);
    }

    ctx.restore();
  }

  function stageCanvasPoint(stage) {
    const rect = getMapRect();
    const sourceW = rect.sourceW || STAGE_MAP_SOURCE.w;
    const sourceH = rect.sourceH || STAGE_MAP_SOURCE.h;
    return {
      x: rect.x + (stage.x / sourceW) * rect.w,
      y: rect.y + (stage.y / sourceH) * rect.h
    };
  }

  function mapHotspotLayout() {
    if (!mapHotspots) {
      return { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, signature: "no-layer" };
    }
    const canvasRect = canvas.getBoundingClientRect();
    const layerRect = mapHotspots.getBoundingClientRect();
    const scaleX = canvasRect.width / CW;
    const scaleY = canvasRect.height / CH;
    const offsetX = canvasRect.left - layerRect.left;
    const offsetY = canvasRect.top - layerRect.top;
    return {
      offsetX,
      offsetY,
      scaleX,
      scaleY,
      signature: [
        Math.round(offsetX * 10),
        Math.round(offsetY * 10),
        Math.round(canvasRect.width * 10),
        Math.round(canvasRect.height * 10)
      ].join(",")
    };
  }

  function stageHotspotPoint(stage, layout) {
    const point = stageCanvasPoint(stage);
    return {
      x: layout.offsetX + point.x * layout.scaleX,
      y: layout.offsetY + point.y * layout.scaleY
    };
  }

  function renderMapHotspots() {
    if (!mapHotspots) return;
    if (state.view !== "map") {
      mapHotspots.innerHTML = "";
      mapHotspots.dataset.signature = "";
      mapHotspots.hidden = true;
      return;
    }

    mapHotspots.hidden = false;
    const layout = mapHotspotLayout();
    const signature = [
      state.selectedStageId,
      state.unlockedStageId,
      Array.from(state.clearedStages).map(String).sort().join("-"),
      layout.signature
    ].join(":");
    if (mapHotspots.dataset.signature === signature) return;
    mapHotspots.dataset.signature = signature;

    mapHotspots.innerHTML = STAGES.map((stage) => {
      const point = stageHotspotPoint(stage, layout);
      const selected = stage.id === state.selectedStageId;
      const unlocked = isStageUnlocked(stage);
      const cleared = isStageCleared(stage);
      return `
        <button
          type="button"
          class="map-pin-button ${selected ? "is-selected" : ""} ${unlocked ? "is-unlocked" : "is-locked"} ${cleared ? "is-cleared" : ""}"
          style="left:${point.x}px; top:${point.y}px; --pin-color:${rankColor(stage.rank)};"
          data-action="select-stage"
          data-stage-id="${stage.id}"
          aria-label="${stage.id}. ${escapeHtml(stage.name)}"
          aria-pressed="${selected ? "true" : "false"}">
          <span class="map-pin-number">${stage.id}</span>
          <span class="map-pin-face" aria-hidden="true"><i></i></span>
        </button>
      `;
    }).join("");
  }

  function drawBattle() {
    const battle = state.battle;
    drawBattlefieldBackground();

    drawBattleTopUi();

    if (!battle) {
      ctx.fillStyle = "rgba(8, 10, 10, 0.76)";
      ctx.fillRect(38, 210, 344, 96);
      ctx.strokeStyle = "#d8a13c";
      ctx.strokeRect(38, 210, 344, 96);
      ctx.fillStyle = "#f5edd7";
      ctx.font = "700 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("出撃待ち", 210, 252);
      ctx.font = "14px sans-serif";
      ctx.fillText("ステージを選んで出撃", 210, 276);
      return;
    }

    drawBattleControlMarker();
    drawBattleUnits();
    drawProjectiles();
    drawActiveAllyActionOverlay();
    drawParticles();

    if (battle.result && !battle.result.sageRestart && !battle.dialogue) {
      drawResultOverlay(battle.result);
    }
    if (battle.dialogue) {
      drawDialogueOverlay(battle.dialogue);
    }
  }

  function drawBattleTopUi() {
    const battle = state.battle;
    ctx.fillStyle = "rgba(8, 10, 10, 0.78)";
    ctx.fillRect(8, 8, 164, 48);
    ctx.strokeStyle = "rgba(216, 161, 60, 0.75)";
    ctx.strokeRect(8, 8, 164, 48);
    ctx.fillStyle = "#f5edd7";
    ctx.font = "700 14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("本陣耐久", 18, 26);
    const hpRatio = battle ? battle.baseHp / battle.baseMaxHp : 1;
    drawMeter(18, 36, 132, 7, hpRatio, "#70d45e");

    if (!battle) return;
    ctx.fillStyle = "rgba(8, 10, 10, 0.78)";
    ctx.fillRect(274, 8, 138, 48);
    ctx.strokeRect(274, 8, 138, 48);
    ctx.fillStyle = "#f5edd7";
    ctx.fillText(`Wave ${battle.wave}/${battle.maxWave}`, 284, 27);
    drawMeter(284, 37, 108, 7, battle.spawned / Math.max(1, battle.waveTarget), "#55afd7");
  }

  function drawBattlefieldBackground() {
    const stage = state.battle?.stage || selectedStage();
    const bg = image(stage?.mapAsset || ASSETS.battle);
    ctx.fillStyle = "#080b0d";
    ctx.fillRect(0, 0, CW, CH);

    if (bg) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      drawCover(bg, 0, 0, CW, CH);
      ctx.restore();
    }

    const shade = ctx.createLinearGradient(0, 0, 0, CH);
    shade.addColorStop(0, "rgba(3, 4, 8, 0.14)");
    shade.addColorStop(0.55, "rgba(3, 4, 5, 0.02)");
    shade.addColorStop(1, "rgba(3, 4, 5, 0.24)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, CW, CH);

    ctx.fillStyle = "rgba(7, 10, 10, 0.58)";
    ctx.fillRect(0, 0, CW, 72);
    ctx.strokeStyle = "rgba(216, 161, 60, 0.45)";
    ctx.beginPath();
    ctx.moveTo(0, 72);
    ctx.lineTo(CW, 72);
    ctx.stroke();
  }

  function drawBattleControlMarker() {
    const battle = state.battle;
    if (!battle || battle.result) return;
    const ally = activeBattleAlly();
    if (!ally || ally.hp <= 0) return;
    const x = battle.moveTargetX || ally.battleX;
    const y = battle.moveTargetY || ally.battleY;
    ctx.save();
    ctx.strokeStyle = "rgba(85, 175, 215, 0.78)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + 4, 11, 0, Math.PI * 2);
    ctx.moveTo(x - 16, y + 4);
    ctx.lineTo(x - 7, y + 4);
    ctx.moveTo(x + 7, y + 4);
    ctx.lineTo(x + 16, y + 4);
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x, y - 4);
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x, y + 20);
    ctx.stroke();
    ctx.restore();
  }

  function drawBattleUnits() {
    const battle = state.battle;
    if (!battle) return;
    const allies = playableAllies();
    const positions = allyPositions(allies.length);
    const compact = allies.length > 9;
    const spriteW = compact ? 56 : 66;
    const spriteH = compact ? 76 : 88;
    const nameplateW = compact ? 62 : 68;
    const active = activeBattleAlly();
    const entries = [
      ...(active ? [{ kind: "ally", ally: active, index: allies.indexOf(active), y: battleUnitY(active) }] : []),
      ...battle.enemies.map((enemy) => ({ kind: "enemy", enemy, y: battleUnitY(enemy) }))
    ];

    entries.sort((a, b) => a.y - b.y).forEach((entry) => {
      if (entry.kind === "enemy") {
        drawEnemyUnit(entry.enemy);
      } else {
        drawAllyUnit(entry.ally, entry.index, positions, compact, spriteW, spriteH, nameplateW);
      }
    });
  }

  function drawAllies() {
    const allies = playableAllies();
    const positions = allyPositions(allies.length);
    const compact = allies.length > 9;
    const spriteW = compact ? 56 : 66;
    const spriteH = compact ? 76 : 88;
    const nameplateW = compact ? 62 : 68;
    allies
      .map((ally, index) => ({ ally, index }))
      .sort((a, b) => (a.ally.battleY || 0) - (b.ally.battleY || 0))
      .forEach(({ ally, index }) => {
        drawAllyUnit(ally, index, positions, compact, spriteW, spriteH, nameplateW);
      });
  }

  function drawAllyUnit(ally, index, positions, compact, spriteW, spriteH, nameplateW) {
    const pos = positions[index];
    if (!pos) return;
    if (!Number.isFinite(ally.battleX) || !Number.isFinite(ally.battleY)) {
      ally.battleX = pos.x;
      ally.battleY = pos.y;
    }
    const x = ally.battleX;
    const y = ally.battleY;

    const selected = ally.id === state.selectedAllyId;
    if (selected) {
      ctx.beginPath();
      ctx.ellipse(x, y + 4, compact ? 29 : 34, compact ? 10 : 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(85, 175, 215, 0.35)";
      ctx.fill();
    }

    const elapsed = state.battle?.elapsed || 0;
    const profile = allyRenderProfile(ally, compact);
    const frame = frameForAlly(ally, elapsed);
    const activeAnim = elapsed < ally.animUntil ? ally.anim : ally.moving ? "walk" : "idle";
    const pulse = activeAnim === "attack" || activeAnim === "skill"
      ? clamp((ally.animUntil - elapsed) / (activeAnim === "skill" ? 1 : 0.52), 0, 1)
      : 0;
    const bob = ally.moving ? Math.sin(elapsed * 14) * 1.15 : 0;
    const lunge = pulse ? (ally.facing || 1) * Math.sin((1 - pulse) * Math.PI) * (activeAnim === "skill" ? 8 : 5) : 0;

    ctx.save();
    ctx.fillStyle = ally.moving ? "rgba(85, 175, 215, 0.24)" : "rgba(0, 0, 0, 0.36)";
    ctx.beginPath();
    ctx.ellipse(x, y + 8, compact ? 20 : 24, compact ? 6 : 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (pulse && activeAnim === "attack" && ally.attackTargetX && ally.attackTargetY) {
      ctx.save();
      ctx.globalAlpha = 0.12 + pulse * 0.35;
      ctx.strokeStyle = "#ffe2a1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + lunge * 0.5, y - 34);
      ctx.quadraticCurveTo((x + ally.attackTargetX) / 2, Math.min(y, ally.attackTargetY) - 58, ally.attackTargetX, ally.attackTargetY - 24);
      ctx.stroke();
      ctx.restore();
    }

    const spriteOptions = {
      flip: allyShouldFlip(ally, profile, frame)
    };
    if (profile.preserveAspect) {
      spriteOptions.preserveAspect = true;
      spriteOptions.anchorXRatio = profile.anchorXRatio ?? 0.5;
    }
    if (activeAnim === "attack" && profile.attackPreserveAspect) {
      spriteOptions.preserveAspect = true;
      spriteOptions.anchorXRatio = profile.attackAnchorXRatio ?? 0.5;
    } else if (activeAnim === "skill" && profile.skillPreserveAspect) {
      spriteOptions.preserveAspect = true;
      spriteOptions.anchorXRatio = profile.skillAnchorXRatio ?? 0.5;
    } else if (ally.id === "nyannmichan" && activeAnim === "attack") {
      spriteOptions.preserveAspect = true;
      spriteOptions.anchorXRatio = 0.36;
    }

    drawCharacterSprite(frame, x + lunge, y + bob, profile.boxW, profile.boxH, ally.hp <= 0 ? 0.45 : 1, spriteOptions);

    drawAllyNameplate(ally, x, y + (compact ? 14 : 16), nameplateW);
    drawMeter(x - nameplateW / 2 + 2, y - (compact ? 84 : 96), nameplateW - 4, 5, ally.hp / ally.maxHp, ally.shield > 0 ? "#55afd7" : "#70d45e");
    drawMeter(x - nameplateW / 2 + 2, y - (compact ? 77 : 89), nameplateW - 4, 3, (ally.skillGauge || 0) / 100, "#55afd7");
  }

  function drawAllyNameplate(ally, x, y, width = 68) {
    const label = `${ally.order}. ${ally.name}`;
    const maxChars = width < 68 ? 9 : 10;
    const clipped = label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label;
    ctx.fillStyle = "rgba(5, 7, 7, 0.78)";
    ctx.fillRect(x - width / 2, y - 10, width, 17);
    ctx.strokeStyle = ally.id === state.selectedAllyId ? "rgba(85, 175, 215, 0.9)" : "rgba(216, 161, 60, 0.36)";
    ctx.strokeRect(x - width / 2, y - 10, width, 17);
    ctx.fillStyle = "#f6edce";
    ctx.font = "700 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(clipped, x, y - 1);
  }

  function drawActiveAllyActionOverlay() {
    const battle = state.battle;
    const ally = activeBattleAlly();
    if (!battle || !ally || ally.hp <= 0) return;
    const elapsed = battle.elapsed || 0;
    const activeAnim = elapsed < ally.animUntil ? ally.anim : null;
    if (activeAnim !== "attack" && activeAnim !== "skill") return;
    const pulse = clamp((ally.animUntil - elapsed) / (activeAnim === "skill" ? 1 : 0.52), 0, 1);
    if (!pulse) return;
    const lunge = (ally.facing || 1) * Math.sin((1 - pulse) * Math.PI) * (activeAnim === "skill" ? 8 : 5);
    drawAllyActionEffect(ally, ally.battleX, ally.battleY, pulse, activeAnim, lunge);
  }

  function allyRenderProfile(ally, compact) {
    const profile = ALLY_RENDER_PROFILES[ally.id] || {};
    if (ally.id === "hehehehehe" && state.heheheheheAwakened) {
      return {
        ...profile,
        nativeFacing: -1,
        boxW: compact ? 64 : 76,
        boxH: compact ? 92 : 108,
        preserveAspect: true,
        anchorXRatio: 0.5,
        attackPreserveAspect: true,
        attackAnchorXRatio: 0.42,
        skillPreserveAspect: true,
        skillAnchorXRatio: 0.5
      };
    }
    return {
      ...profile,
      nativeFacing: profile.nativeFacing || 1,
      boxW: profile.boxW || (compact ? 62 : 70),
      boxH: profile.boxH || (compact ? 82 : 92)
    };
  }

  function allyShouldFlip(ally, profile, frame = null) {
    if (ally.id === "shinji_wolf" && Object.values(ally.assets?.directions || {}).includes(frame)) return false;
    let nativeFacing = profile.nativeFacing || 1;
    // バクニキの攻撃およびスキルフレームは元画像が右向きであるため、基準の向きを右向き(1)として扱う
    if (ally.id === "bakuniki" && frame) {
      if (frame.includes("bakunikisheet_28") || frame.includes("bakunikisheet_29") ||
          frame.includes("bakunikisheet_30") || frame.includes("bakunikisheet_31") ||
          frame.includes("bakunikisheet_44") || frame.includes("bakunikisheet_45") ||
          frame.includes("bakunikisheet_46") || frame.includes("bakunikisheet_34")) {
        nativeFacing = 1;
      }
    }
    // 普通のへへへへへの歩行・攻撃・スキルフレームの向き基準を調整
    if (ally.id === "hehehehehe" && !state.heheheheheAwakened && frame) {
      if (frame.includes("attack_animation") || frame.includes("skill_animation")) {
        nativeFacing = 1;
      } else if (frame.includes("walking_animation")) {
        nativeFacing = -1;
      }
    }
    const facing = ally.facing || 1;
    return facing !== nativeFacing;
  }

  function pickAllyProjectileAsset(ally, kind, skill = null) {
    const effects = ally.assets?.effects || [];
    const signatures = ally.assets?.signatureItems || [];
    const skillFrames = skill?.assets?.effectFrames || [];
    const type = ally.attackType || "";
    const match = (paths, patterns) => paths.find((path) => patterns.some((pattern) => pattern.test(path)));

    if (kind === "skill" && skillFrames[0]) return skillFrames[0];
    if (type.includes("wfi") || ally.id === "kamado") {
      return match(signatures, [/coin/i, /w_coin/i])
        || match(effects, [/coin/i])
        || signatures[0]
        || effects[0]
        || null;
    }
    if (type.includes("rifle")) {
      return match(effects, [/muzzle/i, /attack/i, /atk/i])
        || match(signatures, [/rifle/i, /weapon/i])
        || effects[0]
        || null;
    }
    if (type.includes("golf")) {
      return match(signatures, [/cookie/i, /clover/i])
        || match(effects, [/clover/i, /cookie/i])
        || signatures[0]
        || effects[0]
        || null;
    }
    if (type.includes("magic")) {
      return match(effects, [/sleep/i, /moon/i, /magic/i, /zzz/i])
        || match(signatures, [/staff/i, /pillow/i])
        || effects[0]
        || null;
    }
    if (type.includes("beam")) {
      return match(effects, [/beam/i, /burst/i])
        || effects[0]
        || signatures[0]
        || null;
    }
    if (type.includes("chain")) {
      return match(signatures, [/chain/i, /lock/i, /coin/i])
        || match(effects, [/chain/i, /lock/i, /coin/i])
        || effects[0]
        || null;
    }
    if (type.includes("splash")) {
      return match(effects, [/attack/i, /spit/i, /splash/i])
        || effects[0]
        || signatures[0]
        || null;
    }
    if (type.includes("hybrid")) {
      return match(signatures, [/coin/i])
        || match(effects, [/coin/i, /glow/i])
        || effects[0]
        || null;
    }

    return effects[0] || signatures[0] || skillFrames[0] || null;
  }

  function pickAllyEffectAsset(ally, kind, skill = null) {
    const effects = ally.assets?.effects || [];
    const signatures = ally.assets?.signatureItems || [];
    const skillFrames = skill?.assets?.effectFrames || [];
    const has = (patterns) => effects.find((path) => patterns.some((pattern) => pattern.test(path)));

    if (kind === "attack") {
      if (ally.id === "shinji_wolf") return effects[0] || signatures[0] || null;
      return has([/attack/i, /atk/i, /muzzle/i, /impact/i, /burst/i, /explosion/i, /smash/i, /spit/i])
        || signatures[0]
        || effects[0]
        || skillFrames[0]
        || null;
    }

    return skillFrames[0]
      || has([/skill/i, /magic/i, /circle/i, /beam/i, /spirit/i, /sleep/i, /coin/i, /fountain/i, /pillar/i, /vortex/i, /eruption/i, /blessing/i])
      || effects[effects.length - 1]
      || signatures[0]
      || null;
  }

  function drawAllyActionEffect(ally, x, y, pulse, activeAnim, lunge) {
    if (!pulse || !ally.attackTargetX || !ally.attackTargetY) return;
    const t = 1 - pulse;
    const tx = ally.attackTargetX;
    const ty = ally.attackTargetY;
    const effectPath = ally.activeEffectPath || pickAllyEffectAsset(ally, activeAnim);

    ctx.save();
    if (activeAnim === "skill") {
      if (effectPath) {
        drawEffectSprite(effectPath, tx, ty - 30, 112 + t * 34, 112 + t * 34, 0.82 + pulse * 0.18);
        drawEffectSprite(effectPath, x, y - 44, 68 + t * 20, 68 + t * 20, 0.42 + pulse * 0.22);
      }
    } else {
      const dir = ally.facing || 1;
      if (usesProjectileAttack(ally)) {
        const style = projectileStyleForAlly(ally, "attack");
        const sx = x + dir * (18 + t * 6);
        const sy = y - 46;
        ctx.globalAlpha = 0.18 + pulse * 0.34;
        ctx.strokeStyle = style.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo((sx + tx) / 2, Math.min(sy, ty - 30) - 34, tx, ty - 32);
        ctx.stroke();
        ctx.globalAlpha = 0.5 + pulse * 0.36;
        ctx.fillStyle = style.core;
        ctx.strokeStyle = style.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, 9 + t * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (effectPath) {
          drawEffectSprite(effectPath, sx + dir * 3, sy, 42 + t * 12, 42 + t * 12, 0.45 + pulse * 0.2, { flip: dir < 0 });
        }
      } else {
        ctx.globalAlpha = 0.36 + pulse * 0.62;
        ctx.strokeStyle = "#ffe2a1";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(tx - dir * 9, ty - 28, 16 + t * 8, dir > 0 ? -1.15 : Math.PI + 1.15, dir > 0 ? 1.15 : Math.PI - 1.15);
        ctx.stroke();
        ctx.fillStyle = "#ffd24f";
        for (let i = 0; i < 4; i += 1) {
          const a = t * Math.PI * 2 + i * Math.PI / 2;
          ctx.beginPath();
          ctx.arc(tx + Math.cos(a) * (8 + t * 18), ty - 30 + Math.sin(a) * (6 + t * 14), 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        if (effectPath) {
          const effectX = tx - dir * (8 + t * 12);
          drawEffectSprite(effectPath, effectX, ty - 30, 72 + t * 18, 72 + t * 18, 0.82 + pulse * 0.18, { flip: dir < 0 });
        }
      }
    }
    ctx.restore();
  }

  function frameForAlly(ally, elapsed) {
    const rawAnimName = elapsed < ally.animUntil ? ally.anim : ally.moving ? "walk" : "idle";
    const animName = rawAnimName === "damage" ? (ally.moving ? "walk" : "idle") : rawAnimName;
    const directionalFrame = directionalFrameForAlly(ally, animName);
    if (directionalFrame) return directionalFrame;
    const anim = ally.assets.animations[animName] || ally.assets.animations.idle;
    const frames = anim?.frames?.length ? anim.frames : [ally.assets.defaultSprite];
    const fps = anim?.fps || 6;
    const index = Math.floor(elapsed * fps) % frames.length;
    return frames[index] || ally.assets.defaultSprite;
  }

  function directionalFrameForAlly(ally, animName) {
    if (ally.id !== "shinji_wolf") return null;
    if (animName !== "walk" && animName !== "idle") return null;
    const direction = ally.visualDirection || (ally.facing >= 0 ? "right" : "left");
    const directions = ally.assets?.directions || {};

    if (animName === "walk" && direction === "back") return directions.back || ally.assets.defaultSprite;
    if (animName === "walk" && direction === "front") return directions.front || ally.assets.defaultSprite;
    if (animName === "idle" && direction === "back") return directions.back || ally.assets.defaultSprite;
    if (animName === "idle" && direction === "left") return directions.left || ally.assets.defaultSprite;
    if (animName === "idle" && direction === "right") return directions.right || ally.assets.defaultSprite;
    return null;
  }

  function drawEnemies() {
    const battle = state.battle;
    battle.enemies.slice().sort((a, b) => a.y - b.y).forEach((enemy) => {
      drawEnemyUnit(enemy);
    });
  }

  function drawEnemyUnit(enemy) {
    const scale = enemy.elite ? 1.32 : 1.1;
    const box = enemyDrawBox(enemy);
    const spriteHeight = box.h * scale;
    drawEnemySprite(enemy, scale);
    drawMeter(enemy.x - 20 * scale, enemy.y - spriteHeight - 7 * scale, 40 * scale, 5, enemy.hp / enemy.maxHp, "#d9513b");

    const activeStatus = Object.keys(enemy.status).find((key) => enemy.status[key] > 0);
    if (activeStatus) {
      ctx.fillStyle = statusColor(activeStatus);
      ctx.font = "700 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(statusLabel(activeStatus), enemy.x, enemy.y - spriteHeight - 13 * scale);
    }
  }

  function isVisibleEnemyPixel(data, index) {
    const alpha = data[index + 3];
    if (alpha <= 16) return false;
    return data[index] + data[index + 1] + data[index + 2] > 24;
  }

  function extractStageEnemyFrames(img) {
    const canvasEl = document.createElement("canvas");
    canvasEl.width = img.naturalWidth;
    canvasEl.height = img.naturalHeight;
    const buffer = canvasEl.getContext("2d", { willReadFrequently: true });
    buffer.drawImage(img, 0, 0);
    const { data, width, height } = buffer.getImageData(0, 0, canvasEl.width, canvasEl.height);
    const activeColumns = new Array(width).fill(false);

    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < height; y += 1) {
        const index = (y * width + x) * 4;
        if (isVisibleEnemyPixel(data, index)) {
          activeColumns[x] = true;
          break;
        }
      }
    }

    const groups = [];
    let current = null;
    let gap = 0;
    const mergeGap = 26;
    for (let x = 0; x < width; x += 1) {
      if (activeColumns[x]) {
        if (!current) current = { minX: x, maxX: x };
        current.maxX = x;
        gap = 0;
      } else if (current) {
        gap += 1;
        if (gap > mergeGap) {
          current.maxX -= gap;
          if (current.maxX - current.minX > 20) groups.push(current);
          current = null;
          gap = 0;
        }
      }
    }
    if (current) {
      if (current.maxX - current.minX > 20) groups.push(current);
    }

    const frames = groups.map((group) => {
      let minY = height;
      let maxY = 0;
      for (let x = group.minX; x <= group.maxX; x += 1) {
        for (let y = 0; y < height; y += 1) {
          const index = (y * width + x) * 4;
          if (isVisibleEnemyPixel(data, index)) {
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      }
      const pad = 6;
      const x = clamp(group.minX - pad, 0, width - 1);
      const y = clamp(minY - pad, 0, height - 1);
      const right = clamp(group.maxX + pad, 0, width - 1);
      const bottom = clamp(maxY + pad, 0, height - 1);
      return { x, y, w: right - x + 1, h: bottom - y + 1 };
    }).filter((frame) => frame.w > 20 && frame.h > 20);

    if (frames.length >= STAGE_ENEMY_SLOT_COUNT) {
      return frames.slice(0, STAGE_ENEMY_SLOT_COUNT);
    }

    const visible = frames.reduce((box, frame) => ({
      x: Math.min(box.x, frame.x),
      y: Math.min(box.y, frame.y),
      right: Math.max(box.right, frame.x + frame.w),
      bottom: Math.max(box.bottom, frame.y + frame.h)
    }), { x: width, y: height, right: 0, bottom: 0 });
    if (visible.right <= visible.x) return [];

    const slotWidth = (visible.right - visible.x) / STAGE_ENEMY_SLOT_COUNT;
    return Array.from({ length: STAGE_ENEMY_SLOT_COUNT }, (_, index) => ({
      x: Math.round(visible.x + slotWidth * index),
      y: visible.y,
      w: Math.round(slotWidth),
      h: visible.bottom - visible.y
    }));
  }

  function stageEnemyFrames(stage) {
    const fixedFrames = STAGE_ENEMY_FRAMES[stage?.id];
    if (fixedFrames) return fixedFrames;
    const src = stage?.enemyAsset;
    const img = src ? image(src) : null;
    if (!src || !img) return [];
    if (!enemyFrameCache.has(src)) {
      try {
        enemyFrameCache.set(src, extractStageEnemyFrames(img));
      } catch {
        enemyFrameCache.set(src, fallbackStageEnemyFrames(img));
      }
    }
    return enemyFrameCache.get(src) || [];
  }

  function fallbackStageEnemyFrames(img) {
    const w = img.naturalWidth || 1;
    const h = img.naturalHeight || 1;
    const cuts = [0, 0.17, 0.34, 0.51, 0.66, 1];
    return Array.from({ length: STAGE_ENEMY_SLOT_COUNT }, (_, index) => {
      const x = Math.round(w * cuts[index]);
      const right = Math.round(w * cuts[index + 1]);
      return { x, y: 0, w: Math.max(1, right - x), h };
    });
  }

  function stageEnemyFrame(enemy) {
    const battle = state.battle;
    const frames = stageEnemyFrames(battle?.stage || selectedStage());
    if (frames.length === 0) return null;
    const normalCount = Math.max(1, Math.min(STAGE_NORMAL_ENEMY_COUNT, frames.length - 1));
    const index = enemy.elite
      ? frames.length - 1
      : clamp(Number(enemy.spriteIndex) || 0, 0, normalCount - 1);
    return frames[index] || frames[0];
  }

  function enemyBossAlly(enemy) {
    return enemy.allyBossId ? allyById(enemy.allyBossId) : null;
  }

  function enemyDrawBox(enemy) {
    if (enemy.drawBox) {
      return enemy.drawBox;
    }
    if (enemyBossAlly(enemy)) {
      return { w: 72, h: 94 };
    }
    if (state.battle?.stage?.id === "hehehe-kakusei") {
      const frame = stageEnemyFrame(enemy);
      const heights = {
        ashigaru: 62,
        ninja: 58,
        cavalry: 82,
        rifleman: 66,
        busho: 122
      };
      const h = enemy.elite ? heights.busho : (heights[enemy.type] || 64);
      const aspect = frame ? frame.w / Math.max(1, frame.h) : 0.9;
      return {
        w: clamp(h * aspect, enemy.elite ? 104 : 42, enemy.elite ? 166 : 112),
        h
      };
    }
    const heights = {
      ashigaru: 43,
      ninja: 58,
      cavalry: 50,
      rifleman: 58,
      busho: 94
    };
    const frame = stageEnemyFrame(enemy);
    const h = enemy.elite ? heights.busho : (heights[enemy.type] || 52);
    const aspect = frame ? frame.w / Math.max(1, frame.h) : 0.8;
    return {
      w: clamp(h * aspect, enemy.elite ? 78 : 32, enemy.elite ? 136 : 84),
      h
    };
  }

  function drawEnemySprite(enemy, scale) {
    const bossAlly = enemyBossAlly(enemy);
    if (bossAlly) {
      const box = enemyDrawBox(enemy);
      const elapsed = state.battle?.elapsed || 0;
      const frame = frameForAlly(bossAlly, elapsed) || bossAlly.assets.defaultSprite;
      drawCharacterSprite(frame, enemy.x, enemy.y, box.w * scale, box.h * scale, 1, { flip: true });
      return;
    }

    if (enemy.asset) {
      const img = image(enemy.asset);
      if (!img) {
        drawEnemyToken(enemy, scale);
        return;
      }
      const box = enemyDrawBox(enemy);
      const w = box.w * scale;
      const h = box.h * scale;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (enemy.finalBoss) {
        ctx.shadowColor = enemy.finalBossPhase >= 4 ? "rgba(255, 75, 232, 0.72)" : "rgba(142, 85, 255, 0.52)";
        ctx.shadowBlur = enemy.finalBossPhase >= 3 ? 22 : 14;
      }
      ctx.drawImage(img, enemy.x - w / 2, enemy.y - h, w, h);
      ctx.restore();
      return;
    }

    const battle = state.battle;
    const sheet = image(battle?.stage?.enemyAsset);
    const frame = stageEnemyFrame(enemy);
    if (!sheet || !frame) {
      drawEnemyToken(enemy, scale);
      return;
    }

    const box = enemyDrawBox(enemy);
    const w = box.w * scale;
    const h = box.h * scale;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, frame.x, frame.y, frame.w, frame.h, enemy.x - w / 2, enemy.y - h, w, h);
    ctx.restore();
  }

  function drawEnemyToken(enemy, scale) {
    const x = enemy.x;
    const y = enemy.y;
    const body = enemy.elite ? "#704125" : enemy.type === "ninja" ? "#20252a" : "#273542";
    const trim = enemy.elite ? "#e3a640" : enemy.type === "rifleman" ? "#568bb2" : "#c88943";

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    ctx.beginPath();
    ctx.ellipse(0, 8, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = body;
    ctx.fillRect(-11, -24, 22, 28);
    ctx.fillStyle = "#15191c";
    ctx.fillRect(-13, -38, 26, 16);
    ctx.fillStyle = trim;
    ctx.fillRect(-15, -28, 30, 4);
    ctx.fillStyle = "#d9c098";
    ctx.fillRect(-7, -34, 5, 4);
    ctx.fillRect(3, -34, 5, 4);
    ctx.strokeStyle = trim;
    ctx.lineWidth = 3;
    if (enemy.type === "archer") {
      ctx.beginPath();
      ctx.arc(15, -12, 11, -1.1, 1.1);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(14, -20);
      ctx.lineTo(28, -38);
      ctx.stroke();
    }
    ctx.restore();
  }

  function projectilePoint(projectile, t) {
    const x = lerp(projectile.x1, projectile.x2, t);
    const y = lerp(projectile.y1, projectile.y2, t) - Math.sin(t * Math.PI) * projectile.arc;
    return { x, y };
  }

  function drawProjectiles() {
    const battle = state.battle;
    if (!battle) return;

    battle.projectiles.forEach((projectile) => {
      if (projectile.age < 0) return;
      const raw = projectile.age / projectile.duration;
      const t = clamp(raw, 0, 1);
      const alpha = raw > 1 ? clamp(1 - (raw - 1) / 0.16, 0, 1) : 1;
      if (alpha <= 0) return;

      const eased = t * t * (3 - 2 * t);
      const head = projectilePoint(projectile, eased);
      const prev = projectilePoint(projectile, clamp(eased - 0.035, 0, 1));
      const angle = Math.atan2(head.y - prev.y, head.x - prev.x);
      const trailCount = projectile.trail || 5;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = projectile.color;
      ctx.shadowBlur = projectile.beam ? 16 : 11;

      for (let i = trailCount; i >= 1; i -= 1) {
        const t2 = clamp(eased - i * 0.028, 0, 1);
        const t1 = clamp(eased - (i + 1.8) * 0.028, 0, 1);
        if (t1 === t2) continue;
        const a = alpha * (1 - i / (trailCount + 1)) * (projectile.beam ? 0.58 : 0.44);
        const p1 = projectilePoint(projectile, t1);
        const p2 = projectilePoint(projectile, t2);
        ctx.globalAlpha = a;
        ctx.strokeStyle = projectile.color;
        ctx.lineWidth = Math.max(1.5, projectile.lineWidth * (1 - i / (trailCount + 2)));
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      if (projectile.beam) {
        ctx.globalAlpha = alpha * 0.34;
        ctx.strokeStyle = projectile.color;
        ctx.lineWidth = projectile.lineWidth + 2;
        ctx.beginPath();
        ctx.moveTo(projectile.x1, projectile.y1);
        ctx.lineTo(head.x, head.y);
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.86;
        ctx.strokeStyle = projectile.core;
        ctx.lineWidth = Math.max(2, projectile.lineWidth * 0.42);
        ctx.beginPath();
        ctx.moveTo(projectile.x1, projectile.y1);
        ctx.lineTo(head.x, head.y);
        ctx.stroke();
      }

      const img = projectile.imagePath ? image(projectile.imagePath) : null;
      const size = projectile.size * (0.9 + Math.sin(t * Math.PI) * 0.18);
      ctx.globalAlpha = alpha;
      if (img) {
        const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.save();
        ctx.translate(head.x, head.y);
        ctx.rotate(angle + projectile.spin * t * Math.PI * 2);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      } else {
        drawProjectileFallback(projectile, head.x, head.y, angle, size, alpha);
      }

      if (t > 0.86) {
        const burst = (t - 0.86) / 0.14;
        ctx.globalAlpha = alpha * (1 - burst) * 0.76;
        ctx.strokeStyle = projectile.core;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(projectile.x2, projectile.y2, 7 + burst * 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  function drawProjectileFallback(projectile, x, y, angle, size, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = projectile.core;
    ctx.strokeStyle = projectile.color;
    ctx.lineWidth = 2;
    if (projectile.beam || size <= 20) {
      ctx.beginPath();
      ctx.moveTo(-size * 0.65, 0);
      ctx.lineTo(size * 0.45, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(size * 0.48, 0, Math.max(3, size * 0.16), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(size * 0.46, 0);
      ctx.lineTo(0, -size * 0.34);
      ctx.lineTo(-size * 0.46, 0);
      ctx.lineTo(0, size * 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    const battle = state.battle;
    battle.particles.forEach((particle) => {
      const alpha = clamp(particle.ttl / particle.maxTtl, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      const img = particle.imagePath ? image(particle.imagePath) : null;
      if (img) {
        drawSprite(particle.imagePath, particle.x, particle.y + 28, 86, 86, alpha * 0.8);
      }
      ctx.fillStyle = particle.color;
      ctx.font = "700 13px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
      ctx.lineWidth = 3;
      ctx.strokeText(particle.text, particle.x, particle.y);
      ctx.fillText(particle.text, particle.x, particle.y);
      ctx.restore();
    });
  }

  function drawResultOverlay(result) {
    if (result.joinAlly) {
      drawJoinResultOverlay(result);
      return;
    }
    if (result.clearScreen) {
      drawClearResultOverlay(result);
      return;
    }

    ctx.fillStyle = "rgba(4, 5, 5, 0.72)";
    ctx.fillRect(36, 210, 348, 128);
    ctx.strokeStyle = result.victory ? "#d8a13c" : "#d65a43";
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 210, 348, 128);
    ctx.fillStyle = "#f5edd7";
    ctx.font = "700 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(result.title, 210, 252);
    ctx.font = "12px sans-serif";
    wrapCanvasText(result.message, 210, 282, 286, 18);
  }

  function drawClearResultOverlay(result) {
    ctx.save();
    const img = result.clearImage ? image(result.clearImage) : null;

    if (!result.tapped) {
      // 画面が一度もタップされていない場合は画像のみを全画面表示
      if (img) {
        drawCropCover(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, 420, 560);
      } else {
        ctx.fillStyle = "rgba(4, 5, 5, 0.88)";
        ctx.fillRect(0, 0, 420, 560);
      }
      ctx.restore();
      return;
    }

    // タップ後は通常のクリア画面表示
    const x = 26;
    const y = 76;
    const w = 368;
    const h = 318;
    ctx.fillStyle = "rgba(4, 5, 5, 0.88)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#d8a13c";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    const artX = x + 18;
    const artY = y + 18;
    const artW = w - 36;
    const artH = 170;
    ctx.fillStyle = "#101a1d";
    ctx.fillRect(artX, artY, artW, artH);
    if (img) {
      drawCropCover(img, 0, 0, img.naturalWidth, img.naturalHeight, artX, artY, artW, artH);
    } else {
      const gradient = ctx.createLinearGradient(artX, artY, artX + artW, artY + artH);
      gradient.addColorStop(0, "rgba(85, 175, 215, 0.22)");
      gradient.addColorStop(0.56, "rgba(216, 161, 60, 0.18)");
      gradient.addColorStop(1, "rgba(6, 9, 10, 0.9)");
      ctx.fillStyle = gradient;
      ctx.fillRect(artX, artY, artW, artH);
      ctx.fillStyle = "#ffe2a1";
      ctx.font = "700 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CLEAR", artX + artW / 2, artY + artH / 2 + 10);
    }
    ctx.strokeStyle = "rgba(216, 161, 60, 0.64)";
    ctx.strokeRect(artX, artY, artW, artH);

    ctx.fillStyle = "#f5edd7";
    ctx.font = "700 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(result.title, 210, y + 224);
    ctx.font = "12px sans-serif";
    wrapCanvasText(result.message, 210, y + 252, 300, 18);
    ctx.restore();
  }

  function drawJoinResultOverlay(result) {
    const ally = result.joinAlly;
    ctx.save();
    ctx.fillStyle = "rgba(4, 5, 5, 0.84)";
    ctx.fillRect(30, 92, 360, 244);
    ctx.strokeStyle = "#d8a13c";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 92, 360, 244);

    ctx.fillStyle = "#ffe2a1";
    ctx.font = "700 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("仲間加入", 210, 124);

    drawPortraitIcon(ally.portrait, 52, 146, 74);

    ctx.textAlign = "left";
    ctx.fillStyle = "#f5edd7";
    ctx.font = "700 17px sans-serif";
    ctx.fillText(ally.name, 142, 166);
    ctx.fillStyle = "#79d7ff";
    ctx.font = "700 11px sans-serif";
    wrapCanvasText(ally.feature || "新しい仲間", 142, 190, 210, 15);

    ctx.fillStyle = "#f5edd7";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    wrapCanvasText(ally.description, 52, 242, 310, 16);

    if (ally.quote) {
      ctx.fillStyle = "#d8c79f";
      ctx.font = "700 11px sans-serif";
      wrapCanvasText(`「${ally.quote}」`, 52, 284, 310, 15);
    }

    ctx.fillStyle = "rgba(216, 161, 60, 0.16)";
    ctx.fillRect(52, 308, 316, 18);
    ctx.fillStyle = "#ffe2a1";
    ctx.font = "700 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(ally.stats, 210, 321);
    ctx.restore();
  }

  function drawPortraitIcon(src, x, y, size) {
    ctx.save();
    ctx.fillStyle = "rgba(12, 28, 36, 0.88)";
    ctx.fillRect(x, y, size, size);
    const portrait = image(src);
    if (portrait) {
      ctx.imageSmoothingEnabled = false;
      drawCropCover(portrait, 0, 0, portrait.naturalWidth, portrait.naturalHeight, x + 4, y + 4, size - 8, size - 8);
    } else {
      ctx.fillStyle = "#d8a13c";
      ctx.fillRect(x + 18, y + 14, size - 36, size - 28);
    }
    ctx.strokeStyle = "#55afd7";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    ctx.restore();
  }

  function drawDialogueOverlay(dialogue) {
    ctx.save();
    ctx.fillStyle = "rgba(5, 7, 7, 0.86)";
    ctx.fillRect(28, 344, 364, 164);
    ctx.strokeStyle = "#55afd7";
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 344, 364, 164);

    ctx.fillStyle = "#79d7ff";
    ctx.font = "700 14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(dialogue.speaker || "LINE", 48, 372);

    ctx.fillStyle = "#f5edd7";
    ctx.font = "700 14px sans-serif";
    ctx.textAlign = "center";
    wrapCanvasText(`「${dialogue.text}」`, 210, 404, 318, 19);

    ctx.fillStyle = "rgba(85, 175, 215, 0.22)";
    ctx.fillRect(140, 470, 140, 24);
    ctx.strokeStyle = "rgba(85, 175, 215, 0.78)";
    ctx.strokeRect(140, 470, 140, 24);
    ctx.fillStyle = "#d9efff";
    ctx.font = "700 11px sans-serif";
    ctx.fillText(dialogue.buttonLabel || "進む", 210, 486);
    ctx.restore();
  }

  function drawRosterPreview() {
    const bg = image(ASSETS.scenery);
    if (bg) drawCover(bg, 0, 0, CW, CH);
    ctx.fillStyle = "rgba(5, 7, 7, 0.62)";
    ctx.fillRect(0, 0, CW, CH);
    const allies = playableAllies();
    const positions = allyPositions(allies.length);
    const compact = allies.length > 9;
    allies.forEach((ally, index) => {
      const pos = positions[index];
      if (!pos) return;
      drawSprite(ally.assets.defaultSprite, pos.x, pos.y, compact ? 54 : 60, compact ? 72 : 80, 1);
      ctx.fillStyle = ally.id === state.selectedAllyId ? "#79d7ff" : "#f6edce";
      ctx.font = "700 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(ally.name.length > 8 ? `${ally.name.slice(0, 7)}...` : ally.name, pos.x, pos.y + 20);
    });
    drawCanvasLabel(18, 520, "部隊編成", "#f4cf78");
  }

  function drawLogisticsPreview() {
    const bg = image(ASSETS.logistics);
    if (bg) drawCover(bg, 0, 0, CW, CH);
    ctx.fillStyle = "rgba(5, 7, 7, 0.66)";
    ctx.fillRect(0, 0, CW, CH);
    drawCanvasLabel(18, 80, "兵站", "#f4cf78");
    const rows = [
      ["WFI", state.resources.wfi, "#d8a13c"],
      ["ENERGY", state.resources.energy, "#69c95f"],
      ["FOOD", state.resources.food, "#55afd7"]
    ];
    rows.forEach((row, index) => {
      const y = 140 + index * 48;
      ctx.fillStyle = "rgba(8, 10, 10, 0.75)";
      ctx.fillRect(54, y, 312, 34);
      ctx.strokeStyle = row[2];
      ctx.strokeRect(54, y, 312, 34);
      ctx.fillStyle = row[2];
      ctx.font = "700 13px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(row[0], 72, y + 22);
      ctx.textAlign = "right";
      ctx.fillText(formatNum(row[1]), 346, y + 22);
    });
  }

  function drawCover(img, x, y, w, h) {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (img.naturalWidth - sw) / 2;
    const sy = (img.naturalHeight - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function drawCropCover(img, sx, sy, sw, sh, x, y, w, h) {
    const scale = Math.max(w / sw, h / sh);
    const sourceW = w / scale;
    const sourceH = h / scale;
    const sourceX = sx + (sw - sourceW) / 2;
    const sourceY = sy + (sh - sourceH) / 2;
    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, x, y, w, h);
  }

  function drawSprite(src, x, baselineY, maxW, maxH, alpha = 1, options = {}) {
    const img = image(src);
    if (!img) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#d8a13c";
      ctx.fillRect(x - maxW / 4, baselineY - maxH, maxW / 2, maxH);
      ctx.restore();
      return;
    }
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    if (options.flip) {
      ctx.translate(x, baselineY);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -w / 2, -h, w, h);
    } else {
      ctx.drawImage(img, x - w / 2, baselineY - h, w, h);
    }
    ctx.restore();
  }

  function drawCharacterSprite(src, x, baselineY, boxW, boxH, alpha = 1, options = {}) {
    const img = image(src);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    if (!img) {
      ctx.fillStyle = "#d8a13c";
      ctx.fillRect(x - boxW / 4, baselineY - boxH, boxW / 2, boxH);
      ctx.restore();
      return;
    }
    let drawW = boxW;
    let drawH = boxH;
    let anchorX = drawW / 2;
    if (options.preserveAspect && img.naturalWidth > 0 && img.naturalHeight > 0) {
      const scale = boxH / img.naturalHeight;
      drawW = img.naturalWidth * scale;
      drawH = boxH;
      anchorX = drawW * (options.anchorXRatio ?? 0.5);
    }
    if (options.flip) {
      ctx.translate(x, baselineY);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -anchorX, -drawH, drawW, drawH);
    } else {
      ctx.drawImage(img, x - anchorX, baselineY - drawH, drawW, drawH);
    }
    ctx.restore();
  }

  function drawEffectSprite(src, centerX, centerY, maxW, maxH, alpha = 1, options = {}) {
    const img = image(src);
    if (!img) return;
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    if (options.flip) {
      ctx.translate(centerX, centerY);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      ctx.drawImage(img, centerX - w / 2, centerY - h / 2, w, h);
    }
    ctx.restore();
  }

  function drawMeter(x, y, w, h, ratio, color) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * clamp(ratio, 0, 1), h);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.strokeRect(x, y, w, h);
  }

  function drawCanvasLabel(x, y, text, color) {
    ctx.fillStyle = "rgba(8, 10, 10, 0.82)";
    ctx.fillRect(x - 6, y - 17, Math.min(390, text.length * 13 + 18), 25);
    ctx.strokeStyle = "rgba(216, 161, 60, 0.55)";
    ctx.strokeRect(x - 6, y - 17, Math.min(390, text.length * 13 + 18), 25);
    ctx.fillStyle = color;
    ctx.font = "700 13px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(text, x, y);
  }

  function wrapCanvasText(text, x, y, maxWidth, lineHeight) {
    const chars = Array.from(text);
    let line = "";
    let lineY = y;
    for (const char of chars) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, lineY);
        line = char;
        lineY += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, lineY);
  }

  function renderDom(force) {
    if (!state.ready) return;

    // 加入オーバーレイ表示中
    if (state.showJoinCardAlly) {
      renderResourceBar();
      rosterRail.innerHTML = "";
      quickActions.innerHTML = "";
      battleOverlayControls.hidden = true;
      if (mapHotspots) { mapHotspots.innerHTML = ""; mapHotspots.hidden = true; }

      const ally = state.showJoinCardAlly;
      const btnLabel = state.pendingRestartOnClose ? "戦闘準備へ" : "地図へ";
      sidePanel.innerHTML = `
        <div class="panel-title">
          <div>
            <h2>新メンバー加入！</h2>
            <p>Wefi戦士が部隊に合流しました</p>
          </div>
          <span class="badge">合流</span>
        </div>
        <div class="result-banner" style="margin-top: 15px;">
          ${renderJoinCard(ally)}
          <button class="action-button primary" data-action="close-join-card">${escapeHtml(btnLabel)}</button>
        </div>
        ${renderLog()}
      `;
      document.body.classList.remove("is-battle-view");
      viewTitle.textContent = "新メンバー加入！";
      battleClock.textContent = "";
      chapterLabel.textContent = "";
      return;
    }

    // オープニング・キャラ選択・仲間選択・時間巻き戻し中はDOM UIを最小限に
    if (!state.openingDone || !state.charSelectDone || state.timeRewindPhase || state.joinAllySelectPhase) {
      renderResourceBar();
      if ((state.openingDone && !state.charSelectDone) || state.timeRewindPhase || state.joinAllySelectPhase) {
        renderCharPickActions();
      } else {
        quickActions.innerHTML = "";
      }
      rosterRail.innerHTML = "";
      battleOverlayControls.hidden = true;
      if (mapHotspots) { mapHotspots.innerHTML = ""; mapHotspots.hidden = true; }
      sidePanel.innerHTML = "";
      document.body.classList.remove("is-battle-view");
      viewTitle.textContent = !state.openingDone ? "序章" : "戦士選択";
      battleClock.textContent = "";
      chapterLabel.textContent = "";
      return;
    }

    renderResourceBar();
    renderRosterRail();
    renderQuickActions();
    renderBattleOverlayControls();
    renderMapHotspots();
    document.body.classList.toggle("is-battle-view", state.view === "battle" && !!state.battle);

    if (force || state.view === "battle") {
      if (state.view === "map") renderMapPanel();
      if (state.view === "battle") renderBattlePanel();
      if (state.view === "roster") renderRosterPanel();
      if (state.view === "logistics") renderLogisticsPanel();
    }

    viewTitle.textContent = titleForView();
    battleClock.textContent = state.view === "battle" && state.battle ? `${Math.floor(state.battle.elapsed)}s` : "";
    chapterLabel.textContent = `全${STAGES.length}ステージ選択可`;
  }

  function titleForView() {
    if (state.view === "map") return "地図";
    if (state.view === "battle") return state.battle ? state.battle.stage.name : "戦闘準備";
    if (state.view === "roster") return "部隊";
    return "兵站";
  }

  function renderResourceBar() {
    const items = [
      ["WFI", state.resources.wfi],
      ["ENERGY", state.resources.energy],
      ["食料", state.resources.food]
    ];
    const signature = items.map(([label, value]) => `${label}:${value}`).join("|");
    if (resourceBar.dataset.signature === signature) return;
    resourceBar.dataset.signature = signature;

    resourceBar.innerHTML = items.map(([label, value]) => `
      <div class="resource-chip">
        <span>${label}</span>
        <strong>${formatNum(value)}</strong>
      </div>
    `).join("");
  }

  function renderRosterRail() {
    const allies = playableAllies();
    const activeRosterAllyId = state.battle && !state.battle.result
      ? activeBattleAlly()?.id
      : state.selectedAllyId;
    const signature = [
      state.selectedAllyId,
      state.battle?.activeAllyId || "",
      state.battle ? "battle" : "idle",
      ...allies.map((ally) => `${ally.id}:${Math.round(ally.hp)}:${Math.round(ally.maxHp)}:${Math.floor((ally.skillGauge || 0) / 25)}`)
    ].join("|");
    if (rosterRail.dataset.signature === signature) return;
    rosterRail.dataset.signature = signature;

    rosterRail.innerHTML = allies.map((ally) => {
      const hpRatio = ally.maxHp ? ally.hp / ally.maxHp : 1;
      const gaugeRatio = (ally.skillGauge || 0) / 100;
      const activeOnField = ally.id === activeRosterAllyId && (!state.battle || ally.hp > 0);
      const selected = activeOnField ? " is-selected" : "";
      const down = ally.hp <= 0 && state.battle ? " is-down" : "";
      const ready = activeOnField && canUseSkill(ally) && state.battle ? " is-skill-ready" : "";
      return `
        <button class="ally-card${selected}${down}${ready}" data-ally-id="${ally.id}">
          <strong>${escapeHtml(ally.name)}</strong>
          <span>Lv.${allyLevel(ally.id)} ${escapeHtml(skillById(ally.primarySkillId)?.name || "")}</span>
          <img src="${ally.assets.portrait || ally.assets.defaultSprite}" alt="">
          <span class="skill-charge" style="--value:${Math.max(0, Math.min(100, gaugeRatio * 100))}%"><i></i></span>
          <span class="bar" style="--value:${Math.max(0, hpRatio * 100)}%"><i></i></span>
        </button>
      `;
    }).join("");
  }

  function renderQuickActions() {
    const battle = state.battle;
    const signature = [
      state.view,
      state.selectedStageId,
      state.unlockedStageId,
      state.selectedAllyId,
      state.autoSkill ? "auto" : "manual",
      battle ? `${battle.paused ? "paused" : "run"}:${battle.result ? battle.result.title : "live"}` : "no-battle"
    ].join("|");
    if (quickActions.dataset.signature === signature) return;
    quickActions.dataset.signature = signature;

    if (state.view === "map") {
      const stage = selectedStage();
      const cleared = isStageCleared(stage);
      quickActions.innerHTML = `
        <button class="action-button primary" data-action="start-battle" ${cleared ? "disabled" : ""}>${cleared ? "制圧済み" : "出撃"}</button>
        <button class="action-button" data-action="next-stage" ${state.selectedStageId >= STAGES.length ? "disabled" : ""}>次のステージ</button>
        <button class="action-button" data-action="save">保存</button>
        <button class="action-button" data-action="reset">最初から(データ初期化)</button>
      `;
    } else if (state.view === "battle") {
      quickActions.innerHTML = "";
    } else if (state.view === "roster") {
      const stage = selectedStage();
      const cleared = isStageCleared(stage);
      quickActions.innerHTML = `
        <button class="action-button primary" data-action="start-battle" ${cleared ? "disabled" : ""}>${cleared ? "制圧済み" : "選択中へ出撃"}</button>
        <button class="action-button" data-action="save">保存</button>
        <button class="action-button" data-action="reset">最初から(データ初期化)</button>
      `;
    } else {
      quickActions.innerHTML = `
        <button class="action-button" data-action="save">保存</button>
        <button class="action-button" data-action="reset">最初から(データ初期化)</button>
      `;
    }
  }

  // キャラ選択フェーズの決定ボタンをDOMで提供
  function renderCharPickActions() {
    const ally = state.selectedAllyId ? allyById(state.selectedAllyId) : null;
    // キャラ選択画面ではまだアンロックされていないアライを選択して確定する
    const isValidPick = ally && !isAllyUnlocked(ally.id);

    if (!ally || !isValidPick) {
      quickActions.innerHTML = "<p style=\"padding:8px 4px;color:#79d7ff;font-size:12px\">キャンバスのキャラをタップして選択</p>";
      return;
    }
    const label = state.joinAllySelectPhase
      ? `${escapeHtml(ally.name)} を仲間に迎える！`
      : (state.timeRewindPhase
        ? `${escapeHtml(ally.name)} で再出撃！`
        : `${escapeHtml(ally.name)} を選ぶ！`);
    quickActions.innerHTML = `
      <button class="action-button primary" data-action="char-pick" data-ally-id="${escapeHtml(ally.id)}">${label}</button>
    `;
  }

  function renderBattleOverlayControls() {
    if (!battleOverlayControls) return;
    const battle = state.battle;
    if (state.view !== "battle" || !battle || battle.dialogue) {
      battleOverlayControls.hidden = true;
      battleOverlayControls.innerHTML = "";
      battleOverlayControls.dataset.signature = "";
      return;
    }

    const ally = activeBattleAlly();
    const activeSkill = ally ? activeSkillForAlly(ally) : null;
    const skillReady = ally && activeSkill && canUseSkill(ally);
    const attackReady = ally && (ally.attackTimer || 0) <= 0;
    const canAct = battle && !battle.result && !battle.paused && ally && ally.hp > 0;
    const signature = [
      battle.paused ? "paused" : "run",
      battle.result ? battle.result.title : "live",
      ally ? `${ally.id}:${Math.round(ally.hp)}:${Math.floor((ally.skillGauge || 0) / 5)}:${attackReady ? "atk" : "wait"}` : "no-ally",
      skillReady ? "skill" : "charging"
    ].join("|");
    if (battleOverlayControls.dataset.signature === signature) return;
    battleOverlayControls.dataset.signature = signature;
    battleOverlayControls.hidden = false;
    battleOverlayControls.innerHTML = `
      <button class="battle-map-button attack" data-action="manual-attack" ${canAct && attackReady ? "" : "disabled"} aria-label="攻撃">
        <span>攻撃</span>
      </button>
      <button class="battle-map-button skill ${skillReady ? "is-ready" : ""}" data-action="primary-skill" ${canAct && skillReady ? "" : "disabled"} aria-label="スキル">
        <span>スキル</span>
        <i>${Math.floor(clamp((ally?.skillGauge || 0) / 100, 0, 1) * 100)}%</i>
      </button>
    `;
  }

  function renderMapPanel() {
    const stage = selectedStage();
    sidePanel.innerHTML = `
      <div class="panel-title">
        <div>
          <h2>${stage.id}. ${escapeHtml(stage.name)}</h2>
          <p>${escapeHtml(stage.region)} / ${escapeHtml(stage.difficulty)}</p>
        </div>
        <span class="badge">選択可</span>
      </div>
      <div class="stat-grid">
        <div class="stat"><span>推奨戦力</span><strong>${formatNum(stage.power)}</strong></div>
        <div class="stat"><span>攻略状況</span><strong>${isStageCleared(stage) ? "制圧済み" : "未制圧"}</strong></div>
        <div class="stat"><span>報酬 WFI</span><strong>${formatNum(stage.reward.wfi)}</strong></div>
        <div class="stat"><span>報酬 Energy</span><strong>${formatNum(stage.reward.energy)}</strong></div>
      </div>
      <button class="action-button primary" data-action="start-battle" ${isStageCleared(stage) ? "disabled" : ""}>
        ${isStageCleared(stage) ? "制圧済み" : "出撃"}
      </button>
      <div class="section">
        <h3>惑星ステージ</h3>
        <div class="stage-list">
          ${STAGES.map((item) => `
            <button class="stage-button ${item.id === stage.id ? "is-selected" : ""}" data-action="select-stage" data-stage-id="${item.id}">
              <strong>${item.id}. ${escapeHtml(item.name)}</strong>
              <span>${escapeHtml(item.difficulty)} / ${isStageCleared(item) ? "制圧済み" : "挑戦可"}</span>
            </button>
          `).join("")}
        </div>
      </div>
      ${renderLog()}
    `;
  }

  function renderBattlePanel() {
    const battle = state.battle;
    if (!battle) {
      const stage = selectedStage();
      sidePanel.innerHTML = `
        <div class="panel-title">
          <div>
            <h2>戦闘準備</h2>
            <p>${stage.id}. ${escapeHtml(stage.name)} / ${escapeHtml(stage.difficulty)}</p>
          </div>
          <span class="badge">待機</span>
        </div>
        <button class="action-button primary" data-action="start-battle" ${isStageCleared(stage) ? "disabled" : ""}>
          ${isStageCleared(stage) ? "制圧済み" : "出撃"}
        </button>
        ${renderLog()}
      `;
      return;
    }

    const ally = activeBattleAlly();
    const baseRatio = battle.baseHp / battle.baseMaxHp;
    const techRatio = clamp((ally.skillGauge || 0) / 100, 0, 1);
    const dialogueHtml = battle.dialogue ? renderDialogueEvent(battle.dialogue) : "";
    const showBattleResult = battle.result && !battle.result.sageRestart && !battle.dialogue;
    sidePanel.innerHTML = `
      <div class="panel-title">
        <div>
          <h2>${escapeHtml(battle.stage.name)}</h2>
          <p>Wave ${battle.wave}/${battle.maxWave} / 撃破 ${battle.killed}</p>
        </div>
        <span class="badge">${battle.paused ? "停止" : battle.result ? "終了" : "戦闘"}</span>
      </div>
      ${dialogueHtml}
      <div class="section">
        <h3>本陣</h3>
        <div class="meter-line" style="--value:${Math.max(0, baseRatio * 100)}%"><i></i></div>
      </div>
      <div class="section">
        <h3>${escapeHtml(ally.name)}</h3>
        <div class="stat-grid">
          <div class="stat"><span>HP</span><strong>${formatNum(ally.hp)} / ${formatNum(ally.maxHp)}</strong></div>
          <div class="stat"><span>役割</span><strong>${escapeHtml(ally.roleLabel)}</strong></div>
        </div>
        <div class="meter-caption"><span>技ゲージ</span><strong>${Math.floor(techRatio * 100)}%</strong></div>
        <div class="meter-line tech" style="--value:${Math.floor(techRatio * 100)}%"><i></i></div>
        <div class="skill-grid">${allySkillButtons(ally)}</div>
      </div>
      ${showBattleResult ? `
        <div class="result-banner ${battle.result.clearScreen ? "is-clear-result" : ""}">
          ${battle.result.clearScreen ? renderClearResultArt(battle.result) : ""}
          <strong>${escapeHtml(battle.result.title)}</strong>
          <p>${escapeHtml(battle.result.message)}</p>
          ${battle.result.joinAlly ? renderJoinCard(battle.result.joinAlly) : ""}
          ${battle.result.needsAllySelect ? `
            <button class="action-button primary" data-action="go-ally-select">仲間を選ぶ</button>
          ` : battle.result.newGamePlus ? `
            <p style="text-align: center; color: var(--muted); font-size: 12px; margin: 10px 0;">画面をタップして強くてニューゲームを開始</p>
          ` : `
            <button class="action-button primary" data-action="continue-map">地図へ</button>
          `}
        </div>
      ` : ""}
      ${renderLog()}
    `;
  }

  function renderDialogueEvent(dialogue) {
    return `
      <div class="dialogue-event">
        <strong>${escapeHtml(dialogue.speaker || "LINE")}</strong>
        <p>「${escapeHtml(dialogue.text)}」</p>
        <button class="action-button primary" data-action="advance-dialogue">${escapeHtml(dialogue.buttonLabel || "進む")}</button>
      </div>
    `;
  }

  function renderClearResultArt(result) {
    const imageStyle = result.clearImage ? ` style="--clear-image:url('${escapeHtml(result.clearImage)}')"` : "";
    return `
      <div class="clear-result-art"${imageStyle}>
        <span>CLEAR</span>
      </div>
    `;
  }

  function renderJoinCard(ally) {
    return `
      <div class="join-card">
        <img src="${escapeHtml(ally.portrait)}" alt="">
        <div>
          <strong>${escapeHtml(ally.name)}</strong>
          <span>${escapeHtml(ally.feature)}</span>
          <p>${escapeHtml(ally.description)}</p>
          ${ally.quote ? `<em>「${escapeHtml(ally.quote)}」</em>` : ""}
          <small>${escapeHtml(ally.stats)}</small>
        </div>
      </div>
    `;
  }

  function renderRosterPanel() {
    const ally = selectedAlly();
    const level = allyLevel(ally.id);
    const canLevelUp = level < ALLY_MAX_LEVEL;
    const nextLevel = level + 1;
    const isWfiType = WFI_LEVEL_ALLY_IDS.has(ally.id);
    const isEnergyType = ENERGY_LEVEL_ALLY_IDS.has(ally.id);
    let levelCostText = "？";
    if (isWfiType) {
      let cost = 0;
      if (level === 1) cost = 100;
      else if (level === 2) cost = 500;
      else cost = nextLevel * 500;
      levelCostText = `WFI ${formatNum(cost)}`;
    } else if (isEnergyType) {
      levelCostText = `Energy ${formatNum(nextLevel * 300)}`;
    }
    const skillUnlocked = level >= 3;
    const rangeType = allyRangeType(ally);
    const rangeLabel = { melee: "近接", ranged: "遠距離", magic: "魔法" }[rangeType] || rangeType;
    const mult = 1 + (level - 1) * 0.12;
    sidePanel.innerHTML = `
      <div class="panel-title">
        <div>
          <h2>${escapeHtml(ally.name)}</h2>
          <p>${escapeHtml(ally.job || "")} / ${escapeHtml(ally.roleLabel)}</p>
        </div>
        <span class="badge">Lv.${level} / No.${ally.order}</span>
      </div>
      <div class="stat-grid">
        <div class="stat"><span>HP</span><strong>${formatNum(ally.hp)} / ${formatNum(ally.maxHp)}</strong></div>
        <div class="stat"><span>ATK</span><strong>${formatNum(Math.round(ally.stats.attack * mult))}</strong></div>
        <div class="stat"><span>DEF</span><strong>${formatNum(Math.round(ally.stats.defense * mult))}</strong></div>
        <div class="stat"><span>SPD</span><strong>${formatNum(Math.round(ally.stats.speed * mult))}</strong></div>
        <div class="stat"><span>属性</span><strong>${rangeLabel}</strong></div>
        <div class="stat"><span>スキル</span><strong>${skillUnlocked ? "解放済み" : "Lv3で解放"}</strong></div>
      </div>
      <div class="section">
        <h3>レベルアップ</h3>
        ${canLevelUp
          ? `<button class="action-button primary" data-action="level-up" data-ally-id="${ally.id}">Lv${level} → Lv${nextLevel}（${levelCostText}）</button>`
          : `<p style="padding:6px 0;color:#ffe2a1">最大レベル（Lv${ALLY_MAX_LEVEL}）達成！</p>`
        }
      </div>
      <div class="section">
        <h3>HP回復</h3>
        <button class="action-button" data-action="heal-ally" data-ally-id="${ally.id}">この戦士を回復（食料10 / HP+20%）</button>
      </div>
      <div class="section">
        <h3>セリフ</h3>
        <div class="message-log"><p>${escapeHtml(ally.quote || "")}</p></div>
      </div>
      ${ally.personality ? `<div class="section"><h3>性格・特徴</h3><div class="message-log"><p>${escapeHtml(ally.personality)}</p></div></div>` : ""}
      ${(ally.id === "hehehehehe" && level === 9 && !state.heheheheheAwakened) ? `
        <div class="section">
          <h3>イベント</h3>
          <button class="action-button primary" data-action="start-kakusei-event">へへへ覚醒戦闘スタート</button>
        </div>
      ` : ""}
      <div class="section">
        <h3>スキル</h3>
        <div class="skill-grid">${ally.skillIds.map((skillId) => skillInfoCard(skillById(skillId), ally)).join("")}</div>
      </div>
    `;
  }

  function renderLogisticsPanel() {
    sidePanel.innerHTML = `
      <div class="panel-title">
        <div>
          <h2>兵站</h2>
          <p>WFIとEnergyを変換し、食料を整える。</p>
        </div>
        <span class="badge">補給</span>
      </div>
      <div class="logistics-grid">
        <button class="logistics-button" data-action="logistics" data-item="energy">
          <strong>Energy補給</strong>
          <span>WFI 250 / Energy +600</span>
        </button>
        <button class="logistics-button" data-action="logistics" data-item="food">
          <strong>兵糧補給</strong>
          <span>WFI 160 / 食料 +28</span>
        </button>
        <button class="logistics-button" data-action="logistics" data-item="wfi">
          <strong>WFI変換</strong>
          <span>Energy 600 / WFI +200</span>
        </button>
      </div>
      <div class="section">
        <h3>HP回復</h3>
        <div class="logistics-grid">
          <button class="logistics-button" data-action="heal-all">
            <strong>全員回復</strong>
            <span>食料 30 / 全員HP +20%</span>
          </button>
        </div>
      </div>
      <div class="section">
        <h3>保管状況</h3>
        <div class="stat-grid">
          <div class="stat"><span>WFI</span><strong>${formatNum(state.resources.wfi)}</strong></div>
          <div class="stat"><span>Energy</span><strong>${formatNum(state.resources.energy)}</strong></div>
          <div class="stat"><span>食料</span><strong>${formatNum(state.resources.food)}</strong></div>
        </div>
      </div>
      ${renderLog()}
    `;
  }

  function allySkillButtons(ally) {
    return (ally.skillIds || [])
      .map(skillById)
      .filter((skill) => skill && skill.kind === "active")
      .map((skill) => {
        const gauge = Math.floor(clamp(ally.skillGauge || 0, 0, 100));
        const lvCheck = allyLevel(ally.id) >= 3;
        const disabled = !state.battle || !!state.battle.result || ally.hp <= 0 || !lvCheck || gauge < 100;
        const status = !lvCheck ? `Lv3で解放（現在Lv${allyLevel(ally.id)}）` : gauge >= 100 ? "発動可" : `技 ${gauge}%`;
        return `
          <button class="skill-button" data-action="use-skill" data-skill-id="${skill.id}" data-ally-id="${ally.id}" ${disabled ? "disabled" : ""}>
            <strong>${escapeHtml(skill.name)}</strong>
            <span>${status}</span>
          </button>
        `;
      }).join("");
  }

  function skillInfoCard(skill, ally) {
    if (!skill) return "";
    const level = allyLevel(ally.id);
    const skillUnlocked = level >= 3;
    const kind = skill.kind === "active" ? "技ゲージで発動" : "Passive";
    const disabled = skillUnlocked ? "" : "disabled";
    return `
      <button class="skill-button" data-action="show-skill-effect" data-skill-id="${skill.id}" data-ally-id="${ally.id}" ${disabled}>
        <strong>${escapeHtml(skill.name)}</strong>
        <span>${kind}</span>
      </button>
    `;
  }

  function renderLog() {
    return `
      <div class="section">
        <h3>ログ</h3>
        <div class="message-log">
          ${state.log.map((item) => `<p>${escapeHtml(item.message)}</p>`).join("") || "<p>記録なし</p>"}
        </div>
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  boot();
})();
