import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2lqM-Sib19LdlyT0mNRQMW5jOAWQCO78",
  authDomain: "winemaker-65b77.firebaseapp.com",
  projectId: "winemaker-65b77",
  storageBucket: "winemaker-65b77.appspot.com",
  messagingSenderId: "1021331332576",
  appId: "1:1021331332576:web:b0ccde715f406c55d75f85"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db, doc, setDoc, getDoc, deleteDoc, collection, getDocs }; // Ensure deleteDoc and collection are included here