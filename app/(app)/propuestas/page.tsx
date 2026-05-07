import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createProposalAction, updateProposalStatusAction } from "@/lib/proposals/actions";
import {
  getProposalKpis,
  listProposalFormData,
  listProposals,
} from "@/lib/proposals/queries";
import { fmtMoney } from "@/lib/utils";
import type { ProposalStatus } from "@/types/database";

export const metadata = {
  title: "Propuestas · GNERAI",
};

const STATUS_LABEL = {
  draft: "Borrador",
  sent: "Enviada",
  in_review: "En revisión",
  negotiation: "Negociación",
  won: "Ganada",
  lost: "Perdida",
} as const;

const OPEN_STATUSES: ProposalStatus[] = ["draft", "sent", "in_review", "negotiation"];
const STATUS_OPTIONS: Array<{ value: ProposalStatus; label: string }> = [
  { value: "draft", label: "Borrador" },
  { value: "sent", label: "Enviada" },
  { value: "in_review", label: "En revisión" },
  { value: "negotiation", label: "Negociación" },
  { value: "won", label: "Ganada" },
  { value: "lost", label: "Perdida" },
];

type ProposalFilter = "all" | ProposalStatus | "expired";
type SearchParams = { q?: string; status?: ProposalFilter };

export default async function PropuestasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const [proposals, formData] = await Promise.all([listProposals(), listProposalFormData()]);
  const kpis = await getProposalKpis(proposals);
  const searchQuery = (resolvedSearchParams.q ?? "").trim().toLowerCase();
  const statusFilter = isValidFilter(resolvedSearchParams.status)
    ? resolvedSearchParams.status
    : "all";
  const today = new Date().toISOString().slice(0, 10);

  const filtered = proposals.filter((proposal) => {
    const matchesSearch =
      !searchQuery ||
      proposal.title.toLowerCase().includes(searchQuery) ||
      (proposal.code ?? "").toLowerCase().includes(searchQuery) ||
      (proposal.client_name ?? "").toLowerCase().includes(searchQuery) ||
      (proposal.owner_name ?? "").toLowerCase().includes(searchQuery);
    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "expired") {
      return (
        !!proposal.valid_until &&
        proposal.valid_until < today &&
        OPEN_STATUSES.includes(proposal.status)
      );
    }
    return proposal.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Propuestas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control de pipeline comercial, seguimiento y cierre.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Abiertas" value={String(kpis.totalOpen)} />
        <StatCard label="En negociación" value={String(kpis.inNegotiation)} />
        <StatCard label="Vencidas" value={String(kpis.expired)} />
        <StatCard label="% cierre" value={`${kpis.winRate}%`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
                <input
                  name="q"
                  defaultValue={resolvedSearchParams.q ?? ""}
                  placeholder="Buscar por código, título, cliente o responsable..."
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
                <select
                  name="status"
                  defaultValue={statusFilter}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">Todos los estados</option>
                  <option value="expired">Vencidas sin cerrar</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="outline">
                  Filtrar
                </Button>
              </form>

              <div className="flex flex-wrap gap-2">
                <StatusFilterPill
                  href={buildFilterHref("all", resolvedSearchParams.q)}
                  active={statusFilter === "all"}
                  label="Todas"
                  count={proposals.length}
                />
                <StatusFilterPill
                  href={buildFilterHref("expired", resolvedSearchParams.q)}
                  active={statusFilter === "expired"}
                  label="Vencidas"
                  count={kpis.expired}
                />
                {STATUS_OPTIONS.map((option) => (
                  <StatusFilterPill
                    key={option.value}
                    href={buildFilterHref(option.value, resolvedSearchParams.q)}
                    active={statusFilter === option.value}
                    label={option.label}
                    count={proposals.filter((p) => p.status === option.value).length}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propuesta</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead>Validez</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No hay propuestas para este filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((proposal) => {
                    const isExpired =
                      !!proposal.valid_until &&
                      proposal.valid_until < today &&
                      OPEN_STATUSES.includes(proposal.status);
                    return (
                      <TableRow key={proposal.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {(proposal.code ?? "PR-?") + " · " + proposal.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Creada {fmtDate(proposal.created_at)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{proposal.client_name ?? "Sin cliente"}</TableCell>
                        <TableCell>{proposal.owner_name ?? "Sin asignar"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {fmtMoney(proposal.amount)}
                        </TableCell>
                        <TableCell>
                          {proposal.valid_until ? (
                            <div className="flex items-center gap-2">
                              <span>{fmtDate(proposal.valid_until)}</span>
                              {isExpired && <Badge variant="warning">Vencida</Badge>}
                            </div>
                          ) : (
                            "Sin fecha"
                          )}
                        </TableCell>
                        <TableCell>
                          <form
                            action={async (formData) => {
                              "use server";
                              await updateProposalStatusAction(
                                proposal.id,
                                String(formData.get("status") ?? proposal.status)
                              );
                            }}
                          >
                            <select
                              name="status"
                              defaultValue={proposal.status}
                              onChange={(event) => event.currentTarget.form?.requestSubmit()}
                              className="h-8 min-w-[140px] rounded-md border border-input bg-background px-2 text-xs"
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </form>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <Card className="border-brand/30 xl:sticky xl:top-6 xl:h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Nueva propuesta</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createProposalAction} className="grid gap-3">
              <input
                name="title"
                placeholder="Título de propuesta"
                required
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
              <select
                name="clientId"
                required
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecciona cliente</option>
                {formData.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nombre}
                  </option>
                ))}
              </select>
              <select
                name="ownerId"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Responsable (yo por defecto)</option>
                {formData.owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
              <input
                name="amount"
                type="number"
                min={0}
                step="0.01"
                required
                placeholder="Importe (€)"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
              <input
                name="validUntil"
                type="date"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
              <textarea
                name="notes"
                placeholder="Notas de contexto comercial"
                className="min-h-28 rounded-md border border-input bg-background p-3 text-sm"
              />
              <button
                type="submit"
                className="h-10 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground"
              >
                Guardar propuesta
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusFilterPill({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Button asChild size="sm" variant={active ? "brand" : "outline"} className="rounded-full">
      <Link href={href}>
        {label} · {count}
      </Link>
    </Button>
  );
}

function buildFilterHref(status: ProposalFilter, q?: string) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  const normalizedQuery = (q ?? "").trim();
  if (normalizedQuery) params.set("q", normalizedQuery);
  const queryString = params.toString();
  return queryString ? `/propuestas?${queryString}` : "/propuestas";
}

function isValidFilter(value: string | undefined): value is ProposalFilter {
  return (
    value === "all" ||
    value === "expired" ||
    value === "draft" ||
    value === "sent" ||
    value === "in_review" ||
    value === "negotiation" ||
    value === "won" ||
    value === "lost"
  );
}

function fmtDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
