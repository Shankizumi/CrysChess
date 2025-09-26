import { useState, useEffect } from "react";
import "./ProfilePage.css";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import userService from "../Services/userService"; // adjust path if needed
import { setUser } from "../store/userSlice"; // if you update Redux store


import {
  fetchPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "../store/friendSlice";
import UserService from "../Services/userService";
import { persistor } from "../store/store";
import { logout } from "../store/userSlice";

export default function ProfilePage() {
  const [openFriends, setOpenFriends] = useState(false);
  const [activeTab, setActiveTab] = useState("friends");
  const [openSearch, setOpenSearch] = useState(false);
  const [friendsData, setFriendsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [justSent, setJustSent] = useState([]);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const user = useSelector((state) => state.user.user);
  const { friendList, pendingRequests, loading } = useSelector(
    (state) => state.friends
  );

  const dispatch = useDispatch();

  useEffect(() => {
  refreshProfilePic();
}, [user?.id]); // runs once on load or when user.id changes


  const isFriendOrPending = (userId) =>
    friendList.some((f) => f.id === userId) ||
    pendingRequests.some((p) => p.id === userId);

  // Fetch friends + pending requests + detailed friend data
  // useEffect(() => {
  //   if (!user?.id) return;

  //   const fetchDetails = async () => {
  //     dispatch(fetchFriends(user.id));
  //     dispatch(fetchPendingRequests(user.id));
  //     if (friendList.length > 0) {
  //       try {
  //         const detailed = await Promise.all(
  //           friendList.map((f) =>
  //             FriendService.friendData(f.id).then((res) => res.data)
  //           )
  //         );
  //         setFriendsData(detailed);
  //       } catch (err) {
  //         console.error("Error fetching friend details:", err);
  //       }
  //     } else {
  //       setFriendsData([]);
  //     }
  //   };

  //   fetchDetails();
  // }, [user?.id, dispatch, friendList]);

  const handleAddFriend = async (friendId) => {
    try {
      await dispatch(sendFriendRequest({ userId: user.id, friendId })).unwrap();
      setJustSent((prev) => [...prev, friendId]);
      dispatch(fetchPendingRequests(user.id));
    } catch (error) {
      alert(error || "Failed to send friend request");
    }
  };

  const handleSearch = async () => {
    setOpenSearch(true);
    setSearchLoading(true);
    setSearchError(null);
    try {
      const results = await UserService.searchUsers(searchTerm);
      setSearchResults(results);
    } catch (error) {
      setSearchError(error.message);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

const refreshProfilePic = async () => {
  if (!user?.id) return;
  try {
    // ✅ call via userService, not directly
    const blobUrl = await userService.getProfilePicture(user.id);
    dispatch(setUser({ ...user, profilePictureUrl: blobUrl }));
  } catch (err) {
    console.error("Failed to refresh profile picture:", err);
  }
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
          onClick={() => {
            dispatch(logout());
            persistor.purge();
            navigate("/login"); // redirect to login page
          }}
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
          e.target.src = "/default-avatar.png"; // fallback in case image is broken
        }}
      />
    ) : (
      "👤" // default emoji if no profile picture
    )}
  </div>
  <div>
    <p className="username">{user?.username || "Guest"}</p>
    <p className="rank">Rank: {user?.rank || "Unranked"}</p>
    <button className="btn-outline frdbtn" onClick={() => setOpenFriends(true)}>
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
                {loading ? (
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
                        onClick={() =>
                          dispatch(
                            removeFriend({
                              userId: user.id,
                              friendId: friend.id,
                            })
                          )
                        }
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
                {loading ? (
                  <p>Loading pending requests...</p>
                ) : pendingRequests.length > 0 ? (
                  pendingRequests.map((req) => (
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
                        onClick={() => dispatch(acceptFriendRequest(req.id))}
                      >
                        Accept
                      </button>
                      <button
                        className="btn-outline"
                        onClick={() => dispatch(rejectFriendRequest(req.id))}
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
                        className="friendavatar"
                      />
                      <div className="friendinfo">
                        <p className="username">{result.username}</p>
                        <p className="rank">{result.rank || "Unranked"}</p>
                      </div>
                      <button
                        className="btn-outline"
                        disabled={
                          isFriendOrPending(result.id) ||
                          justSent.includes(result.id)
                        }
                        onClick={() => handleAddFriend(result.id)}
                      >
                        {isFriendOrPending(result.id) ||
                        justSent.includes(result.id)
                          ? "Request Sent"
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
 {/* Modal for Profile Info */}
{open && (
  <div className="modal-overlay" onClick={() => setOpen(false)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <h2 className="modal-title">Edit Profile</h2>
      <div className="modal-form">
        {/* Username */}
        <div>
          <label>Username</label>
          <input
            type="text"
            defaultValue={user?.username}
            className="input"
          />
        </div>

        {/* Password */}
        <div>
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            className="input"
          />
        </div>

        {/* Email */}
        <div>
          <label>Email</label>
          <input
            type="email"
            placeholder={user?.email}
            className="input"
            disabled
          />
        </div>

        {/* Non-editable stats */}
        <div className="stats">
          <div>
            <p>Wins: {user?.wins || 0}</p>
            <p>Losses: {user?.losses || 0}</p>
            <p>Global Rank: {user?.rank || "N/A"}</p>
          </div>

          {/* Profile Picture / Avatar */}
{/* Profile Picture / Avatar */}
<div className="profile-pic-wrapper">
  {/* Profile Picture */}
  <img
    src={user?.profilePictureUrl ? `${user.profilePictureUrl}?t=${Date.now()}` : null}
    alt="Profile"
    className="profile-pic"
    onClick={() => document.getElementById("pfp-upload").click()}
    style={{ display: user?.profilePictureUrl ? "block" : "none" }}
    onError={(e) => {
      e.target.style.display = "none"; // hide broken image
      document.getElementById("avatar-fallback").style.display = "flex"; // show fallback
    }}
  />

  {/* Avatar Fallback */}
  <div
    id="avatar-fallback"
    className="upimg"
    style={{ display: user?.profilePictureUrl ? "none" : "flex" }}
    onClick={() => document.getElementById("pfp-upload").click()}
  >
    👤
  </div>

  {/* Hidden File Input */}
  <input
    type="file"
    id="pfp-upload"
    accept="image/*"
    style={{ display: "none" }}
    onChange={async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const updatedUser = await userService.updateProfilePicture(user.id, file);
        dispatch(setUser(updatedUser)); // update Redux
        // console.log(user)
          refreshProfilePic(); // optional, refresh even if just closed

      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    }}
  />
</div>

        </div>

        {/* Save Changes Button */}
        <button className="btn" onClick={() => {
  setOpen(false);
  refreshProfilePic(); // optional, refresh even if just closed
}}
>
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
