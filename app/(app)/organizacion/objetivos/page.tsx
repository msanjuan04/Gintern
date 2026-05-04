import { getOrganizationDashboardData } from "@/lib/organizacion/_services/queries";

import { OrganizacionGoalsClient } from "../ui/organizacion-goals-client";
import { OrganizacionNav } from "../ui/organizacion-nav";

export const metadata = {
  title: "Objetivos · GNERAI",
};

export default async function OrganizacionObjetivosPage() {
  const data = await getOrganizationDashboardData();

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Objetivos</h1>
        <p className="text-sm text-muted-foreground">
          Vista visual de objetivos de equipo y personales.
        </p>
      </header>
      <OrganizacionNav />
      <OrganizacionGoalsClient data={data} />
    </section>
  );
}

