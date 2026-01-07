import React, { useState, useEffect } from "react";
import { connectSocket } from "../Services/socketService";
import { useSelector } from "react-redux";
import { sendFriendRequest } from "../store/friendSlice";
import userService from "../Services/userService";
import { useDispatch } from "react-redux";
import FriendService from "../Services/friendService";
import { sendEnd, getActiveGameId } from "../Services/socketService";
import { sendChat, registerChatListener, unregisterChatListener } from "../Services/socketService";
import { useNavigate } from "react-router-dom";

import "./GameBoard.css";

const BOARD_SIZE = 8;
const ANIM_DURATION = 500;

const RulesModal = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="rules-modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rules-modal-content">
        <button
          className="rules-modal-close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <h2>Game Rules — Board Mechanics</h2>

        <div className="rules-body">
          <h3>Quick summary</h3>
          <ul>
            <li>
              Turn-based: <b>red</b> starts first. Each successful move or
              activation consumes the current player's turn.
            </li>
            <li>
              Move: move orthogonally by 1 cell (up/down/left/right) into an
              empty cell. Can move via click-selection, drag & drop, or arrow
              keys.
            </li>
            <li>
              Special stones: <b>triple (exact 3)</b>, <b>quad (exact 4)</b>,{" "}
              <b>star (exact 5)</b>, <b>hexa (exact 6)</b>. Exact length
              detection only — not part of longer runs.
            </li>
            <li>Activation: double-click on your special stone to activate.</li>
            <li>
              Win: counts are checked after every change. If one player has &lt;
              3 stones and the opponent has ≥ 3, the opponent wins. If both &lt;
              3 → Draw.
            </li>
          </ul>

          <h3>Detailed rules (how the code implements them)</h3>
          <ol>
            <li>
              <b>Movement & selection</b>
              <ul>
                <li>
                  Single click selects a piece. Click a valid neighbouring empty
                  cell to move it.
                </li>
                <li>
                  Keyboard: when a piece is selected, Arrow keys move it (if
                  valid). Movement is allowed only if the piece belongs to the
                  current player's color.
                </li>
                <li>
                  Drag & drop is allowed for pieces owned by the current player.
                </li>
              </ul>
            </li>

            <li>
              <b>Exact-run detection</b>
              <ul>
                <li>
                  The game scans rows and columns for runs of exactly 3, 4, 5,
                  or 6 stones of the same base color.
                </li>
                <li>
                  For <b>quad (4)</b>, <b>star (5)</b> and <b>hexa (6)</b>{" "}
                  triggers, there must be an adjacent enemy stone immediately
                  before or after the run — otherwise that run doesn't trigger
                  anything.
                </li>
                <li>
                  When an adjacent enemy exists on both ends, the code
                  deterministically prefers the <b>after</b> side (right or
                  down). If no after side, it uses before (left or up).
                </li>
              </ul>
            </li>

            <li>
              <b>Triple (exact 3)</b>
              <ul>
                <li>
                  Detected for exact 3 in a row/column (not part of longer run).
                </li>
                <li>
                  Destroys enemy stones immediately adjacent to both ends of the
                  triple (if present).
                </li>
                <li>
                  No new special piece is spawned for triples — they just remove
                  enemies at the ends.
                </li>
              </ul>
            </li>

            <li>
              <b>Quad (exact 4)</b>
              <ul>
                <li>
                  Exact 4 + at least one adjacent enemy → the adjacent enemy is
                  destroyed and one endpoint stone of the 4 is upgraded into a{" "}
                  <b>quad crystal</b>.
                </li>
                <li>
                  Which endpoint becomes the quad: endpoint on the side where an
                  adjacent enemy exists (prefer AFTER if both).
                </li>
                <li>
                  <b>Activation:</b> double-click a quad (your own) to destroy
                  all enemy stones in the 3×3 centered on that quad. The quad is
                  consumed and the player's turn is used.
                </li>
              </ul>
            </li>

            <li>
              <b>Star (exact 5)</b>
              <ul>
                <li>
                  Exact 5 + adjacent enemy → adjacent enemy destroyed; endpoint
                  stone upgraded into a <b>star</b>.
                </li>
                <li>
                  <b>Activation:</b> double-click the star (or press{" "}
                  <b>Enter</b> when the star is selected) to destroy all enemy
                  stones in the same row. The star is consumed and the player's
                  turn is used.
                </li>
              </ul>
            </li>

            <li>
              <b>Hexa (exact 6)</b>
              <ul>
                <li>
                  Exact 6 + adjacent enemy → adjacent enemy destroyed; endpoint
                  stone upgraded into a <b>hexa</b> (crystal).
                </li>
                <li>
                  <b>Activation:</b> double-click the hexa (your own) to destroy
                  all enemy stones in the same row and the same column
                  (excluding the hexa itself). The hexa is consumed and the
                  player's turn is used.
                </li>
              </ul>
            </li>

            <li>
              <b>Ownership & restrictions</b>
              <ul>
                <li>
                  You can only move or activate pieces that match the current
                  player's color.
                </li>
                <li>Activating a special stone consumes the owner's turn.</li>
              </ul>
            </li>

            <li>
              <b>Winning condition (auto-checked)</b>
              <ul>
                <li>
                  After every board change, the code counts red and blue stones.
                  If one player's stone count &lt; 3 while opponent has ≥ 3,
                  opponent wins.
                </li>
                <li>
                  If both players have &lt; 3 stones the result is a Draw.
                </li>
              </ul>
            </li>
          </ol>

          <h3>Play tips</h3>
          <ul>
            <li>
              To create a quad/star/hexa, build an exact run (4/5/6) and make
              sure an enemy sits adjacent to the endpoint — that adjacency is
              required to spawn the upgraded crystal.
            </li>
            <li>
              Because upgrades happen after destroy animation, time your
              activations — the endpoint must survive the removal-step to be
              upgraded.
            </li>
            <li>
              Stars clear entire rows; hexa clears row+column — they are
              powerful board control tools but consume your turn when used.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const GameBoard = () => {
  const [gameOver, setGameOver] = useState(false);
  const gameId = useSelector((state) => state.game.gameId);
  const { gameData } = useSelector((state) => state.game);
  const [player1Details, setPlayer1Details] = useState(null);
  const [player2Details, setPlayer2Details] = useState(null);
  const user = useSelector((state) => state.user.user);
  const friendList = useSelector((state) => state.friends.friendList);
  const opponentId = player2Details?.id;
  const dispatch = useDispatch();
  const { pendingRequests } = useSelector((state) => state.friends);
  const [friendStatus, setFriendStatus] = useState(null);
  const [chatMessages, setChatMessages] = useState([]); // { sender, text, timestamp }
  const [chatInput, setChatInput] = useState("");


  const navigate = useNavigate();

  // ✅ Decide opponent based on whether user is player1 or player2
  const opponent =
    user?.id === player1Details?.id ? player2Details : player1Details;

  const isFriend = friendList.some(
    (f) =>
      (f.userId === user.id && f.friendId === opponentId) ||
      (f.friendId === user.id && f.userId === opponentId)
  );

  const isCurrentPlayer1 = Boolean(
    user?.id && gameData?.player1?.id && user.id === gameData.player1.id
  );

  // Derived player objects (may be undefined while waiting)

  useEffect(() => {
    // register local listener to receive chat messages delivered by socketService
    const listener = (msg) => {
      // msg shape: { sender, text, timestamp }
      setChatMessages((prev) => [...prev, msg]);
    };

    const unsubscribe = registerChatListener(listener);

    // Cleanup on unmount
    return () => {
      unsubscribe();
      // also remove if using unregisterChatListener
      unregisterChatListener(listener);
    };
  }, []); // no props - single listener for whole component lifecycle

  const leftPlayer = isCurrentPlayer1 ? gameData?.player1 : gameData?.player2;
  const rightPlayer = isCurrentPlayer1 ? gameData?.player2 : gameData?.player1;

  useEffect(() => {
    if (!opponent?.id || !user?.id || !pendingRequests) return;

    const exists = pendingRequests.some((req) => {
      const isBetween =
        (req.userId === user.id && req.friendId === opponent.id) ||
        (req.userId === opponent.id && req.friendId === user.id);

      return req.status === "PENDING" && isBetween;
    });
  }, [opponent, pendingRequests, user]);

  useEffect(() => {
    if (!user?.id || !opponent?.id) return;

    const loadStatus = async () => {
      try {
        const res = await FriendService.getFriendStatus(user.id, opponent.id);
        setFriendStatus(res.data); // ✅ PENDING / ACCEPTED / NONE
      } catch (err) {
        console.error("Failed to load friend status:", err);
      }
    };

    loadStatus();
  }, [user?.id, opponent?.id]);

  useEffect(() => {
    if (!gameData) return;

    // Derive who should appear left/right for THIS logged-in user
    const isPlayer1 = Boolean(
      user?.id && gameData.player1 && user.id === gameData.player1.id
    );
    const lp = isPlayer1 ? gameData.player1 : gameData.player2;
    const rp = isPlayer1 ? gameData.player2 : gameData.player1;

    // Reset while loading so UI doesn't briefly show stale values
    setPlayer1Details(null);
    setPlayer2Details(null);

    if (lp?.id) {
      userService
        .getUserById(lp.id)
        .then(setPlayer1Details)
        .catch(() => setPlayer1Details(null));
    }
    if (rp?.id) {
      userService
        .getUserById(rp.id)
        .then(setPlayer2Details)
        .catch(() => setPlayer2Details(null));
    }
  }, [gameData, user?.id]);

  const handleAddFriend = async () => {
    try {
      await FriendService.sendRequest(user.id, opponent.id);
      setFriendStatus("PENDING"); // ✅ instantly update
    } catch (err) {
      console.error("sendRequest error:", err);
    }
  };

  const handleGiveUp = () => {
    const activeId = getActiveGameId();
    if (!activeId) {
      console.error("No active game ID found.");
      return;
    }

    const winnerUsername = opponent?.username || "Opponent";

    console.log("🏳 Player gave up! Winner:", winnerUsername);

    // 🔥 Immediately show modal
    setWinner(winnerUsername);
    setGameOver(true);

    // Notify backend
    sendEnd(activeId, winnerUsername);
  };


const sendChatMessage = () => {
  const text = (chatInput || "").trim();
  if (!text) return;

  const message = {
    sender: user?.username || "You",
    text,
    timestamp: Date.now(),
  };

  const activeId = gameId || getActiveGameId();
  if (!activeId) {
    console.warn("No active game id for chat");
    setChatInput("");
    return;
  }

  // send over socket only (remove local echo)
  sendChat(activeId, message);

  // clear input — UI will update when server echoes the message
  setChatInput("");
};

  // ----------------- Helpers -----------------
  const createInitialBoard = () => {
    const board = Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(null)
    );
    for (let row = 0; row < 2; row++) board[row].fill("red");
    for (let row = BOARD_SIZE - 2; row < BOARD_SIZE; row++)
      board[row].fill("blue");
    return board;
  };

  const [board, setBoard] = useState(createInitialBoard);
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState("red");
  const [destroyingStones, setDestroyingStones] = useState([]); // animation tracker
  const [winner, setWinner] = useState(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  // helper to get base color (e.g., "red" from "red" or "red-quad")
  const baseColor = (p) =>
    p && typeof p === "string" ? p.split("-")[0] : null;

  const makeQuad = (color) => `${color}-quad`;
  const makeStar = (color) => `${color}-star`;
  const makeHexa = (color) => `${color}-hexa`;

  useEffect(() => {
    if (winner || gameOver) return; // stop if game already finished

    let redCount = 0;
    let blueCount = 0;

    board.forEach((row) => {
      row.forEach((cell) => {
        const color = baseColor(cell);
        if (color === "red") redCount++;
        if (color === "blue") blueCount++;
      });
    });

    let newWinner = null;
    if (redCount < 3 && blueCount >= 3) {
      newWinner = "Blue";
    } else if (blueCount < 3 && redCount >= 3) {
      newWinner = "Red";
    } else if (redCount < 3 && blueCount < 3) {
      newWinner = "Draw";
    }

    if (newWinner) {
      setWinner(newWinner);
      setGameOver(true);

      // 🔥 Show the modal

      // Send to backend only if it's not a draw
      if (newWinner !== "Draw") {
        sendEnd(gameId, newWinner);
      }
    }
  }, [board, winner, gameOver, gameId]);

  const isValidMove = (fromRow, fromCol, toRow, toCol) => {
    const dx = Math.abs(fromRow - toRow);
    const dy = Math.abs(fromCol - toCol);
    return dx + dy === 1;
  };

  const withinBounds = (r, c) =>
    r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

  // (scanLine is present but we use explicit loops for clarity & parity with original logic)
  const scanLine = (line, getCell, len, exactLen, handler) => {
    for (let i = 0; i <= BOARD_SIZE - len; i++) {
      const color = baseColor(getCell(i));
      if (!color) continue;

      // check run
      let valid = true;
      for (let k = 1; k < len; k++) {
        if (baseColor(getCell(i + k)) !== color) {
          valid = false;
          break;
        }
      }
      if (!valid) continue;

      // ensure exact length (not part of longer run)
      const beforeSame = i - 1 >= 0 && baseColor(getCell(i - 1)) === color;
      const afterSame =
        i + len < BOARD_SIZE && baseColor(getCell(i + len)) === color;
      if (beforeSame || afterSame) continue;

      handler(i, color);
    }
  };

  /**
   * checkAndDestroy:
   * - detect exact 6 → produce hexaSpawns
   * - detect exact 5 → starSpawns (existing)
   * - detect exact 4 → quadSpawns (existing)
   * - detect exact 3 → destroys adjacent enemies
   * - animate enemy removals, then apply removals + place spawns
   */

  useEffect(() => {
    connectSocket(gameId, (updatedGame) => {
      setBoard(JSON.parse(updatedGame.boardState));
    });
  }, []);

  const checkAndDestroy = (newBoard) => {
    const updated = newBoard.map((r) => [...r]);
    const toDestroySet = new Set(); // "r,c"
    const quadSpawns = []; // { r, c, color }
    const starSpawns = [];
    const hexaSpawns = [];

    // ---------- HEXA detection (exact 6) ----------
    // Horizontal hexa (exact 6)
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c <= BOARD_SIZE - 6; c++) {
        const a = updated[r][c];
        if (!a) continue;
        const color = baseColor(a);
        if (
          color &&
          baseColor(updated[r][c + 1]) === color &&
          baseColor(updated[r][c + 2]) === color &&
          baseColor(updated[r][c + 3]) === color &&
          baseColor(updated[r][c + 4]) === color &&
          baseColor(updated[r][c + 5]) === color
        ) {
          // ensure exact 6 (not part of 7+)
          const leftSame = c - 1 >= 0 && baseColor(updated[r][c - 1]) === color;
          const rightSame =
            c + 6 < BOARD_SIZE && baseColor(updated[r][c + 6]) === color;
          if (leftSame || rightSame) continue;

          // check adjacent enemies
          const beforeEnemy =
            c - 1 >= 0 &&
            updated[r][c - 1] &&
            baseColor(updated[r][c - 1]) !== color;
          const afterEnemy =
            c + 6 < BOARD_SIZE &&
            updated[r][c + 6] &&
            baseColor(updated[r][c + 6]) !== color;

          if (!beforeEnemy && !afterEnemy) continue;

          // deterministic pick: prefer AFTER side if exists, else BEFORE
          if (afterEnemy) {
            toDestroySet.add(`${r},${c + 6}`); // explode enemy at right end
            // upgrade rightmost stone (c+5) into hexa
            hexaSpawns.push({ r, c: c + 5, color });
          } else {
            toDestroySet.add(`${r},${c - 1}`); // explode enemy at left end
            // upgrade leftmost stone (c) into hexa
            hexaSpawns.push({ r, c: c, color });
          }
        }
      }
    }

    // Vertical hexa (exact 6)
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r <= BOARD_SIZE - 6; r++) {
        const a = updated[r][c];
        if (!a) continue;
        const color = baseColor(a);
        if (
          color &&
          baseColor(updated[r + 1][c]) === color &&
          baseColor(updated[r + 2][c]) === color &&
          baseColor(updated[r + 3][c]) === color &&
          baseColor(updated[r + 4][c]) === color &&
          baseColor(updated[r + 5][c]) === color
        ) {
          // ensure exact 6 (not part of 7+)
          const upSame = r - 1 >= 0 && baseColor(updated[r - 1][c]) === color;
          const downSame =
            r + 6 < BOARD_SIZE && baseColor(updated[r + 6][c]) === color;
          if (upSame || downSame) continue;

          const beforeEnemy =
            r - 1 >= 0 &&
            updated[r - 1][c] &&
            baseColor(updated[r - 1][c]) !== color;
          const afterEnemy =
            r + 6 < BOARD_SIZE &&
            updated[r + 6][c] &&
            baseColor(updated[r + 6][c]) !== color;

          if (!beforeEnemy && !afterEnemy) continue;

          if (afterEnemy) {
            toDestroySet.add(`${r + 6},${c}`); // explode enemy below
            // upgrade bottom stone (r+5)
            hexaSpawns.push({ r: r + 5, c, color });
          } else {
            toDestroySet.add(`${r - 1},${c}`); // explode enemy above
            // upgrade top stone (r)
            hexaSpawns.push({ r: r, c: c, color });
          }
        }
      }
    }

    // ---------- STAR detection (exact 5) ----------
    // Horizontal stars
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c <= BOARD_SIZE - 5; c++) {
        const a = updated[r][c];
        if (!a) continue;
        const color = baseColor(a);
        if (
          color &&
          baseColor(updated[r][c + 1]) === color &&
          baseColor(updated[r][c + 2]) === color &&
          baseColor(updated[r][c + 3]) === color &&
          baseColor(updated[r][c + 4]) === color
        ) {
          // ensure exact 5 (not part of 6+)
          const leftSame = c - 1 >= 0 && baseColor(updated[r][c - 1]) === color;
          const rightSame =
            c + 5 < BOARD_SIZE && baseColor(updated[r][c + 5]) === color;
          if (leftSame || rightSame) continue;

          // check adjacent enemies
          const beforeEnemy =
            c - 1 >= 0 &&
            updated[r][c - 1] &&
            baseColor(updated[r][c - 1]) !== color;
          const afterEnemy =
            c + 5 < BOARD_SIZE &&
            updated[r][c + 5] &&
            baseColor(updated[r][c + 5]) !== color;

          if (!beforeEnemy && !afterEnemy) continue;

          // deterministic pick: prefer AFTER side if exists, else BEFORE
          if (afterEnemy) {
            toDestroySet.add(`${r},${c + 5}`); // explode enemy at right end
            // upgrade rightmost stone (c+4) into star
            starSpawns.push({ r, c: c + 4, color });
          } else {
            toDestroySet.add(`${r},${c - 1}`); // explode enemy at left end
            // upgrade leftmost stone (c) into star
            starSpawns.push({ r, c: c, color });
          }
        }
      }
    }

    // Vertical stars
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r <= BOARD_SIZE - 5; r++) {
        const a = updated[r][c];
        if (!a) continue;
        const color = baseColor(a);
        if (
          color &&
          baseColor(updated[r + 1][c]) === color &&
          baseColor(updated[r + 2][c]) === color &&
          baseColor(updated[r + 3][c]) === color &&
          baseColor(updated[r + 4][c]) === color
        ) {
          // ensure exact 5 (not part of 6+)
          const upSame = r - 1 >= 0 && baseColor(updated[r - 1][c]) === color;
          const downSame =
            r + 5 < BOARD_SIZE && baseColor(updated[r + 5][c]) === color;
          if (upSame || downSame) continue;

          const beforeEnemy =
            r - 1 >= 0 &&
            updated[r - 1][c] &&
            baseColor(updated[r - 1][c]) !== color;
          const afterEnemy =
            r + 5 < BOARD_SIZE &&
            updated[r + 5][c] &&
            baseColor(updated[r + 5][c]) !== color;

          if (!beforeEnemy && !afterEnemy) continue;

          if (afterEnemy) {
            toDestroySet.add(`${r + 5},${c}`); // explode enemy below
            // upgrade bottom stone (r+4)
            starSpawns.push({ r: r + 4, c, color });
          } else {
            toDestroySet.add(`${r - 1},${c}`); // explode enemy above
            // upgrade top stone (r)
            starSpawns.push({ r: r, c, color });
          }
        }
      }
    }

    // ---------- QUAD detection (exact 4) ----------
    // Horizontal quads
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c <= BOARD_SIZE - 4; c++) {
        const a = updated[r][c];
        if (!a) continue;
        const color = baseColor(a);
        if (
          color &&
          baseColor(updated[r][c + 1]) === color &&
          baseColor(updated[r][c + 2]) === color &&
          baseColor(updated[r][c + 3]) === color
        ) {
          // ensure not part of 5+
          const leftSame = c - 1 >= 0 && baseColor(updated[r][c - 1]) === color;
          const rightSame =
            c + 4 < BOARD_SIZE && baseColor(updated[r][c + 4]) === color;
          if (leftSame || rightSame) continue; // part of longer run -> skip

          // check adjacent enemies
          const beforeEnemy =
            c - 1 >= 0 &&
            updated[r][c - 1] &&
            baseColor(updated[r][c - 1]) !== color;
          const afterEnemy =
            c + 4 < BOARD_SIZE &&
            updated[r][c + 4] &&
            baseColor(updated[r][c + 4]) !== color;

          if (!beforeEnemy && !afterEnemy) continue; // quad needs adjacent enemy to trigger

          // deterministic pick: prefer the AFTER side if exists, else BEFORE
          if (afterEnemy) {
            toDestroySet.add(`${r},${c + 4}`);
            // upgrade rightmost stone (c+3) into quad after animation
            quadSpawns.push({ r, c: c + 3, color });
          } else {
            toDestroySet.add(`${r},${c - 1}`);
            // upgrade leftmost stone (c) into quad after animation
            quadSpawns.push({ r, c: c, color });
          }
        }
      }
    }

    // Vertical quads
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r <= BOARD_SIZE - 4; r++) {
        const a = updated[r][c];
        if (!a) continue;
        const color = baseColor(a);
        if (
          color &&
          baseColor(updated[r + 1][c]) === color &&
          baseColor(updated[r + 2][c]) === color &&
          baseColor(updated[r + 3][c]) === color
        ) {
          // ensure not part of 5+
          const upSame = r - 1 >= 0 && baseColor(updated[r - 1][c]) === color;
          const downSame =
            r + 4 < BOARD_SIZE && baseColor(updated[r + 4][c]) === color;
          if (upSame || downSame) continue;

          const beforeEnemy =
            r - 1 >= 0 &&
            updated[r - 1][c] &&
            baseColor(updated[r - 1][c]) !== color;
          const afterEnemy =
            r + 4 < BOARD_SIZE &&
            updated[r + 4][c] &&
            baseColor(updated[r + 4][c]) !== color;

          if (!beforeEnemy && !afterEnemy) continue;

          if (afterEnemy) {
            toDestroySet.add(`${r + 4},${c}`);
            // upgrade bottom stone (r+3)
            quadSpawns.push({ r: r + 3, c, color });
          } else {
            toDestroySet.add(`${r - 1},${c}`);
            // upgrade top stone (r)
            quadSpawns.push({ r: r, c, color });
          }
        }
      }
    }

    // ---------- TRIPLE detection (exact 3) ----------
    // Horizontal triples (exact 3)
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c <= BOARD_SIZE - 3; c++) {
        const a = updated[r][c];
        if (!a) continue;
        const color = baseColor(a);
        if (
          color &&
          baseColor(updated[r][c + 1]) === color &&
          baseColor(updated[r][c + 2]) === color
        ) {
          // ensure exact triple (not part of 4+)
          const leftSame = c - 1 >= 0 && baseColor(updated[r][c - 1]) === color;
          const rightSame =
            c + 3 < BOARD_SIZE && baseColor(updated[r][c + 3]) === color;
          if (leftSame || rightSame) continue;

          // destroy adjacent enemies at both ends if present
          if (c - 1 >= 0) {
            const lc = updated[r][c - 1];
            if (lc && baseColor(lc) !== color)
              toDestroySet.add(`${r},${c - 1}`);
          }
          if (c + 3 < BOARD_SIZE) {
            const rc = updated[r][c + 3];
            if (rc && baseColor(rc) !== color)
              toDestroySet.add(`${r},${c + 3}`);
          }
        }
      }
    }

    // Vertical triples (exact 3)
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r <= BOARD_SIZE - 3; r++) {
        const a = updated[r][c];
        if (!a) continue;
        const color = baseColor(a);
        if (
          color &&
          baseColor(updated[r + 1][c]) === color &&
          baseColor(updated[r + 2][c]) === color
        ) {
          const upSame = r - 1 >= 0 && baseColor(updated[r - 1][c]) === color;
          const downSame =
            r + 3 < BOARD_SIZE && baseColor(updated[r + 3][c]) === color;
          if (upSame || downSame) continue;

          if (r - 1 >= 0) {
            const uc = updated[r - 1][c];
            if (uc && baseColor(uc) !== color)
              toDestroySet.add(`${r - 1},${c}`);
          }
          if (r + 3 < BOARD_SIZE) {
            const dc = updated[r + 3][c];
            if (dc && baseColor(dc) !== color)
              toDestroySet.add(`${r + 3},${c}`);
          }
        }
      }
    }

    // If there are any enemies to destroy, animate then remove them and apply spawns
    if (
      toDestroySet.size > 0 ||
      quadSpawns.length > 0 ||
      starSpawns.length > 0 ||
      hexaSpawns.length > 0
    ) {
      const toDestroy = Array.from(toDestroySet).map((k) =>
        k.split(",").map(Number)
      );
      if (toDestroy.length > 0) {
        setDestroyingStones(toDestroy);
      }

      setTimeout(() => {
        const finalBoard = updated.map((r) => [...r]);

        // actually remove enemies
        Array.from(toDestroySet).forEach((key) => {
          const [rr, cc] = key.split(",").map(Number);
          finalBoard[rr][cc] = null;
        });

        // place quad crystals (replace endpoint stone)
        quadSpawns.forEach(({ r, c, color }) => {
          if (finalBoard[r][c] && baseColor(finalBoard[r][c]) === color) {
            finalBoard[r][c] = makeQuad(color); // e.g. "red-quad"
          }
        });

        // place star stones (replace endpoint stone)
        starSpawns.forEach(({ r, c, color }) => {
          if (finalBoard[r][c] && baseColor(finalBoard[r][c]) === color) {
            finalBoard[r][c] = makeStar(color); // e.g. "red-star"
          }
        });

        // place hexa crystals (replace endpoint stone)
        hexaSpawns.forEach(({ r, c, color }) => {
          if (finalBoard[r][c] && baseColor(finalBoard[r][c]) === color) {
            finalBoard[r][c] = makeHexa(color); // e.g. "red-hexa"
          }
        });

        setBoard(finalBoard);
        setDestroyingStones([]);
      }, ANIM_DURATION); // matches CSS animation duration
    }

    return updated;
  };

  // Activate star via double-click or Enter: destroys enemies in same row, consumes star, consumes turn
  const activateStarStone = (row, col) => {
    const piece = board[row][col];
    if (!piece || !piece.includes("-star")) return;
    const color = baseColor(piece);
    if (color !== turn) return; // only owner on their turn

    const toDestroy = [];
    // destroy all enemy stones in the same row
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (c === col) continue;
      const cell = board[row][c];
      if (cell && baseColor(cell) !== color) {
        toDestroy.push([row, c]);
      }
    }

    if (toDestroy.length === 0) return; // nothing to do

    setDestroyingStones(toDestroy);

    setTimeout(() => {
      setBoard((prev) => {
        const nb = prev.map((rowArr) => [...rowArr]);
        toDestroy.forEach(([rr, cc]) => {
          nb[rr][cc] = null;
        });
        // consume the star itself
        nb[row][col] = null;
        return nb;
      });
      setDestroyingStones([]);
      // consuming the star uses the player's turn
      setTurn((p) => (p === "red" ? "blue" : "red"));
    }, ANIM_DURATION);
  };

  // Activate quad via double-click: destroys enemies in 3x3, consumes quad, consumes turn
  const activateQuadCrystal = (row, col) => {
    const piece = board[row][col];
    const color = baseColor(piece);
    if (!piece?.includes("-quad") || color !== turn) return;

    const toDestroy = [];
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          const cell = board[r][c];
          if (cell && baseColor(cell) !== color) {
            toDestroy.push([r, c]);
          }
        }
      }
    }

    if (toDestroy.length === 0) return; // nothing to do

    setDestroyingStones(toDestroy);

    setTimeout(() => {
      setBoard((prev) => {
        const nb = prev.map((rowArr) => [...rowArr]);
        toDestroy.forEach(([rr, cc]) => {
          nb[rr][cc] = null;
        });
        // consume the quad itself
        nb[row][col] = null;
        return nb;
      });
      setDestroyingStones([]);
      // consuming the quad should also use the player's turn
      setTurn((p) => (p === "red" ? "blue" : "red"));
    }, ANIM_DURATION);
  };

  // Activate hexa via double-click: destroys enemies in same row+column, consumes hexa, consumes turn
  const activateHexaCrystal = (row, col) => {
    const piece = board[row][col];
    const color = baseColor(piece);
    if (!piece || !piece.includes("-hexa")) return;
    if (color !== turn) return; // only owner on their turn

    const toDestroy = [];
    // destroy enemies in same row (except itself)
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (c === col) continue;
      const cell = board[row][c];
      if (cell && baseColor(cell) !== color) toDestroy.push([row, c]);
    }
    // destroy enemies in same column (except itself)
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (r === row) continue;
      const cell = board[r][col];
      if (cell && baseColor(cell) !== color) toDestroy.push([r, col]);
    }

    if (toDestroy.length === 0) return;

    setDestroyingStones(toDestroy);

    setTimeout(() => {
      setBoard((prev) => {
        const nb = prev.map((rowArr) => [...rowArr]);
        toDestroy.forEach(([rr, cc]) => (nb[rr][cc] = null));
        // consume the hexa itself
        nb[row][col] = null;
        return nb;
      });
      setDestroyingStones([]);
      // consuming hexa uses the player's turn
      setTurn((p) => (p === "red" ? "blue" : "red"));
    }, ANIM_DURATION);
  };

  // ========================= Movement handlers =========================

  // keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ENTER to trigger star when selected
      if (e.key === "Enter" && selected) {
        const { row, col, piece } = selected;
        if (piece && piece.includes("-star") && baseColor(piece) === turn) {
          activateStarStone(row, col);
          setSelected(null);
          return; // don't also try to move
        }
      }

      if (!selected) return;
      let { row, col, piece } = selected;
      const owner = baseColor(piece);
      if (owner !== turn) return;

      let newRow = row;
      let newCol = col;

      if (e.key === "ArrowUp") newRow--;
      if (e.key === "ArrowDown") newRow++;
      if (e.key === "ArrowLeft") newCol--;
      if (e.key === "ArrowRight") newCol++;

      if (
        newRow >= 0 &&
        newRow < BOARD_SIZE &&
        newCol >= 0 &&
        newCol < BOARD_SIZE &&
        !board[newRow][newCol] &&
        isValidMove(row, col, newRow, newCol)
      ) {
        let newBoard = board.map((r) => [...r]);
        newBoard[newRow][newCol] = piece;
        newBoard[row][col] = null;
        newBoard = checkAndDestroy(newBoard);

        setBoard(newBoard);
        setSelected(null);
        setTurn((p) => (p === "red" ? "blue" : "red"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, board, turn]);

  // drag start
  const handleDragStart = (e, row, col) => {
    const piece = board[row][col];
    if (!piece || baseColor(piece) !== turn) return;
    setSelected({ row, col, piece });
    e.dataTransfer.setData("text/plain", JSON.stringify({ row, col }));
  };

  // drop
  const handleDrop = (e, row, col) => {
    e.preventDefault();
    if (!selected) return;
    const { row: fromRow, col: fromCol, piece } = selected;

    if (
      !board[row][col] &&
      isValidMove(fromRow, fromCol, row, col) &&
      baseColor(piece) === turn
    ) {
      let newBoard = board.map((r) => [...r]);
      newBoard[row][col] = piece;
      newBoard[fromRow][fromCol] = null;
      newBoard = checkAndDestroy(newBoard);

      setBoard(newBoard);
      setSelected(null);
      setTurn((p) => (p === "red" ? "blue" : "red"));
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleCellClick = (row, col) => {
    const piece = board[row][col];

    if (selected) {
      if (
        !piece &&
        isValidMove(selected.row, selected.col, row, col) &&
        baseColor(selected.piece) === turn
      ) {
        let newBoard = board.map((r) => [...r]);
        newBoard[row][col] = selected.piece;
        newBoard[selected.row][selected.col] = null;
        newBoard = checkAndDestroy(newBoard);

        // calculate the next turn
        const nextTurn = turn === "red" ? "blue" : "red";

        // update local UI
        setBoard(newBoard);
        setSelected(null);
        setTurn(nextTurn);

        // 🧩 send updated board state to backend via parent prop
        if (onMove) {
          onMove(
            JSON.stringify({
              board: newBoard,
              turn: nextTurn,
            })
          );
        }
      } else {
        setSelected(null);
      }
    } else if (piece && baseColor(piece) === turn) {
      setSelected({ row, col, piece });
    }
  };

  const handlePieceDoubleClick = (e, row, col) => {
    e.stopPropagation();
    const piece = board[row][col];
    if (!piece) return;
    if (piece.includes("-quad")) activateQuadCrystal(row, col);
    if (piece.includes("-star")) activateStarStone(row, col);
    if (piece.includes("-hexa")) activateHexaCrystal(row, col);
  };

  // ========================= Rendering =========================

  const renderCell = (row, col) => {
    const piece = board[row][col];
    const isDestroying = destroyingStones.some(
      ([r, c]) => r === row && c === col
    );

    return (
      <div
        key={`${row}-${col}`}
        className={`cell ${selected?.row === row && selected?.col === col ? "selected" : ""
          }`}
        onClick={() => handleCellClick(row, col)}
        onDrop={(e) => handleDrop(e, row, col)}
        onDragOver={handleDragOver}
      >
        {piece && (
          <div
            className={`piece ${piece} ${isDestroying ? "destroying" : ""}`}
            draggable={baseColor(piece) === turn}
            onDragStart={(e) => handleDragStart(e, row, col)}
            onDoubleClick={(e) => handlePieceDoubleClick(e, row, col)}
          />
        )}
      </div>
    );
  };

  const renderBoard = () => {
    const cells = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        cells.push(renderCell(r, c));
      }
    }
    return cells;
  };

  return (
    <div className="game-layout">
      {/* Left Sidebar */}
      <div className="sidebar-left">
        <button className="rules-btn" onClick={() => setRulesOpen(true)}>
          📜 Rules
        </button>

        <div className="rank-card">
          <p>Your Rank</p>
          <h3>#{player1Details?.currentRank || "----"}</h3>
          <small>Worldwide</small>
        </div>

        <div className="profile-card">
          <img
            src={player1Details?.profilePictureUrl || "/default-avatar.png"}
            alt={player1Details?.username || "Player"}
            className="profile-pic"
          />
          <p>{player1Details?.username || "Loading..."}</p>
        </div>

        <div className="bottom-buttons">
          <button className="logout-btn" onClick={handleGiveUp}>
            🚪 Give Up!
          </button>
          <button className="donate-btn">💖 Donate</button>
        </div>
      </div>

      {/* Center Board */}
      <div className="game-center">
        <div className="game-board-container">
          <div className="board">{renderBoard()}</div>
          <div className="turn-indicator">Turn: {turn.toUpperCase()}</div>

          {winner && (
            <div className="winner-message">
              {winner === "Draw"
                ? "It's a Draw!"
                : `${winner} has won the game!`}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="sidebar-right">
        <div className="chat-box">
          <div className="messages">
            {chatMessages.length === 0 && (
              <>
                <p>
                  <b>{player2Details?.username || "Opponent"}:</b> Good luck!
                </p>
                <p>
                  <b>You:</b> Thanks 🚀
                </p>
              </>
            )}

            {chatMessages.map((m, idx) => (
              <p key={idx} className={`chat-message ${m.sender === (user?.username || "You") ? "me" : "them"}`}>
                <b>{m.sender === (user?.username) ? "You" : m.sender}:</b> {m.text}
                <small className="chat-ts">{new Date(m.timestamp).toLocaleTimeString()}</small>
              </p>
            ))}
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendChatMessage();
              }}
            />
            <button onClick={sendChatMessage}>➤</button>
          </div>
        </div>


        <div className="opponent-card">
          <img
            src={player2Details?.profilePictureUrl || "/default-avatar.png"}
            alt={player2Details?.username || "Opponent"}
            className="opponent-pic"
          />
          <p>{player2Details?.username || "Waiting..."}</p>
          <small>Rank: #{player2Details?.currentRank || "----"}</small>
          <button
            className="friend-btn"
            disabled={friendStatus === "PENDING" || friendStatus === "ACCEPTED"}
            onClick={handleAddFriend}
          >
            {friendStatus === "PENDING"
              ? "Request Pending"
              : friendStatus === "ACCEPTED"
                ? "Friends"
                : "Add Friend"}
          </button>
        </div>
      </div>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
};

export default GameBoard;
