import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase.js"; 
import "../style/Login.css"; // Import CSS

const StudentLogin = () => {
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const email = `${rollNumber}@campusflow.com`.toLowerCase();
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("userType", "student");
      navigate("/student/dashboard");
    } catch (error) {
      alert(`Login Error: ${error.message}`);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Student Login</h2>
        <input
          type="text"
          placeholder="Enter Username"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
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

export default StudentLogin;
