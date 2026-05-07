"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createCredentialAction } from "@/lib/boveda/actions";

type ClientRow = {
  id: string;
  nombre: string;
  activo: boolean;
};

type CredentialRow = {
  id: string;
  service: string;
  account_identifier: string;
  client_id: string | null;
  client_name: string | null;
  environment: "prod" | "staging" | "dev" | "other";
  secret_hint: string | null;
  vault_secret_ref: string | null;
  has_secret: boolean;
  rotation_due_on: string | null;
  owner_name: string | null;
};

export function BovedaClientesList({
  clients,
  credentials,
}: {
  clients: ClientRow[];
  credentials: CredentialRow[];
}) {
  const [query, setQuery] = useState("");
  const [openedClientId, setOpenedClientId] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const byClientId = useMemo(() => {
    const map = new Map<string, CredentialRow[]>();
    for (const credential of credentials) {
      if (!credential.client_id) continue;
      map.set(credential.client_id, [...(map.get(credential.client_id) ?? []), credential]);
    }
    return map;
  }, [credentials]);

  const filteredClients = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((client) => {
      const rows = byClientId.get(client.id) ?? [];
      const text = [
        client.nombre,
        ...rows.flatMap((row) => [row.service, row.account_identifier, row.owner_name ?? ""]),
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(needle);
    });
  }, [clients, byClientId, query]);

  const totalWithoutCredentials = filteredClients.filter(
    (client) => (byClientId.get(client.id) ?? []).length === 0
  ).length;
  const totalExpired = credentials.filter(
    (item) => item.rotation_due_on && item.rotation_due_on < today
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <MiniMetric label="Clientes visibles" value={String(filteredClients.length)} />
        <MiniMetric label="Credenciales cliente" value={String(credentials.length)} />
        <MiniMetric label="Sin credenciales" value={String(totalWithoutCredentials)} />
        <MiniMetric label="Rotación vencida" value={String(totalExpired)} tone="danger" />
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar cliente, servicio, cuenta o owner..."
              className="pl-9"
            />
          </div>

          <div className="rounded-lg border border-border/70">
            {filteredClients.map((client) => {
              const rows = byClientId.get(client.id) ?? [];
              const isOpen = openedClientId === client.id;
              return (
                <div key={client.id} className="border-b border-border/60 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setOpenedClientId((prev) => (prev === client.id ? null : client.id))}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{client.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.activo ? "Activo" : "Inactivo"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline">{rows.length} credenciales</Badge>
                      <Badge variant={rows.length === 0 ? "secondary" : "warning"}>
                        {rows.length === 0 ? "Sin accesos" : "Configurado"}
                      </Badge>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="grid gap-3 border-t border-border/60 bg-muted/20 px-4 py-3 lg:grid-cols-[1.2fr_1fr]">
                      <div className="space-y-2">
                        {rows.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Este cliente aún no tiene credenciales asociadas.
                          </p>
                        ) : (
                          rows.map((item) => (
                            <article
                              key={item.id}
                              className="rounded-md border border-border/60 bg-background px-3 py-2"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{item.service}</p>
                                  <p className="text-[11px] text-muted-foreground">Credencial de cliente</p>
                                </div>
                                <div className="flex flex-wrap items-center justify-end gap-1">
                                  <Badge variant="outline" className="text-[10px]">
                                    {formatEnvironment(item.environment)}
                                  </Badge>
                                  <Badge
                                    variant={
                                      item.rotation_due_on && item.rotation_due_on < today
                                        ? "destructive"
                                        : "secondary"
                                    }
                                    className="text-[10px]"
                                  >
                                    {item.rotation_due_on ? item.rotation_due_on : "Sin rotación"}
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
                                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    Secreto
                                  </p>
                                  <p className="truncate font-mono">
                                    {item.vault_secret_ref ??
                                      (item.has_secret ? "•••••••• (bloqueada)" : "Sin secreto")}
                                  </p>
                                </div>
                              </div>
                            </article>
                          ))
                        )}
                      </div>

                      <form action={createCredentialAction} className="grid gap-2 rounded-md border border-brand/30 bg-background p-3">
                        <input type="hidden" name="scope" value="client" />
                        <input type="hidden" name="clientId" value={client.id} />
                        <p className="text-xs font-medium text-muted-foreground">
                          Asociar nueva credencial
                        </p>
                        <input
                          name="service"
                          required
                          placeholder="Servicio"
                          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs"
                        />
                        <input
                          name="accountIdentifier"
                          required
                          placeholder="Cuenta / email"
                          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            name="environment"
                            defaultValue="prod"
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          >
                            <option value="prod">Producción</option>
                            <option value="staging">Staging</option>
                            <option value="dev">Desarrollo</option>
                            <option value="other">Otro</option>
                          </select>
                          <input
                            name="rotationDueOn"
                            type="date"
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          />
                        </div>
                        <input
                          name="password"
                          type="password"
                          placeholder="Contraseña (opcional)"
                          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs"
                        />
                        <input
                          name="secretHint"
                          placeholder="Pista segura"
                          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs"
                        />
                        <input
                          name="vaultSecretRef"
                          placeholder="vault://..."
                          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs"
                        />
                        <button
                          type="submit"
                          className="h-8 rounded-md bg-brand px-3 text-xs font-medium text-brand-foreground"
                        >
                          Guardar
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniMetric({
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
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${tone === "danger" ? "text-destructive" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function formatEnvironment(value: "prod" | "staging" | "dev" | "other") {
  if (value === "prod") return "Prod";
  if (value === "staging") return "Staging";
  if (value === "dev") return "Dev";
  return "Otro";
}
