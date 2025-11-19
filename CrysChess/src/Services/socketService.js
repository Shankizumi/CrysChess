import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

let stompClient = null;
let connected = false;
let reconnectAttempts = 0;
const MAX_RETRIES = 5;

let activeGameId = null;

export const getActiveGameId = () => activeGameId;
// chat listener registry (no props / no Redux required)
const chatListeners = [];

/**
 * Register/unregister chat listeners (components call these directly)
 * listener: function(messageObj) => void
 */
export const registerChatListener = (listener) => {
  if (chatListeners.includes(listener)) return () => {};
  chatListeners.push(listener);

  return () => {
    const idx = chatListeners.indexOf(listener);
    if (idx !== -1) chatListeners.splice(idx, 1);
  };
};


export const unregisterChatListener = (listener) => {
  const idx = chatListeners.indexOf(listener);
  if (idx !== -1) chatListeners.splice(idx, 1);
};

/**
 * Connects to the WebSocket server and subscribes to game updates
 */
export const connectSocket = (gameId, callback) => {

  if (stompClient && connected && activeGameId === gameId) {
  console.log("⚠️ Already subscribed to this game topic.");
  return;
}



  if (stompClient && connected) {
    console.log("✅ Already connected to socket");
    activeGameId = gameId;

    return;
  }

  const socket = new SockJS("http://localhost:8080/ws-game"); // ✅ match backend endpoint
  stompClient = Stomp.over(() => socket);

  stompClient.reconnect_delay = 5000;
  stompClient.debug = () => {}; // silence noisy logs

  stompClient.connect(
    {},
    () => {
      connected = true;
      reconnectAttempts = 0;
      console.log("🔗 Connected to WebSocket server");

      // inside connectSocket success callback, replace subscribe(...) with this
      setTimeout(() => {
if (!stompClient._hasSubscribed) {
  stompClient._hasSubscribed = true;

  stompClient.subscribe(`/topic/game/${gameId}`, (message) => {
    if (!message.body) return;

    const data = JSON.parse(message.body);

    if (data.type === "CHAT" && data.message) {
      chatListeners.forEach((fn) => fn(data.message));
      return;
    }

    callback(data);
  });
}
     }, 50);
    },
    (error) => {
      console.error("⚠️ WebSocket error:", error);
      connected = false;
      attemptReconnect(gameId, callback);
    }
  );
};

/**
 * Try reconnecting on failure
 */
const attemptReconnect = (gameId, callback) => {
  if (reconnectAttempts >= MAX_RETRIES) {
    console.error("❌ Max reconnection attempts reached.");
    return;
  }

  reconnectAttempts++;
  const delay = reconnectAttempts * 2000; // exponential-ish backoff
  console.log(
    `🔁 Attempting reconnect #${reconnectAttempts} in ${delay / 1000}s`
  );

  setTimeout(() => {
    connectSocket(gameId, callback);
  }, delay);
};

/**
 * Send "join" message
 */
export const sendJoin = (gameId, username) => {
  if (!stompClient || !connected) {
    console.warn("⏳ Cannot send join — socket not connected yet.");
    return;
  }
  stompClient.send(`/app/game/${gameId}/join`, {}, username);
};

/**
 * Send "move" message
 */
export const sendMove = (gameId, move) => {
  if (!stompClient || !connected) {
    console.warn("⏳ Cannot send move — socket not connected yet.");
    return;
  }
  stompClient.send(`/app/game/${gameId}/move`, {}, move);
};

/**
 * Send "end game" message
 */
export const sendEnd = (gameId, winnerUsername) => {
  if (!stompClient || !connected) {
    console.warn("⏳ Cannot send end — socket not connected yet.");
    return;
  }
  stompClient.send(`/app/game/${gameId}/end`, {}, winnerUsername);
};

/**
 * Optional: Disconnect manually
 */
export const disconnectSocket = () => {
  if (stompClient && connected) {
    stompClient.disconnect(() => {
      console.log("🔌 Disconnected from WebSocket");
      connected = false;
    });
  }
};

/**
 * Send chat message (ephemeral — no DB)
 * messageObj: { sender, text, timestamp }
 */
export const sendChat = (gameId, messageObj) => {
  if (!stompClient || !connected) {
    console.warn("⏳ Cannot send chat — socket not connected yet.");
    return;
  }

  // server expects a chat route; backend may ignore/store — we treat as ephemeral
  const payload = JSON.stringify({
    type: "CHAT",
    gameId,
    message: messageObj,
  });

  stompClient.send(`/app/game/${gameId}/chat`, {}, payload);
};

export const isSocketConnected = () => connected;
