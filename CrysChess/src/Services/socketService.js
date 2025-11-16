import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

let stompClient = null;
let connected = false;
let reconnectAttempts = 0;
const MAX_RETRIES = 5;


let activeGameId = null;

export const getActiveGameId = () => activeGameId;

/**
 * Connects to the WebSocket server and subscribes to game updates
 */
export const connectSocket = (gameId, callback) => {
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

      stompClient.subscribe(`/topic/game/${gameId}`, (message) => {
        if (message.body) {
          const gameUpdate = JSON.parse(message.body);
          callback(gameUpdate);
        }
      });
      
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
  console.log(`🔁 Attempting reconnect #${reconnectAttempts} in ${delay / 1000}s`);

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


export const isSocketConnected = () => connected;
