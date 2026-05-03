const base = import.meta.env.BASE_URL;

export default function Step2Model() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="relative z-10 h-full w-full px-[6vw] py-[6vh] grid grid-cols-12 gap-[3vw]">
        <div className="col-span-8 flex items-center justify-center">
          <div className="relative w-full rounded-[1vw] overflow-hidden border border-line shadow-2xl" style={{ aspectRatio: "16 / 9" }}>
            <img src={`${base}screens/wizard-step1-model.jpg`} crossOrigin="anonymous" alt="Select base model" className="w-full h-full object-cover object-top" />
          </div>
        </div>
        <div className="col-span-4 flex flex-col justify-between">
          <div>
            <div className="font-mono text-[1vw] uppercase tracking-[0.3em] text-accent">Step 02 / 05</div>
            <div className="mt-[1.2vh] text-[1.1vw] text-muted font-mono">Model</div>
          </div>
          <div>
            <h2 className="font-display font-bold text-[4vw] leading-[1.0] tracking-tight">Pick a base model.</h2>
            <p className="mt-[3vh] text-[1.4vw] text-muted leading-relaxed">
              Ten curated models — from a 4M-parameter BERT-Tiny that trains on CPU in two minutes, to Mistral-7B with LoRA on GPU. The right defaults are highlighted.
            </p>
            <div className="mt-[4vh] grid grid-cols-2 gap-[1.5vh] text-[1.05vw]">
              <div className="rounded-[0.5vw] border border-line bg-surface px-[1vw] py-[1.2vh]"><div className="font-semibold">DistilBERT</div><div className="text-muted text-[0.9vw]">66M · CPU · ~5m</div></div>
              <div className="rounded-[0.5vw] border border-line bg-surface px-[1vw] py-[1.2vh]"><div className="font-semibold">GPT-2 Small</div><div className="text-muted text-[0.9vw]">117M · CPU · ~10m</div></div>
              <div className="rounded-[0.5vw] border border-line bg-surface px-[1vw] py-[1.2vh]"><div className="font-semibold">Qwen2.5-1.5B</div><div className="text-muted text-[0.9vw]">1.5B · GPU · LoRA</div></div>
              <div className="rounded-[0.5vw] border border-line bg-surface px-[1vw] py-[1.2vh]"><div className="font-semibold">Mistral-7B</div><div className="text-muted text-[0.9vw]">7B · GPU · LoRA</div></div>
            </div>
          </div>
          <div className="text-[0.95vw] text-muted font-mono">04 / 11</div>
        </div>
      </div>
    </div>
  );
}
