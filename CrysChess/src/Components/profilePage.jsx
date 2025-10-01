import { useState, useEffect } from "react";
import "./ProfilePage.css";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import userService from "../Services/userService"; // ensure correct path
import { setUser, logout } from "../store/userSlice";
import LogoutConfirmModal from "../Components/LogoutConfirmModal";
import Alert from "./Alert";

import {
  fetchFriends,
  fetchPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "../store/friendSlice";
import UserService from "../Services/userService";
import FriendService from "../Services/friendService";
import { persistor } from "../store/store";

export default function ProfilePage() {
  const [openFriends, setOpenFriends] = useState(false);
  const [activeTab, setActiveTab] = useState("friends");
  const [openSearch, setOpenSearch] = useState(false);
  const [friendsData, setFriendsData] = useState([]); // enriched friend user objects
  const [pendingData, setPendingData] = useState([]); // enriched pending objects (contains requestId)
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [justSent, setJustSent] = useState([]);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);


  
  const user = useSelector((state) => state.user.user);
  const { friendList, pendingRequests, loading } = useSelector(
    (state) => state.friends
  );

  const dispatch = useDispatch();

  useEffect(() => {
    refreshProfilePic();
  }, [user?.id]);

  // openFriends toggles fetching of lists from Redux
  useEffect(() => {
    if (openFriends && user?.id) {
      dispatch(fetchFriends(user.id));
      dispatch(fetchPendingRequests(user.id));
    }
  }, [openFriends, user?.id, dispatch]);

  // === FIXED: build friendsData from friendList (use userId/friendId, not request id) ===
  useEffect(() => {
    const fetchFriendDetails = async () => {
      if (!friendList || friendList.length === 0) {
        setFriendsData([]);
        return;
      }

      try {
        // 1️⃣ Get unique friend IDs (the "other" user in the friendship)
        const uniqueFriendIds = [
          ...new Set(
            friendList.map((friend) =>
              friend.userId === user.id ? friend.friendId : friend.userId
            )
          ),
        ];

        // 2️⃣ Fetch details for each unique friend
        const detailed = await Promise.all(
          uniqueFriendIds.map(async (friendId) => {
            try {
              const userDetails = await userService.getUserById(friendId);
              const avatar = await userService.getProfilePicture(friendId);
              return { ...userDetails, avatar };
            } catch (err) {
              console.error("Failed to fetch friend details:", err);
              return { id: friendId, username: "Unknown", avatar: null };
            }
          })
        );

        setFriendsData(detailed);
      } catch (err) {
        console.error("Error while fetching friends data:", err);
      }
    };

    fetchFriendDetails();
  }, [friendList, user.id]);

  useEffect(() => {
  const fetchPendingDetails = async () => {
    if (!user?.id || !pendingRequests || pendingRequests.length === 0) {
      setPendingData([]);
      return;
    }

    try {
      const detailed = await Promise.all(
        pendingRequests
          .filter((pr) => pr.friendId === user.id) // only requests **to me**
          .map(async (pr) => {
            const otherUserId = pr.userId; // sender

            try {
              const userDetails = await userService.getUserById(otherUserId);
              const avatar = await userService.getProfilePicture(otherUserId).catch(() => null);

              return {
                requestId: pr.id,
                id: otherUserId,
                status: pr.status,
                ...userDetails,
                avatar,
              };
            } catch (err) {
              console.error("Failed to fetch pending details for id", otherUserId, err);
              return {
                requestId: pr.id,
                id: otherUserId,
                username: "Unknown",
                avatar: null,
                status: pr.status,
              };
            }
          })
      );

      setPendingData(detailed);
    } catch (err) {
      console.error("Error while fetching pending requests:", err);
      setPendingData([]);
    }
  };

  fetchPendingDetails();
}, [pendingRequests, user?.id]);

  // --- other handlers unchanged, small improvement: use requestId when accepting/rejecting ---
  const handleAddFriend = async (friendId) => {
    try {
      await dispatch(sendFriendRequest({ userId: user.id, friendId })).unwrap();

      setJustSent((prev) => [...prev, friendId]);

      setSearchResults((prev) =>
        prev.map((u) => (u.id === friendId ? { ...u, status: "PENDING" } : u))
      );

      dispatch(fetchPendingRequests(user.id));
      showAlert("success", "Friend request sent");
    } catch (error) {
      console.error("sendFriendRequest error:", error);
      showAlert("error", error || "Failed to send friend request");
    }
  };


  const handleRemoveOrReject = async (friendId) => {
  await dispatch(removeFriend({ userId: user.id, friendId }));
  dispatch(fetchFriends(user.id));
  dispatch(fetchPendingRequests(user.id));
};


  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setOpenSearch(true);
    setSearchLoading(true);
    setSearchError(null);

    try {
      const results = await UserService.searchUsers(searchTerm.trim());

      if (!results || results.length === 0) {
        setSearchError("No users found");
        setSearchResults([]);
        return;
      }

      const detailedResults = await Promise.all(
        results.map(async (foundUser) => {
          try {
            const [avatar, statusRes] = await Promise.all([
              userService.getProfilePicture(foundUser.id).catch(() => null),
              FriendService.getFriendStatus(user.id, foundUser.id).catch(
                () => ({ data: null })
              ),
            ]);

            return {
              ...foundUser,
              avatar,
              status: statusRes?.data || null,
            };
          } catch (err) {
            console.error(
              "Failed fetching details for user",
              foundUser.id,
              err
            );
            return { ...foundUser, avatar: null, status: "UNKNOWN" };
          }
        })
      );

      setSearchResults(detailedResults);
    } catch (error) {
      console.error("Search error:", error);
      setSearchError(error.message || "Failed to search users");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };



  const refreshProfilePic = async () => {
    if (!user?.id) return;
    try {
      const blobUrl = await userService.getProfilePicture(user.id);
      dispatch(setUser({ ...user, profilePictureUrl: blobUrl }));
    } catch (err) {
      console.error("Failed to refresh profile picture:", err);
    }
  };


  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const latestUser = await userService.getUserById(user.id);
      dispatch(setUser(latestUser));
    } catch (err) {
      console.error("Failed to refresh user data:", err);
    }
  };

  const showAlert = (type, message) => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setAlerts((prev) => prev.filter((a) => a.id !== id)),
      3000
    );
  };

  return (
    <div className="page-container">
      {/* Search Bar + Logout */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search player..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="search-btn" onClick={handleSearch}>
          🔍
        </button>
        <button
          className="btn"
          style={{ marginLeft: "20px", border: "2px solid white" }}
          onClick={() => setLogoutModalOpen(true)}
        >
          Logout
        </button>
      </div>

      {/* Profile Section */}
      <div className="profile-section cardProfile">
        <div className="avatar" onClick={() => setOpen(true)}>
          {user?.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt="avatar"
              className="avatar-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://i.pravatar.cc/90";
              }}
            />
          ) : (
            "👤"
          )}
        </div>
        <div>
          <p className="username">{user?.username || "Guest"}</p>
          <p className="rank">Rank: {user?.rank || "Unranked"}</p>
          <button
            className="btn-outline frdbtn"
            onClick={() => setOpenFriends(true)}
          >
            Friend List
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="card">
        <h1 className="title">Welcome to CryChess</h1>
        <p className="subtitle">Put your brain to test and cry</p>
        <div className="button-group">
          <button className="btn">Practice with AI</button>
          <button className="btn">Invite a Friend for VS</button>
          <button className="btn">Play VS the World</button>
          <button className="btn">See Global Rank Players</button>
        </div>
        <div className="donate-container">
          <button className="btn-outline">Donate</button>
        </div>
      </div>

      {/* Friends Modal */}
      {openFriends && (
        <div
          className="friendmodal-overlay"
          onClick={() => setOpenFriends(false)}
        >
          <div className="friendmodal" onClick={(e) => e.stopPropagation()}>
            <h2 className="friendmodal-title">Friends & Requests</h2>
            <div className="friend-tabs">
              <button
                className={`tab-btn ${activeTab === "friends" ? "active" : ""}`}
                onClick={() => setActiveTab("friends")}
              >
                Friend List
              </button>
              <button
                className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
                onClick={() => setActiveTab("pending")}
              >
                Pending Requests
              </button>
            </div>

            {activeTab === "friends" && (
              <div className="cardCont">
                {loading && friendsData.length === 0 ?(
                  <p>Loading friends...</p>
                ) : friendsData.length > 0 ? (
                  friendsData.map((friend) => (
                    <div key={friend.id} className="friendcardProfile">
                      <img
                        src={friend.avatar || "https://i.pravatar.cc/90"}
                        alt={friend.username}
                        className="friendavatar"
                      />
                      <div className="friendinfo">
                        <p className="username">{friend.username}</p>
                        <p className="rank">{friend.rank || "Unranked"}</p>
                      </div>
                      <button
                        className="btn-outline"
  onClick={() => handleRemoveOrReject(friend.id)}

                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="st">No friends yet 😢</p>
                )}
              </div>
            )}

            {activeTab === "pending" && (
              <div className="cardCont">
                {loading && pendingData.length === 0 ?(
                  <p>Loading pending requests...</p>
                ) : pendingData.length > 0 ? (
                  pendingData.map((req) => (
                    <div key={req.id} className="friendcardProfile">
                      <img
                        src={req.avatar || "https://i.pravatar.cc/90"}
                        alt={req.username}
                        className="friendavatar"
                      />
                      <div className="friendinfo">
                        <p className="username">{req.username}</p>
                        <p className="rank">{req.rank || "Unranked"}</p>
                      </div>
                      <button
                        className="btn"
                        onClick={() =>
                          dispatch(acceptFriendRequest(req.requestId))
                        }
                      >
                        Accept
                      </button>
                      <button
                        className="btn-outline"
  onClick={() => handleRemoveOrReject(req.id)}

                      >
                        Reject
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="st">No pending requests 🎉</p>
                )}
              </div>
            )}

            <div className="friendmodal-footer">
              <button
                className="btn-outline"
                onClick={() => setOpenFriends(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {openSearch && (
        <div
          className="friendmodal-overlay"
          onClick={() => setOpenSearch(false)}
        >
          <div className="friendmodal" onClick={(e) => e.stopPropagation()}>
            <h2 className="friendmodal-title">Search Results</h2>
            <div className="cardCont">
              {searchLoading ? (
                <p>Searching...</p>
              ) : searchError ? (
                <p className="st">{searchError}</p>
              ) : (
                searchResults
                  .filter((r) => r.id !== user.id)
                  .map((result, index) => (
                    <div key={index} className="friendcardProfile">
                      <img
                        src={result.avatar || "https://i.pravatar.cc/70"}
                        alt={result.username}
                        className="avatar-img"
                      />
                      <div className="friendinfo">
                        <p className="username">{result.username}</p>
                        <p className="rank">{result.rank || "Unranked"}</p>
                      </div>
                      <button
                        className="btn-outline"
                        disabled={
                          result.status === "PENDING" ||
                          result.status === "ACCEPTED" ||
                          justSent.includes(result.id)
                        }
                        onClick={() => handleAddFriend(result.id)}
                      >
                        {result.status === "PENDING"
                          ? "Request Pending"
                          : result.status === "ACCEPTED"
                          ? "Friends"
                          : "Add Friend"}
                      </button>
                    </div>
                  ))
              )}
              {!searchLoading && !searchError && searchResults.length === 0 && (
                <p className="st">No users found</p>
              )}
            </div>
            <div className="friendmodal-footer">
              <button
                className="btn-outline"
                onClick={() => setOpenSearch(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal (unchanged) */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Edit Profile</h2>
            <div className="modal-form">
              <div>
                <label>Username</label>
                <input
                  type="text"
                  defaultValue={user?.username}
                  className="input"
                  id="username-input"
                />
              </div>
              <div>
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="input"
                  id="password-input"
                />
              </div>
              <div>
                <label>Email</label>
                <input
                  type="email"
                  placeholder={user?.email}
                  className="input"
                  disabled
                />
              </div>

              <div className="stats">
                <div>
                  <p>Wins: {user?.wins || 0}</p>
                  <p>Losses: {user?.losses || 0}</p>
                  <p>Global Rank: {user?.rank || "N/A"}</p>
                </div>

                <div className="profile-pic-wrapper">
                  <img
                    src={
                      user?.profilePictureUrl
                        ? `${user.profilePictureUrl}?t=${Date.now()}`
                        : null
                    }
                    alt="Profile"
                    className="profile-pic"
                    onClick={() =>
                      document.getElementById("pfp-upload").click()
                    }
                    style={{
                      display: user?.profilePictureUrl ? "block" : "none",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      document.getElementById("avatar-fallback").style.display =
                        "flex";
                    }}
                  />
                  <div
                    id="avatar-fallback"
                    className="upimg"
                    style={{
                      display: user?.profilePictureUrl ? "none" : "flex",
                    }}
                    onClick={() =>
                      document.getElementById("pfp-upload").click()
                    }
                  >
                    👤
                  </div>

                  <input
                    type="file"
                    id="pfp-upload"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      try {
                        const updatedUser =
                          await userService.updateProfilePicture(user.id, file);
                        dispatch(setUser(updatedUser));
                        refreshProfilePic();
                      } catch (err) {
                        console.error(err);
                        alert(err.message);
                      }
                    }}
                  />
                </div>
              </div>

              <p id="st" className="st"></p>

              <button
                className="btn"
                onClick={async () => {
                  const newUsername =
                    document.getElementById("username-input").value;
                  const newPassword =
                    document.getElementById("password-input").value;

                  try {
                    await userService.updateCredentials(
                      user.id,
                      newUsername,
                      newPassword
                    );
                    const latestUser = await userService.getUserById(user.id);
                    const blobUrl = await userService.getProfilePicture(
                      user.id
                    );
                    dispatch(
                      setUser({ ...latestUser, profilePictureUrl: blobUrl })
                    );
                    setOpen(false);
                  } catch (err) {
                    console.error(err);
                    document.getElementById("st").innerText = err.message;
                  }
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <LogoutConfirmModal
        isOpen={logoutModalOpen}
        onCancel={() => setLogoutModalOpen(false)}
        onConfirm={() => {
          dispatch(logout());
          persistor.purge();
          navigate("/login");
        }}
      />

      <div className="alerts-container">
        {alerts.map((a) => (
          <Alert
            key={a.id}
            type={a.type}
            message={a.message}
            onClose={() =>
              setAlerts((prev) => prev.filter((alert) => alert.id !== a.id))
            }
          />
        ))}
      </div>
    </div>
  );
}
