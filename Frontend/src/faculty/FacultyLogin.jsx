import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase.js";
import "../style/Login.css"; // Import the same CSS

const FacultyLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const email = `${username}@campusflow.com`.toLowerCase();
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("userType", "faculty");
      navigate("/faculty/dashboard");
    } catch (error) {
      alert(`Login Error: ${error.message}`);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Faculty Login</h2>
        <input
          type="text"
          placeholder="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    </div>
  );
};

export default FacultyLogin;
