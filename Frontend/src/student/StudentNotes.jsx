import { useState, useEffect } from "react";
import axios from "axios";

const StudentNotes = () => {
    const [notes, setNotes] = useState([]);
    const [classes, setClasses] = useState([]);
    const [studentClass, setStudentClass] = useState(""); // Initialize as empty string

    useEffect(() => {
        // Fetch the list of classes
        const fetchClasses = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/classes");
                setClasses(response.data.classes);
            } catch (error) {
                console.error("Error fetching classes:", error);
            }
        };

        fetchClasses();
    }, []);

    useEffect(() => {
        // Fetch notes based on the selected studentClass
        if (studentClass) {
            const fetchNotes = async () => {
                try {
                    const response = await axios.get(`http://localhost:5000/api/student/notes?class=${studentClass}`);
                    setNotes(response.data.notes);
                } catch (error) {
                    console.error("Error fetching notes:", error);
                }
            };
            fetchNotes();
        } else {
            setNotes([]); // Clear notes if no class is selected
        }
    }, [studentClass]);

    const handleClassChange = (event) => {
        setStudentClass(event.target.value);
    };

    const downloadNote = async (noteId) => {
        window.location.href = `http://localhost:5000/api/content/download/${noteId}`;
    };

    return (
        <div className="container">
            <h1>Available Notes</h1>

            {/* Dropdown to select class */}
            <div>
                <label htmlFor="classSelect">Select your class:</label>
                <select id="classSelect" value={studentClass} onChange={handleClassChange}>
                    <option value="">-- Select Class --</option>
                    {classes.map((className) => (
                        <option key={className} value={className}>
                            {className}
                        </option>
                    ))}
                </select>
            </div>

            {/* Display notes if a class is selected */}
            {studentClass && (
                <div>
                    <h2>Notes for {studentClass}</h2>
                    {notes.length > 0 ? (
                        <ul>
                            {notes.map((note) => (
                                <li key={note._id}>
                                    <button onClick={() => downloadNote(note._id)}>{note.title}</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No notes available for the selected class.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentNotes;