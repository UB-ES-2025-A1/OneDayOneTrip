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
import { registerUser } from "../api/client";
import { sendPasswordResetEmail } from "firebase/auth";

const auth = getAuth(app);

class AuthService {
  /**
   * Registre d'usuari:
   * 1. Crear compte a Firebase
   * 2. Actualitza displayName
   * 3. Crida al backend /users/register amb token
   */
  async register(
    fullname: string,
    username: string,
    mail: string,
    password: string,
    isPrivate: boolean = false   // 🔐 nou paràmetre amb valor per defecte
  ) {
    const userCredential = await createUserWithEmailAndPassword(auth, mail, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: fullname });

    await registerUser({ fullname, username, mail, isPrivate });

    localStorage.setItem("uid", user.uid);

    return user;
  }

  /**
   * Iniciar sessió amb Firebase Auth
   */
  async login(mail: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, mail, password);
    const user = userCredential.user;
    localStorage.setItem("uid", user.uid);

    return user;
  }

  /**
   * Tancar sessió
   */
  async logout() {
    await signOut(auth);
  }

  /**
   * Escolta canvis de sessió (login/logout)
   */
  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Retorna l'usuari actual (si hi ha sessió activa)
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  async resetPassword(email: string) {
    if (!email) throw new Error("El email és obligatori");

    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error: any) {
      console.error("Error al enviar correu de reset:", error);
      throw new Error(
        error.message || "No s'ha pogut enviar l'enllaç de recuperació."
      );
    }
  }
}

export const Auth = new AuthService();
export { auth };

//Per cridar al endpoint de elminar compte, per poder obtenir el verify token s'ha d'utilitzar el següent:
//firebase.auth().currentUser.getIdToken(/* forceRefresh */ true), si no funciona probar el següent:
//const tokenDelClient = await user.getIdToken(true);
