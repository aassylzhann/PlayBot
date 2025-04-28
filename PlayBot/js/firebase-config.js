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
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Export for use in other files
window.fbAuth = auth;
window.fbDb = db;
