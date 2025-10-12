import { auth } from "../firebase/auth";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Bienvenido al Dashboard </h2>
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  );
}
