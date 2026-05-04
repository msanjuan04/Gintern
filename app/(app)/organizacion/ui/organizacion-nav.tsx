"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function OrganizacionNav() {
  const pathname = usePathname();
  const isKanban = pathname === "/organizacion";
  const isGoals = pathname.startsWith("/organizacion/objetivos");

  return (
    <div className="inline-flex h-11 items-center rounded-xl bg-muted/70 p-1">
      <Link
        href="/organizacion"
        className={cn(
          "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
          isKanban ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        To-dos (Kanban)
      </Link>
      <Link
        href="/organizacion/objetivos"
        className={cn(
          "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
          isGoals ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Objetivos
      </Link>
    </div>
  );
}

