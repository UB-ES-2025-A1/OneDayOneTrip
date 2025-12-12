import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import "../styles/Footer.css";

interface FooterProps {
  children?: ReactNode;
}

export default function Footer({ children }: FooterProps) {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-grid">
        {/* Marca */}
        <div>
          <h2>OneDayOneTrip</h2>
          <p>
            &copy; {new Date().getFullYear()} OneDayOneTrip. All rights reserved.
          </p>
          {children}
        </div>

        {/* Contacto */}
        <div>
          <h2>{t("footer_contact")}</h2>
          <p>
            <a href="mailto:onedayonetripes6@gmail.com">
              onedayonetripes6@gmail.com
            </a>
          </p>
          <p>
            <a href="tel:+34601320227">
              +34 601 320 227
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
