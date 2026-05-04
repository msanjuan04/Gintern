import { getOrganizationDashboardData } from "@/lib/organizacion/_services/queries";

import { OrganizacionGoalsClient } from "../ui/organizacion-goals-client";

export const metadata = {
  title: "Organización · GNERAI",
};

export default async function OrganizacionObjetivosPage() {
  const data = await getOrganizationDashboardData();

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Organización</h1>
        <p className="text-sm text-muted-foreground">
          Objetivos de equipo y personales. El trabajo operativo del día a día está en Tickets.
        </p>
      </header>
      <OrganizacionGoalsClient data={data} />
    </section>
  );
}
