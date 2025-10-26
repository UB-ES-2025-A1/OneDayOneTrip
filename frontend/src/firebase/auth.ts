import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { app } from "./config";
import { apiPost } from "../api/client";

const auth = getAuth(app);

class AuthService {
  async register(fullname: string, username: string, mail: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, mail, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: fullname });

    await apiPost("/users/register", { fullname, username, mail });

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
