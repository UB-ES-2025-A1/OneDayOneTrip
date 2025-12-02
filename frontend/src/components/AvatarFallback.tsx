export default function AvatarFallback({ name }: { name: string }) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div
      style={{
        width: "160px",
        height: "160px",
        borderRadius: "50%",
        backgroundColor: "#d3d4d5ba",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "48px",
        fontWeight: "bold",
        border: "3px solid white",
      }}
    >
      {initial}
    </div>
  );
}
