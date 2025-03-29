import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <h1>Welcome to CampusFlow</h1>
      <div className="button-group">
        <button className="login-button student" onClick={() => navigate("/student/login")}>
          Student Login
        </button>
        <button className="login-button faculty" onClick={() => navigate("/faculty/login")}>
          Faculty Login
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
