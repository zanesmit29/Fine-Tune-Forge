export default function Slide08Verdict() {
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
        <div style={{ fontSize: "1.2vw", fontWeight: 400, color: "#999999" }}>Verdict</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", flex: 1, marginTop: "-5vh" }}>
        <div style={{ fontSize: "1vw", fontWeight: 600, color: "#007AFF", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "3vh" }}>
          All Primary Flows Pass
        </div>
        <h2 style={{ fontSize: "6vw", fontWeight: 200, letterSpacing: "-0.04em", margin: "0 0 2vh 0", lineHeight: 1.1 }}>
          Ready for <span style={{ color: "#007AFF" }}>production</span>.
        </h2>
        <p style={{ fontSize: "1.8vw", fontWeight: 300, color: "#666666", maxWidth: "55vw", marginBottom: "6vh", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
          Modal-backed GPU training is wired end to end, the wizard guards against missing credentials, and the documentation guides new users through their first run.
        </p>

        <div style={{ display: "flex", gap: "4vw", fontSize: "1.2vw", color: "#666666" }}>
          <div>Landing · Wizard · Integrations · Docs · Models</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: "1vw", fontWeight: 400, color: "#999999", letterSpacing: "0.02em" }}>FineTuneForge / Internal QA Report — Confidential</div>
        <div style={{ fontSize: "1vw", fontWeight: 400, color: "#999999" }}>08</div>
      </div>
    </div>
  );
}
