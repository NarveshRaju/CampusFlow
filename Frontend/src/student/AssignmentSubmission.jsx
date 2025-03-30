import React, { useState } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth'; // Import Firebase Auth

const AssignmentSubmission = ({ assignment, onSubmissionSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [submissionError, setSubmissionError] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setSubmissionError('Please select a file to submit.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('assignmentId', assignment._id);

    // Retrieve the rollNumber from localStorage
    const rollNumber = localStorage.getItem('rollNumber');
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const studentIdToUse = rollNumber || currentUser.uid;
    formData.append('studentId', studentIdToUse); // Use the rollNumber as studentId

    try {
      const response = await axios.post('http://localhost:5000/api/assignments/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSubmissionMessage(response.data.message);
      setSubmissionError('');
      setSelectedFile(null); // Clear the selected file
      // Call the onSubmissionSuccess function to refetch submission details in the parent component
      if (onSubmissionSuccess) {
        onSubmissionSuccess();
      }
    } catch (error) {
      setSubmissionError(error.response?.data?.error || 'Failed to submit assignment.');
      setSubmissionMessage('');
      console.error('Error submitting assignment:', error);
    }
  };

  return (
    <div>
      <h4>Submit your work:</h4>
      {submissionMessage && <p style={{ color: 'green' }}>{submissionMessage}</p>}
      {submissionError && <p style={{ color: 'red' }}>{submissionError}</p>}
      <div>
        <input type="file" onChange={handleFileChange} />
      </div>
      <button onClick={handleSubmit} disabled={!selectedFile}>Submit Assignment</button>
    </div>
  );
};

export default AssignmentSubmission;