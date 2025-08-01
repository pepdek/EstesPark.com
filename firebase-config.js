// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfCRvUPmCEXhXleJG0nHM3BXQpSEowjq8",
  authDomain: "estespark-83a46.firebaseapp.com",
  projectId: "estespark-83a46",
  storageBucket: "estespark-83a46.firebasestorage.app",
  messagingSenderId: "1048795445089",
  appId: "1:1048795445089:web:3720c5f474a66df1883720"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;