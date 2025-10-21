// src/firebase/auth.ts
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { app } from "./config";
import { db } from "./firestore";

const auth = getAuth(app);

class AuthService {

    async register(
    fullname: string,
    username: string,
    mail: string,
    password: string
  ) {
    
    const userCredential = await createUserWithEmailAndPassword(auth, mail, password); 
    const user = userCredential.user;

    await updateProfile(user, { displayName: fullname });

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      fullname,
      username,
      mail,
      role: "user",
      createdAt: serverTimestamp(),
    });

    return user;
  }

  async login(mail: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, mail, password);
    return userCredential.user;
  }

  async logout() {
    await signOut(auth);
  }

  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }
}

export const Auth = new AuthService();
export { auth };
