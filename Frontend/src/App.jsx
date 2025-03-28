import { Routes, Route } from "react-router-dom"; // ❌ Remove BrowserRouter from here
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase"; // Firebase config
import ProtectedRoute from "./components/ProtectedRoute"; // Protect routes
import LandingPage from "./LandingPage.jsx";
import StudentLogin from "./student/StudentLogin.jsx";
import FacultyLogin from "./faculty/FacultyLogin.jsx";
import StudentDashboard from "./student/StudentDashboard.jsx";
import FacultyDashboard from "./faculty/FacultyDashboard.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // "student" or "faculty"

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserType(localStorage.getItem("userType"));
      } else {
        setUser(null);
        setUserType(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <Routes> {/* ✅ Keep only Routes here */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/student/login" element={<StudentLogin />} />
      <Route path="/faculty/login" element={<FacultyLogin />} />

      {/* Protected Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute user={user} userType={userType} allowedType="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/dashboard"
        element={
          <ProtectedRoute user={user} userType={userType} allowedType="faculty">
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
