"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function createActivityLog(input: {
  module: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("activity_logs").insert({
    actor_id: user?.id ?? null,
    module: input.module,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });

  // Mantener la pantalla de auditoría al día sin repetir revalidate en cada acción.
  revalidatePath("/logs");
}
