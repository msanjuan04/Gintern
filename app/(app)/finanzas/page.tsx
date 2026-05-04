import { Badge } from "@/components/ui/badge";
import { getFinanceDashboardData } from "@/lib/finanzas/queries";

import { FinanzasTabs } from "./finanzas-tabs";

export const metadata = {
  title: "Finanzas · GNERAI",
};

export default async function FinanzasPage() {
  const data = await getFinanceDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Finanzas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control financiero integral para operación y estrategia.
          </p>
        </div>
        <Badge variant="outline">Núcleo financiero</Badge>
      </div>
      <FinanzasTabs data={data} />
    </div>
  );
}
