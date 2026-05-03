const base = import.meta.env.BASE_URL;

export default function Step3Data() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="relative z-10 h-full w-full px-[6vw] py-[6vh] grid grid-cols-12 gap-[3vw]">
        <div className="col-span-4 flex flex-col justify-between">
          <div>
            <div className="font-mono text-[1vw] uppercase tracking-[0.3em] text-accent">Step 03 / 05</div>
            <div className="mt-[1.2vh] text-[1.1vw] text-muted font-mono">Data</div>
          </div>
          <div>
            <h2 className="font-display font-bold text-[4vw] leading-[1.0] tracking-tight">Bring your data.</h2>
            <p className="mt-[3vh] text-[1.4vw] text-muted leading-relaxed">
              Drop a CSV up to 50MB, or start from a built-in template. Columns are auto-detected and a 200-row preview is shown before you commit.
            </p>
            <div className="mt-[4vh] space-y-[1.4vh] text-[1.15vw]">
              <div className="flex items-baseline gap-[0.8vw]"><span className="text-accent">→</span><span>Customer Support Tickets template</span></div>
              <div className="flex items-baseline gap-[0.8vw]"><span className="text-accent">→</span><span>Topic Classifier template</span></div>
              <div className="flex items-baseline gap-[0.8vw]"><span className="text-accent">→</span><span>Or upload your own CSV</span></div>
            </div>
          </div>
          <div className="text-[0.95vw] text-muted font-mono">05 / 11</div>
        </div>
        <div className="col-span-8 flex items-center justify-center">
          <div className="relative w-full rounded-[1vw] overflow-hidden border border-line shadow-2xl" style={{ aspectRatio: "16 / 9" }}>
            <img src={`${base}screens/wizard-step2-data.jpg`} crossOrigin="anonymous" alt="Upload training data" className="w-full h-full object-cover object-top" />
          </div>
        </div>
      </div>
    </div>
  );
}
