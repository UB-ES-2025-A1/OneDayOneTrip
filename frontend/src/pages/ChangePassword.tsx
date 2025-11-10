import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "../firebase";
import "../styles/Home.css";
import "../styles/LoginReg.css";
import Footer from "../components/Footer";
import { UserCircle } from "lucide-react";

export default function ChangePassword() {
  const user = auth.currentUser;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user || !user.email) {
      setError("No hay usuario autenticado.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccess("Contraseña actualizada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      setError("Error al cambiar la contraseña. Verifica tu contraseña actual.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <header className="home-header">
        <h1 className="logo">OneDayOneTrip</h1>
      </header>

      <main className="change-password-container">
        <h2>Canviar contrasenya</h2>
        <p>Per seguretat, introdueix la teva contrasenya actual i la nova </p>

        <form onSubmit={handleChangePassword} className="change-password-form">
          <label>
            Contrasenya actual
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>

          <label>
            Nova contrasenya
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>

          <label>
            Confirmar nova contrasenya
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="header-btn" disabled={loading}>
            {loading ? "Actualizando..." : "Cambiar contraseña"}
          </button>

          {error && <p className="error-text">{error}</p>}
          {success && <p className="success-text">{success}</p>}
        </form>
      </main>

      <Footer />
    </div>
  );
}
