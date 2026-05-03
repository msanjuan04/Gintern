"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  FileText,
  LayoutDashboard,
  Receipt,
  Scale,
  Users,
} from "lucide-react";

import type { Role } from "@/lib/auth/allowlist";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/movimientos", label: "Movimientos", icon: Receipt },
  { href: "/facturas", label: "Facturas", icon: FileText },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/balance", label: "Balance", icon: Scale },
  { href: "/calendario", label: "Calendario", icon: Calendar },
];

const COLABORADOR_ALLOWED = new Set(["/facturas", "/clientes", "/calendario"]);

function navForRole(role: Role) {
  if (role === "colaborador") {
    return NAV.filter((item) => COLABORADOR_ALLOWED.has(item.href));
  }
  return NAV;
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navForRole(role);
  const homeHref = role === "colaborador" ? "/facturas" : "/dashboard";

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card/40 lg:flex lg:flex-col">
      <div className="flex h-16 items-center px-6">
        <Link
          href={homeHref}
          className="text-lg font-semibold tracking-tight"
        >
          <span className="text-brand">GNERAI</span>
          <span className="ml-1.5 text-foreground/80">Finance</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      active ? "" : "text-muted-foreground/70"
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6 py-4 text-[11px] text-muted-foreground/60">
        v0.1 · interna
      </div>
    </aside>
  );
}

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navForRole(role);
  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-border/60 bg-card/40 px-3 py-2 lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

