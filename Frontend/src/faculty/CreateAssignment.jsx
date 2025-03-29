import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth'; // Import Firebase Auth

const CreateAssignment = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedDate, setAssignedDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [evaluationCriteria, setEvaluationCriteria] = useState('');
  const [classes, setClasses] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError('Faculty not authenticated. Please log in.');
        return;
      }

      const facultyId = currentUser.uid;

      const response = await axios.post('http://localhost:5000/api/assignments/create', {
        facultyId,
        class: selectedClass,
        title,
        description,
        assignedDate,
        dueDate,
        evaluationCriteria,
      });

      setMessage('Assignment Created Successfully!');
      console.log('Assignment Creation Response:', response.data);
      // Reset form fields if needed
      setTitle('');
      setDescription('');
      setAssignedDate('');
      setDueDate('');
      setSelectedClass('');
      setEvaluationCriteria('');
    } catch (err) {
      setError('Error creating assignment: ' + (err.response?.data?.error || err.message));
      console.error('Error creating assignment:', err);
    }
  };

  return (
    <div>
      <h1>Create New Assignment</h1>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="assignedDate">Assigned Date:</label>
          <input
            type="date"
            id="assignedDate"
            value={assignedDate}
            onChange={(e) => setAssignedDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="dueDate">Due Date:</label>
          <input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="selectedClass">Class:</label>
          <select
            id="selectedClass"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            required
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="evaluationCriteria">Evaluation Criteria:</label>
          <textarea
            id="evaluationCriteria"
            placeholder="Enter evaluation criteria for AI grading"
            value={evaluationCriteria}
            onChange={(e) => setEvaluationCriteria(e.target.value)}
            required
          />
        </div>
        <button type="submit">Create Assignment</button>
      </form>
    </div>
  );
};

export default CreateAssignment;