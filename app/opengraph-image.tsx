import { ImageResponse } from "next/og";
import { personal } from "@/config/portfolio";

export const alt = `${personal.name} — ${personal.roles.join(" · ")}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generated OG card — no binary asset to forget in /public.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0C0B09 0%, #16130F 60%, #1E1508 100%)",
          color: "#F8F3EA",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #F5A623, #2DC7B0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {personal.initials}
          </div>
          <div style={{ fontSize: 28, color: "#C9BEAC" }}>{personal.name}</div>
        </div>

        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2 }}>
          I build AI products —
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -2,
            color: "#F5A623",
            marginBottom: 40,
          }}
        >
          from model to market.
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 24, color: "#9A8F7C" }}>
          <span style={{ color: "#2DC7B0" }}>{personal.roles.join(" · ")}</span>
          <span>·</span>
          <span>Agentic AI · RAG · LLM Systems</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
