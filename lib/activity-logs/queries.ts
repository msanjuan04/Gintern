import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ActivityLogListItem = {
  id: string;
  module: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  actor_name: string | null;
  metadata: Record<string, unknown>;
};

export async function listActivityLogs(limit = 200): Promise<ActivityLogListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id, module, action, entity_type, entity_id, created_at, metadata, actor:team_members(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (error.code === "PGRST205") return [];
    throw error;
  }

  return (data ?? []).map((row) => {
    const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor;
    return {
      id: row.id,
      module: row.module,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      created_at: row.created_at,
      actor_name: actor?.full_name || actor?.email || null,
      metadata:
        row.metadata && typeof row.metadata === "object"
          ? (row.metadata as Record<string, unknown>)
          : {},
    };
  });
}
