// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYIHjEinvORycSEeFJOzCXAp6eqqdy-xo",
  authDomain: "disasterrelief-de43c.firebaseapp.com",
  projectId: "disasterrelief-de43c",
  storageBucket: "disasterrelief-de43c.appspot.com",
  messagingSenderId: "1071900181067",
  appId: "1:1071900181067:web:c0ca47c66679720788c3ce",
  measurementId: "G-GJ2RC53T8H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
