"use server";

import { revalidatePath } from "next/cache";

import { createActivityLog } from "@/lib/activity-logs/server";
import { createClient } from "@/lib/supabase/server";

import { createProposalSchema, proposalStatusSchema } from "./schema";

export async function createProposalAction(formData: FormData) {
  const parsed = createProposalSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    clientId: String(formData.get("clientId") ?? ""),
    amount: String(formData.get("amount") ?? "0"),
    validUntil: String(formData.get("validUntil") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { data, error } = await supabase
    .from("proposals")
    .insert({
    title: parsed.data.title,
    client_id: parsed.data.clientId,
    owner_id: user.id,
    amount: parsed.data.amount,
    valid_until: parsed.data.validUntil || null,
    notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  await createActivityLog({
    module: "propuestas",
    action: "proposal_created",
    entityType: "proposal",
    entityId: data.id,
    metadata: { title: parsed.data.title, amount: parsed.data.amount },
  });
  revalidatePath("/propuestas");
  revalidatePath("/dashboard");
  revalidatePath("/logs");
}

export async function updateProposalStatusAction(proposalId: string, nextStatus: string) {
  const status = proposalStatusSchema.parse(nextStatus);
  const supabase = await createClient();

  const patch: Record<string, string | null> = {
    status,
  };
  if (status === "sent" && !patch.sent_at) patch.sent_at = new Date().toISOString();
  if (status === "won" || status === "lost") patch.responded_at = new Date().toISOString();

  const { error } = await supabase.from("proposals").update(patch).eq("id", proposalId);
  if (error) throw new Error(error.message);
  await createActivityLog({
    module: "propuestas",
    action: "proposal_status_changed",
    entityType: "proposal",
    entityId: proposalId,
    metadata: { status },
  });

  revalidatePath("/propuestas");
  revalidatePath("/dashboard");
  revalidatePath("/logs");
}
