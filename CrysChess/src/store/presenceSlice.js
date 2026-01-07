const presenceSlice = createSlice({
  name: "presence",
  initialState: {
    onlineUsers: []
  },
  reducers: {
    setOnlineUsers(state, action) {
      state.onlineUsers = action.payload; // REPLACE, not append
    }
  }
});
