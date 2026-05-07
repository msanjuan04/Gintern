"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  Moon,
  Sun,
  Users,
} from "lucide-react";

import type { Role } from "@/lib/auth/allowlist";
import { GneraiLogo } from "@/components/gnerai-logo";
import { UserAvatar } from "@/components/user-avatar";
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

function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("gnerai-theme", next);
    } catch {
      /* noop */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
      className={cn(
        "relative z-10 inline-flex items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        compact ? "h-8 w-8" : "h-9 w-9"
      )}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function Sidebar({
  role,
  userEmail,
  avatarUrl,
  nombre,
  apellidos,
}: {
  role: Role;
  userEmail: string;
  avatarUrl: string | null;
  nombre: string | null;
  apellidos: string | null;
}) {
  const pathname = usePathname();
  const items = navForRole(role);
  const homeHref = "/dashboard";

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border/70 bg-card text-foreground lg:flex lg:flex-col">
      <div className="relative flex h-[96px] shrink-0 items-center gap-2 overflow-visible border-b border-border/70 px-4">
        <Link
          href={homeHref}
          className="group flex min-h-0 min-w-0 flex-1 items-center overflow-visible"
          title="Ir al panel"
        >
          {/* Escala visual sin aumentar la franja de cabecera: la navegación no baja */}
          <span className="block w-full max-w-[min(100%,13.5rem)] origin-left scale-[1.58] [will-change:transform]">
            <GneraiLogo priority heightClass="h-14" className="max-w-full" />
          </span>
        </Link>
        <ThemeToggle compact />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
          Navegación
        </p>
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
                    "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-brand" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      active ? "text-foreground" : "text-muted-foreground/70"
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-border/70 bg-background/60 px-4 py-4">
        <Link
          href="/perfil"
          className="flex items-center gap-3 rounded-md border border-border/70 px-2.5 py-2 transition-colors hover:bg-secondary"
          title="Ver perfil"
        >
          <UserAvatar
            avatarUrl={avatarUrl}
            nombre={nombre}
            apellidos={apellidos}
            email={userEmail}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{userEmail}</p>
            <p className="text-[11px] text-muted-foreground">
              {role === "colaborador" ? "Colaborador" : "Socio"} · Ver perfil
            </p>
          </div>
        </Link>
        <LogoutButton className="w-full justify-start border border-border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground" />
        <div className="px-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
          GNERAI OS · v1
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navForRole(role);
  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-border/60 bg-card px-3 py-2 lg:hidden">
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
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
      <span className="ml-auto pl-2">
        <ThemeToggle compact />
      </span>
    </nav>
  );
}
