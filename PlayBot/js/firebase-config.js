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
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
  
  // Define global variables for Firebase services
  window.fbAuth = firebase.auth();
  window.fbDb = firebase.firestore();
  window.fbStorage = firebase.storage();
  
  if (firebaseConfig.apiKey.includes("Dummy")) {
    console.warn("⚠️ Using placeholder Firebase configuration. Replace with actual values.");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  // Provide fallback references to prevent errors
  window.fbAuth = { signInWithEmailAndPassword: () => Promise.reject(new Error("Firebase not initialized")) };
  window.fbDb = { collection: () => ({ get: () => Promise.reject(new Error("Firebase not initialized")) }) };
  window.fbStorage = {};
}
