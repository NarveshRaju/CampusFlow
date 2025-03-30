import { Link } from "react-router-dom";
import { Menu, ChevronLeft } from "lucide-react";

const Sidebar = ({ userType, isCollapsed, setIsCollapsed }) => {
  const menuItems =
    userType === "student"
      ? [
          { name: "Dashboard", path: "/student/dashboard" },
          { name: "Assignments", path: "/student/assignments" },
          { name: "Courses", path: "/student/courses" },
          { name: "Learning Analytics", path: "/student/analytics" },
          { name: "Code Repository", path: "/student/repository" },
          { name: "Notes", path: "/student/notes" },

        ]
      : [
          { name: "Dashboard", path: "/faculty/dashboard" },
          { name: "Create Assignments", path: "/faculty/createassignment" },
          { name: "Create Content", path: "/faculty/createcontent" },
          { name: "Evaluation", path: "/faculty/evaluation" },
          { name: "AI-Automation", path: "/faculty/aiautomation" },
          { name: "View Assignment", path: "/faculty/ViewAssignment" },
        ];

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Sidebar Toggle Button */}
      <button className="text-white absolute top-4 right-4 mt-4 ml-4 p-5" onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? <Menu size={24} /> : <ChevronLeft size={24} />}
      </button>

      {/* Sidebar Header */}
      {!isCollapsed && <h2 className="text-xl font-bold mb-6">Panel</h2>}

      {/* Sidebar Menu */}
      <ul>
        {menuItems.map((item) => (
          <li key={item.path} className="mb-4">
            <Link to={item.path} className="hover:text-gray-300 flex items-center">
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
