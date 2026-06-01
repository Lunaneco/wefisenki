const fs = require('fs');
const path = require('path');
const vm = require('vm');

// game.js を読み込む
const gameJsPath = path.join(__dirname, 'game.js');
const code = fs.readFileSync(gameJsPath, 'utf8');

// テスト用のコンテキスト（モック環境）を作成
const mockState = {
  view: 'battle',
  battle: {
    stage: { id: 'final-darkrive22', finalBoss: true },
    dialogue: null,
    result: {
      victory: true,
      title: "クリア",
      message: "ダークリーヴ２２を撃破。",
      newGamePlus: true,
      clearScreen: true,
      tapped: false
    }
  },
  showJoinCardAlly: null,
  joinAllySelectPhase: false,
  selectedAllyId: "",
  openingDone: true,
  charSelectDone: true
};

let setViewCalled = null;
let renderDomCalledCount = 0;
let startNewGamePlusCalled = false;

const context = {
  state: mockState,
  battlePointer: { moved: false },
  canvasPoint(event) {
    return { x: event.clientX, y: event.clientY };
  },
  setView(view) {
    setViewCalled = view;
    mockState.view = view;
  },
  renderDom(force) {
    renderDomCalledCount++;
  },
  startNewGamePlus() {
    startNewGamePlusCalled = true;
  },
  escapeHtml(str) {
    return str;
  },
  console: console
};

// handleActionClick と handleCanvasClick の抽出
// 単純に正規表現で関数定義から切り出す
function extractFunction(functionName) {
  const startIdx = code.indexOf(`function ${functionName}(`);
  if (startIdx === -1) {
    throw new Error(`Function ${functionName} not found in game.js`);
  }
  
  // 中括弧の対応を数えて関数の終わりを見つける
  let braceCount = 0;
  let inString = false;
  let stringChar = '';
  let i = startIdx;
  
  // 関数の引数部分などを超えて、最初の { を見つける
  while (code[i] !== '{' && i < code.length) {
    i++;
  }
  
  const funcStart = i;
  braceCount = 1;
  i++;
  
  while (braceCount > 0 && i < code.length) {
    const char = code[i];
    
    // 文字列リテラルのハンドリング（簡易エスケープ対応）
    if ((char === '"' || char === "'" || char === '`') && code[i-1] !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (stringChar === char) {
        inString = false;
      }
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }
    }
    i++;
  }
  
  return code.substring(startIdx, i);
}

const handleActionClickCode = extractFunction('handleActionClick');
const handleCanvasClickCode = extractFunction('handleCanvasClick');

// 関数の実行
const script = new vm.Script(`
  ${handleActionClickCode}
  ${handleCanvasClickCode}
`);

vm.createContext(context);
script.runInContext(context);

// テストの実行
console.log('--- テスト開始 ---');

// 1. 初期状態チェック
console.log('初期状態の確認...');
if (startNewGamePlusCalled !== false) {
  throw new Error('初期状態で startNewGamePlus が呼ばれていてはなりません。');
}

// 2. キャンバスタップ時のテスト
console.log('キャンバスをタップします...');
context.handleCanvasClick({ clientX: 100, clientY: 100 }); // モックイベント
console.log('タップ後: startNewGamePlus 呼び出し状況 =', startNewGamePlusCalled);

if (startNewGamePlusCalled !== true) {
  throw new Error('キャンバスを一度タップした時点で startNewGamePlus が呼ばれる必要があります。');
}

// テスト状態のリセット
startNewGamePlusCalled = false;

// 3. サイドパネルタップ時のテスト
console.log('サイドパネル（リザルト画面）をタップします...');
const mockEventPanel = {
  target: {
    closest(selector) {
      // data-action属性がない普通の領域のクリックを模倣
      return null;
    }
  }
};
context.handleActionClick(mockEventPanel);
console.log('サイドパネルタップ後: startNewGamePlus 呼び出し状況 =', startNewGamePlusCalled);

if (startNewGamePlusCalled !== true) {
  throw new Error('サイドパネルを一度タップした時点で startNewGamePlus が呼ばれる必要があります。');
}

console.log('--- すべてのテストに合格しました！ ---');
