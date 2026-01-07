import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  gameId: null,
  board: [],
  turn: null,
  lastMove: null,
  status: "idle",
};

const gameBoardSlice = createSlice({
  name: "gameBoard",
  initialState,
  reducers: {
    setGameId(state, action) {
      state.gameId = action.payload;
    },

    setBoardState(state, action) {
      const { board, turn } = action.payload;
      state.board = board;
      state.turn = turn;
      state.lastMove = null;
    },

    applyMove(state, action) {
      const { move } = action.payload; 
      state.lastMove = move;
    },

    setTurn(state, action) {
      state.turn = action.payload;
    },

    resetBoard(state) {
      return initialState;
    },
  },
});

export const { setGameId, setBoardState, applyMove, setTurn, resetBoard } =
  gameBoardSlice.actions;

export default gameBoardSlice.reducer;
