import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCredentialAction } from "@/lib/boveda/actions";
import { isBovedaUnlocked, listCredentials } from "@/lib/boveda/queries";

import { BovedaNav } from "../ui/boveda-nav";
import { BovedaUnlockControls } from "../ui/boveda-unlock-controls";

export const metadata = {
  title: "Contraseñas GNERAI · GNERAI",
};

export default async function BovedaInternasPage() {
  const [allCredentials, unlocked] = await Promise.all([listCredentials(), isBovedaUnlocked()]);
  const credentials = allCredentials.filter((item) => item.scope === "internal");
  const today = new Date().toISOString().slice(0, 10);
  const expiredCount = credentials.filter(
    (item) => item.rotation_due_on && item.rotation_due_on < today
  ).length;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Contraseñas GNERAI</h1>
        <p className="text-sm text-muted-foreground">
          Credenciales internas de la agencia, separadas de las de clientes.
        </p>
        <BovedaUnlockControls unlocked={unlocked} />
        <BovedaNav active="internas" />
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total internas" value={String(credentials.length)} />
        <MetricCard
          label="Entorno producción"
          value={String(credentials.filter((item) => item.environment === "prod").length)}
        />
        <MetricCard label="Rotación vencida" value={String(expiredCount)} tone="danger" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Listado de credenciales internas</CardTitle>
          </CardHeader>
          <CardContent>
            {credentials.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay credenciales internas.</p>
            ) : (
              <div className="space-y-2">
                {credentials.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-md border border-border/70 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{item.service}</p>
                        <p className="text-[11px] text-muted-foreground">Credencial interna</p>
                      </div>
                      <div className="flex flex-wrap items-start justify-end gap-2">
                        <Badge variant="outline">{formatEnvironment(item.environment)}</Badge>
                        <Badge
                          variant={
                            item.rotation_due_on && item.rotation_due_on < today
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {item.rotation_due_on ? `Rotación ${item.rotation_due_on}` : "Sin rotación"}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Cuenta</p>
                        <p className="truncate font-medium">{item.account_identifier}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Owner</p>
                        <p className="truncate font-medium">{item.owner_name ?? "Equipo"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pista</p>
                        <p className="truncate font-medium">{item.secret_hint ?? "Sin pista"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Secreto</p>
                        <p className="truncate font-mono">
                          {item.vault_secret_ref ?? (item.has_secret ? "•••••••• (bloqueada)" : "Sin secreto")}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit border-brand/30 xl:sticky xl:top-6">
          <CardHeader>
            <CardTitle className="text-lg">Nueva credencial GNERAI</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCredentialAction} className="grid gap-3">
              <input type="hidden" name="scope" value="internal" />
              <input
                name="service"
                required
                placeholder="Servicio (Supabase, OpenAI...)"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
              <input
                name="accountIdentifier"
                required
                placeholder="Cuenta / email"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
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
                name="password"
                type="password"
                placeholder="Contraseña (opcional)"
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
                placeholder="Notas internas"
                className="min-h-24 rounded-md border border-input bg-background p-3 text-sm"
              />
              <button
                type="submit"
                className="h-10 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground"
              >
                Guardar
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatEnvironment(value: "prod" | "staging" | "dev" | "other") {
  if (value === "prod") return "Producción";
  if (value === "staging") return "Staging";
  if (value === "dev") return "Desarrollo";
  return "Otro";
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={`mt-2 text-3xl font-semibold tabular-nums ${
            tone === "danger" ? "text-destructive" : ""
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
