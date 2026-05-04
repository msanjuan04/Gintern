"use server";

import { revalidatePath } from "next/cache";

import { createActivityLog } from "@/lib/activity-logs/server";
import { createClient } from "@/lib/supabase/server";

import { createTicketSchema, ticketStatusSchema } from "./schema";

function normalizeMentionSource(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export async function createTicketAction(formData: FormData) {
  const parsed = createTicketSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    clientId: String(formData.get("clientId") ?? "") || undefined,
    assigneeId: String(formData.get("assigneeId") ?? "") || undefined,
    priority: String(formData.get("priority") ?? "normal"),
    dueDate: String(formData.get("dueDate") ?? "") || undefined,
  });

  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, message: "No autenticado" };

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      client_id: parsed.data.clientId,
      assignee_id: parsed.data.assigneeId,
      priority: parsed.data.priority,
      due_date: parsed.data.dueDate,
      reporter_id: user.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false as const, message: error.message };

  await createActivityLog({
    module: "tickets",
    action: "ticket_created",
    entityType: "ticket",
    entityId: data.id as string,
    metadata: { title: parsed.data.title },
  });

  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  return { ok: true as const, ticketId: data.id as string };
}

export async function moveTicketStatusAction(ticketId: string, nextStatus: string) {
  const status = ticketStatusSchema.parse(nextStatus);
  const supabase = await createClient();
  const { data: ticketRow } = await supabase
    .from("tickets")
    .select("title")
    .eq("id", ticketId)
    .maybeSingle();
  const patch =
    status === "done"
      ? { status, completed_at: new Date().toISOString() }
      : { status, completed_at: null };

  const { error } = await supabase.from("tickets").update(patch).eq("id", ticketId);
  if (error) return { ok: false as const, message: error.message };

  await createActivityLog({
    module: "tickets",
    action: "ticket_status_changed",
    entityType: "ticket",
    entityId: ticketId,
    metadata: { title: ticketRow?.title ?? null, status },
  });

  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function startTicketTimerAction(ticketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "No autenticado" };

  const { data: openEntry } = await supabase
    .from("time_tracking")
    .select("id")
    .eq("ticket_id", ticketId)
    .eq("team_member_id", user.id)
    .is("end_at", null)
    .limit(1)
    .maybeSingle();
  if (openEntry) return { ok: true as const };

  const { error } = await supabase.from("time_tracking").insert({
    ticket_id: ticketId,
    team_member_id: user.id,
    entry_type: "timer",
    start_at: new Date().toISOString(),
  });

  if (error) return { ok: false as const, message: error.message };
  revalidatePath("/tickets");
  return { ok: true as const };
}

export async function stopTicketTimerAction(ticketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "No autenticado" };

  const { data: openEntry, error: openError } = await supabase
    .from("time_tracking")
    .select("id, start_at")
    .eq("ticket_id", ticketId)
    .eq("team_member_id", user.id)
    .is("end_at", null)
    .order("start_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (openError) return { ok: false as const, message: openError.message };
  if (!openEntry) return { ok: true as const };

  const endAt = new Date();
  const startAt = new Date(openEntry.start_at);
  const minutesSpent = Math.max(
    0,
    Math.floor((endAt.getTime() - startAt.getTime()) / 60000)
  );

  const { error } = await supabase
    .from("time_tracking")
    .update({
      end_at: endAt.toISOString(),
      minutes_spent: minutesSpent,
    })
    .eq("id", openEntry.id);
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/tickets");
  return { ok: true as const };
}

export async function deleteTicketAction(ticketId: string) {
  const supabase = await createClient();

  const { data: ticketMeta } = await supabase
    .from("tickets")
    .select("title")
    .eq("id", ticketId)
    .maybeSingle();

  const { data: attachments } = await supabase
    .from("ticket_attachments")
    .select("file_path")
    .eq("ticket_id", ticketId);

  const filePaths = (attachments ?? [])
    .map((a) => a.file_path)
    .filter((p): p is string => typeof p === "string" && p.length > 0);

  if (filePaths.length > 0) {
    await supabase.storage.from("invoices").remove(filePaths);
  }

  const { error } = await supabase.from("tickets").delete().eq("id", ticketId);
  if (error) return { ok: false as const, message: error.message };

  await createActivityLog({
    module: "tickets",
    action: "ticket_deleted",
    entityType: "ticket",
    entityId: ticketId,
    metadata: { title: ticketMeta?.title ?? null },
  });

  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function attachToTicket(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  ticketId: string,
  formData: FormData
) {
  const label = String(formData.get("label") ?? "").trim() || null;
  const externalUrl = String(formData.get("externalUrl") ?? "").trim() || null;
  const rawFile = formData.get("file");
  const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;

  if (!externalUrl && !file) {
    return { ok: true as const };
  }

  let uploadedPath: string | null = null;
  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = sanitizeFilename(file.name || "adjunto");
    const storagePath = `tickets/${ticketId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(storagePath, buffer, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
    if (uploadError) return { ok: false as const, message: uploadError.message };
    uploadedPath = storagePath;
  }

  const { error } = await supabase.from("ticket_attachments").insert({
    ticket_id: ticketId,
    uploader_id: userId,
    label,
    file_path: uploadedPath,
    external_url: externalUrl,
  });

  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const };
}

export async function addTicketAttachmentAction(ticketId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "No autenticado" };

  const result = await attachToTicket(supabase, user.id, ticketId, formData);
  if (!result.ok) return result;
  revalidatePath("/tickets");
  return { ok: true as const };
}

export async function createTicketWithExtrasAction(formData: FormData) {
  const createResult = await createTicketAction(formData);
  if (!createResult.ok) return createResult;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "No autenticado" };

  const ticketId = createResult.ticketId;

  const ccIds = formData
    .getAll("ccMemberIds")
    .map((v) => String(v))
    .filter(Boolean);

  if (ccIds.length > 0) {
    const { error: ccError } = await supabase.from("ticket_watchers").insert(
      ccIds.map((id) => ({
        ticket_id: ticketId,
        team_member_id: id,
      }))
    );
    if (ccError && ccError.code !== "PGRST205") {
      return { ok: false as const, message: ccError.message };
    }
  }

  const attachResult = await attachToTicket(supabase, user.id, ticketId, formData);
  if (!attachResult.ok) return attachResult;

  revalidatePath("/tickets");
  return { ok: true as const };
}

export async function addTicketCommentAction(ticketId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { ok: false as const, message: "Comentario vacío." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "No autenticado" };

  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select("id, full_name, email")
    .eq("is_active", true);
  if (membersError) return { ok: false as const, message: membersError.message };

  const mentionsInBody = Array.from(body.matchAll(/@([a-zA-Z0-9._-]+)/g)).map((m) =>
    normalizeMentionSource(m[1] ?? "")
  );

  const mentionIds = new Set<string>();
  if (mentionsInBody.length > 0) {
    for (const member of members ?? []) {
      const fullNameKey = normalizeMentionSource(member.full_name ?? "");
      const emailKey = normalizeMentionSource(member.email ?? "");
      const emailUserKey = normalizeMentionSource((member.email ?? "").split("@")[0] ?? "");
      if (
        mentionsInBody.includes(fullNameKey) ||
        mentionsInBody.includes(emailKey) ||
        mentionsInBody.includes(emailUserKey)
      ) {
        mentionIds.add(member.id);
      }
    }
  }

  const { error } = await supabase.from("ticket_comments").insert({
    ticket_id: ticketId,
    author_id: user.id,
    body,
    mentions: Array.from(mentionIds),
  });
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/tickets");
  return { ok: true as const };
}
