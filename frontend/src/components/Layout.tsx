import Header from "./Header";
import Footer from "./Footer";
import { type User } from "firebase/auth";
import "../styles/Layout.css";

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
  onLogout: () => void;
  onLogin: () => void;
  onRegister: () => void;
  variant?: "home" | "ruta" | "perfil";
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function Layout({
  children,
  currentUser,
  onLogout,
  onLogin,
  onRegister,
  variant = "home",
  showBackButton,
  onBack,
}: LayoutProps) {
  return (
    <div className={`layout ${variant}`}>
      <Header
        currentUser={currentUser}
        onLogout={onLogout}
        onLogin={onLogin}
        onRegister={onRegister}
        showBackButton={showBackButton}
        onBack={onBack}
        variant={variant}
      />
      <main className="layout-content">{children}</main>
      <Footer />
    </div>
  );
}
