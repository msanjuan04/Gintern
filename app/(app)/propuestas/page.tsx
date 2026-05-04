import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProposalAction, updateProposalStatusAction } from "@/lib/proposals/actions";
import {
  getProposalKpis,
  listProposalFormData,
  listProposals,
} from "@/lib/proposals/queries";
import { fmtMoney } from "@/lib/utils";

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

export default async function PropuestasPage() {
  const [proposals, formData] = await Promise.all([listProposals(), listProposalFormData()]);
  const kpis = await getProposalKpis(proposals);
  const byStatus = {
    draft: proposals.filter((p) => p.status === "draft"),
    sent: proposals.filter((p) => p.status === "sent"),
    in_review: proposals.filter((p) => p.status === "in_review"),
    negotiation: proposals.filter((p) => p.status === "negotiation"),
    won: proposals.filter((p) => p.status === "won"),
    lost: proposals.filter((p) => p.status === "lost"),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Propuestas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control de pipeline comercial, seguimiento y cierre.
          </p>
        </div>
        <Badge variant="outline">Fase 2</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Sin respuesta" value={String(kpis.totalOpen)} />
        <StatCard label="En negociación" value={String(kpis.inNegotiation)} />
        <StatCard label="% cierre" value={`${kpis.winRate}%`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {([
            ["draft", "Borrador"],
            ["sent", "Enviada"],
            ["in_review", "En revisión"],
            ["negotiation", "Negociación"],
            ["won", "Ganada"],
            ["lost", "Perdida"],
          ] as const).map(([statusKey, title]) => (
            <Card key={statusKey}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{title}</span>
                  <Badge variant="outline">{byStatus[statusKey].length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {byStatus[statusKey].length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin propuestas</p>
                ) : (
                  byStatus[statusKey].map((proposal) => (
                    <article key={proposal.id} className="rounded-md border border-border/70 p-2">
                      <p className="truncate text-sm font-medium">
                        {(proposal.code ?? "PR-?") + " · " + proposal.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {proposal.client_name ?? "Sin cliente"} · {fmtMoney(proposal.amount)}
                      </p>
                      <form
                        action={async (formData) => {
                          "use server";
                          await updateProposalStatusAction(
                            proposal.id,
                            String(formData.get("status") ?? proposal.status)
                          );
                        }}
                        className="mt-2"
                      >
                        <select
                          name="status"
                          defaultValue={proposal.status}
                          onChange={(event) => event.currentTarget.form?.requestSubmit()}
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                        >
                          {Object.entries(STATUS_LABEL).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </form>
                    </article>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
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
