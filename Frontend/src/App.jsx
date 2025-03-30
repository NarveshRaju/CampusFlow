import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./LandingPage.jsx";

// student imports
import StudentLogin from "./student/StudentLogin.jsx";
import StudentDashboard from "./student/StudentDashboard.jsx";
import StudentNotes from "./student/StudentNotes.jsx";  

// faculty imports
import FacultyLogin from "./faculty/FacultyLogin.jsx";
import FacultyDashboard from "./faculty/FacultyDashboard.jsx";
import CreateAssignment from "./faculty/CreateAssignment.jsx";
import CreateContent from "./faculty/CreateContent.jsx";  
import ViewAssignment from "./faculty/ViewAssignment.jsx";

// ✅ Corrected import paths for student pages
import Courses from "./student/Courses";
import Assignments from "./student/Assignments";
import Analytics from "./student/Analytics";
import Repository from "./student/Repository";

function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setUserType(localStorage.getItem("userType"));
    });
    return () => unsubscribe();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/student/login" element={<StudentLogin />} />
      <Route path="/faculty/login" element={<FacultyLogin />} />

      {/* 🔒 Protected Student Routes */}
      <Route path="/student/dashboard" element={<ProtectedRoute allowedType="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/courses" element={<ProtectedRoute allowedType="student"><Courses /></ProtectedRoute>} />
      <Route path="/student/assignments" element={<ProtectedRoute allowedType="student"><Assignments /></ProtectedRoute>} />
      <Route path="/student/analytics" element={<ProtectedRoute allowedType="student"><Analytics /></ProtectedRoute>} />
      <Route path="/student/repository" element={<ProtectedRoute allowedType="student"><Repository /></ProtectedRoute>} />
      <Route path="/student/notes" element={<ProtectedRoute allowedType="student"><StudentNotes /></ProtectedRoute>} />


      {/* 🔒 Protected Faculty Routes */}
      <Route path="/faculty/dashboard" element={<ProtectedRoute allowedType="faculty"><FacultyDashboard /></ProtectedRoute>} />
      <Route path="/faculty/createassignment" element={<ProtectedRoute allowedType="faculty"><CreateAssignment /></ProtectedRoute>} />
      <Route path="/faculty/createcontent" element={<ProtectedRoute allowedType="faculty"><CreateContent /></ProtectedRoute>} />
      <Route path="/faculty/ViewAssignment" element={<ProtectedRoute allowedType="faculty"><ViewAssignment /></ProtectedRoute>} />

    </Routes>
  );
}

export default App;
