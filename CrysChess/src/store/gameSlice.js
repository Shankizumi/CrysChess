import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  gameId: null,
  gameData: null, // optional: store full game object too
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setGameId: (state, action) => {
      state.gameId = action.payload;
    },
    setGameData: (state, action) => {
      state.gameData = action.payload;
    },
    resetGame: (state) => {
      state.gameId = null;
      state.gameData = null;
    },
  },
});

export const { setGameId, setGameData, resetGame } = gameSlice.actions;
export default gameSlice.reducer;
