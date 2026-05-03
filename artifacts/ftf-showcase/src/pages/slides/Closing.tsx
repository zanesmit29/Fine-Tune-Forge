export default function Closing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute inset-0" style={{ background: "radial-gradient(800px 600px at 25% 75%, rgba(37,99,235,0.30), transparent 60%), radial-gradient(700px 500px at 85% 20%, rgba(96,165,250,0.18), transparent 65%)" }} />
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "6vh 6vh" }} />
      <div className="relative z-10 h-full w-full px-[8vw] py-[8vh] flex flex-col justify-between">
        <div className="flex items-center gap-[1.2vw]">
          <div className="w-[2.6vw] h-[2.6vw] rounded-[0.5vw] bg-primary flex items-center justify-center">
            <div className="w-[1.2vw] h-[1.2vw] rounded-[0.2vw] bg-text" />
          </div>
          <div className="font-display text-[1.6vw] font-bold tracking-tight">FineTuneForge</div>
        </div>
        <div className="max-w-[80%]">
          <div className="font-mono text-[1.1vw] uppercase tracking-[0.3em] text-accent mb-[3vh]">Fin.</div>
          <h1 className="font-display font-bold text-[7.5vw] leading-[0.95] tracking-tighter max-w-[14ch]" style={{ textWrap: "balance" } as React.CSSProperties}>
            Own your model completely.
          </h1>
          <p className="mt-[4vh] text-[1.6vw] text-muted max-w-[55vw] leading-snug">
            Five steps. Your data. Your weights. No lock-in.
          </p>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-[1vw] text-muted font-mono">11 / 11</div>
          <div className="grid grid-cols-3 gap-[2vw] text-[1vw]">
            <div><div className="text-muted uppercase tracking-wider text-[0.85vw]">Models</div><div className="font-mono mt-[0.4vh]">10 base</div></div>
            <div><div className="text-muted uppercase tracking-wider text-[0.85vw]">Exports</div><div className="font-mono mt-[0.4vh]">PKL · ONNX · GGUF</div></div>
            <div><div className="text-muted uppercase tracking-wider text-[0.85vw]">Compute</div><div className="font-mono mt-[0.4vh]">CPU or GPU</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
