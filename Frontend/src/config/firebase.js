import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Firestore (if needed)
import { getAnalytics } from "firebase/analytics"; // Optional: Analytics

const firebaseConfig = {
  apiKey: "AIzaSyAQtJAmU-0AADKmzhdMoCo06Ss0uUhifCI",
  authDomain: "campusflow-d0330.firebaseapp.com",
  projectId: "campusflow-d0330",
  storageBucket: "campusflow-d0330.appspot.com", 
  messagingSenderId: "927589677973",
  appId: "1:927589677973:web:aa3d1a5da913456530d49c",
  measurementId: "G-XHFFKBZ36S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Firestore database (if needed)
const analytics = getAnalytics(app); // Optional: Analytics

export { auth, app, db, analytics };
