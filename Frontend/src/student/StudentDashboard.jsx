import { useState } from "react";
import Sidebar from "../components/Sidebar";

const StudentDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`app-container ${isCollapsed ? "collapsed" : ""}`}>
      {/* Sidebar */}
      <Sidebar userType="student" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content */}
      <div className="main-content">
        

        {/* Dashboard Content */}
        <div className="content">
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
            <div className="p-6 bg-purple-200 rounded-lg shadow-md text-white">📚 Courses Overview</div>
            <div className="p-6 bg-blue-200 rounded-lg shadow-md">📄 Assignments</div>
            <div className="p-6 bg-green-200 rounded-lg shadow-md">📊 Learning Analytics</div>
            <div className="p-6 bg-yellow-200 rounded-lg shadow-md">💾 Code Repository</div>
            <div className="p-6 bg-yellow-200 rounded-lg shadow-md">📓 Notes</div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
