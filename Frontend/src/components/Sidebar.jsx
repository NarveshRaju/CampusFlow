// src/components/Sidebar.jsx
import { Link } from "react-router-dom";

const Sidebar = ({ userType }) => {
  const menuItems =
    userType === "student"
      ? [
          { name: "Dashboard", path: "/student/dashboard" },
          { name: "Assignments", path: "/student/assignments" },
          { name: "Courses", path: "/student/courses" },
          { name: "Learning Analytics", path: "/student/analytics" },
          { name: "Code Repository", path: "/student/repository" },
        ]
      : [
          { name: "Dashboard", path: "/faculty/dashboard" },
          { name: "Create Assignments", path: "/faculty/create-assignment" },
          { name: "Evaluation", path: "/faculty/evaluation" },
          { name: "AI-Automation", path: "/faculty/ai-automation" },
        ];

  return (
    <div className="w-64 h-screen bg-gray-900 text-white p-5 fixed">
      <h2 className="text-xl font-bold mb-6">{userType === "student" ? "Student" : "Faculty"} Panel</h2>
      <ul>
        {menuItems.map((item) => (
          <li key={item.path} className="mb-4">
            <Link to={item.path} className="hover:text-gray-300">{item.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
