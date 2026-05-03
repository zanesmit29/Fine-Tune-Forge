const base = import.meta.env.BASE_URL;

export default function Integrations() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="relative z-10 h-full w-full px-[6vw] py-[6vh] grid grid-cols-12 gap-[3vw]">
        <div className="col-span-5 flex flex-col justify-between">
          <div>
            <div className="font-mono text-[1vw] uppercase tracking-[0.3em] text-accent">Scaling up</div>
            <h2 className="font-display font-bold text-[4.4vw] leading-[1.0] tracking-tight mt-[1.5vh]">Bring your own GPU.</h2>
            <p className="mt-[3vh] text-[1.4vw] text-muted leading-relaxed">
              Plug in a Modal account to unlock 7B-parameter models on A10G GPUs. Credentials stay encrypted in your account — never shared, never logged.
            </p>
          </div>
          <div className="space-y-[2vh]">
            <div className="rounded-[0.6vw] border border-line bg-surface px-[1.4vw] py-[2vh]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display font-semibold text-[1.6vw]">Modal</div>
                  <div className="text-muted text-[1vw]">On-demand A10G GPUs</div>
                </div>
                <div className="font-mono text-[1vw] text-accent">~$2.07 / hr</div>
              </div>
            </div>
            <div className="rounded-[0.6vw] border border-line bg-surface px-[1.4vw] py-[2vh]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display font-semibold text-[1.6vw]">Hugging Face Hub</div>
                  <div className="text-muted text-[1vw]">Push trained models in one click</div>
                </div>
                <div className="font-mono text-[1vw] text-muted">optional</div>
              </div>
            </div>
            <div className="text-[0.95vw] text-muted font-mono">10 / 11</div>
          </div>
        </div>
        <div className="col-span-7 flex items-center justify-center">
          <div className="relative w-full rounded-[1vw] overflow-hidden border border-line shadow-2xl" style={{ aspectRatio: "16 / 9" }}>
            <img src={`${base}screens/integrations.jpg`} crossOrigin="anonymous" alt="Integrations" className="w-full h-full object-cover object-top" />
          </div>
        </div>
      </div>
    </div>
  );
}
