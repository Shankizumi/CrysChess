import { Routes, Route } from "react-router-dom"; // <-- missing import
import './App.css'
import GameBoard from './Components/GameBoard'
import LoginPage from './Components/LoginPage'
import ProfilePage from './Components/ProfilePage'
import Navbar from './Components/Navbar'

function App() {
  return (
    <>
    <Navbar></Navbar>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/profilePage" element={<ProfilePage />} />
      <Route path="/game" element={<GameBoard />} />
    </Routes>
    </>
  )
}

export default App
