/**
 * WeFi戦記 グローバルチャット機能
 *
 * Firebase Realtime Database を使ったリアルタイムチャット。
 * ニックネームのみで参加でき、後から変更も可能。
 * メッセージは最新100件を保持する。
 */
(function () {
  "use strict";

  // ==========================================
  // 定数
  // ==========================================
  /** ローカルストレージのニックネーム保存キー */
  const NICK_STORAGE_KEY = "wefi-chat-nickname";
  /** ローカルストレージのデバイスID保存キー */
  const DEVICE_ID_KEY = "wefi-chat-device-id";
  /** チャットに保持するメッセージ最大件数 */
  const MAX_MESSAGES = 100;
  /** メッセージの最大文字数 */
  const MAX_MSG_LENGTH = 80;
  /** ニックネームの最大文字数 */
  const MAX_NICK_LENGTH = 12;
  /** 送信クールダウン（ミリ秒） */
  const SEND_COOLDOWN_MS = 1500;
  /** Firebaseが未設定の場合のデモモード判定 */
  const IS_DEMO_MODE =
    typeof FIREBASE_CONFIG === "undefined" ||
    FIREBASE_CONFIG.apiKey === "YOUR_API_KEY";

  // ==========================================
  // デバイスID（匿名識別用・自分のメッセージ判定に使う）
  // ==========================================
  function getOrCreateDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = "d" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }

  const deviceId = getOrCreateDeviceId();

  // ==========================================
  // ニックネーム管理
  // ==========================================
  function getNickname() {
    return localStorage.getItem(NICK_STORAGE_KEY) || "";
  }

  function saveNickname(nick) {
    localStorage.setItem(NICK_STORAGE_KEY, nick.trim());
  }

  // ==========================================
  // 時刻フォーマット
  // ==========================================
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  // ==========================================
  // HTML エスケープ
  // ==========================================
  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ==========================================
  // DOM構築
  // ==========================================
  function buildChatDOM() {
    // フローティングボタン
    const fab = document.createElement("button");
    fab.className = "chat-fab";
    fab.id = "chat-fab";
    fab.setAttribute("aria-label", "チャットを開く");
    fab.innerHTML = `💬<span class="chat-fab-badge" id="chat-fab-badge"></span>`;

    // ニックネーム変更モーダル
    const nickModalOverlay = document.createElement("div");
    nickModalOverlay.className = "chat-nick-modal-overlay";
    nickModalOverlay.id = "chat-nick-modal-overlay";
    nickModalOverlay.innerHTML = `
      <div class="chat-nick-modal" role="dialog" aria-label="ニックネーム変更">
        <div class="chat-nick-modal-title">✏️ ニックネームを変更</div>
        <input
          class="chat-nick-modal-input"
          id="chat-nick-modal-input"
          type="text"
          maxlength="${MAX_NICK_LENGTH}"
          placeholder="新しい名前（最大${MAX_NICK_LENGTH}文字）"
        />
        <div class="chat-nick-modal-btns">
          <button class="chat-nick-modal-cancel" id="chat-nick-modal-cancel">キャンセル</button>
          <button class="chat-nick-modal-ok" id="chat-nick-modal-ok">変更する</button>
        </div>
      </div>
    `;

    // チャットパネル
    const panel = document.createElement("div");
    panel.className = "chat-panel";
    panel.id = "chat-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "グローバルチャット");
    panel.innerHTML = `
      <div class="chat-header">
        <span class="chat-header-title">⚔️ WeFi戦記チャット</span>
        <button class="chat-nick-display" id="chat-nick-display" aria-label="ニックネームを変更">
          ゲスト
        </button>
        <button class="chat-close-btn" id="chat-close-btn" aria-label="チャットを閉じる">✕</button>
      </div>

      <!-- ニックネーム入力画面（初回） -->
      <div class="chat-nick-screen" id="chat-nick-screen">
        <div class="chat-nick-title">⚔️ WeFi戦記チャットへようこそ！</div>
        <div class="chat-nick-desc">
          ニックネームを設定して<br>他の戦士たちと話そう
        </div>
        <input
          class="chat-nick-input"
          id="chat-nick-first-input"
          type="text"
          maxlength="${MAX_NICK_LENGTH}"
          placeholder="名前を入力（最大${MAX_NICK_LENGTH}文字）"
        />
        <button class="chat-nick-submit" id="chat-nick-first-submit">戦場へ参る！</button>
      </div>

      <!-- メッセージ一覧 -->
      <div class="chat-messages-area is-hidden" id="chat-messages-area">
        <div class="chat-empty-hint" id="chat-empty-hint">
          まだメッセージはありません。<br>最初の一言を送ろう！
        </div>
      </div>

      <!-- エラーバー -->
      <div class="chat-error-bar" id="chat-error-bar">
        接続に失敗しました。ネットワークを確認してください。
      </div>

      <!-- 入力エリア -->
      <div class="chat-input-area is-hidden" id="chat-input-area">
        <input
          class="chat-text-input"
          id="chat-text-input"
          type="text"
          maxlength="${MAX_MSG_LENGTH}"
          placeholder="メッセージを入力..."
          autocomplete="off"
        />
        <button class="chat-send-btn" id="chat-send-btn">送信</button>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);
    document.body.appendChild(nickModalOverlay);
  }

  // ==========================================
  // 状態管理
  // ==========================================
  const chatState = {
    /** パネルが開いているか */
    isOpen: false,
    /** ニックネームが設定済みか */
    hasNick: false,
    /** 未読件数 */
    unreadCount: 0,
    /** 最後に送信した時刻 */
    lastSentAt: 0,
    /** Firebaseリスナー */
    dbListener: null,
    /** デモモードのメッセージ一覧（Firebaseなし時） */
    demoMessages: []
  };

  // ==========================================
  // UI参照
  // ==========================================
  let elFab, elBadge, elPanel, elNickDisplay;
  let elNickScreen, elFirstInput, elFirstSubmit;
  let elMessagesArea, elEmptyHint, elErrorBar;
  let elInputArea, elTextInput, elSendBtn;
  let elNickModalOverlay, elNickModalInput, elNickModalOk, elNickModalCancel;

  function bindElements() {
    elFab = document.getElementById("chat-fab");
    elBadge = document.getElementById("chat-fab-badge");
    elPanel = document.getElementById("chat-panel");
    elNickDisplay = document.getElementById("chat-nick-display");
    elNickScreen = document.getElementById("chat-nick-screen");
    elFirstInput = document.getElementById("chat-nick-first-input");
    elFirstSubmit = document.getElementById("chat-nick-first-submit");
    elMessagesArea = document.getElementById("chat-messages-area");
    elEmptyHint = document.getElementById("chat-empty-hint");
    elErrorBar = document.getElementById("chat-error-bar");
    elInputArea = document.getElementById("chat-input-area");
    elTextInput = document.getElementById("chat-text-input");
    elSendBtn = document.getElementById("chat-send-btn");
    elNickModalOverlay = document.getElementById("chat-nick-modal-overlay");
    elNickModalInput = document.getElementById("chat-nick-modal-input");
    elNickModalOk = document.getElementById("chat-nick-modal-ok");
    elNickModalCancel = document.getElementById("chat-nick-modal-cancel");
  }

  // ==========================================
  // パネル開閉
  // ==========================================
  function openPanel() {
    chatState.isOpen = true;
    elPanel.classList.add("is-open");
    // 未読クリア
    chatState.unreadCount = 0;
    elBadge.textContent = "";
    elBadge.classList.remove("is-visible");

    if (chatState.hasNick) {
      // ニックネーム設定済みならメッセージ画面へスクロール
      scrollToBottom();
      setTimeout(() => elTextInput.focus(), 250);
    } else {
      setTimeout(() => elFirstInput.focus(), 250);
    }
  }

  function closePanel() {
    chatState.isOpen = false;
    elPanel.classList.remove("is-open");
  }

  // ==========================================
  // ニックネーム画面の表示切替
  // ==========================================
  function showChatScreen() {
    elNickScreen.classList.add("is-hidden");
    elMessagesArea.classList.remove("is-hidden");
    elInputArea.classList.remove("is-hidden");
  }

  function showNickScreen() {
    elNickScreen.classList.remove("is-hidden");
    elMessagesArea.classList.add("is-hidden");
    elInputArea.classList.add("is-hidden");
  }

  function updateNickDisplay(nick) {
    elNickDisplay.textContent = nick;
  }

  // ==========================================
  // ニックネーム確定処理（初回）
  // ==========================================
  function submitFirstNick() {
    const raw = elFirstInput.value.trim();
    if (!raw) {
      elFirstInput.focus();
      return;
    }
    const nick = raw.slice(0, MAX_NICK_LENGTH);
    saveNickname(nick);
    chatState.hasNick = true;
    updateNickDisplay(nick);
    showChatScreen();
    scrollToBottom();
    elTextInput.focus();
  }

  // ==========================================
  // ニックネーム変更モーダル
  // ==========================================
  function openNickModal() {
    elNickModalInput.value = getNickname();
    elNickModalOverlay.classList.add("is-open");
    setTimeout(() => elNickModalInput.focus(), 200);
  }

  function closeNickModal() {
    elNickModalOverlay.classList.remove("is-open");
  }

  function submitNickChange() {
    const raw = elNickModalInput.value.trim();
    if (!raw) {
      elNickModalInput.focus();
      return;
    }
    const nick = raw.slice(0, MAX_NICK_LENGTH);
    saveNickname(nick);
    updateNickDisplay(nick);
    closeNickModal();
  }

  // ==========================================
  // メッセージ描画
  // ==========================================
  function renderMessage(msgData) {
    const isMine = msgData.deviceId === deviceId;
    const isSystem = msgData.type === "system";

    // 空のヒントを非表示
    if (elEmptyHint) {
      elEmptyHint.style.display = "none";
    }

    const el = document.createElement("div");
    el.className =
      "chat-message" +
      (isMine ? " is-mine" : "") +
      (isSystem ? " is-system" : "");

    if (isSystem) {
      el.innerHTML = `<div class="chat-message-bubble">${escapeHtml(msgData.text)}</div>`;
    } else {
      el.innerHTML = `
        <div class="chat-message-meta">
          <span class="chat-message-nick">${escapeHtml(msgData.nick)}</span>
          <span class="chat-message-time">${formatTime(msgData.timestamp)}</span>
        </div>
        <div class="chat-message-bubble">${escapeHtml(msgData.text)}</div>
      `;
    }

    elMessagesArea.appendChild(el);
    scrollToBottom();

    // 未読カウント（パネルが閉じているとき）
    if (!chatState.isOpen && !isMine) {
      chatState.unreadCount++;
      if (chatState.unreadCount > 99) {
        elBadge.textContent = "99+";
      } else {
        elBadge.textContent = chatState.unreadCount;
      }
      elBadge.classList.add("is-visible");
    }
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      elMessagesArea.scrollTop = elMessagesArea.scrollHeight;
    });
  }

  // ==========================================
  // メッセージ送信
  // ==========================================
  function sendMessage() {
    const text = elTextInput.value.trim();
    if (!text) return;

    // クールダウンチェック
    const now = Date.now();
    if (now - chatState.lastSentAt < SEND_COOLDOWN_MS) return;
    chatState.lastSentAt = now;

    const nick = getNickname();
    const msgData = {
      nick: nick,
      text: text.slice(0, MAX_MSG_LENGTH),
      deviceId: deviceId,
      timestamp: now
    };

    elTextInput.value = "";
    elSendBtn.disabled = true;
    setTimeout(() => {
      elSendBtn.disabled = false;
    }, SEND_COOLDOWN_MS);

    if (IS_DEMO_MODE) {
      // デモモード：Firebaseなしでローカル表示のみ
      renderMessage(msgData);
      return;
    }

    // Firebase へ書き込み
    const db = firebase.database();
    const ref = db.ref("chat/messages");
    ref
      .push(msgData)
      .catch(() => {
        elErrorBar.classList.add("is-visible");
      });
  }

  // ==========================================
  // Firebase リスナー設定
  // ==========================================
  function startFirebaseListener() {
    if (IS_DEMO_MODE) {
      // デモモード：システムメッセージを表示
      renderMessage({
        type: "system",
        text: "⚠️ デモモード（firebase-config.js を設定するとリアルタイム通信が有効になります）",
        timestamp: Date.now()
      });
      return;
    }

    try {
      firebase.initializeApp(FIREBASE_CONFIG);
    } catch (e) {
      // 既に初期化済みの場合は無視
    }

    const db = firebase.database();
    const messagesRef = db.ref("chat/messages").limitToLast(MAX_MESSAGES);

    messagesRef.on(
      "child_added",
      (snapshot) => {
        elErrorBar.classList.remove("is-visible");
        const data = snapshot.val();
        if (data) renderMessage(data);
      },
      () => {
        elErrorBar.classList.add("is-visible");
      }
    );

    chatState.dbListener = messagesRef;
  }

  // ==========================================
  // イベントバインド
  // ==========================================
  function bindEvents() {
    // フローティングボタン
    elFab.addEventListener("click", () => {
      if (chatState.isOpen) {
        closePanel();
      } else {
        openPanel();
      }
    });

    // 閉じるボタン
    document.getElementById("chat-close-btn").addEventListener("click", closePanel);

    // 初回ニックネーム送信
    elFirstSubmit.addEventListener("click", submitFirstNick);
    elFirstInput.addEventListener("keydown", (e) => {
      if (e.isComposing) return;
      if (e.key === "Enter") submitFirstNick();
    });

    // ニックネーム変更ボタン（ヘッダー）
    elNickDisplay.addEventListener("click", () => {
      if (chatState.hasNick) openNickModal();
    });

    // モーダル操作
    elNickModalOk.addEventListener("click", submitNickChange);
    elNickModalCancel.addEventListener("click", closeNickModal);
    elNickModalInput.addEventListener("keydown", (e) => {
      if (e.isComposing) return;
      if (e.key === "Enter") submitNickChange();
      if (e.key === "Escape") closeNickModal();
    });
    elNickModalOverlay.addEventListener("click", (e) => {
      if (e.target === elNickModalOverlay) closeNickModal();
    });

    // メッセージ送信
    elSendBtn.addEventListener("click", sendMessage);
    elTextInput.addEventListener("keydown", (e) => {
      if (e.isComposing) return;
      if (e.key === "Enter") sendMessage();
    });
  }

  // ==========================================
  // 初期化
  // ==========================================
  function init() {
    buildChatDOM();
    bindElements();
    bindEvents();

    const savedNick = getNickname();
    if (savedNick) {
      chatState.hasNick = true;
      updateNickDisplay(savedNick);
      showChatScreen();
    }

    startFirebaseListener();
  }

  // DOMが確実に読み込まれてから実行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
