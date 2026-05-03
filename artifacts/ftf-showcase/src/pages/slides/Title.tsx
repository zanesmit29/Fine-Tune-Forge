export default function Title() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute inset-0" style={{ background: "radial-gradient(900px 600px at 78% 28%, rgba(37,99,235,0.35), transparent 60%), radial-gradient(700px 500px at 12% 85%, rgba(96,165,250,0.18), transparent 65%)" }} />
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "6vh 6vh" }} />
      <div className="relative z-10 h-full w-full px-[8vw] py-[7vh] flex flex-col justify-between">
        <div className="flex items-center gap-[1.2vw]">
          <div className="w-[2.6vw] h-[2.6vw] rounded-[0.5vw] bg-primary flex items-center justify-center">
            <div className="w-[1.2vw] h-[1.2vw] rounded-[0.2vw] bg-text" />
          </div>
          <div className="font-display text-[1.6vw] font-bold tracking-tight">FineTuneForge</div>
        </div>
        <div className="max-w-[78%]">
          <div className="font-mono text-[1.1vw] uppercase tracking-[0.3em] text-accent mb-[3vh]">Product Walkthrough · v1</div>
          <h1 className="font-display font-bold text-[7vw] leading-[0.95] tracking-tighter max-w-[18ch]" style={{ textWrap: "balance" } as React.CSSProperties}>
            Fine-tune AI on your data.
          </h1>
          <p className="mt-[4vh] text-[1.7vw] text-muted max-w-[58vw] leading-snug">
            A guided tour of how teams go from a CSV to a downloadable, production-ready model — in five steps.
          </p>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-[1vw] text-muted font-mono">01 / 11</div>
          <div className="text-[1vw] text-muted">No cloud lock-in · No black boxes</div>
        </div>
      </div>
    </div>
  );
}
