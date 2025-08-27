import { useState } from "react";
import "./ProfilePage.css";

export default function ProfilePage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="page-container">
        
        {/* Profile Section */}
        <div className="profile-section cardProfile">
          <div className="avatar" onClick={() => setOpen(true)}>👤</div>
          <div>
            <p className="username">Username</p>
            <p className="rank">Rank: 67421</p>
          </div>
        </div>
      <div className="card">
        {/* Welcome Text */}
        <h1 className="title">Welcome to CryChess</h1>
        <p className="subtitle">Put your brain to test and cry</p>


        {/* Buttons */}
        <div className="button-group">
          <button className="btn">Practice with AI</button>
          <button className="btn">Invite a Friend for VS</button>
          <button className="btn">Play VS the World</button>
        </div>

        {/* Donate */}
        <div className="donate-container">
          <button className="btn-outline">Donate</button>
        </div>
      </div>

      {/* Modal for Profile Info */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Edit Profile</h2>

            <div className="modal-form">
              <div>
                <label>Username</label>
                <input type="text" defaultValue="Username" className="input" />
              </div>
              <div>
                <label>Password</label>
                <input type="password" placeholder="Enter password" className="input" />
              </div>
              <div>
                <label>Email</label>
                <input type="email" placeholder="Enter email" className="input" />
              </div>

              {/* Non-editable data */}
              <div className="stats">
                <p>Wins: 42</p>
                <p>Losses: 17</p>
                <p>Global Rank: 67421</p>
              </div>

              <button className="btn" onClick={() => setOpen(false)}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
