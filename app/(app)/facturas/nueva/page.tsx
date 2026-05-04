import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { listClients } from "@/lib/clients/queries";
import { listAllPartners } from "@/lib/invoices/queries";
import { createClient } from "@/lib/supabase/server";
import type { InvoiceKind } from "@/types/database";

import { InvoiceForm, type InvoiceFormDefaults } from "./invoice-form";

export const metadata = {
  title: "Nueva factura · GNERAI Finance",
};

const VALID_KINDS: readonly InvoiceKind[] = [
  "client",
  "internal_compensation",
  "expense_received",
];

export default async function NuevaFacturaPage({
  searchParams,
}: {
  searchParams: Promise<{
    kind?: string;
    cliente?: string;
    counterparty?: string;
    base?: string;
    concepto?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [clients, partners] = await Promise.all([
    listClients({ includeInactive: false }),
    listAllPartners(),
  ]);

  const kindParam = (VALID_KINDS as readonly string[]).includes(
    resolvedSearchParams.kind ?? ""
  )
    ? (resolvedSearchParams.kind as InvoiceKind)
    : null;

  const baseAmount = resolvedSearchParams.base
    ? Number(resolvedSearchParams.base)
    : null;

  const defaults: InvoiceFormDefaults = {
    kind: kindParam ?? "client",
    clientId: resolvedSearchParams.cliente ?? null,
    counterpartyId: resolvedSearchParams.counterparty ?? null,
    concepto: resolvedSearchParams.concepto ?? "",
    initialLine:
      baseAmount && Number.isFinite(baseAmount) && baseAmount > 0
        ? {
            descripcion: resolvedSearchParams.concepto ?? "",
            cantidad: "1",
            precio_unitario: baseAmount.toFixed(2),
          }
        : null,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/facturas"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Facturas
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Nueva factura
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          La numeración (MS-2026/001…) se asigna automáticamente al guardar.
        </p>
      </div>

      <InvoiceForm
        clients={clients}
        partners={partners}
        currentUserId={user.id}
        defaults={defaults}
      />
    </div>
  );
}
