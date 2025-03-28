// src/faculty/FacultyDashboard.jsx
import Sidebar from "../components/Sidebar";

const FacultyDashboard = () => {
  return (
    <div className="flex">
      <Sidebar userType="faculty" />
      <div className="ml-64 p-6 w-full">
        <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="p-6 bg-red-200 rounded-lg shadow-md">📂 Create Assignments</div>
          <div className="p-6 bg-indigo-200 rounded-lg shadow-md">✔ Evaluation</div>
          <div className="p-6 bg-teal-200 rounded-lg shadow-md">🤖 AI Automation</div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
