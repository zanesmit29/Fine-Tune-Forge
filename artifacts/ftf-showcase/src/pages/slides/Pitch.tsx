const base = import.meta.env.BASE_URL;

export default function Pitch() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0b1220 0%, #111a2e 100%)" }} />
      <div className="relative z-10 h-full w-full px-[7vw] py-[7vh] grid grid-cols-12 gap-[3vw]">
        <div className="col-span-5 flex flex-col justify-center">
          <div className="font-mono text-[1vw] uppercase tracking-[0.3em] text-accent mb-[2vh]">02 — The Pitch</div>
          <h2 className="font-display font-bold text-[4.4vw] leading-[1.0] tracking-tight" style={{ textWrap: "balance" } as React.CSSProperties}>
            Built for teams that want to own their model.
          </h2>
          <p className="mt-[3vh] text-[1.5vw] text-muted leading-relaxed">
            FineTuneForge takes the friction out of fine-tuning. Pick a task, drop a CSV, and download a model you can run anywhere — in PKL, ONNX, or GGUF format.
          </p>
          <div className="mt-[5vh] grid grid-cols-2 gap-[2vh] text-[1.15vw]">
            <div className="flex items-center gap-[0.8vw]"><span className="text-accent font-bold">✓</span><span>No credit card</span></div>
            <div className="flex items-center gap-[0.8vw]"><span className="text-accent font-bold">✓</span><span>Data stays yours</span></div>
            <div className="flex items-center gap-[0.8vw]"><span className="text-accent font-bold">✓</span><span>10 base models</span></div>
            <div className="flex items-center gap-[0.8vw]"><span className="text-accent font-bold">✓</span><span>CPU or GPU</span></div>
          </div>
        </div>
        <div className="col-span-7 flex items-center justify-center">
          <div className="relative w-full rounded-[1vw] overflow-hidden border border-line shadow-2xl" style={{ aspectRatio: "16 / 9" }}>
            <img src={`${base}screens/landing.jpg`} crossOrigin="anonymous" alt="FineTuneForge landing page" className="w-full h-full object-cover object-top" />
          </div>
        </div>
      </div>
    </div>
  );
}
