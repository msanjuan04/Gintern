import Link from "next/link";
import { Plus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listClients } from "@/lib/clients/queries";

export const metadata = {
  title: "Clientes · GNERAI Finance",
};

type ClientStageFilter =
  | "all"
  | "lead"
  | "meeting"
  | "proposal"
  | "negotiation"
  | "active"
  | "inactive";
type SearchParams = { archivados?: string; q?: string; stage?: ClientStageFilter };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const includeInactive = resolvedSearchParams.archivados === "1";
  const stageFilter =
    resolvedSearchParams.stage && STAGE_OPTIONS.some((s) => s.value === resolvedSearchParams.stage)
      ? resolvedSearchParams.stage
      : "all";
  const searchQuery = (resolvedSearchParams.q ?? "").trim();
  const clients = await listClients({
    includeInactive,
    stage: stageFilter,
    query: searchQuery,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Empresas y personas a las que GNERAI factura.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={includeInactive ? "/clientes" : "/clientes?archivados=1"}>
              {includeInactive ? "Ocultar archivados" : "Ver archivados"}
            </Link>
          </Button>
          <Button asChild variant="brand">
            <Link href="/clientes/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo cliente
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <input type="hidden" name="archivados" value={includeInactive ? "1" : "0"} />
            <input
              name="q"
              defaultValue={searchQuery}
              placeholder="Buscar por nombre, contacto, email o teléfono..."
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
            <select
              name="stage"
              defaultValue={stageFilter}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {STAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline">
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {clients.length === 0 ? (
        <Card>
          <CardHeader className="items-center text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft">
              <Users className="h-6 w-6 text-brand" />
            </div>
            <CardTitle className="text-lg">
              {includeInactive ? "No hay clientes" : "No hay clientes activos"}
            </CardTitle>
            <CardDescription>
              {includeInactive
                ? "Aún no has creado ningún cliente."
                : "Crea tu primer cliente para empezar a facturar."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button asChild variant="brand">
              <Link href="/clientes/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Crear cliente
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>NIF</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => {
                const initial = (c.nombre || "?").trim().charAt(0).toUpperCase();
                return (
                  <TableRow key={c.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="flex items-center gap-3 hover:underline"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                          {initial}
                        </span>
                        <span>{c.nombre}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.nif ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p>{c.contacto ?? "—"}</p>
                        {c.telefono && (
                          <p className="text-xs text-muted-foreground">{c.telefono}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      {c.activo ? (
                        <Badge variant="success">Activo</Badge>
                      ) : (
                        <Badge variant="muted">Archivado</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

const STAGE_OPTIONS: Array<{ value: ClientStageFilter; label: string }> = [
  { value: "all", label: "Todas las etapas" },
  { value: "lead", label: "Lead" },
  { value: "meeting", label: "Reunión" },
  { value: "proposal", label: "Propuesta" },
  { value: "negotiation", label: "Negociación" },
  { value: "active", label: "Cliente activo" },
  { value: "inactive", label: "Inactivo" },
];
