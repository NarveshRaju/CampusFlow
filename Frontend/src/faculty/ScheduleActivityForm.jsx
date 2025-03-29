import React, { useState, useEffect } from "react";
import { auth } from "../config/firebase.js"; // Import the auth object

const ScheduleActivityForm = () => {
  const [activityType, setActivityType] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [schedulingStatus, setSchedulingStatus] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [availableClasses, setAvailableClasses] = useState([]);
  const [aiPrompt, setAiPrompt] = useState(""); // State for the AI prompt

  useEffect(() => {
    fetch("http://localhost:5000/api/classes")
      .then((response) => response.json())
      .then((data) => {
        setAvailableClasses(data.classes);
      })
      .catch((error) => {
        console.error("Error fetching classes:", error);
      });
  }, []);

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    setSchedulingStatus("Scheduling...");

    const activityData = {
      activity_type: activityType,
      title: title,
      date: date,
      start_time: startTime,
      end_time: endTime,
      location: location,
      selected_class: selectedClass,
      organizer_id: auth.currentUser?.uid, // Get the logged-in user's UID
    };

    try {
      const response = await fetch("http://localhost:5000/api/activities/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activityData),
      });

      const data = await response.json();

      if (response.ok) {
        setSchedulingStatus(`Activity scheduled successfully! ID: ${data.activity_id}`);
        // Optionally clear the form fields
        setActivityType("");
        setTitle("");
        setDate("");
        setStartTime("");
        setEndTime("");
        setLocation("");
        setSelectedClass("");
      } else {
        setSchedulingStatus(`Scheduling failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      setSchedulingStatus(`Scheduling failed: ${error.message}`);
    }
  };

  const handleAiSubmit = async (event) => {
    event.preventDefault();
    setSchedulingStatus("Processing AI Prompt...");

    const aiData = {
      prompt: aiPrompt,
      organizer_id: auth.currentUser?.uid, // Get the logged-in user's UID
    };

    try {
      const response = await fetch("http://localhost:5000/api/ai/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(aiData),
      });

      const data = await response.json();

      if (response.ok) {
        setSchedulingStatus(`AI Prompt processed successfully! Result: ${JSON.stringify(data)}`);
        // You might want to automatically fill the form fields based on the AI result here
      } else {
        setSchedulingStatus(`AI Prompt processing failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      setSchedulingStatus(`AI Prompt processing failed: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Schedule New Activity</h2>

      {/* Manual Scheduling Form */}
      <h3>Manual Scheduling</h3>
      <form onSubmit={handleManualSubmit}>
        {/* ... (Your existing manual form fields here) ... */}
        <div>
          <label htmlFor="activityType">Activity Type:</label>
          <select
            id="activityType"
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
          >
            <option value="">Select Type</option>
            <option value="Test">Test</option>
            <option value="Event">Event</option>
            <option value="Meeting">Meeting</option>
          </select>
        </div>
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
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="startTime">Start Time:</label>
          <input
            type="time"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="endTime">End Time:</label>
          <input
            type="time"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="location">Location:</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="selectedClass">Select Class:</label>
          <select
            id="selectedClass"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Select a Class</option>
            {availableClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Schedule Activity</button>
      </form>

      <hr />

      {/* AI-Powered Scheduling */}
      <h3>AI-Powered Scheduling</h3>
      <form onSubmit={handleAiSubmit}>
        <div>
          <label htmlFor="aiPrompt">Enter Scheduling Prompt:</label>
          <textarea
            id="aiPrompt"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows="4"
            cols="50"
            placeholder="e.g., Schedule a Class AIML lecture on 'Introduction to Neural Networks' for March 30th, 2025, at 10:00 AM in room 201"
            required
          />
        </div>
        <button type="submit">Process with AI</button>
      </form>

      {schedulingStatus && <p>{schedulingStatus}</p>}x
    </div>
  );
};

export default ScheduleActivityForm;