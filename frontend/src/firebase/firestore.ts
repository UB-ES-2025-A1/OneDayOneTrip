// src/firebase/firestore.ts
import { getFirestore } from "firebase/firestore";
import { app } from "./config";

export const db = getFirestore(app);

 // importar-lo amb import { db } from "../firebase/firestore";