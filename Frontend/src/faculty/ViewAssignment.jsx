import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth'; // Assuming you are using Firebase for authentication

const ViewAssignment = () => {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
    const [submissions, setSubmissions] = useState([]);
    const [error, setError] = useState('');
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const [grading, setGrading] = useState({}); // Store grade and feedback for each submission

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/classes'); // Assuming this endpoint returns all classes
                setClasses(response.data.classes);
            } catch (err) {
                console.error('Error fetching classes:', err);
                setError('Failed to load classes.');
            }
        };

        fetchClasses();
    }, []);

    useEffect(() => {
        const fetchAssignmentsForClass = async () => {
            if (selectedClass) {
                try {
                    const response = await axios.get(`http://localhost:5000/api/assignments/class/${selectedClass}`); // New backend endpoint
                    setAssignments(response.data.assignments);
                    setSelectedAssignmentId(''); // Reset selected assignment when class changes
                    setSubmissions([]); // Clear previous submissions
                    setGrading({}); // Clear previous grading
                } catch (err) {
                    console.error('Error fetching assignments:', err);
                    setError('Failed to load assignments for this class.');
                    setAssignments([]);
                    setSubmissions([]);
                    setGrading({});
                }
            } else {
                setAssignments([]);
                setSubmissions([]);
                setGrading({});
            }
        };

        fetchAssignmentsForClass();
    }, [selectedClass]);

    useEffect(() => {
        const fetchSubmissionsForAssignment = async () => {
            if (selectedAssignmentId) {
                try {
                    const response = await axios.get(`http://localhost:5000/api/teacher/submissions/${selectedAssignmentId}`);
                    const submissionsData = response.data.submissions;
                    setSubmissions(submissionsData);

                    // Initialize grading state for the selected assignment's submissions
                    const initialGrading = {};
                    submissionsData.forEach(sub => {
                        initialGrading[sub._id] = { grade: sub.grade || '', feedback: sub.feedback || '' };
                    });
                    setGrading(initialGrading);

                } catch (err) {
                    console.error('Error fetching submissions:', err);
                    setError('Failed to load submissions for this assignment.');
                    setSubmissions([]);
                    setGrading({});
                }
            } else {
                setSubmissions([]);
                setGrading({});
            }
        };

        fetchSubmissionsForAssignment();
    }, [selectedAssignmentId]);

    const handleClassChange = (event) => {
        setSelectedClass(event.target.value);
    };

    const handleAssignmentChange = (event) => {
        setSelectedAssignmentId(event.target.value);
    };

    const handleGradeChange = (submissionId, event) => {
        setGrading(prevGrading => ({
            ...prevGrading,
            [submissionId]: { ...prevGrading[submissionId], grade: event.target.value }
        }));
    };

    const handleFeedbackChange = (submissionId, event) => {
        setGrading(prevGrading => ({
            ...prevGrading,
            [submissionId]: { ...prevGrading[submissionId], feedback: event.target.value }
        }));
    };

    const saveGrade = async (submissionId) => {
        const { grade, feedback } = grading[submissionId] || {};
        try {
            const response = await axios.post(`http://localhost:5000/api/submissions/grade/${submissionId}`, {
                grade,
                feedback,
            });
            console.log('Grade saved:', response.data);
            // Optionally update the submissions state
            setSubmissions(prevSubmissions =>
                prevSubmissions.map(sub =>
                    sub._id === submissionId ? { ...sub, grade, feedback } : sub
                )
            );
        } catch (error) {
            console.error('Error saving grade:', error);
            setError('Failed to save grade and feedback.');
        }
    };

    return (
        <div>
            <h2>View Submissions by Class and Assignment</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div>
                <label htmlFor="classSelect">Select Class:</label>
                <select id="classSelect" value={selectedClass} onChange={handleClassChange}>
                    <option value="">-- Select Class --</option>
                    {classes.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                    ))}
                </select>
            </div>

            {selectedClass && (
                <div>
                    <label htmlFor="assignmentSelect">Select Assignment:</label>
                    <select id="assignmentSelect" value={selectedAssignmentId} onChange={handleAssignmentChange}>
                        <option value="">-- Select Assignment --</option>
                        {assignments.map((assignment) => (
                            <option key={assignment._id} value={assignment._id}>{assignment.title}</option>
                        ))}
                    </select>
                </div>
            )}

            {selectedAssignmentId && submissions.length > 0 && (
                <div>
                    <h3>Submissions for Selected Assignment:</h3>
                    <ul>
                        {submissions.map(submission => (
                            <li key={submission._id}>
                                <p>Student Name: {submission.studentName}</p>
                                <p>Submitted on: {new Date(submission.submissionDate).toLocaleDateString()}</p>
                                <p>File: <a href={`http://localhost:5000/uploads/${submission.originalFileName}`} target="_blank" rel="noopener noreferrer">{submission.originalFileName}</a></p>

                                <div>
                                    <label htmlFor={`grade-${submission._id}`}>Grade:</label>
                                    <input
                                        type="text"
                                        id={`grade-${submission._id}`}
                                        value={grading[submission._id]?.grade || ''}
                                        onChange={(e) => handleGradeChange(submission._id, e)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor={`feedback-${submission._id}`}>Feedback:</label>
                                    <textarea
                                        id={`feedback-${submission._id}`}
                                        value={grading[submission._id]?.feedback || ''}
                                        onChange={(e) => handleFeedbackChange(submission._id, e)}
                                    />
                                </div>
                                <button onClick={() => saveGrade(submission._id)}>Save Grade</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {selectedClass && assignments.length > 0 && submissions.length === 0 && selectedAssignmentId !== '' && (
                <p>No submissions yet for the selected assignment in this class.</p>
            )}
        </div>
    );
};

export default ViewAssignment;