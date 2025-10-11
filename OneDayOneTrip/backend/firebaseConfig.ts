import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyALNA2dn61Rm2lsLYTpI_xB04Qz2a1fxHY",
  authDomain: "onedayonecity-c82dd.firebaseapp.com",
  projectId: "onedayonecity-c82dd",
  storageBucket: "onedayonecity-c82dd.firebasestorage.app",
  messagingSenderId: "960538828647",
  appId: "1:960538828647:web:eb72e2ff1077a4bdee99c2",
  measurementId: "G-CW72XL931M"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
