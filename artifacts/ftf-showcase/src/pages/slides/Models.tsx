const base = import.meta.env.BASE_URL;

export default function Models() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="relative z-10 h-full w-full px-[6vw] py-[6vh] flex flex-col">
        <div className="flex items-end justify-between mb-[4vh]">
          <div>
            <div className="font-mono text-[1vw] uppercase tracking-[0.3em] text-accent mb-[1vh]">After training</div>
            <h2 className="font-display font-bold text-[4.4vw] leading-[1.0] tracking-tight">Every trained model, in one place.</h2>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-[5vw] leading-none text-accent">5</div>
            <div className="text-[1vw] text-muted uppercase tracking-wider mt-[0.5vh]">models trained</div>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-12 gap-[3vw]">
          <div className="col-span-8">
            <div className="relative w-full rounded-[1vw] overflow-hidden border border-line shadow-2xl" style={{ aspectRatio: "16 / 9" }}>
              <img src={`${base}screens/my-models.jpg`} crossOrigin="anonymous" alt="My Models" className="w-full h-full object-cover object-top" />
            </div>
          </div>
          <div className="col-span-4 flex flex-col gap-[1.5vh] text-[1.1vw]">
            <div className="rounded-[0.6vw] border border-line bg-surface px-[1.2vw] py-[1.6vh]">
              <div className="text-muted text-[0.9vw] uppercase tracking-wider">Best run</div>
              <div className="font-semibold mt-[0.5vh]">DistilBERT · Fine-Tune</div>
              <div className="font-mono text-accent mt-[0.4vh]">99.1% accuracy</div>
            </div>
            <div className="rounded-[0.6vw] border border-line bg-surface px-[1.2vw] py-[1.6vh]">
              <div className="text-muted text-[0.9vw] uppercase tracking-wider">Tasks covered</div>
              <div className="font-semibold mt-[0.5vh]">Classification · Instruction Tuning</div>
            </div>
            <div className="rounded-[0.6vw] border border-line bg-surface px-[1.2vw] py-[1.6vh]">
              <div className="text-muted text-[0.9vw] uppercase tracking-wider">Compute</div>
              <div className="font-semibold mt-[0.5vh]">5 of 5 ran on free CPU</div>
            </div>
          </div>
        </div>
        <div className="mt-[3vh] text-[0.95vw] text-muted font-mono">08 / 11</div>
      </div>
    </div>
  );
}
