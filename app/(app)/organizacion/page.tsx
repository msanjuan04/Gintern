import { getOrganizationDashboardData } from "@/lib/organizacion/_services/queries";

import { OrganizacionKanbanClient } from "./ui/organizacion-kanban-client";
import { OrganizacionNav } from "./ui/organizacion-nav";

export const metadata = {
  title: "Organizacion · GNERAI",
};

export default async function OrganizacionPage() {
  const data = await getOrganizationDashboardData();

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Organizacion</h1>
        <p className="text-sm text-muted-foreground">
          Centro operativo premium para tareas compartidas en formato kanban.
        </p>
      </header>
      <OrganizacionNav />
      <OrganizacionKanbanClient data={data} />
    </section>
  );
}

