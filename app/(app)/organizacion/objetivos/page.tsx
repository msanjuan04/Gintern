import { getOrganizationDashboardData } from "@/lib/organizacion/_services/queries";

import { OrganizacionGoalsClient } from "../ui/organizacion-goals-client";

export const metadata = {
  title: "Organización · GNERAI",
};

export default async function OrganizacionObjetivosPage() {
  const data = await getOrganizationDashboardData();

  return (
    <section className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500/[0.07] via-card to-card px-6 py-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600/90 dark:text-emerald-400/90">
            Organización
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Objetivos</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Metas medibles para el equipo y para ti. Actualiza el progreso cuando avance el
            trabajo; lo operativo del día a día sigue en Tickets.
          </p>
        </div>
      </header>
      <OrganizacionGoalsClient data={data} />
    </section>
  );
}
