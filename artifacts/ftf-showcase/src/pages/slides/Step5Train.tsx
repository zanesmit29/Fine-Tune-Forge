const base = import.meta.env.BASE_URL;

export default function Step5Train() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="relative z-10 h-full w-full px-[6vw] py-[6vh] grid grid-cols-12 gap-[3vw]">
        <div className="col-span-4 flex flex-col justify-between">
          <div>
            <div className="font-mono text-[1vw] uppercase tracking-[0.3em] text-accent">Step 05 / 05</div>
            <div className="mt-[1.2vh] text-[1.1vw] text-muted font-mono">Train</div>
          </div>
          <div>
            <h2 className="font-display font-bold text-[4vw] leading-[1.0] tracking-tight">Train. Then own it.</h2>
            <p className="mt-[3vh] text-[1.4vw] text-muted leading-relaxed">
              Live training logs stream from the server. When the run completes, the model and training script are yours to download.
            </p>
            <div className="mt-[4vh] space-y-[1.2vh] text-[1.05vw]">
              <div className="flex items-center justify-between border-b border-line pb-[1vh]"><span className="text-muted">Final train loss</span><span className="font-mono font-semibold">1.5045</span></div>
              <div className="flex items-center justify-between border-b border-line pb-[1vh]"><span className="text-muted">Final eval loss</span><span className="font-mono font-semibold">1.3457</span></div>
              <div className="flex items-center justify-between"><span className="text-muted">Accuracy</span><span className="font-mono font-semibold text-accent">70.00%</span></div>
            </div>
            <div className="mt-[3vh] flex flex-wrap gap-[0.8vw] text-[1vw]">
              <span className="px-[1vw] py-[0.6vh] rounded-full bg-primary/20 text-accent border border-primary/40 font-mono">.pkl</span>
              <span className="px-[1vw] py-[0.6vh] rounded-full bg-surface text-muted border border-line font-mono">.onnx</span>
              <span className="px-[1vw] py-[0.6vh] rounded-full bg-surface text-muted border border-line font-mono">.gguf</span>
            </div>
          </div>
          <div className="text-[0.95vw] text-muted font-mono">07 / 11</div>
        </div>
        <div className="col-span-8 flex items-center justify-center">
          <div className="relative w-full rounded-[1vw] overflow-hidden border border-line shadow-2xl" style={{ aspectRatio: "16 / 9" }}>
            <img src={`${base}screens/wizard-step4-train.jpg`} crossOrigin="anonymous" alt="Training results" className="w-full h-full object-cover object-top" />
          </div>
        </div>
      </div>
    </div>
  );
}
