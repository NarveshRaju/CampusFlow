import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ScheduleActivityForm from "./ScheduleActivityForm.jsx"; // Adjust the import path as needed

const FacultyDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="faculty-dashboard-container">
      {/* Sidebar */}
      <Sidebar userType="faculty" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content */}
      <div className={`main-content ${isCollapsed ? "collapsed" : "expanded"}`}>
        <h1 className="page-title">Faculty Dashboard</h1>
        <div className="dashboard-grid">
          <div className="card red">📂 Create Assignments</div>
          <div className="card indigo">✔ Evaluation</div>
          <div className="card teal">🤖 AI Automation</div>
          <div className="card beige">💻 Create Content</div>
          <section>
            <h2 className="section-title">Schedule New Activity</h2>
            <ScheduleActivityForm />
          </section>
        </div>
      </div>

      <style jsx>{`
        .faculty-dashboard-container {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        .main-content {
          padding: 24px;
          width: 100%;
          overflow-y: auto;
          transition: margin-left 0.3s ease;
          scrollbar-width: thin; /* For Firefox */
          scrollbar-color: #6b7280 #f3f4f6; /* For Firefox */
        }

        .main-content::-webkit-scrollbar {
          width: 8px; /* Width of the scrollbar */
        }

        .main-content::-webkit-scrollbar-thumb {
          background-color: #6b7280; /* Color of the scrollbar */
          border-radius: 10px;
        }

        .main-content::-webkit-scrollbar-track {
          background: #f3f4f6; /* Background color of the scrollbar track */
          border-radius: 10px;
        }

        .main-content.collapsed {
          margin-left: 4rem; /* When collapsed, the content shifts */
        }

        .main-content.expanded {
          margin-left: 16rem; /* When expanded, it takes more space */
        }

        .page-title {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 1rem;
          color:white;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .card {
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          cursor: pointer;
          height: 200px;
        }

        .red {
          background-color: #f87171;
        }

        .indigo {
          background-color: #818cf8;
        }

        .teal {
          background-color: #34d399;
        }

        .beige{
          background-color: #d4c8a3
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
};

export default FacultyDashboard;
