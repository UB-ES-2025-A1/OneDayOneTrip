import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ICONA OFICIAL LEAFLET UTILITZANT CDN
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapSelectorProps {
  lat: number | null;
  lng: number | null;
  onSelect: (lat: number, lng: number) => void;
}

export default function MapSelector({ lat, lng, onSelect }: MapSelectorProps) {
  const [internalLat, setInternalLat] = useState(lat ?? 41.3851);
  const [internalLng, setInternalLng] = useState(lng ?? 2.1734);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (lat != null && lng != null) {
      setInternalLat(lat);
      setInternalLng(lng);
    }
  }, [lat, lng]);

  // Detectar clics al mapa
  function MapClickHandler() {
    useMapEvents({
      click(e) {
        setInternalLat(e.latlng.lat);
        setInternalLng(e.latlng.lng);
        onSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  // Moure el mapa quan canviïn les coords
  function ChangeView({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    map.setView([lat, lng], 14);
    return null;
  }

  // Buscar ubicació
  const runSearch = async () => {
    if (!query.trim()) return;

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=1`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.length > 0) {
        const { lat: newLat, lon: newLng } = data[0];
        const latNum = parseFloat(newLat);
        const lngNum = parseFloat(newLng);

        setInternalLat(latNum);
        setInternalLng(lngNum);
        onSelect(latNum, lngNum);
      } else {
        alert("No s'ha trobat cap ubicació.");
      }
    } catch (err) {
      console.error("Error cercant ubicació:", err);
      alert("Hi ha hagut un problema cercant la ubicació.");
    }
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Barra de búsqueda sin <form> */}
      <div style={{ marginBottom: "8px", display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="Escriu una adreça o lloc"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              runSearch();
            }
          }}
          style={{
            flex: 1,
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            runSearch();
          }}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            cursor: "pointer",
            background: "white",
          }}
        >
          Cercar
        </button>
      </div>

      <MapContainer
        center={[internalLat, internalLng]}
        zoom={13}
        style={{ width: "100%", height: "250px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <ChangeView lat={internalLat} lng={internalLng} />
        <MapClickHandler />

        <Marker position={[internalLat, internalLng]} icon={markerIcon} />
      </MapContainer>
    </div>
  );
}
