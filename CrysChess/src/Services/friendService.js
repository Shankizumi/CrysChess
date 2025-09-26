import axios from "axios";

const API_URL = "/api/friends";
const User_URL = "/api/users"; // adjust if your backend is on another port


const FriendService = {
  // Get all friends
  getFriends: (userId) => axios.get(`${API_URL}/${userId}/list`),

  // Get pending friend requests
  getPendingRequests: (userId) => axios.get(`${API_URL}/${userId}/pending`),

  // Send friend request
  sendRequest: (userId, friendId) =>
    axios.post(`${API_URL}/send`, null, { params: { userId, friendId } }),

  // Accept friend request
  acceptRequest: (requestId) =>
    axios.put(`${API_URL}/accept/${requestId}`),

  // Reject friend request
  rejectRequest: (requestId) =>
    axios.put(`${API_URL}/reject/${requestId}`),

  // Remove friend
  removeFriend: (userId, friendId) =>
    axios.delete(`${API_URL}/remove`, { params: { userId, friendId } }),

  // Search friends
  searchFriends: (userId, query) =>
    axios.get(`${API_URL}/search`, { params: { userId, query } }),

  // Add friend Data
  friendData: (userId) =>
    axios.get(`${User_URL}/${userId}`),
};

export default FriendService;
