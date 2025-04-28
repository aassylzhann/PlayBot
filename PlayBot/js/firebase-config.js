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
if (typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
    
    // Global Firebase shortcuts
    const fbAuth = firebase.auth();
    const fbDb = firebase.firestore();
    
    // Display a message if not configured with real values
    if (firebaseConfig.apiKey.includes("Dummy")) {
      console.warn("⚠️ Using placeholder Firebase configuration. Replace with actual values.");
    }
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  console.error("Firebase SDK not loaded");
}
