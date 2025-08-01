// Firebase Bundle - CDN version for browser compatibility
// This avoids ES6 module import issues in production

// Initialize Firebase with CDN imports
const firebaseConfig = {
  apiKey: "AIzaSyCfCRvUPmCEXhXleJG0nHM3BXQpSEowjq8",
  authDomain: "estespark-83a46.firebaseapp.com",
  projectId: "estespark-83a46",
  storageBucket: "estespark-83a46.firebasestorage.app",
  messagingSenderId: "1048795445089",
  appId: "1:1048795445089:web:3720c5f474a66df1883720"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Configure Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Export to global scope for other scripts
window.firebaseAuth = auth;
window.firebaseDb = db;
window.googleProvider = googleProvider;

console.log('Firebase initialized successfully with CDN version');