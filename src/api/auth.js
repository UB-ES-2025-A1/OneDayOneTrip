import { auth, db } from "../firebase-config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function registerUser({ email, password, username, fullname }) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    await setDoc(doc(db, "users", uid), {
      uid,
      username,
      fullname,
      email,
      role: "user",
      createdAt: serverTimestamp(),
    });

    return { success: true, uid };
  } catch (error) {
    console.error("Error registrando usuario:", error);
    return { success: false, error: error.message };
  }
}
