import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Sparkles,
  Database,
  BookOpen,
  Plug,
  Settings as SettingsIcon,
  LogOut,
  Menu,
} from "lucide-react";
import { useNavHighlight } from "@/lib/nav-highlight";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/app", label: "New Fine-Tune", icon: Sparkles },
  { href: "/my-models", label: "My Models", icon: Database },
  { href: "/get-started", label: "Get Started", icon: BookOpen },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[#E2E8F0]">
      <svg
        width="28"
        height="28"
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
      <span className="font-semibold text-[15px] tracking-tight text-[#0F172A]">
        FineTuneForge
      </span>
    </div>
  );
}

function SidebarUser() {
  // Placeholder until Replit Auth is wired. Shows a fallback avatar + name.
  const name = "Your Workspace";
  return (
    <div className="border-t border-[#E2E8F0] p-4">
      <div className="flex items-center gap-3">
        <Avatar className="w-9 h-9">
          <AvatarFallback className="bg-[#EFF6FF] text-[#2563EB] text-sm font-semibold">
            {name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[#0F172A] truncate">
            {name}
          </div>
          <a
            href="/api/logout"
            className="inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-[#2563EB] transition-colors"
            data-testid="link-sign-out"
          >
            <LogOut className="w-3 h-3" /> Sign out
          </a>
        </div>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { highlightMyModels } = useNavHighlight();
  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/"
            ? location === "/" || location === ""
            : location.startsWith(item.href);
        const showHighlight =
          item.href === "/my-models" && highlightMyModels && !active;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`relative flex items-center gap-3 px-3 h-9 rounded-md text-[14px] font-medium transition-colors ${
              active
                ? "bg-[#EFF6FF] text-[#2563EB]"
                : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            }`}
            data-testid={`nav-${item.href.replace("/", "") || "home"}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
            {showHighlight && (
              <span className="ml-auto inline-block w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarShell({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-white">
      <Logo />
      <NavList onNavigate={onNavigate} />
      <SidebarUser />
    </div>
  );
}

function DesktopSidebar() {
  return (
    <aside className="hidden md:block w-[240px] shrink-0 border-r border-[#E2E8F0] h-screen sticky top-0">
      <SidebarShell />
    </aside>
  );
}

function MobileTopBar({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden flex items-center gap-2 h-14 px-4 bg-white border-b border-[#E2E8F0] sticky top-0 z-20">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation"
            data-testid="button-mobile-nav"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[260px]">
          <SidebarShell onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <span className="font-semibold text-[15px] text-[#0F172A] truncate">
        {title}
      </span>
    </div>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumb?: string;
}

export function Layout({ children, title, breadcrumb }: LayoutProps) {
  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopBar title={title} />
        <header className="hidden md:flex bg-white border-b border-[#E2E8F0] h-16 items-center px-8 sticky top-0 z-10">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#0F172A] leading-tight">
              {title}
            </h1>
            {breadcrumb && (
              <p className="text-xs text-[#64748B] mt-0.5">{breadcrumb}</p>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
