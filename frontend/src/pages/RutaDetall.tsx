import { useParams } from "react-router-dom";
import Footer from "../components/Footer";
import "../styles/RutaDetalls.css";

export default function RutaDetall() {
  const { id } = useParams(); // obté l'ID de la ruta des de la URL

  return (
    <div className="ruta-detall-container">
      <header className="home-header">
        <h1 className="logo">OneDayOneTrip</h1>
      </header>
      <h1>Detalls de la ruta {id}</h1>
      <p>Aquí es mostraran totes les dades de la ruta seleccionada.</p>
      <Footer />
    </div>
  );
}
