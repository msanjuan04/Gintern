import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCredentialAction } from "@/lib/boveda/actions";
import { listCredentials } from "@/lib/boveda/queries";
import { listClients } from "@/lib/clients/queries";
import Link from "next/link";

export const metadata = {
  title: "Contraseñas · GNERAI",
};

export default async function BovedaPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: "all" | "client" | "internal" }>;
}) {
  const resolvedSearchParams = await searchParams;
  const [credentials, clients] = await Promise.all([listCredentials(), listClients({ includeInactive: true })]);
  const scopeFilter = resolvedSearchParams.scope ?? "all";
  const filteredCredentials =
    scopeFilter === "all"
      ? credentials
      : credentials.filter((item) => item.scope === scopeFilter);
  const today = new Date().toISOString().slice(0, 10);
  const expiredCount = filteredCredentials.filter(
    (item) => item.rotation_due_on && item.rotation_due_on < today
  ).length;
  const dueSoonCount = filteredCredentials.filter((item) => {
    if (!item.rotation_due_on) return false;
    const due = new Date(item.rotation_due_on);
    const in30 = new Date(Date.now() + 30 * 86400000);
    return due >= new Date(today) && due <= in30;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Contraseñas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inventario de credenciales con rotación y referencia a secreto en Vault.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Credenciales visibles" value={String(filteredCredentials.length)} />
        <MetricCard
          label="Por cliente"
          value={String(filteredCredentials.filter((item) => item.scope === "client").length)}
        />
        <MetricCard
          label="Internas GNERAI"
          value={String(filteredCredentials.filter((item) => item.scope === "internal").length)}
        />
        <MetricCard label="Rotación vencida" value={String(expiredCount)} tone="danger" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard label="Vence en 30 días" value={String(dueSoonCount)} tone="warning" />
        <Card>
          <CardContent className="flex h-full items-center gap-2 pt-6">
            <Link
              href="/boveda"
              className={`rounded-full px-3 py-1 text-xs ${scopeFilter === "all" ? "bg-brand text-brand-foreground" : "border border-border text-muted-foreground hover:bg-secondary"}`}
            >
              Todo
            </Link>
            <Link
              href="/boveda?scope=client"
              className={`rounded-full px-3 py-1 text-xs ${scopeFilter === "client" ? "bg-brand text-brand-foreground" : "border border-border text-muted-foreground hover:bg-secondary"}`}
            >
              Contraseñas por cliente
            </Link>
            <Link
              href="/boveda?scope=internal"
              className={`rounded-full px-3 py-1 text-xs ${scopeFilter === "internal" ? "bg-brand text-brand-foreground" : "border border-border text-muted-foreground hover:bg-secondary"}`}
            >
              Contraseñas internas
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-brand/30">
        <CardHeader>
          <CardTitle className="text-lg">Registrar credencial</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCredentialAction} className="grid gap-3 md:grid-cols-2">
            <input
              name="service"
              required
              placeholder="Servicio (Meta Ads, Stripe...)"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
            <input
              name="accountIdentifier"
              required
              placeholder="Cuenta / email"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
            <select
              name="scope"
              defaultValue="internal"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="internal">Interna GNERAI</option>
              <option value="client">De cliente</option>
            </select>
            <select
              name="clientId"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Sin cliente asociado</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nombre}
                </option>
              ))}
            </select>
            <select
              name="environment"
              defaultValue="prod"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="prod">Producción</option>
              <option value="staging">Staging</option>
              <option value="dev">Desarrollo</option>
              <option value="other">Otro</option>
            </select>
            <input
              name="rotationDueOn"
              type="date"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
            <input
              name="secretHint"
              placeholder="Pista segura (sin exponer secreto)"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
            <input
              name="vaultSecretRef"
              placeholder="Referencia Vault (ej: vault://...)"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
            <textarea
              name="notes"
              placeholder="Notas de acceso y protocolo de rotación"
              className="min-h-24 rounded-md border border-input bg-background p-3 text-sm md:col-span-2"
            />
            <button
              type="submit"
              className="h-10 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground md:w-fit"
            >
              Guardar en bóveda
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mapa de credenciales</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCredentials.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin credenciales en este segmento.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredCredentials.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-2 rounded-md border border-border/70 p-3 md:grid-cols-[1fr_auto_auto]"
                >
                  <div>
                    <p className="text-sm font-medium">{item.service}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.account_identifier} · owner: {item.owner_name ?? "Equipo"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.scope === "client"
                        ? `Cliente: ${item.client_name ?? "Sin asignar"}`
                        : "Contraseña interna GNERAI"}
                    </p>
                    {(item.secret_hint || item.vault_secret_ref) && (
                      <p className="text-xs text-muted-foreground">
                        {item.secret_hint ?? "Sin pista"} · {item.vault_secret_ref ?? "Sin ref Vault"}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {item.environment === "prod"
                      ? "Producción"
                      : item.environment === "staging"
                        ? "Staging"
                        : item.environment === "dev"
                          ? "Desarrollo"
                          : "Otro"}
                  </Badge>
                  <Badge variant={item.scope === "client" ? "warning" : "secondary"}>
                    {item.scope === "client" ? "Cliente" : "Interna"}
                  </Badge>
                  <Badge
                    variant={
                      item.rotation_due_on && item.rotation_due_on < today
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {item.rotation_due_on ? `Rotación ${item.rotation_due_on}` : "Sin fecha de rotación"}
                  </Badge>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "danger";
}) {
  const valueClass =
    tone === "danger"
      ? "text-destructive"
      : tone === "warning"
        ? "text-amber-600"
        : "text-foreground";
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className={`mt-2 text-3xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
