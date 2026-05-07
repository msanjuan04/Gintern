import { isBovedaUnlocked, listCredentials } from "@/lib/boveda/queries";
import { listClients } from "@/lib/clients/queries";

import { BovedaNav } from "../ui/boveda-nav";
import { BovedaClientesList } from "../ui/boveda-clientes-list";
import { BovedaUnlockControls } from "../ui/boveda-unlock-controls";

export const metadata = {
  title: "Contraseñas de clientes · GNERAI",
};

export default async function BovedaClientesPage() {
  const [credentials, clients, unlocked] = await Promise.all([
    listCredentials(),
    listClients({ includeInactive: true }),
    isBovedaUnlocked(),
  ]);
  const clientCredentials = credentials.filter((item) => item.scope === "client").map((item) => ({
    id: item.id,
    service: item.service,
    account_identifier: item.account_identifier,
    client_id: item.client_id,
    client_name: item.client_name,
    environment: item.environment,
    secret_hint: item.secret_hint,
    vault_secret_ref: item.vault_secret_ref,
    has_secret: item.has_secret,
    rotation_due_on: item.rotation_due_on,
    owner_name: item.owner_name,
  }));
  const clientRows = clients.map((client) => ({
    id: client.id,
    nombre: client.nombre,
    activo: client.activo,
  }));

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Contraseñas de clientes</h1>
        <p className="text-sm text-muted-foreground">
          Vista por cliente para asociar y revisar accesos de Supabase, Meta, Ads, etc.
        </p>
        <BovedaUnlockControls unlocked={unlocked} />
        <BovedaNav active="clientes" />
      </header>

      <BovedaClientesList clients={clientRows} credentials={clientCredentials} />
    </div>
  );
}
