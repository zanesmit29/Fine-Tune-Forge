const base = import.meta.env.BASE_URL;

export default function Step4Config() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="relative z-10 h-full w-full px-[6vw] py-[6vh] grid grid-cols-12 gap-[3vw]">
        <div className="col-span-8 flex items-center justify-center">
          <div className="relative w-full rounded-[1vw] overflow-hidden border border-line shadow-2xl" style={{ aspectRatio: "16 / 9" }}>
            <img src={`${base}screens/wizard-step3-config.jpg`} crossOrigin="anonymous" alt="Configure hyperparameters" className="w-full h-full object-cover object-top" />
          </div>
        </div>
        <div className="col-span-4 flex flex-col justify-between">
          <div>
            <div className="font-mono text-[1vw] uppercase tracking-[0.3em] text-accent">Step 04 / 05</div>
            <div className="mt-[1.2vh] text-[1.1vw] text-muted font-mono">Config</div>
          </div>
          <div>
            <h2 className="font-display font-bold text-[4vw] leading-[1.0] tracking-tight">Tune the dials.</h2>
            <p className="mt-[3vh] text-[1.4vw] text-muted leading-relaxed">
              Safe defaults for everything. Override compute, epochs, learning rate, LoRA rank, and sequence length when you know what you want.
            </p>
            <div className="mt-[4vh] grid grid-cols-2 gap-[1.5vh] text-[1.05vw]">
              <div className="rounded-[0.5vw] border border-line bg-surface px-[1vw] py-[1.2vh]"><div className="text-muted text-[0.85vw] uppercase tracking-wider">Compute</div><div className="font-semibold mt-[0.4vh]">CPU or GPU</div></div>
              <div className="rounded-[0.5vw] border border-line bg-surface px-[1vw] py-[1.2vh]"><div className="text-muted text-[0.85vw] uppercase tracking-wider">Epochs</div><div className="font-semibold mt-[0.4vh]">1 — 10</div></div>
              <div className="rounded-[0.5vw] border border-line bg-surface px-[1vw] py-[1.2vh]"><div className="text-muted text-[0.85vw] uppercase tracking-wider">Learn rate</div><div className="font-semibold mt-[0.4vh] font-mono">2e-4</div></div>
              <div className="rounded-[0.5vw] border border-line bg-surface px-[1vw] py-[1.2vh]"><div className="text-muted text-[0.85vw] uppercase tracking-wider">LoRA rank</div><div className="font-semibold mt-[0.4vh] font-mono">8 / 16 / 32</div></div>
            </div>
          </div>
          <div className="text-[0.95vw] text-muted font-mono">06 / 11</div>
        </div>
      </div>
    </div>
  );
}
