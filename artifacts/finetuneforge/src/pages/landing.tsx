import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Code,
  Unlock,
  Target,
  Tag,
  BarChart2,
  MessageSquare,
  ArrowRight,
  Check,
} from "lucide-react";

const APP_PATH = "/app";

function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="28" height="28" rx="6" fill="#2563EB" />
      <path
        d="M9 8.5h10M9 14h7M9 19.5h4"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20.5" cy="14" r="2" fill="white" />
      <circle cx="14.5" cy="19.5" r="2" fill="white" />
    </svg>
  );
}

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(20px)",
        transition: `opacity 400ms ease-out ${delay}ms, transform 400ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function Navbar() {
  const scrolled = useScrolled();
  return (
    <header
      className="sticky top-0 z-50 border-b border-[#E2E8F0]"
      style={{
        backgroundColor: scrolled ? "rgba(255,255,255,0.85)" : "#FFFFFF",
        backdropFilter: scrolled ? "blur(8px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(8px)" : "none",
        transition: "background-color 200ms ease",
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-semibold text-[15px] tracking-tight text-[#0F172A]">
            FineTuneForge
          </span>
        </a>
        <nav className="flex items-center gap-6">
          <a
            href="#why"
            className="hidden sm:inline text-sm text-[#0F172A] hover:text-[#2563EB] transition-colors"
          >
            Why FineTuneForge
          </a>
          <Link
            href={APP_PATH}
            className="hidden sm:inline text-sm text-[#0F172A] hover:text-[#2563EB] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href={APP_PATH}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors"
          >
            Start for Free
          </Link>
        </nav>
      </div>
    </header>
  );
}

function HeroMockup() {
  const tasks = [
    { label: "Text Classification", active: true },
    { label: "Sentiment Analysis", active: false, soon: false },
    { label: "Instruction Tuning", active: false, soon: false },
    { label: "Named Entity Recognition", active: false, soon: true },
    { label: "Summarization", active: false, soon: true },
    { label: "Question & Answer", active: false, soon: true },
  ];
  return (
    <div
      className="rounded-xl bg-white border border-[#E2E8F0] p-5 sm:p-6"
      style={{
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 24px 48px -16px rgba(15,23,42,0.18)",
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={
                "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold " +
                (i === 0
                  ? "bg-[#2563EB] text-white"
                  : "bg-[#EFF6FF] text-[#64748B]")
              }
            >
              {i + 1}
            </div>
            {i < 3 && <div className="w-6 h-px bg-[#E2E8F0]" />}
          </div>
        ))}
        <div className="ml-auto text-xs text-[#64748B] font-medium">
          Step 1 of 4
        </div>
      </div>

      <div className="text-[#0F172A] font-semibold text-base mb-1">
        Choose Your Task
      </div>
      <div className="text-[#64748B] text-sm mb-4">
        Pick the business problem you want your model to solve.
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tasks.map((t) => (
          <div
            key={t.label}
            className={
              "rounded-lg border p-3 flex items-start gap-2 " +
              (t.active
                ? "border-[#2563EB] bg-[#EFF6FF]"
                : t.soon
                  ? "border-[#E2E8F0] bg-[#F8FAFC] opacity-60"
                  : "border-[#E2E8F0] bg-white")
            }
          >
            <div
              className={
                "h-4 w-4 rounded-full border mt-0.5 flex items-center justify-center " +
                (t.active
                  ? "border-[#2563EB] bg-[#2563EB]"
                  : "border-[#CBD5E1] bg-white")
              }
            >
              {t.active && (
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[#0F172A] flex items-center gap-2">
                {t.label}
                {t.soon && (
                  <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] bg-white border border-[#E2E8F0] rounded px-1.5 py-0.5">
                    Coming soon
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <div className="inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium text-white bg-[#2563EB]">
          Continue
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <Reveal>
          <div>
            <div
              className="text-sm uppercase font-semibold text-[#2563EB] mb-4"
              style={{ letterSpacing: "0.08em" }}
            >
              The fine-tuning platform built for your business
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] leading-[1.1] tracking-tight"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Fine-tune AI on your data.
              <br />
              Own your model completely.
            </h1>
            <p className="mt-5 text-lg text-[#64748B] max-w-[540px] leading-relaxed">
              No cloud lock-in. No black boxes. Upload your data, train on any
              model, and download both the model and the full training code —
              in PKL, ONNX, or GGUF format.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={APP_PATH}
                className="inline-flex items-center justify-center rounded-md px-5 py-3 text-base font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors"
              >
                Start Fine-Tuning Free
              </Link>
              <a
                href="#how"
                className="inline-flex items-center justify-center rounded-md px-5 py-3 text-base font-medium text-[#0F172A] bg-transparent border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
              >
                See how it works ↓
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#64748B]">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#2563EB]" /> No credit card
                required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#2563EB]" /> Your data stays in
                your account
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#2563EB]" /> Download your
                model + the code
              </span>
            </div>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <HeroMockup />
        </Reveal>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: 1,
      title: "Choose Your Task",
      desc: "Pick a business problem — classification, sentiment analysis, or instruction tuning",
    },
    {
      n: 2,
      title: "Upload Your Data",
      desc: "Drop in a CSV or start from one of our templates",
    },
    {
      n: 3,
      title: "Configure & Train",
      desc: "Set your parameters and choose GPU or CPU compute",
    },
    {
      n: 4,
      title: "Download Everything",
      desc: "Get your model in PKL, ONNX, or GGUF — plus the full Python training script",
    },
  ];
  return (
    <section id="how" className="bg-[#F8FAFC] border-y border-[#E2E8F0]">
      <div className="max-w-[1200px] mx-auto px-6 py-20">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
              From data to model in four steps
            </h2>
            <p className="mt-3 text-base text-[#64748B]">
              No ML expertise required. Most users are done in under 15
              minutes.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div className="relative h-full">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-px bg-[#E2E8F0]" />
                )}
                <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 h-full relative">
                  <div className="h-10 w-10 rounded-full bg-[#2563EB] text-white font-semibold flex items-center justify-center mb-3">
                    {s.n}
                  </div>
                  <div className="text-base font-semibold text-[#0F172A]">
                    {s.title}
                  </div>
                  <div className="mt-1 text-sm text-[#64748B] leading-relaxed">
                    {s.desc}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Why() {
  const cards = [
    {
      icon: Code,
      title: "Your models, your code",
      body: "Every training run generates a clean, commented Python script you can download and run anywhere. No black boxes. No vendor dependency.",
    },
    {
      icon: Unlock,
      title: "No cloud lock-in",
      body: "Bring your own Modal API key. Your data and compute stay in your own accounts. We never store your models on our servers.",
    },
    {
      icon: Target,
      title: "Built for your use case",
      body: "Start from a business problem — not a model architecture. Classification, sentiment, instruction tuning — with more use cases coming soon.",
    },
  ];
  return (
    <section id="why" className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-20">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
              Built differently from every other fine-tuning tool
            </h2>
            <p className="mt-3 text-base text-[#64748B]">
              Most platforms give you a model and nothing else. We give you the
              model, the code, and full control.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={i * 80}>
                <div
                  className="bg-white border border-[#E2E8F0] rounded-lg p-6 h-full transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
                >
                  <div className="h-10 w-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-base font-semibold text-[#0F172A]">
                    {c.title}
                  </div>
                  <div className="mt-2 text-sm text-[#64748B] leading-relaxed">
                    {c.body}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TaskTypes() {
  const cards = [
    {
      icon: Tag,
      title: "Text Classification",
      body: "Automatically sort emails, tickets, or documents into the categories your team defines.",
      example: "Support routing · Topic tagging",
    },
    {
      icon: BarChart2,
      title: "Sentiment Analysis",
      body: "Understand how customers feel about your product from reviews, surveys, and support messages.",
      example: "Review analysis · NPS scoring",
    },
    {
      icon: MessageSquare,
      title: "Instruction Tuning",
      body: "Train a model on your company FAQ or product docs. Run it locally in LM Studio — fully offline.",
      example: "Company FAQ · Product assistant",
      badge: "GGUF · LM Studio Ready",
    },
  ];
  return (
    <section className="bg-[#F8FAFC] border-y border-[#E2E8F0]">
      <div className="max-w-[1200px] mx-auto px-6 py-20">
        <Reveal>
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
            Built for real business use cases
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={i * 80}>
                <div
                  className="relative bg-white border border-[#E2E8F0] rounded-lg p-6 h-full transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
                >
                  {c.badge && (
                    <span className="absolute top-4 right-4 text-[10px] uppercase tracking-wider font-semibold text-[#065F46] bg-[#D1FAE5] border border-[#A7F3D0] rounded px-2 py-1">
                      {c.badge}
                    </span>
                  )}
                  <div className="h-10 w-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-base font-semibold text-[#0F172A]">
                    {c.title}
                  </div>
                  <div className="mt-2 text-sm text-[#64748B] leading-relaxed">
                    {c.body}
                  </div>
                  <div className="mt-4 inline-block text-xs text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded px-2 py-1">
                    {c.example}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
        <Reveal delay={240}>
          <p className="mt-10 text-center text-sm text-[#94A3B8]">
            Coming soon: Named Entity Recognition · Summarization · Question
            &amp; Answer · Custom Instruction Sets
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function ExportFormats() {
  const formats = [
    { label: "PKL", desc: "For Python pipelines and scikit-learn" },
    { label: "ONNX", desc: "For cross-platform inference (ONNX Runtime)" },
    { label: "GGUF", desc: "For LM Studio and Ollama — run fully offline" },
  ];
  return (
    <section className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-20">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
              Your model, your format
            </h2>
            <p className="mt-3 text-base text-[#64748B]">
              Download in the format that fits your stack — or take all three.
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div
            className="mt-10 grid grid-cols-1 md:grid-cols-3 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden"
            style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
          >
            {formats.map((f, i) => (
              <div
                key={f.label}
                className={
                  "p-8 text-center " +
                  (i < formats.length - 1
                    ? "md:border-r border-b md:border-b-0 border-[#E2E8F0]"
                    : "")
                }
              >
                <div
                  className="text-xl font-bold text-[#0F172A]"
                  style={{
                    fontFamily:
                      "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
                  }}
                >
                  {f.label}
                </div>
                <div className="mt-2 text-sm text-[#64748B]">{f.desc}</div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#2563EB]">
            <Code className="h-4 w-4" />
            Every export includes the full Python training script that
            generated it.
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="bg-[#F8FAFC] border-y border-[#E2E8F0]">
      <div className="max-w-[1200px] mx-auto px-6 py-20">
        <Reveal>
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
            Trusted by teams who build with AI
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-14 bg-white border border-[#E2E8F0] rounded-md flex items-center justify-center"
              >
                <span className="text-sm text-[#94A3B8]">Company</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={200}>
          <blockquote
            className="mt-12 max-w-3xl mx-auto text-lg italic text-[#0F172A]"
            style={{
              borderLeft: "3px solid #2563EB",
              paddingLeft: "1.5rem",
            }}
          >
            “We fine-tuned a support classifier in 20 minutes and deployed it
            the same day. The exported code meant we could integrate it into
            our pipeline immediately.”
            <footer className="mt-3 not-italic text-sm text-[#64748B]">
              — “Head of Engineering, B2B SaaS company” (example testimonial)
            </footer>
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section style={{ backgroundColor: "#EFF6FF" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-20 text-center">
        <Reveal>
          <h2
            className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Start building your model today
          </h2>
          <p className="mt-3 text-base text-[#64748B] max-w-xl mx-auto">
            Free to start. No ML expertise. No cloud lock-in. Your models stay
            yours.
          </p>
          <div className="mt-7">
            <Link
              href={APP_PATH}
              className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-base font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors"
            >
              Create Your First Model <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-[#E2E8F0]">
      <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Logo size={22} />
          <span className="text-sm text-[#64748B]">
            © 2026 FineTuneForge
          </span>
        </div>
        <div className="flex items-center gap-5 text-sm text-[#64748B]">
          <a href="#" className="hover:text-[#0F172A] transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-[#0F172A] transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-[#0F172A] transition-colors">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "smooth";
    return () => {
      html.style.scrollBehavior = prev;
    };
  }, []);
  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Why />
        <TaskTypes />
        <ExportFormats />
        <SocialProof />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
