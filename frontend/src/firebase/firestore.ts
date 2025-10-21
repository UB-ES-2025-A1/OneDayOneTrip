// src/firebase/firestore.ts
import { getFirestore } from "firebase/firestore";
import { app } from "./config";

export const db = getFirestore(app);

 // importarlo con import { db } from "../firebase/firestore";