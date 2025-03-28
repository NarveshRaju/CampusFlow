import React from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../config/firebase.js";

const ProtectedRoute = ({ children, role }) => {
  const user = auth.currentUser;

  if (!user) {
    return <Navigate to="/" />;
  }

  // Example role-based access control (replace with Firestore claims)
  if (role === "faculty" && !user.email.includes("faculty")) {
    return <Navigate to="/" />;
  }
  if (role === "student" && !user.email.includes("student")) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
