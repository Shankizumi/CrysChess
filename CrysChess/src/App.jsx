import { Routes, Route, useLocation } from "react-router-dom";
import './App.css'
import GameBoard from './Components/GameBoard'
import LoginPage from './Components/LoginPage'
import ProfilePage from './Components/ProfilePage'
import Navbar from './Components/Navbar'
import MultiPlayerMatch from './Components/MultiPlayerMatch'

function App() {
  const location = useLocation();   // <-- important!
  const hideNavbar = location.pathname.startsWith("/multiplayer/");

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profilePage" element={<ProfilePage />} />
        <Route path="/game" element={<GameBoard />} />
        <Route path="/multiplayer/:gameId" element={<MultiPlayerMatch />} />
      </Routes>
    </>
  );
}

export default App;
