import React from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
      <h1 className="text-4xl font-bold mb-6 text-center">Welcome to CampusFlow</h1>
      
      <div className="space-x-4">
        <button
          onClick={() => navigate("/student/login")}
          className="px-6 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition duration-300"
        >
          Student Login
        </button>
        <button
          onClick={() => navigate("/faculty/login")}
          className="px-6 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition duration-300"
        >
          Faculty Login
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
