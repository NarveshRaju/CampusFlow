import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AssignmentSubmission from './AssignmentSubmission'; // Ensure the path is correct
import { getAuth } from 'firebase/auth'; // Import Firebase Auth

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [studentClass, setStudentClass] = useState('');
  const [error, setError] = useState('');
  const [submissionDetails, setSubmissionDetails] = useState({}); // Store submission details for each assignment

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/classes');
        setClasses(response.data.classes);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes.');
      }
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (studentClass) {
        try {
          const response = await axios.get(`http://localhost:5000/api/student/assignments?class=${studentClass}`);
          setAssignments(response.data.assignments);
        } catch (err) {
          console.error('Error fetching assignments:', err);
          setError('Failed to load assignments.');
          setAssignments([]);
        }
      } else {
        setAssignments([]);
      }
    };

    fetchAssignments();
  }, [studentClass]);

  const fetchSubmissionDetails = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const rollNumber = localStorage.getItem('rollNumber'); // Get rollNumber from localStorage
    if ((currentUser || rollNumber) && studentClass && assignments.length > 0) {
      const studentIdToUse = rollNumber || currentUser.uid; // Use rollNumber if available, otherwise UID
      const details = {};
      for (const assignment of assignments) {
        try {
          const response = await axios.get(`http://localhost:5000/api/student/submission/${assignment._id}?studentId=${studentIdToUse}`);
          details[assignment._id] = response.data.submission;
        } catch (err) {
          console.error(`Error fetching submission details for ${assignment._id}:`, err);
          // Handle errors if needed
        }
      }
      setSubmissionDetails(details);
    }
  };

  useEffect(() => {
    fetchSubmissionDetails();
  }, [assignments, studentClass]); // Fetch details when assignments or class changes

  const handleClassChange = (event) => {
    setStudentClass(event.target.value);
  };

  return (
    <div>
      <h1>Assignments</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <label htmlFor="classSelect">Select your class:</label>
        <select id="classSelect" value={studentClass} onChange={handleClassChange}>
          <option value="">-- Select Class --</option>
          {classes.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>
      </div>

      {studentClass && (
        <div>
          <h2>Assignments for {studentClass}</h2>
          {assignments.length > 0 ? (
            <ul>
              {assignments.map((assignment) => (
                <li key={assignment._id}>
                  <h3>{assignment.title}</h3>
                  <p>{assignment.description}</p>
                  <p>
                    <strong>Assigned:</strong>{' '}
                    {new Date(assignment.assignedDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Due:</strong>{' '}
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Evaluation Criteria:</strong> {assignment.evaluationCriteria}
                  </p>

                  {/* Conditionally render AssignmentSubmission */}
                  {!submissionDetails[assignment._id] && (
                    <AssignmentSubmission assignment={assignment} onSubmissionSuccess={fetchSubmissionDetails} />
                  )}

                  {/* Display Submission Details (including grade and feedback) */}
                  {submissionDetails[assignment._id] && (
                    <div>
                      <h4>Your Submission Details:</h4>
                      <p>Submitted on: {new Date(submissionDetails[assignment._id].submissionDate).toLocaleDateString()}</p>
                      <p>File: <a href={`http://localhost:5000/uploads/${submissionDetails[assignment._id].originalFileName}`} target="_blank" rel="noopener noreferrer">{submissionDetails[assignment._id].originalFileName}</a></p>
                      {submissionDetails[assignment._id]?.grade !== undefined ? (
                        <p><strong>Grade:</strong> {submissionDetails[assignment._id].grade}</p>
                      ) : (
                        <p>Submission awaiting grading.</p>
                      )}
                      {submissionDetails[assignment._id]?.feedback && (
                        <p><strong>Feedback:</strong> {submissionDetails[assignment._id].feedback}</p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No assignments available for the selected class.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Assignments;