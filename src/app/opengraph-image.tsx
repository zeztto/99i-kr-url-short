import { ImageResponse } from "next/og";

export const alt = "99i.kr URL shortener pricing plans including Enterprise";
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
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#f7f8f4",
          backgroundImage:
            "linear-gradient(90deg, rgba(23,33,28,0.06) 1px, transparent 1px), linear-gradient(180deg, rgba(23,33,28,0.06) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          color: "#17211c",
          padding: "64px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              width: "72px",
              height: "58px",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #aebfaf",
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              color: "#2f6f5e",
              fontSize: "24px",
              fontWeight: 900,
            }}
          >
            99i
          </div>
          <div style={{ fontSize: "30px", fontWeight: 900 }}>99i.kr</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              maxWidth: "900px",
              fontSize: "96px",
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            짧은 링크로 마케팅 운영
          </div>
          <div
            style={{
              marginTop: "28px",
              maxWidth: "850px",
              color: "#526258",
              fontSize: "34px",
              lineHeight: 1.35,
            }}
          >
            추천인 링크, 전환율 측정, Enterprise 맞춤 플랜
          </div>
        </div>

        <div style={{ display: "flex", gap: "14px" }}>
          {[
            ["Basic", "10 links"],
            ["Pro", "100K/link"],
            ["Max", "1M/link"],
            ["Enterprise", "Custom"],
          ].map(([name, limit]) => (
            <div
              key={name}
              style={{
                display: "flex",
                flexDirection: "column",
                width: name === "Enterprise" ? "250px" : "190px",
                border: "1px solid #dce4dc",
                borderRadius: "8px",
                backgroundColor: name === "Pro" ? "#17211c" : "#ffffff",
                color: name === "Pro" ? "#f7f8f4" : "#17211c",
                padding: "18px",
              }}
            >
              <span style={{ fontSize: "24px", fontWeight: 900 }}>{name}</span>
              <span
                style={{
                  marginTop: "8px",
                  color: name === "Pro" ? "#dce9df" : "#526258",
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                {limit}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
