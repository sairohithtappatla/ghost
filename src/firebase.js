// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA05Y5evFSzjM_Pa_dpbkGCeWBlfRMFq7A",
  authDomain: "ghostchat-45.firebaseapp.com",
  databaseURL: "https://ghostchat-45-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ghostchat-45",
  storageBucket: "ghostchat-45.firebasestorage.app",
  messagingSenderId: "633116323755",
  appId: "1:633116323755:web:e009531860e78f449facee",
  measurementId: "G-5VKG92CZ7T"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const rtdb = getDatabase(app);
const auth = getAuth(app);

// Automatically login user anonymously
signInAnonymously(auth);

export { db, rtdb, auth };
