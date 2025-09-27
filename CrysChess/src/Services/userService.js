import axios from "axios";

const API_URL = "/api/users"; // adjust if your backend is on another port


// ✅ Register new user
const register = async (userData) => {
  try {
    const res = await axios.post(`${API_URL}/register`, userData);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Registration failed");
  }
};

// ✅ Login user
const login = async ({ email, password }) => {
  try {
    const res = await axios.post(
      `${API_URL}/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    );
    return res.data;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Login failed");
  }
};


// ✅ Get all users (for dev/admin)
const getAllUsers = async () => {
  try {
    const res = await axios.get(`${API_URL}/getAllUsers`);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch users");
  }
};

// ✅ Get user by ID
const getUserById = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch user");
  }

};

// ✅ Search users by username
const searchUsers = async (query) => {
  try {
    const res = await axios.get(`${API_URL}/search?username=${query}`);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Search failed");
  }
};

// ✅ Update profile picture
const updateProfilePicture = async (userId, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    // Backend now handles building the full URL
    const res = await axios.put(`${API_URL}/${userId}/profile-picture`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // ✅ Backend response already contains the updated User object
    // with profilePictureUrl as full URL (http://localhost:8080/pfp/...)
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update profile picture");
  }
};

// ✅ Get profile picture URL
const getProfilePicture = async (userId) => {
  return `${API_URL}/${userId}/profile-picture?ts=${Date.now()}`;
};


// ✅ Update username and password from profile modal
const updateCredentials = async (userId, username, password) => {
  try {
    const res = await axios.put(
      `${API_URL}/update-credentials`,
      null, // no request body, params are in URL
      {
        params: { userId, username, password },
      }
    );
    return res.data; // updated user object
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update credentials");
  }
};





// Export all methods
const userService = {
  register,
  login,
  getAllUsers,
  getUserById,
  searchUsers,
  updateProfilePicture,
  getProfilePicture,
  updateCredentials,

};

export default userService;
