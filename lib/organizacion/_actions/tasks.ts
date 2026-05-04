"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createActivityLog } from "@/lib/activity-logs/server";
import { createClient } from "@/lib/supabase/server";

const createTaskSchema = z.object({
  title: z.string().min(3, "Titulo obligatorio."),
  description: z.string().max(4000).optional(),
  scope: z.enum(["team", "personal"]),
  priority: z.enum(["low", "medium", "high"]),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

const updateTaskStatusSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["todo", "in_progress", "done", "blocked"]),
});

export async function createOrganizationTaskAction(formData: FormData) {
  const parsed = createTaskSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    scope: String(formData.get("scope") ?? "team"),
    priority: String(formData.get("priority") ?? "medium"),
    assigneeId: String(formData.get("assigneeId") ?? "") || undefined,
    dueDate: String(formData.get("dueDate") ?? "") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const assigneeId =
    parsed.data.scope === "personal"
      ? user.id
      : parsed.data.assigneeId || user.id;

  const { data: created, error } = await supabase
    .from("organization_tasks")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      scope: parsed.data.scope,
      priority: parsed.data.priority,
      assignee_id: assigneeId,
      created_by: user.id,
      due_date: parsed.data.dueDate ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await createActivityLog({
    module: "organizacion",
    action: "task_created",
    entityType: "organization_task",
    entityId: created.id as string,
    metadata: { title: parsed.data.title, scope: parsed.data.scope },
  });

  revalidatePath("/organizacion");
  revalidatePath("/organizacion/objetivos");
}

export async function updateOrganizationTaskStatusAction(input: {
  taskId: string;
  status: "todo" | "in_progress" | "done" | "blocked";
}) {
  const parsed = updateTaskStatusSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");

  const supabase = await createClient();
  const { data: taskRow } = await supabase
    .from("organization_tasks")
    .select("title")
    .eq("id", parsed.data.taskId)
    .maybeSingle();

  const { error } = await supabase
    .from("organization_tasks")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.taskId);
  if (error) throw new Error(error.message);

  await createActivityLog({
    module: "organizacion",
    action: "task_status_changed",
    entityType: "organization_task",
    entityId: parsed.data.taskId,
    metadata: { title: taskRow?.title ?? null, status: parsed.data.status },
  });

  revalidatePath("/organizacion");
  revalidatePath("/organizacion/objetivos");
}

