import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listActivityLogs } from "@/lib/activity-logs/queries";
import Link from "next/link";

export const metadata = {
  title: "Logs · GNERAI",
};

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ modulo?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const logs = await listActivityLogs();
  const selectedModule = (resolvedSearchParams.modulo ?? "all").toLowerCase();
  const filteredLogs =
    selectedModule === "all"
      ? logs
      : logs.filter((log) => log.module.toLowerCase() === selectedModule);
  const moduleCount = new Map<string, number>();
  for (const log of logs) {
    moduleCount.set(log.module, (moduleCount.get(log.module) ?? 0) + 1);
  }
  const topModule = Array.from(moduleCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const modules = Array.from(moduleCount.keys()).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Auditoría no editable de operaciones del sistema.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Eventos registrados" value={String(filteredLogs.length)} />
        <MetricCard label="Módulo más activo" value={topModule} />
        <MetricCard
          label="Último evento"
          value={filteredLogs[0] ? new Date(filteredLogs[0].created_at).toLocaleDateString() : "—"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtrar por módulo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link
            href="/logs"
            className={`rounded-full px-3 py-1 text-xs ${
              selectedModule === "all"
                ? "bg-brand text-brand-foreground"
                : "border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            Todos
          </Link>
          {modules.map((module) => (
            <Link
              key={module}
              href={`/logs?modulo=${encodeURIComponent(module)}`}
              className={`rounded-full px-3 py-1 text-xs ${
                selectedModule === module.toLowerCase()
                  ? "bg-brand text-brand-foreground"
                  : "border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {module}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline de actividad</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay eventos de auditoría.
            </p>
          ) : (
            <div className="relative space-y-4 pl-4 before:absolute before:bottom-0 before:left-1.5 before:top-0 before:w-px before:bg-border">
              {filteredLogs.map((log) => (
                <article key={log.id} className="relative rounded-md border border-border/70 p-3">
                  <span className="absolute -left-[14px] top-4 h-2.5 w-2.5 rounded-full bg-brand" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{log.module}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">
                    <span className="font-medium">{log.action}</span> sobre{" "}
                    <span className="font-medium">{log.entity_type}</span>
                    {log.entity_id ? ` (${log.entity_id.slice(0, 8)})` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    actor: {log.actor_name ?? "Sistema"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
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
