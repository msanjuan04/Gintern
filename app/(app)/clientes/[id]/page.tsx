import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

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
  getClient,
  listClientInteractions,
  listClientProjects,
} from "@/lib/clients/queries";
import {
  addClientInteractionAction,
  updateClientAction,
} from "@/lib/clients/actions";
import { fmtMoney, formatDate } from "@/lib/utils";

import { ClientForm } from "../client-form";
import { ArchiveButton } from "./archive-button";

export const metadata = {
  title: "Cliente · GNERAI OS",
};

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const client = await getClient(resolvedParams.id);
  if (!client) notFound();

  const [interactions, projects] = await Promise.all([
    listClientInteractions(client.id),
    listClientProjects(client.id),
  ]);

  const updateAction = updateClientAction.bind(null, client.id);
  const initial = (client.nombre || "?").trim().charAt(0).toUpperCase();
  const addInteraction = addClientInteractionAction.bind(null, client.id);

  return (
    <div className="w-full space-y-8">
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Clientes
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-lg font-semibold text-brand">
              {initial}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-2xl font-semibold tracking-tight">
                  {client.nombre}
                </h1>
                {client.activo ? (
                  <Badge variant="success">Activo</Badge>
                ) : (
                  <Badge variant="muted">Archivado</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {client.nif ? `NIF ${client.nif} · ` : ""}Alta {formatDate(client.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ArchiveButton id={client.id} activo={client.activo} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-secondary/30">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              LTV estimado
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {fmtMoney(client.estimated_ltv ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              Potencial total del cliente
            </p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pipeline
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {["lead", "meeting", "proposal", "negotiation", "active"].map(
                (stage) => (
                  <Badge
                    key={stage}
                    variant={client.stage === stage ? "success" : "muted"}
                  >
                    {STAGE_LABEL[stage] ?? stage}
                  </Badge>
                )
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Contacto
            </p>
            <p className="mt-2 text-sm text-foreground">
              {client.contacto || <span className="text-muted-foreground">Sin contacto</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {client.email || client.telefono || ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proyectos vinculados</CardTitle>
          <CardDescription>
            Relación de proyectos activos e históricos de este cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay proyectos vinculados.
            </p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.start_date
                        ? `Inicio: ${formatDate(project.start_date)}`
                        : "Sin fecha de inicio"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.budget != null
                        ? `Presupuesto: ${fmtMoney(project.budget)}`
                        : "Presupuesto sin definir"}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {PROJECT_STATUS_LABEL[project.status] ?? project.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interacciones</CardTitle>
          <CardDescription>
            Muro cronológico con notas del equipo para seguimiento comercial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={addInteraction} className="space-y-2">
            <select
              name="interactionType"
              defaultValue="note"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="note">Nota interna</option>
              <option value="call">Llamada</option>
              <option value="meeting">Reunión</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="other">Otro</option>
            </select>
            <textarea
              name="content"
              rows={3}
              required
              className="w-full rounded-md border border-input bg-background p-3 text-sm"
              placeholder="Añade una nota de llamada, reunión o decisión importante..."
            />
            <Button type="submit" variant="brand" size="sm">
              Guardar interacción
            </Button>
          </form>

          {interactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin interacciones registradas todavía.
            </p>
          ) : (
            <div className="space-y-3">
              {interactions.map((item) => (
                <article
                  key={item.id}
                  className="rounded-md border border-border/70 p-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {(item.author?.full_name || item.author?.email || "Equipo") +
                        " · " +
                        formatDate(item.created_at)}
                    </span>
                    <Badge variant="outline">
                      {INTERACTION_LABEL[item.interaction_type] ?? item.interaction_type}
                    </Badge>
                  </div>
                  <p className="mb-2 text-[11px] text-muted-foreground">
                    {INTERACTION_HINT[item.interaction_type] ?? "Seguimiento interno"}
                  </p>
                  <p className="text-sm">{item.content}</p>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos del cliente</CardTitle>
          <CardDescription>
            Cambios disponibles inmediatamente para próximas operaciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm
            action={updateAction}
            client={client}
            submitLabel="Guardar cambios"
            successMessage="Cambios guardados."
          />
        </CardContent>
      </Card>
    </div>
  );
}

const STAGE_LABEL: Record<string, string> = {
  lead: "Lead",
  meeting: "Reunión",
  proposal: "Propuesta",
  negotiation: "Negociación",
  active: "Cliente Activo",
};

const PROJECT_STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  paused: "Pausado",
  done: "Finalizado",
  cancelled: "Cancelado",
};

const INTERACTION_LABEL: Record<string, string> = {
  note: "Nota",
  call: "Llamada",
  meeting: "Reunión",
  email: "Email",
  whatsapp: "WhatsApp",
  other: "Otro",
};

const INTERACTION_HINT: Record<string, string> = {
  note: "Registro de contexto comercial",
  call: "Resumen de llamada con cliente",
  meeting: "Conclusiones de reunión",
  email: "Seguimiento por correo",
  whatsapp: "Seguimiento por mensajería",
  other: "Actividad de seguimiento",
};
