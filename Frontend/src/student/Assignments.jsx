import { useState, useEffect } from 'react';
import axios from 'axios';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/assignments');
        setAssignments(response.data);
      } catch (err) {
        console.error('Error fetching assignments:', err);
      }
    };

    fetchAssignments();
  }, []);

  return (
    <div>
      <h1>Assignments</h1>
      <ul>
        {assignments.map((assignment) => (
          <li key={assignment._id}>
            <h2>{assignment.title}</h2>
            <p>{assignment.description}</p>
            <p><strong>Assigned:</strong> {new Date(assignment.assignedDate).toLocaleDateString()}</p>
            <p><strong>Due:</strong> {new Date(assignment.dueDate).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Assignments;
