import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqra1rbF_TNLpMDtO5D4CNYF1QBRkz7WM",
  authDomain: "dashboard-emplacar.firebaseapp.com",
  projectId: "dashboard-emplacar",
  storageBucket: "dashboard-emplacar.firebasestorage.app",
  messagingSenderId: "1070836541264",
  appId: "1:1070836541264:web:39e305fb77c0927a3cee55",
  measurementId: "G-QFEEJHJQMQ"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);