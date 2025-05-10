// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1qLhzfxQ17NtyU7Kre5c6GA3ra5TBFiU",
  authDomain: "maco-hk.firebaseapp.com",
  projectId: "maco-hk",
  storageBucket: "maco-hk.firebasestorage.app",
  messagingSenderId: "60896278736",
  appId: "1:60896278736:web:fe5c951f4ed0a916a0c6d5",
  measurementId: "G-GE2HCNNBBD"
};

// Initialize Firebase
try {
  // Check if Firebase SDK is loaded
  if (typeof firebase !== 'undefined') {
    // Initialize only if not already initialized
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    console.log("Firebase initialized successfully");
    
    // Define global variables for Firebase services - with proper error handling
    try {
      window.fbAuth = firebase.auth && firebase.auth();
    } catch (e) {
      console.warn("Firebase Auth not available:", e);
      window.fbAuth = null;
    }
    
    try {
      window.fbDb = firebase.firestore && firebase.firestore();
    } catch (e) {
      console.warn("Firebase Firestore not available:", e);
      window.fbDb = null;
    }
    
    try {
      // Only use storage if the function exists
      window.fbStorage = typeof firebase.storage === 'function' ? firebase.storage() : null;
    } catch (e) {
      console.warn("Firebase Storage not available:", e);
      window.fbStorage = null;
    }
    
    if (firebaseConfig.apiKey.includes("Dummy")) {
      console.warn("⚠️ Using placeholder Firebase configuration. Replace with actual values.");
    }
  } else {
    throw new Error("Firebase SDK not loaded");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  // Provide fallback references to prevent errors
  window.fbAuth = null;
  window.fbDb = null;
  window.fbStorage = null;
}
