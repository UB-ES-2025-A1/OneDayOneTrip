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
   * 🔹 Registro de usuario:
   * 1. Crea cuenta en Firebase
   * 2. Actualiza displayName
   * 3. Llama al backend /users/register con token
   */
  async register(fullname: string, username: string, mail: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, mail, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: fullname });


    // ⚠️ Usamos registerUser() que ya adjunta el token automáticamente
    await registerUser({ fullname, username, mail });

    return user;
  }

  /**
   * 🔹 Iniciar sesión con Firebase Auth
   */
  async login(mail: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, mail, password);
    return userCredential.user;
  }

  /**
   * 🔹 Cerrar sesión
   */
  async logout() {
    await signOut(auth);
  }

  /**
   * 🔹 Escucha cambios de sesión (login/logout)
   */
  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * 🔹 Devuelve el usuario actual (si hay sesión activa)
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
      throw new Error(error.message || "No s'ha pogut enviar l'enllaç de recuperació.");
    }
  }
}


export const Auth = new AuthService();
export { auth };
