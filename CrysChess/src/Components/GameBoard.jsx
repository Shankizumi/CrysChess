import React, { useState, useEffect } from "react";
import "./GameBoard.css";

const BOARD_SIZE = 8;
const ANIM_DURATION = 500;

const GameBoard = () => {

  // ----------------- Helpers -----------------
  const createInitialBoard = () => {
    const board = Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(null)
    );
    for (let row = 0; row < 2; row++) board[row].fill("red");
    for (let row = BOARD_SIZE - 2; row < BOARD_SIZE; row++) board[row].fill("blue");
    return board;
  };

  const [board, setBoard] = useState(createInitialBoard);
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState("red");
  const [destroyingStones, setDestroyingStones] = useState([]); // animation tracker

  // helper to get base color (e.g., "red" from "red" or "red-quad")
  const baseColor = (p) => (p && typeof p === "string" ? p.split("-")[0] : null);

  const makeQuad = (color) => `${color}-quad`;
  const makeStar = (color) => `${color}-star`;
  const makeHexa = (color) => `${color}-hexa`;

  const isValidMove = (fromRow, fromCol, toRow, toCol) => {
    const dx = Math.abs(fromRow - toRow);
    const dy = Math.abs(fromCol - toCol);
    return dx + dy === 1;
  };

  const withinBounds = (r, c) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

  // (scanLine is present but we use explicit loops for clarity & parity with your original logic)
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
      const afterSame = i + len < BOARD_SIZE && baseColor(getCell(i + len)) === color;
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
          const rightSame = c + 6 < BOARD_SIZE && baseColor(updated[r][c + 6]) === color;
          if (leftSame || rightSame) continue;

          // check adjacent enemies
          const beforeEnemy =
            c - 1 >= 0 && updated[r][c - 1] && baseColor(updated[r][c - 1]) !== color;
          const afterEnemy =
            c + 6 < BOARD_SIZE && updated[r][c + 6] && baseColor(updated[r][c + 6]) !== color;

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
          const downSame = r + 6 < BOARD_SIZE && baseColor(updated[r + 6][c]) === color;
          if (upSame || downSame) continue;

          const beforeEnemy =
            r - 1 >= 0 && updated[r - 1][c] && baseColor(updated[r - 1][c]) !== color;
          const afterEnemy =
            r + 6 < BOARD_SIZE && updated[r + 6][c] && baseColor(updated[r + 6][c]) !== color;

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
          const rightSame = c + 5 < BOARD_SIZE && baseColor(updated[r][c + 5]) === color;
          if (leftSame || rightSame) continue;

          // check adjacent enemies
          const beforeEnemy =
            c - 1 >= 0 && updated[r][c - 1] && baseColor(updated[r][c - 1]) !== color;
          const afterEnemy =
            c + 5 < BOARD_SIZE && updated[r][c + 5] && baseColor(updated[r][c + 5]) !== color;

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
          const downSame = r + 5 < BOARD_SIZE && baseColor(updated[r + 5][c]) === color;
          if (upSame || downSame) continue;

          const beforeEnemy =
            r - 1 >= 0 && updated[r - 1][c] && baseColor(updated[r - 1][c]) !== color;
          const afterEnemy =
            r + 5 < BOARD_SIZE && updated[r + 5][c] && baseColor(updated[r + 5][c]) !== color;

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
          const rightSame = c + 4 < BOARD_SIZE && baseColor(updated[r][c + 4]) === color;
          if (leftSame || rightSame) continue; // part of longer run -> skip

          // check adjacent enemies
          const beforeEnemy =
            c - 1 >= 0 && updated[r][c - 1] && baseColor(updated[r][c - 1]) !== color;
          const afterEnemy =
            c + 4 < BOARD_SIZE && updated[r][c + 4] && baseColor(updated[r][c + 4]) !== color;

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
          const downSame = r + 4 < BOARD_SIZE && baseColor(updated[r + 4][c]) === color;
          if (upSame || downSame) continue;

          const beforeEnemy =
            r - 1 >= 0 && updated[r - 1][c] && baseColor(updated[r - 1][c]) !== color;
          const afterEnemy =
            r + 4 < BOARD_SIZE && updated[r + 4][c] && baseColor(updated[r + 4][c]) !== color;

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
          const rightSame = c + 3 < BOARD_SIZE && baseColor(updated[r][c + 3]) === color;
          if (leftSame || rightSame) continue;

          // destroy adjacent enemies at both ends if present
          if (c - 1 >= 0) {
            const lc = updated[r][c - 1];
            if (lc && baseColor(lc) !== color) toDestroySet.add(`${r},${c - 1}`);
          }
          if (c + 3 < BOARD_SIZE) {
            const rc = updated[r][c + 3];
            if (rc && baseColor(rc) !== color) toDestroySet.add(`${r},${c + 3}`);
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
          const downSame = r + 3 < BOARD_SIZE && baseColor(updated[r + 3][c]) === color;
          if (upSame || downSame) continue;

          if (r - 1 >= 0) {
            const uc = updated[r - 1][c];
            if (uc && baseColor(uc) !== color) toDestroySet.add(`${r - 1},${c}`);
          }
          if (r + 3 < BOARD_SIZE) {
            const dc = updated[r + 3][c];
            if (dc && baseColor(dc) !== color) toDestroySet.add(`${r + 3},${c}`);
          }
        }
      }
    }

    // If there are any enemies to destroy, animate then remove them and apply spawns
    if (toDestroySet.size > 0 || quadSpawns.length > 0 || starSpawns.length > 0 || hexaSpawns.length > 0) {
      const toDestroy = Array.from(toDestroySet).map((k) => k.split(",").map(Number));
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

  // click selects/moves; double-click on a piece activates quad or star or hexa
  const handleCellClick = (row, col) => {
    const piece = board[row][col];

    // selection / move flow (do NOT auto-activate on single click)
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

        setBoard(newBoard);
        setSelected(null);
        setTurn((p) => (p === "red" ? "blue" : "red"));
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
        className={`cell ${selected?.row === row && selected?.col === col ? "selected" : ""}`}
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
    <div className="game-board-container">
      <div className="board">{renderBoard()}</div>
      <div className="turn-indicator">Turn: {turn.toUpperCase()}</div>
    </div>
  );
};

export default GameBoard;
