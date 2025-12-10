export default function AvatarFallback({
  name,
  size = 35, // Tamaño por defecto para el header
}: {
  name: string;
  size?: number;
}) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundColor: "#d3d4d5ba",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: `${size * 0.45}px`, // Tamaño de letra proporcional
        fontWeight: "bold",
        border: "1px solid white", // borde más fino para header
        lineHeight: 1,
      }}
    >
      {initial}
    </div>
  );
}
