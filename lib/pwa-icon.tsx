type PwaIconProps = {
  label: string;
  size: number;
};

export function PwaIcon({ label, size }: PwaIconProps) {
  const badgeSize = Math.round(size * 0.12);
  const fontSize = Math.round(size * 0.28);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fdf2f8",
      }}
    >
      <div
        style={{
          height: "76%",
          width: "76%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "28%",
          background: "#0f172a",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            width: badgeSize,
            height: badgeSize,
            borderRadius: 9999,
            background: "#fb7185",
            marginBottom: Math.round(size * 0.07),
          }}
        />
        <div
          style={{
            fontSize,
            fontWeight: 700,
            letterSpacing: 0,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
