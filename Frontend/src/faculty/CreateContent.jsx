import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar"; // Import Sidebar
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown

const CreateContent = () => {
    const [title, setTitle] = useState("");
    const [keyTopics, setKeyTopics] = useState("");
    const [generatedContent, setGeneratedContent] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar toggle state
    const [classes, setClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [showGeneratedContent, setShowGeneratedContent] = useState(false);

    useEffect(() => {
        // Fetch the list of classes when the component mounts
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

    const handleClassSelection = (event) => {
        const selectedOptions = Array.from(event.target.selectedOptions).map(option => option.value);
        setSelectedClasses(selectedOptions);
    };

    const generateContent = async () => {
        try {
            const prompt = `Generate content with the title "${title}" covering the key topics: ${keyTopics}`;
            const facultyId = "someFacultyId"; // Replace with actual faculty ID

            const response = await axios.post("http://localhost:5000/api/content/ai_generate", {
                prompt,
                facultyId,
                title,
                visibleToClasses: selectedClasses // Send the selected classes
            });

            setGeneratedContent(response.data.generatedContent);
            setShowGeneratedContent(true); // Show the generated content section
        } catch (error) {
            console.error("Error generating content:", error);
            alert("Error generating content.");
        }
    };

    const saveContent = async () => {
        try {
            const facultyId = "someFacultyId"; // Replace with actual faculty ID
            const saveResponse = await axios.post("http://localhost:5000/api/content/create", {
                facultyId: facultyId,
                title: title,
                content: generatedContent,
                visibleToClasses: selectedClasses
            });

            console.log("Content saved successfully:", saveResponse.data);
            alert("Notes generated and saved successfully!");
            // Optionally clear the input fields and generated content here
            setTitle("");
            setKeyTopics("");
            setGeneratedContent("");
            setShowGeneratedContent(false);
        } catch (error) {
            console.error("Error saving content:", error);
            alert("Error saving content.");
        }
    };

    const downloadPdf = async () => {
        // ... (your existing downloadPdf function) ...
    };

    return (
      <div className="flex">
          {/* Sidebar */}
          <Sidebar userType="faculty" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

          {/* Main Content */}
          <div className={`main-content ${isCollapsed ? "expanded" : ""}`}>
              <h1 style={{ marginTop: "235px" }}>Create AI-Generated Notes</h1>
              <input type="text" placeholder="Enter Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input type="text" placeholder="Key Topics (comma separated)" value={keyTopics} onChange={(e) => setKeyTopics(e.target.value)} />

              {/* Class Selection */}
              <div>
                  <label htmlFor="classes">Visible to Classes:</label>
                  <select
                      id="classes"
                      multiple
                      value={selectedClasses}
                      onChange={handleClassSelection}
                  >
                      {classes.map((className) => (
                          <option key={className} value={className}>
                              {className}
                          </option>
                      ))}
                  </select>
              </div>

              <button onClick={generateContent}>Generate Content</button>

              {showGeneratedContent && (
                  <div>
                      <h2>Generated Notes</h2>
                      <ReactMarkdown>{generatedContent}</ReactMarkdown> {/* Use ReactMarkdown here */}
                      <button onClick={downloadPdf}>Download as PDF</button>
                      <button onClick={saveContent}>Send/Save Notes</button>
                  </div>
              )}
          </div>
      </div>
  );
};

export default CreateContent;