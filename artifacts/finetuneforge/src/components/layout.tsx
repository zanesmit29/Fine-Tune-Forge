import { Link, useLocation } from "wouter";
import { Database, LayoutTemplate } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-md">
            <LayoutTemplate className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold tracking-tight text-lg">FineTuneForge</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
            Wizard
          </Link>
          <Link href="/history" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/history' ? 'text-primary' : 'text-muted-foreground'}`}>
            History
          </Link>
        </nav>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
