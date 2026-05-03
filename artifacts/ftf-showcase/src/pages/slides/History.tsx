const base = import.meta.env.BASE_URL;

export default function History() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="relative z-10 h-full w-full px-[6vw] py-[6vh] flex flex-col">
        <div className="flex items-end justify-between mb-[4vh]">
          <div>
            <div className="font-mono text-[1vw] uppercase tracking-[0.3em] text-accent mb-[1vh]">Observability</div>
            <h2 className="font-display font-bold text-[4.4vw] leading-[1.0] tracking-tight">Every run, accounted for.</h2>
          </div>
          <div className="text-[1.2vw] text-muted max-w-[28vw] text-right">
            Click any run to replay its logs, metrics, and the exact training script that produced it.
          </div>
        </div>
        <div className="grid grid-cols-4 gap-[1.5vw] mb-[3vh]">
          <div className="rounded-[0.6vw] border border-line bg-surface px-[1.4vw] py-[2vh]">
            <div className="text-muted text-[0.9vw] uppercase tracking-wider">Total</div>
            <div className="font-display font-bold text-[3.2vw] leading-none mt-[1vh]">14</div>
          </div>
          <div className="rounded-[0.6vw] border border-line bg-surface px-[1.4vw] py-[2vh]">
            <div className="text-muted text-[0.9vw] uppercase tracking-wider">Completed</div>
            <div className="font-display font-bold text-[3.2vw] leading-none mt-[1vh] text-accent">5</div>
          </div>
          <div className="rounded-[0.6vw] border border-line bg-surface px-[1.4vw] py-[2vh]">
            <div className="text-muted text-[0.9vw] uppercase tracking-wider">Running</div>
            <div className="font-display font-bold text-[3.2vw] leading-none mt-[1vh]">1</div>
          </div>
          <div className="rounded-[0.6vw] border border-line bg-surface px-[1.4vw] py-[2vh]">
            <div className="text-muted text-[0.9vw] uppercase tracking-wider">Failed</div>
            <div className="font-display font-bold text-[3.2vw] leading-none mt-[1vh] text-[#f87171]">8</div>
          </div>
        </div>
        <div className="flex-1 relative w-full rounded-[1vw] overflow-hidden border border-line shadow-2xl">
          <img src={`${base}screens/history.jpg`} crossOrigin="anonymous" alt="Training history" className="w-full h-full object-cover object-top" />
        </div>
        <div className="mt-[2vh] text-[0.95vw] text-muted font-mono">09 / 11</div>
      </div>
    </div>
  );
}
