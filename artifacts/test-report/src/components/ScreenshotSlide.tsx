import type { ReactNode } from "react";

export interface ScreenshotSlideProps {
  pageNumber: string;
  eyebrow: string;
  title: ReactNode;
  caption: string;
  imageSrc: string;
  imageAlt: string;
}

export function ScreenshotSlide({ pageNumber, eyebrow, title, caption, imageSrc, imageAlt }: ScreenshotSlideProps) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        fontFamily: "'Inter', sans-serif",
        color: "#000000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "5vh 6vw",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: "1.2vw", fontWeight: 400, letterSpacing: "-0.01em", color: "#666666" }}>
          finetuneforge.app <span style={{ color: "#999999" }}>(QA Engineering)</span>
        </div>
        <div style={{ fontSize: "1.2vw", fontWeight: 400, color: "#999999" }}>{eyebrow}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, marginTop: "2vh" }}>
        <h2 style={{ fontSize: "3.6vw", fontWeight: 200, letterSpacing: "-0.04em", margin: 0, lineHeight: 1.1 }}>{title}</h2>
        <p style={{ fontSize: "1.3vw", fontWeight: 300, color: "#666666", maxWidth: "70vw", marginTop: "1.5vh", marginBottom: "2.5vh", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
          {caption}
        </p>

        <div
          style={{
            flex: 1,
            backgroundColor: "#F5F5F7",
            borderRadius: "1.2vw",
            padding: "1.5vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "0.6vw",
              boxShadow: "0 1vh 3vh rgba(0, 0, 0, 0.08)",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "2vh" }}>
        <div style={{ fontSize: "1vw", fontWeight: 400, color: "#999999", letterSpacing: "0.02em" }}>FineTuneForge / Internal QA Report — Confidential</div>
        <div style={{ fontSize: "1vw", fontWeight: 400, color: "#999999" }}>{pageNumber}</div>
      </div>
    </div>
  );
}
