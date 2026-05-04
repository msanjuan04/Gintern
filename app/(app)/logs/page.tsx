import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  describeActivityLog,
  formatMetadataPreview,
  MODULE_LABEL,
} from "@/lib/activity-logs/format-log";
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
  const topModuleEntry = Array.from(moduleCount.entries()).sort((a, b) => b[1] - a[1])[0];
  const topModuleLabel = topModuleEntry
    ? MODULE_LABEL[topModuleEntry[0]] ?? topModuleEntry[0]
    : "—";

  const modules = Array.from(moduleCount.keys()).sort((a, b) => a.localeCompare(b));
  const lastLog = filteredLogs[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Logs</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Historial de acciones importantes (tickets, clientes, finanzas, organización,
            contraseñas, etc.). Solo se listan eventos que el sistema registra de forma
            explícita; no sustituye a los logs de Supabase ni al historial completo de BD.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label={selectedModule === "all" ? "Eventos en vista" : "Coinciden filtro"}
          value={String(filteredLogs.length)}
        />
        <MetricCard label="Total cargado" value={String(logs.length)} />
        <MetricCard label="Módulo más activo" value={topModuleLabel} />
      </div>

      {lastLog && (
        <p className="text-xs text-muted-foreground">
          Último evento (según filtro):{" "}
          <span className="font-medium text-foreground">
            {new Date(lastLog.created_at).toLocaleString()}
          </span>
        </p>
      )}

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
              {MODULE_LABEL[module] ?? module}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Línea de tiempo</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>No hay eventos con este filtro.</p>
              <p className="text-xs">
                Si acabas de empezar, crea un ticket, guarda un cliente o registra una operación
                en Finanzas: a partir de ahora quedará reflejado aquí.
              </p>
            </div>
          ) : (
            <div className="relative space-y-3 pl-4 before:absolute before:bottom-0 before:left-1.5 before:top-0 before:w-px before:bg-border">
              {filteredLogs.map((log) => {
                const { headline, subline, href } = describeActivityLog(log);
                const extras = formatMetadataPreview(log.metadata);
                return (
                  <article
                    key={log.id}
                    className="relative rounded-lg border border-border/70 bg-card/30 p-3"
                  >
                    <span className="absolute -left-[14px] top-4 h-2.5 w-2.5 rounded-full bg-brand" />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {MODULE_LABEL[log.module] ?? log.module}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                      {href && (
                        <Link
                          href={href}
                          className="text-[11px] font-medium text-brand hover:underline"
                        >
                          Ir al módulo
                        </Link>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium leading-snug">{headline}</p>
                    {subline && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{subline}</p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Por: {log.actor_name ?? "Sistema"} ·{" "}
                      <span className="font-mono">{log.action}</span>
                      {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}…` : ""}
                    </p>
                    {extras.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {extras.map((row) => (
                          <li key={row.k}>
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              {row.k}: {row.v}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
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
