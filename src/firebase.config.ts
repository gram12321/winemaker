// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgsTB9gyTRz8EQVFGimFkoFfnJkP8pJOc",
  authDomain: "winemaker03.firebaseapp.com",
  projectId: "winemaker03",
  storageBucket: "winemaker03.firebasestorage.app",
  messagingSenderId: "4963250918",
  appId: "1:4963250918:web:e39a42d3619f06aa7bc127"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);

export { app, db, auth, functions };
export default app; 