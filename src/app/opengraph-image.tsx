import { ImageResponse } from "next/og";

export const alt = "99i.kr Open Graph image";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#020617",
          color: "#f8fafc",
          fontSize: 220,
          fontWeight: 800,
          letterSpacing: "-0.08em",
        }}
      >
        99i.kr
      </div>
    ),
    size
  );
}
