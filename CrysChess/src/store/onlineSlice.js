import { createSlice } from "@reduxjs/toolkit";

const onlineSlice = createSlice({
  name: "online",
  initialState: {
    users: {}
  },
  reducers: {
setOnlineStatus: (state, action) => {
  const { userId, online } = action.payload;

  // 🚫 BLOCK GARBAGE
  if (userId === undefined || userId === null || userId === -1) {
    console.warn("🚫 Ignoring invalid presence update:", action.payload);
    return;
  }

  state.users[userId] = online;
},

  }
});


export const { setOnlineStatus } = onlineSlice.actions;
export default onlineSlice.reducer;
