import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import FriendService from "../Services/friendService";

// Async Thunks

export const fetchFriends = createAsyncThunk(
  "friends/fetchFriends",
  async (userId) => {
    const response = await FriendService.getFriends(userId);
    return response.data;
  }
);

export const fetchPendingRequests = createAsyncThunk(
  "friends/fetchPendingRequests",
  async (userId) => {
    const response = await FriendService.getPendingRequests(userId);
    return response.data;
  }
);

export const sendFriendRequest = createAsyncThunk(
  "friends/sendFriendRequest",
  async ({ userId, friendId }, { rejectWithValue }) => {
    try {
      const response = await FriendService.sendRequest(userId, friendId);
      return response.data;
    } catch (err) {
      // alert("error hai bhai");
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  "friends/acceptFriendRequest",
  async (requestId, { dispatch, getState }) => {
    const response = await FriendService.acceptRequest(requestId);
    const userId = getState().user.user.id;
    dispatch(fetchFriends(userId));
    dispatch(fetchPendingRequests(userId));
    return response.data;
  }
);


export const fetchFriendData = createAsyncThunk(
  "friends/fetchFriendData",
  async (userId) => {
    const response = await FriendService.friendData(userId);
    return response.data;
  }
);


export const rejectFriendRequest = createAsyncThunk(
  "friends/rejectFriendRequest",
  async (requestId, { dispatch, getState }) => {
    const response = await FriendService.rejectRequest(requestId);
    const userId = getState().user.user.id;
    dispatch(fetchPendingRequests(userId));
    return response.data;
  }
);

export const removeFriend = createAsyncThunk(
  "friends/removeFriend",
  async ({ userId, friendId }, { dispatch, rejectWithValue }) => {
    try {
      console.log("Removing friend:", userId, friendId);
      const res = await FriendService.removeFriend(userId, friendId);
      console.log("API response:", res.data);
      dispatch(fetchFriends(userId));
      return friendId;
    } catch (err) {
      console.error("Remove friend error:", err.response || err.message);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Slice

const friendSlice = createSlice({
  name: "friends",
  initialState: {
    friendList: [],
    pendingRequests: [],
    friendDetails: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchFriends
      .addCase(fetchFriends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.loading = false;
        state.friendList = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // fetchPendingRequests
      .addCase(fetchPendingRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingRequests.fulfilled, (state, action) => {
        console.log("Pending requests updated", action.payload);
        state.loading = false;
        state.pendingRequests = action.payload;
      })
      .addCase(fetchPendingRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // sendFriendRequest
      .addCase(sendFriendRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendFriendRequest.fulfilled, (state) => {
        state.loading = false;
        // no state update here; fetchPendingRequests called after dispatch in component
      })
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // fetchFriendData
      .addCase(fetchFriendData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriendData.fulfilled, (state, action) => {
        state.loading = false;
        state.friendDetails = action.payload;
      })
      .addCase(fetchFriendData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // removeFriend
      .addCase(removeFriend.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFriend.fulfilled, (state, action) => {
        state.loading = false;
        state.friendList = state.friendList.filter(
          (f) => f.id !== action.payload
        );
      })
      .addCase(removeFriend.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default friendSlice.reducer;
