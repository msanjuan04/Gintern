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

type SearchParams = { archivados?: string };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const includeInactive = searchParams.archivados === "1";
  const clients = await listClients({ includeInactive });

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
                    <TableCell>{c.contacto ?? "—"}</TableCell>
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
