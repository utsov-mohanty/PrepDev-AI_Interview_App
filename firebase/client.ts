import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcGl1eE3axvXDC2-ARXWaW5dSfyjL6K6M",
  authDomain: "prepdev-ab7ba.firebaseapp.com",
  projectId: "prepdev-ab7ba",
  storageBucket: "prepdev-ab7ba.firebasestorage.app",
  messagingSenderId: "849387728307",
  appId: "1:849387728307:web:4b2af2c47b25fb2e07efc6",
  measurementId: "G-NWKYXQ1KKM"
};

const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);