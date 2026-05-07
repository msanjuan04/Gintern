"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  ClipboardCheck,
  FileText,
  FolderLock,
  Gauge,
  History,
  KanbanSquare,
  Users,
} from "lucide-react";

import type { Role } from "@/lib/auth/allowlist";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

const NAV = [
  { href: "/dashboard", label: "Panel", icon: Gauge },
  { href: "/tickets", label: "Tickets", icon: KanbanSquare },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/propuestas", label: "Propuestas", icon: FileText },
  { href: "/finanzas", label: "Finanzas", icon: BriefcaseBusiness },
  { href: "/organizacion/objetivos", label: "Organizacion", icon: ClipboardCheck },
  { href: "/boveda", label: "Contraseñas", icon: FolderLock },
  { href: "/wiki", label: "Drive", icon: BookOpen },
  { href: "/calendario", label: "Calendario", icon: Calendar },
  { href: "/logs", label: "Logs", icon: History },
];

const COLABORADOR_ALLOWED = new Set([
  "/dashboard",
  "/tickets",
  "/clientes",
  "/calendario",
  "/organizacion/objetivos",
]);

function navForRole(role: Role) {
  if (role === "colaborador") {
    return NAV.filter((item) => COLABORADOR_ALLOWED.has(item.href));
  }
  return NAV;
}

export function Sidebar({
  role,
  userEmail,
  userInitials,
}: {
  role: Role;
  userEmail: string;
  userInitials: string;
}) {
  const pathname = usePathname();
  const items = navForRole(role);
  const homeHref = "/dashboard";

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border/70 bg-card/40 text-foreground lg:flex lg:flex-col">
      <div className="flex h-20 items-center border-b border-border/70 px-5">
        <Link
          href={homeHref}
          className="group flex items-center gap-3 text-lg font-semibold tracking-tight"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-bold text-emerald-950 shadow-sm">
            GN
          </span>
          <span>
            <span className="text-emerald-400">GNERAI</span>
            <span className="ml-1.5 text-foreground/70">OS</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Navegacion
        </p>
        <ul className="space-y-1.5">
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
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-2 h-6 w-1 rounded-r-full bg-emerald-500" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      active ? "text-primary-foreground" : "text-muted-foreground/70"
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-border/70 bg-background/70 px-4 py-4">
        <Link
          href="/perfil"
          className="flex items-center gap-3 rounded-xl border border-border/70 px-2.5 py-2 transition-colors hover:bg-secondary"
          title="Ver perfil"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-700">
            {userInitials || "•"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{userEmail}</p>
            <p className="text-[11px] text-muted-foreground">
              {role === "colaborador" ? "Colaborador · Ver perfil" : "Ver perfil"}
            </p>
          </div>
        </Link>
        <LogoutButton className="w-full justify-start border border-border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground" />
        <div className="px-2 text-[11px] text-muted-foreground/70">
          Sistema interno · v1
        </div>
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

