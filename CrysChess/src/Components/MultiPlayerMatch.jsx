import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  connectSocket,
  sendJoin,
  sendMove,
  sendEnd,
  isSocketConnected,
  getActiveGameId,
} from "../Services/socketService";
import GameBoard from "./GameBoard";
import { useParams } from "react-router-dom";
import "./MultiPlayerMatch.css";
import { useDispatch } from "react-redux";
import { setGameId, setGameData } from "../store/gameSlice";
import WinnerModal from "./WinnerModal";

export default function MultiPlayerMatch() {
  const { gameId } = useParams();
  const username = localStorage.getItem("username") || "Guest";
  const userId = localStorage.getItem("userId");

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const dispatch = useDispatch();
  const [winnerModalVisible, setWinnerModalVisible] = useState(false);
  const [winner, setWinner] = useState(null);


  
  

  // 🔹 Join existing game if URL has gameId

    useEffect(() => {
      if (!winnerModalVisible) return;
  
      const timer = setTimeout(() => {
        navigate("/ProfilePage");
      }, 10000); // 10 sec
  
      return () => clearTimeout(timer);
    }, [winnerModalVisible]);

  useEffect(() => {
    if (!gameId) return;

    console.log("🌐 Auto-joining existing game:", gameId);
    dispatch(setGameId(gameId));

connectSocket(gameId, (updatedGame) => {
  console.log("📡 [SOCKET UPDATE]", updatedGame);

  setGame(updatedGame);
  dispatch(setGameData(updatedGame));

  // ✅ Game started
  if (updatedGame?.status === "IN_PROGRESS") {
    setLoading(false);
    setIsConnected(true);
  }

  // ⭐️ GAME FINISHED → Handle it for BOTH players
if (updatedGame?.status === "FINISHED") {
  const winner = updatedGame.winner?.username || updatedGame.winner;
  
  console.log("🏁 Game finished! Winner:", winner);

  setWinner(winner);
  setWinnerModalVisible(true);

  // redirect after 8 sec
  setTimeout(() => {
    window.location.href = "/ProfilePage";
  }, 8000);
}


});


    setTimeout(() => {
      console.log("🚀 Sending JOIN for:", gameId);
      sendJoin(gameId, username);
    }, 500);
  }, [gameId, dispatch, username]);

  // 🔹 Find or create a match
  const handleFindMatch = async () => {
    console.log("🎯 handleFindMatch called for userId:", userId);
    setLoading(true);

    try {
      const res = await axios.post(
        `http://localhost:8080/games/find-or-create?userId=${userId}`
      );

      const createdGame = res.data;
      console.log("🎮 Found/Created Game:", createdGame);

      setGame(createdGame);
      dispatch(setGameId(createdGame.id));
      dispatch(setGameData(createdGame));

      connectSocket(createdGame.id, (updatedGame) => {
        console.log("📡 [SOCKET UPDATE - FIND MATCH]", updatedGame);

        setGame(updatedGame);
        dispatch(setGameData(updatedGame));

        if (updatedGame?.status === "IN_PROGRESS") {
          console.log("✅ Game started!");
          setLoading(false);
          setIsConnected(true);
        } else {
          console.log("⏳ Waiting for opponent...");
        }
      });

      setTimeout(() => {
        console.log("🚀 Sending JOIN for:", createdGame.id);
        sendJoin(createdGame.id, username);
      }, 500);

      if (createdGame?.status === "IN_PROGRESS") {
        console.log("⚡ Game already in progress!");
        setLoading(false);
        setIsConnected(true);
      }
    } catch (err) {
      console.error("❌ Error finding or creating match:", err);
      setLoading(false);
    }
  };

  // 🔹 Send move
  const handleMove = (move) => {
    if (!isSocketConnected()) {
      console.warn("⚠️ Socket not connected yet!");
      return;
    }

    const activeGameId = getActiveGameId();
    if (!activeGameId) {
      console.warn("⚠️ No active game ID found!");
      return;
    }

    console.log("🎯 Sending move:", move);
    sendMove(activeGameId, JSON.stringify(move));
  };

  // 🔹 End game
  const handleEnd = () => {
    if (!game) return;
    if (game.status === "FINISHED") return alert("Game already ended!");
    const winnerUsername = username;
    console.log("🏁 Ending game, winner:", winnerUsername);
    sendEnd(game.id, winnerUsername);
  };

  const handleGiveUp = () => {
  if (!game) return;
  if (game.status === "FINISHED") return alert("Game already ended!");

  // The opponent becomes the winner
  const winnerUsername =
    game.player1 === username ? game.player2 : game.player1;

  console.log("🏳️ You gave up! Winner:", winnerUsername);

  sendEnd(game.id, winnerUsername); // ✅ sendEnd already exists
};


  // 🔹 Render
  return (
    <>
      {game && isConnected ? (
        <GameBoard
          gameId={game.id}
          board={
            (() => {
              try {
                return game.boardState ? JSON.parse(game.boardState).board : [];
              } catch {
                return [];
              }
            })()
          }
          turn={
            (() => {
              try {
                return game.boardState
                  ? JSON.parse(game.boardState).turn
                  : "red";
              } catch {
                return "red";
              }
            })()
          }
          onMove={handleMove}
        />
      ) : (
        <div className="waiting-screen">
          <button
            className={`find-btn ${loading ? "hidden" : "visible"}`}
            onClick={handleFindMatch}
            disabled={loading}
          >
            🔍 {loading ? "Finding Match..." : "Please Wait..."}
          </button>

          {loading && (
            <p className="loading-text">⏳ Searching for an opponent...</p>
          )}
        </div>
      )}
            {winnerModalVisible && (
              <WinnerModal
  winner={winner?.username || winner}
                onFinish={() => navigate("/ProfilePage")}
              />
            )}
    </>
  );
}
