import { createSlice } from "@reduxjs/toolkit";

const onlineSlice = createSlice({
  name: "onlineStatus",
  initialState: {
    users: {}, // { userId: true/false }
  },
  reducers: {
    setOnlineStatus: (state, action) => {
      const { userId, online } = action.payload;
      state.users[userId] = online;
    }
  }
});

export const { setOnlineStatus } = onlineSlice.actions;
export default onlineSlice.reducer;
