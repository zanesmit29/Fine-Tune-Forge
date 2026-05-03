type Item = { glyph: string; title: string; desc: string };

const items: Item[] = [
  { glyph: "◉", title: "Landing & Hero", desc: "Marketing surface, value prop, and wizard preview." },
  { glyph: "◆", title: "Training Wizard", desc: "All six task types, including the new LM Studio path." },
  { glyph: "▸", title: "Modal Integration", desc: "Connection, credential masking, and GPU validation." },
  { glyph: "◎", title: "In-App Documentation", desc: "Get Started page with the new GPU training guide." },
  { glyph: "✦", title: "Models & History", desc: "My Models registry and the full job history view." },
];

export default function Slide02Scope() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        fontFamily: "'Inter', sans-serif",
        color: "#1D1D1F",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        padding: "6vh 6vw",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: "1.2vw", fontWeight: 400, letterSpacing: "-0.01em", color: "#666666" }}>
          finetuneforge.app <span style={{ color: "#999999" }}>(QA Engineering)</span>
        </div>
        <div style={{ fontSize: "1.2vw", fontWeight: 400, color: "#999999" }}>Test Scope</div>
      </div>

      <div style={{ marginLeft: "26vw", marginTop: "10vh", marginBottom: "5vh", color: "#007AFF", fontSize: "1vw", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        What We Tested
      </div>

      <div style={{ marginLeft: "26vw", display: "flex", flexDirection: "column", gap: "4.5vh" }}>
        {items.map((item) => (
          <div key={item.title} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ color: "#007AFF", fontSize: "1.2vw", width: "3vw" }}>{item.glyph}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "2vw" }}>
              <span style={{ fontSize: "1.6vw", fontWeight: 600, letterSpacing: "-0.02em" }}>{item.title}</span>
              <span style={{ fontSize: "1.4vw", fontWeight: 400, color: "#86868B", letterSpacing: "-0.01em" }}>{item.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: "6vh", left: "6vw", right: "6vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#1D1D1F" }}>02</div>
        <div style={{ fontSize: "0.9vw", fontWeight: 400, color: "#86868B", letterSpacing: "0.02em" }}>FineTuneForge / Internal QA Report — Confidential</div>
        <div style={{ width: "1vw" }} />
      </div>
    </div>
  );
}
