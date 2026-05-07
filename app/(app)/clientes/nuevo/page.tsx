import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClientAction } from "@/lib/clients/actions";

import { ClientForm } from "../client-form";

export const metadata = {
  title: "Nuevo cliente · GNERAI OS",
};

export default function NuevoClientePage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Clientes
        </Link>
        <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight">
          Nuevo cliente
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos del cliente</CardTitle>
          <CardDescription>
            Estos datos se usarán al emitir facturas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm action={createClientAction} submitLabel="Crear cliente" />
        </CardContent>
      </Card>
    </div>
  );
}
