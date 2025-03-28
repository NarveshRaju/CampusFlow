// src/student/StudentDashboard.jsx
import Sidebar from "../components/Sidebar";

const StudentDashboard = () => {
  return (
    <div className="flex">
      <Sidebar userType="student" />
      <div className="ml-64 p-6 w-full">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="p-6 bg-purple-200 rounded-lg shadow-md">📚 Courses Overview</div>
          <div className="p-6 bg-blue-200 rounded-lg shadow-md">📄 Assignments</div>
          <div className="p-6 bg-green-200 rounded-lg shadow-md">📊 Learning Analytics</div>
          <div className="p-6 bg-yellow-200 rounded-lg shadow-md">💾 Code Repository</div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
