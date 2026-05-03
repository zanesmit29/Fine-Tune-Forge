type Stat = { label: string; value: string; sub: string; dark?: boolean };

const stats: Stat[] = [
  { label: "Top Accuracy", value: "99.1%", sub: "DistilBERT, fine-tuned" },
  { label: "Models in Registry", value: "4", sub: "Top two at 99.1% / 99.0%" },
  { label: "Total Training Jobs", value: "13", sub: "4 completed · 1 running · 8 failed", dark: true },
];

export default function Slide07Results() {
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
        <div style={{ fontSize: "1.2vw", fontWeight: 400, color: "#999999" }}>Module 5 — Results</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginTop: "2vh", flex: 1 }}>
        <h2 style={{ fontSize: "4.5vw", fontWeight: 200, letterSpacing: "-0.04em", margin: "0 0 1vh 0", lineHeight: 1.1 }}>
          Training <span style={{ color: "#007AFF" }}>Results</span>
        </h2>
        <p style={{ fontSize: "1.6vw", fontWeight: 300, color: "#666666", maxWidth: "65vw", marginBottom: "5vh", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
          Captured live from the My Models registry and the Job History view.
        </p>

        <div style={{ display: "flex", gap: "3vw", width: "100%", height: "40vh" }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                backgroundColor: s.dark ? "#000000" : "#F5F5F7",
                borderRadius: "1.5vw",
                padding: "3.5vw",
              }}
            >
              <div style={{ fontSize: "1.4vw", fontWeight: 500, color: s.dark ? "#999999" : "#666666", marginBottom: "1vh" }}>
                {s.label}
              </div>
              <div style={{ fontSize: "6vw", fontWeight: 200, letterSpacing: "-0.04em", color: s.dark ? "#FFFFFF" : "#000000", lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: "1.1vw", fontWeight: 400, color: s.dark ? "#FFFFFF" : "#007AFF", opacity: s.dark ? 0.85 : 1, marginTop: "1.5vh" }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: "1vw", fontWeight: 400, color: "#999999", letterSpacing: "0.02em" }}>FineTuneForge / Internal QA Report — Confidential</div>
        <div style={{ fontSize: "1vw", fontWeight: 400, color: "#999999" }}>07</div>
      </div>
    </div>
  );
}
