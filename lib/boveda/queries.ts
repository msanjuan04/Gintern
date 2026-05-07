import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type CredentialListItem = {
  id: string;
  service: string;
  account_identifier: string;
  scope: "internal" | "client";
  client_id: string | null;
  client_name: string | null;
  environment: "prod" | "staging" | "dev" | "other";
  secret_hint: string | null;
  vault_secret_ref: string | null;
  has_secret: boolean;
  rotation_due_on: string | null;
  owner_name: string | null;
};

export async function isBovedaUnlocked() {
  const cookieStore = await cookies();
  return cookieStore.get("boveda_unlocked")?.value === "1";
}

export async function listCredentials(): Promise<CredentialListItem[]> {
  const unlocked = await isBovedaUnlocked();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credentials")
    .select(
      "id, service, account_identifier, scope, client_id, environment, secret_hint, vault_secret_ref, rotation_due_on, owner:team_members(full_name, email), client:clients(nombre)"
    )
    .order("rotation_due_on", { ascending: true, nullsFirst: false });
  if (error) {
    if (error.code === "PGRST205") return [];
    throw error;
  }

  return (data ?? []).map((row) => {
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
    const client = Array.isArray(row.client) ? row.client[0] : row.client;
    return {
      id: row.id,
      service: row.service,
      account_identifier: row.account_identifier,
      scope: row.scope,
      client_id: row.client_id,
      client_name: client?.nombre ?? null,
      environment: row.environment,
      secret_hint: row.secret_hint,
      vault_secret_ref: unlocked ? row.vault_secret_ref : null,
      has_secret: Boolean(row.vault_secret_ref),
      rotation_due_on: row.rotation_due_on,
      owner_name: owner?.full_name || owner?.email || null,
    };
  });
}
