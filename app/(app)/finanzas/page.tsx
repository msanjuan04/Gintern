import { getFinanceDataBundle, listClientsForFilter } from "@/lib/finanzas/_services/queries";

import { FinanzasClient } from "./ui/finanzas-client";

export const metadata = {
  title: "Finanzas · GNERAI",
};

export default async function FinanzasPage() {
  const [bundle, clients] = await Promise.all([getFinanceDataBundle(), listClientsForFilter()]);

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Nucleo Financiero</h1>
        <p className="text-sm text-muted-foreground">
          Gestion operativa premium: KPI, movimientos, reportes y carga de operaciones.
        </p>
      </header>
      <FinanzasClient initialData={bundle} clients={clients} />
    </section>
  );
}
