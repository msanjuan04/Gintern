"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createActivityLog } from "@/lib/activity-logs/server";
import { createClient } from "@/lib/supabase/server";

const manualEventSchema = z.object({
  title: z.string().min(3, "Título obligatorio."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida."),
  time: z.string().optional(),
  category: z.enum(["meeting", "deadline", "milestone", "note", "other"]),
  priority: z.enum(["normal", "high", "critical"]),
  description: z.string().max(1500).optional(),
});

export async function createCalendarManualEventAction(formData: FormData) {
  const parsed = manualEventSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? "") || undefined,
    category: String(formData.get("category") ?? "other"),
    priority: String(formData.get("priority") ?? "normal"),
    description: String(formData.get("description") ?? "") || undefined,
  });

  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const { data: inserted, error } = await supabase
    .from("calendar_manual_events")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      event_date: parsed.data.date,
      event_time: parsed.data.time || null,
      category: parsed.data.category,
      priority: parsed.data.priority,
      created_by: user.id,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await createActivityLog({
    module: "calendario",
    action: "manual_event_created",
    entityType: "calendar_manual_event",
    entityId: inserted.id as string,
    metadata: {
      title: parsed.data.title,
      category: parsed.data.category,
      priority: parsed.data.priority,
      date: parsed.data.date,
    },
  });

  revalidatePath("/calendario");
  revalidatePath("/logs");
}

const manualEventUpdateSchema = z.object({
  eventId: z.string().uuid("Evento no válido."),
  title: z.string().min(3, "Título obligatorio."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida."),
  time: z.string().optional(),
  category: z.enum(["meeting", "deadline", "milestone", "note", "other"]),
  priority: z.enum(["normal", "high", "critical"]),
  description: z.string().max(1500).optional(),
});

export async function updateCalendarManualEventAction(formData: FormData) {
  const parsed = manualEventUpdateSchema.safeParse({
    eventId: String(formData.get("eventId") ?? ""),
    title: String(formData.get("title") ?? ""),
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? "") || undefined,
    category: String(formData.get("category") ?? "other"),
    priority: String(formData.get("priority") ?? "normal"),
    description: String(formData.get("description") ?? "") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("calendar_manual_events")
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      event_date: parsed.data.date,
      event_time: parsed.data.time || null,
      category: parsed.data.category,
      priority: parsed.data.priority,
    })
    .eq("id", parsed.data.eventId);

  if (error) throw new Error(error.message);
  revalidatePath("/calendario");
}

export async function toggleCalendarManualEventDoneAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const nextValue = String(formData.get("isDone") ?? "false") === "true";
  if (!eventId) throw new Error("Evento no válido.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("calendar_manual_events")
    .update({ is_done: nextValue })
    .eq("id", eventId);

  if (error) throw new Error(error.message);
  revalidatePath("/calendario");
}

export async function deleteCalendarManualEventAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) throw new Error("Evento no válido.");

  const supabase = await createClient();
  const { error } = await supabase.from("calendar_manual_events").delete().eq("id", eventId);

  if (error) throw new Error(error.message);
  revalidatePath("/calendario");
}
