export default function Slide01Title() {
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
        padding: "6vh 6vw",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: "1.2vw", fontWeight: 400, letterSpacing: "-0.01em", color: "#666666" }}>
          finetuneforge.app <span style={{ color: "#999999" }}>(QA Engineering)</span>
        </div>
        <div style={{ fontSize: "1.2vw", fontWeight: 400, color: "#999999" }}>May 3, 2026</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: "-5vh" }}>
        <div style={{ fontSize: "1vw", fontWeight: 600, color: "#007AFF", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "3vh" }}>
          End-to-End Test Pass
        </div>
        <h1 style={{ fontSize: "8vw", fontWeight: 200, letterSpacing: "-0.04em", margin: 0, lineHeight: 1.05 }}>
          FineTuneForge <span style={{ color: "#007AFF" }}>Report</span>
        </h1>
        <p style={{ fontSize: "1.8vw", fontWeight: 300, color: "#666666", maxWidth: "60vw", marginTop: "4vh", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
          A full walkthrough of every primary user flow, captured live from the running application.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ fontSize: "1vw", fontWeight: 400, color: "#999999", letterSpacing: "0.02em" }}>
          FineTuneForge / Internal QA Report — Confidential
        </div>
      </div>
    </div>
  );
}
