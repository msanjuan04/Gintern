import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listProfitabilityRows } from "@/lib/rentabilidad/queries";
import { fmtMoney } from "@/lib/utils";

export const metadata = {
  title: "Rentabilidad · GNERAI",
};

export default async function RentabilidadPage() {
  const rows = await listProfitabilityRows();
  const greenCount = rows.filter((row) => row.status === "verde").length;
  const redCount = rows.filter((row) => row.status === "rojo").length;
  const avg =
    rows.length > 0
      ? Number((rows.reduce((acc, row) => acc + row.eur_per_hour, 0) / rows.length).toFixed(2))
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Rentabilidad
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control de margen por proyecto con foco en decisiones.
          </p>
        </div>
        <Badge variant="outline">Fase 2</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="€/h media cartera" value={`${avg} €/h`} />
        <StatCard label="Proyectos en verde" value={String(greenCount)} />
        <StatCard label="Proyectos en rojo" value={String(redCount)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ranking de margen por hora</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay datos suficientes de proyectos y tiempo imputado.
              </p>
            ) : (
              <div className="space-y-2">
                {rows
                  .slice()
                  .sort((a, b) => b.eur_per_hour - a.eur_per_hour)
                  .map((row, index) => (
                    <article
                      key={row.project_id}
                      className="grid gap-2 rounded-md border border-border/70 p-3 md:grid-cols-[36px_1fr_auto_auto_auto]"
                    >
                      <p className="text-sm font-semibold text-muted-foreground">#{index + 1}</p>
                      <div>
                        <p className="text-sm font-medium">{row.project_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.client_name ?? "Sin cliente"} · {row.spent_hours} h reales
                        </p>
                      </div>
                      <p className="text-sm font-semibold">{fmtMoney(row.budget)}</p>
                      <p className="text-sm font-semibold">{row.eur_per_hour} €/h</p>
                      <Badge
                        variant={
                          row.status === "verde"
                            ? "success"
                            : row.status === "ambar"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {row.status === "verde"
                          ? "Verde"
                          : row.status === "ambar"
                            ? "Ámbar"
                            : "Rojo"}
                      </Badge>
                    </article>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-6 xl:h-fit">
          <CardHeader>
            <CardTitle className="text-base">Semáforo cartera</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SemaforoRow label="Verde" value={greenCount} color="bg-emerald-500" />
            <SemaforoRow
              label="Ámbar"
              value={rows.filter((row) => row.status === "ambar").length}
              color="bg-amber-500"
            />
            <SemaforoRow label="Rojo" value={redCount} color="bg-rose-500" />
            <div className="rounded-md border border-border/70 p-3 text-xs text-muted-foreground">
              Priorización recomendada: primero rojos con horas altas y bajo €/h.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SemaforoRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
      <span className="flex items-center gap-2 text-sm">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
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
