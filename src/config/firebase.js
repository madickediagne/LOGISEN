// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApmi-q1byA2uZM5hbrSHij1-onHiIN0xE",
  authDomain: "logisen-dc7fe.firebaseapp.com",
  projectId: "logisen-dc7fe",
  storageBucket: "logisen-dc7fe.firebasestorage.app",
  messagingSenderId: "276883422960",
  appId: "1:276883422960:web:96f1c8e2528a1308790c35",
  measurementId: "G-9KQ48EQVGY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
