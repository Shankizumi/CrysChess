import React from "react";
import "./Navbar.css";
import logo from "../assets/logo1.png"

function Navbar() {
  return (
    <div className="navbar">
      <div className="brandnav">
        <img src={logo} alt="" srcSet="" className="logo"/>
        <span className="crys">Crys</span>
        <span className="chesss">Chess</span>
      </div>
    </div>
  );
}

export default Navbar;
