// src/firebase/register.ts
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "./auth";
import { db } from "./firestore";

export type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
  username?: string;
};

export type RegisterResult =
  | { ok: true; uid: string; warning?: string }
  | { ok: false; code?: string; message: string };

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const { email, password, displayName, username } = input;

  try {
    // Crear usuario en Auth
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    // Actualizar displayName en Auth
    await updateProfile(user, { displayName });

    // Refrescar token para asegurar coherencia con las rules
    await user.reload();
    await user.getIdToken(true);

    // Datos del usuario para Firestore
    const userDoc: Record<string, any> = {
      uid: user.uid,
      email: user.email ?? null,
      displayName,
      role: "user",
      photoURL: user.photoURL ?? null,
      createdAt: serverTimestamp(),
    };
    if (username) userDoc.username = username;

    // Guardar en Firestore
    try {
      await setDoc(doc(db, "users", user.uid), userDoc);
      console.log("✅ Usuario guardado correctamente en Firestore");
      return { ok: true, uid: user.uid };
    } catch (err: any) {
      console.warn("⚠️ Error guardando perfil en Firestore:", err.code, err.message);
      return {
        ok: true,
        uid: user.uid,
        warning:
          "Cuenta creada, pero no se pudo guardar el perfil. Puedes completarlo más tarde.",
      };
    }
  } catch (err: any) {
    const map: Record<string, string> = {
      "auth/email-already-in-use": "Este correo ya está registrado.",
      "auth/invalid-email": "El correo electrónico no es válido.",
      "auth/weak-password": "La contraseña es demasiado débil.",
      "auth/operation-not-allowed": "Método de autenticación no habilitado.",
    };
    const code = err?.code ?? "unknown";
    console.error("❌ Error de registro:", code, err.message);
    return { ok: false, code, message: map[code] ?? "Error desconocido al registrar." };
  }
}
