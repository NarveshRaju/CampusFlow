import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase.js";

const ProtectedRoute = ({ children, allowedType }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  if (loading) return <div>Loading...</div>; // Prevents flickering

  const userType = localStorage.getItem("userType");

  if (!user || userType !== allowedType) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
