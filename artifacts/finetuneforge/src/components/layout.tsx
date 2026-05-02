import { Link, useLocation } from "wouter";
import { Cpu } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-white border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary flex items-center justify-center w-7 h-7 rounded-md shadow-sm">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-foreground">
              FineTune<span className="text-primary">Forge</span>
            </span>
            <span className="hidden sm:block text-muted-foreground/40 text-xs ml-1 mt-px">|</span>
            <span className="hidden sm:block text-muted-foreground text-xs">Model Fine-Tuning</span>
          </div>

          <nav className="flex items-stretch h-14">
            <Link
              href="/"
              className={`flex items-center px-4 text-sm font-medium border-b-2 transition-colors duration-150 ${
                location === "/"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Wizard
            </Link>
            <Link
              href="/history"
              className={`flex items-center px-4 text-sm font-medium border-b-2 transition-colors duration-150 ${
                location === "/history"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              History
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
