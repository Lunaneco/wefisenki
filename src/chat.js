/**
 * WeFi戦記 グローバルチャット機能
 */
(function () {
  "use strict";

  const NICK_STORAGE_KEY = "wefi-chat-nickname";
  const DEVICE_ID_KEY = "wefi-chat-device-id";
  const MAX_MESSAGES = 100;
  const MAX_MSG_LENGTH = 80;
  const MAX_NICK_LENGTH = 12;
  const SEND_COOLDOWN_MS = 1500;
  const IS_DEMO_MODE = typeof FIREBASE_CONFIG === "undefined" || FIREBASE_CONFIG.apiKey === "YOUR_API_KEY";

  function getOrCreateDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = "d" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }

  const deviceId = getOrCreateDeviceId();

  function getNickname() {
    return localStorage.getItem(NICK_STORAGE_KEY) || "";
  }

  function saveNickname(nick) {
    localStorage.setItem(NICK_STORAGE_KEY, nick.trim());
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function buildChatDOM() {
    const nickModalOverlay = document.createElement("div");
    nickModalOverlay.className = "chat-nick-modal-overlay";
    nickModalOverlay.id = "chat-nick-modal-overlay";
    nickModalOverlay.innerHTML = `
      <div class="chat-nick-modal" role="dialog">
        <div class="chat-nick-modal-title">✏️ ニックネームを変更</div>
        <input class="chat-nick-modal-input" id="chat-nick-modal-input" type="text" maxlength="${MAX_NICK_LENGTH}" placeholder="新しい名前" />
        <div class="chat-nick-modal-btns">
          <button class="chat-nick-modal-cancel" id="chat-nick-modal-cancel">キャンセル</button>
          <button class="chat-nick-modal-ok" id="chat-nick-modal-ok">変更する</button>
        </div>
      </div>
    `;

    const panel = document.createElement("div");
    panel.className = "chat-panel";
    panel.id = "chat-panel";
    panel.innerHTML = `
      <div class="chat-header">
        <span class="chat-header-title">⚔️ グローバルチャット</span>
        <button class="chat-nick-display" id="chat-nick-display">ゲスト</button>
      </div>

      <div class="chat-nick-screen" id="chat-nick-screen">
        <div class="chat-nick-title">⚔️ WeFi戦記チャットへようこそ！</div>
        <div class="chat-nick-desc">ニックネームを設定して他の戦士たちと話そう</div>
        <input class="chat-nick-input" id="chat-nick-first-input" type="text" maxlength="${MAX_NICK_LENGTH}" placeholder="名前を入力" />
        <button class="chat-nick-submit" id="chat-nick-first-submit">戦場へ参る！</button>
      </div>

      <div class="chat-messages-area is-hidden" id="chat-messages-area">
        <div class="chat-empty-hint" id="chat-empty-hint">まだメッセージはありません。</div>
      </div>

      <div class="chat-error-bar" id="chat-error-bar">接続エラー。FirebaseのデータベースURLなどを確認してください。</div>

      <div class="chat-input-area is-hidden" id="chat-input-area">
        <input class="chat-text-input" id="chat-text-input" type="text" maxlength="${MAX_MSG_LENGTH}" placeholder="メッセージを入力..." autocomplete="off" />
        <button class="chat-send-btn" id="chat-send-btn">送信</button>
      </div>
    `;

    document.body.appendChild(nickModalOverlay);
    // パネルはプレイサーフェスにオーバーレイさせる
    const playSurface = document.querySelector(".play-surface");
    if (playSurface) {
      playSurface.appendChild(panel);
    } else {
      document.body.appendChild(panel);
    }
  }

  const chatState = {
    isOpen: false,
    hasNick: false,
    unreadCount: 0,
    lastSentAt: 0,
    dbListener: null,
  };

  let elTabBtn, elTabBadge, elPanel, elNickDisplay;
  let elNickScreen, elFirstInput, elFirstSubmit;
  let elMessagesArea, elEmptyHint, elErrorBar;
  let elInputArea, elTextInput, elSendBtn;
  let elNickModalOverlay, elNickModalInput, elNickModalOk, elNickModalCancel;

  function bindElements() {
    elTabBtn = document.getElementById("tab-chat-btn");
    elTabBadge = document.getElementById("chat-tab-badge");
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

  function openPanel() {
    chatState.isOpen = true;
    elPanel.classList.add("is-open");
    chatState.unreadCount = 0;
    if (elTabBadge) {
      elTabBadge.textContent = "";
      elTabBadge.classList.remove("is-visible");
    }

    if (chatState.hasNick) {
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

  function showChatScreen() {
    elNickScreen.classList.add("is-hidden");
    elMessagesArea.classList.remove("is-hidden");
    elInputArea.classList.remove("is-hidden");
  }

  function updateNickDisplay(nick) {
    elNickDisplay.textContent = nick;
  }

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

  function renderMessage(msgData) {
    const isMine = msgData.deviceId === deviceId;
    const isSystem = msgData.type === "system";

    if (elEmptyHint) elEmptyHint.style.display = "none";

    const el = document.createElement("div");
    el.className = "chat-message" + (isMine ? " is-mine" : "") + (isSystem ? " is-system" : "");

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

    if (!chatState.isOpen && !isMine && elTabBadge) {
      chatState.unreadCount++;
      elTabBadge.textContent = chatState.unreadCount > 99 ? "99+" : chatState.unreadCount;
      elTabBadge.classList.add("is-visible");
    }
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      elMessagesArea.scrollTop = elMessagesArea.scrollHeight;
    });
  }

  function sendMessage() {
    const text = elTextInput.value.trim();
    if (!text) return;

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
      renderMessage(msgData);
      return;
    }

    try {
      firebase.database().ref("chat/messages").push(msgData).catch(err => {
        console.error("Firebase send error:", err);
        elErrorBar.classList.add("is-visible");
      });
    } catch (e) {
      console.error("Firebase write error:", e);
      elErrorBar.classList.add("is-visible");
    }
  }

  function startFirebaseListener() {
    if (IS_DEMO_MODE) {
      renderMessage({ type: "system", text: "⚠️ デモモード", timestamp: Date.now() });
      return;
    }

    try {
      firebase.initializeApp(FIREBASE_CONFIG);
    } catch (e) {
      // ignore
    }

    try {
      const db = firebase.database();
      const messagesRef = db.ref("chat/messages").limitToLast(MAX_MESSAGES);

      messagesRef.on(
        "child_added",
        (snapshot) => {
          elErrorBar.classList.remove("is-visible");
          const data = snapshot.val();
          if (data) renderMessage(data);
        },
        (error) => {
          console.error("Firebase listen error:", error);
          elErrorBar.classList.add("is-visible");
        }
      );
    } catch (e) {
      console.error("Firebase init error:", e);
      elErrorBar.classList.add("is-visible");
    }
  }

  function bindEvents() {
    // タブボタン監視 (DOMが変更される可能性があるため全体を監視または直接イベントを張る)
    document.querySelectorAll(".tab-button").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.view === "chat") {
          openPanel();
        } else {
          closePanel();
        }
      });
    });

    elFirstSubmit.addEventListener("click", submitFirstNick);
    elFirstInput.addEventListener("keydown", (e) => {
      if (e.isComposing) return;
      if (e.key === "Enter") submitFirstNick();
    });

    elNickDisplay.addEventListener("click", () => {
      if (chatState.hasNick) openNickModal();
    });

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

    elSendBtn.addEventListener("click", sendMessage);
    elTextInput.addEventListener("keydown", (e) => {
      if (e.isComposing) return;
      if (e.key === "Enter") sendMessage();
    });
  }

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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
