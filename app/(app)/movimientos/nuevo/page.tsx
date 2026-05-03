import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { listClients } from "@/lib/clients/queries";

import { MovementForm } from "./movement-form";

export const metadata = {
  title: "Nuevo movimiento · GNERAI Finance",
};

export default async function NuevoMovimientoPage() {
  const clients = await listClients({ includeInactive: false });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/movimientos"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Movimientos
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Nuevo movimiento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Para registros sueltos sin factura formal (cash, dietas, gastos
          menores…).
        </p>
      </div>

      <MovementForm clients={clients} />
    </div>
  );
}
