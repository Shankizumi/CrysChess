import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,       // stores user data
  isLoggedIn: false // tracks login status
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isLoggedIn = true;
    },
    logout: (state) => {
      // ✅ completely reset user state
      state.user = null;
      state.isLoggedIn = false;
    },
  },
});

export const { setUser, logout } = userSlice.actions;

export default userSlice.reducer;
