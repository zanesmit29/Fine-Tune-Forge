const base = import.meta.env.BASE_URL;

export default function Step1Task() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="relative z-10 h-full w-full px-[6vw] py-[6vh] grid grid-cols-12 gap-[3vw]">
        <div className="col-span-4 flex flex-col justify-between">
          <div>
            <div className="font-mono text-[1vw] uppercase tracking-[0.3em] text-accent">Step 01 / 05</div>
            <div className="mt-[1.2vh] text-[1.1vw] text-muted font-mono">/app</div>
          </div>
          <div>
            <h2 className="font-display font-bold text-[4vw] leading-[1.0] tracking-tight">Choose your task.</h2>
            <p className="mt-[3vh] text-[1.4vw] text-muted leading-relaxed">
              Start with the business problem, not the model. FineTuneForge pre-configures the wizard with the right base models and dataset templates.
            </p>
            <div className="mt-[4vh] space-y-[1.4vh] text-[1.2vw]">
              <div className="flex items-baseline gap-[0.8vw]"><span className="text-accent">→</span><span><span className="font-semibold">Text Classification</span> — sort, label, route</span></div>
              <div className="flex items-baseline gap-[0.8vw]"><span className="text-accent">→</span><span><span className="font-semibold">Sentiment Analysis</span> — tone and opinion</span></div>
              <div className="flex items-baseline gap-[0.8vw]"><span className="text-accent">→</span><span><span className="font-semibold">Instruction Tuning</span> — Q&amp;A and assistants</span></div>
            </div>
          </div>
          <div className="text-[0.95vw] text-muted font-mono">03 / 11</div>
        </div>
        <div className="col-span-8 flex items-center justify-center">
          <div className="relative w-full rounded-[1vw] overflow-hidden border border-line shadow-2xl" style={{ aspectRatio: "16 / 9" }}>
            <img src={`${base}screens/wizard-step0-task.jpg`} crossOrigin="anonymous" alt="Choose your task" className="w-full h-full object-cover object-top" />
          </div>
        </div>
      </div>
    </div>
  );
}
