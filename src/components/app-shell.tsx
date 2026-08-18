"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Users, Tag, BarChart2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Tamu", icon: Users },
  { href: "/categories", label: "Kategori", icon: Tag },
  { href: "/analytics", label: "Analitik", icon: BarChart2 }
];

function RailButton({
  href,
  label,
  icon: Icon,
  active,
  onClick
}: {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onClick?: () => void;
}) {
  const classes = cn(
    "flex size-11 items-center justify-center rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1 [&_svg]:size-5",
    active
      ? "bg-accent-gold-subtle text-accent-gold"
      : "text-muted hover:bg-surface-3 hover:text-secondary"
  );
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>
        {href ? (
          <Link
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={classes}
          >
            <Icon aria-hidden="true" />
          </Link>
        ) : (
          <button type="button" aria-label={label} onClick={onClick} className={classes}>
            <Icon aria-hidden="true" />
          </button>
        )}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="right"
          sideOffset={8}
          className="z-50 rounded-md border border-default bg-surface-4 px-2.5 py-1.5 text-xs font-medium text-primary shadow-2 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95"
        >
          {label}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

async function logout() {
  await fetch("/api/auth/login", { method: "DELETE" });
  location.href = "/login";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login renders fullscreen, without the rail.
  if (pathname === "/login") return <>{children}</>;

  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[72px] flex-col items-center gap-2 border-r border-subtle bg-surface-1 py-4 lg:flex">
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-full bg-surface-3 font-display text-sm font-semibold text-accent-gold"
        >
          WG
        </span>
        <div aria-hidden="true" className="mx-3 h-px w-8 bg-[var(--border-subtle)]" />
        <nav className="flex flex-col items-center gap-2">
          {NAV.map((item) => (
            <RailButton
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href}
            />
          ))}
        </nav>
        <div className="mt-auto">
          <RailButton label="Keluar" icon={LogOut} onClick={logout} />
        </div>
      </aside>
      <div className="ml-0 min-h-screen bg-surface-2 pb-14 lg:ml-[72px] lg:pb-0">
        {children}
      </div>
      {/* Mobile-only bottom nav; lg+ uses the sidebar rail. */}
      <nav
        aria-label="Navigasi utama"
        className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-subtle bg-surface-1 px-4 lg:hidden"
      >
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex size-11 flex-col items-center justify-center gap-0.5 transition-transform duration-100 active:scale-90 focus-visible:outline-none focus-visible:ring focus-visible:ring-ring [&_svg]:size-5",
                active ? "text-accent-gold" : "text-muted"
              )}
            >
              <item.icon aria-hidden="true" />
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "size-1 rounded-full",
                  active ? "bg-accent-gold" : "bg-transparent"
                )}
              />
            </Link>
          );
        })}
        <button
          type="button"
          aria-label="Keluar"
          onClick={logout}
          className="flex size-11 flex-col items-center justify-center gap-0.5 text-muted transition-transform duration-100 active:scale-90 focus-visible:outline-none focus-visible:ring focus-visible:ring-ring [&_svg]:size-5"
        >
          <LogOut aria-hidden="true" />
          <span className="text-[10px] font-medium leading-none">Keluar</span>
          <span aria-hidden="true" className="size-1 rounded-full bg-transparent" />
        </button>
      </nav>
    </TooltipPrimitive.Provider>
  );
}

/** Sticky page top bar — first child of each page inside AppShell. */
export function TopBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex h-12 items-center justify-between gap-4 border-b border-subtle bg-surface-2 px-6">
      {children}
    </div>
  );
}
