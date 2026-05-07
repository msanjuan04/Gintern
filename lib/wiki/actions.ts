"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createActivityLog } from "@/lib/activity-logs/server";
import { createClient } from "@/lib/supabase/server";

const pageSchema = z.object({
  title: z.string().min(3, "Título obligatorio."),
  area: z.string().min(2, "Área obligatoria."),
  subcategory: z.string().optional(),
  driveUrl: z.string().url("URL de Drive no válida."),
  content: z.string().optional(),
  isPublished: z.boolean().default(true),
});

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function createWikiPageAction(formData: FormData) {
  const parsed = pageSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    area: String(formData.get("area") ?? ""),
    subcategory: String(formData.get("subcategory") ?? "") || undefined,
    driveUrl: String(formData.get("driveUrl") ?? ""),
    content: String(formData.get("content") ?? "") || undefined,
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const baseSlug = slugify(parsed.data.title);
  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  const normalizedArea = parsed.data.area.trim().toLowerCase();
  const normalizedSubcategory = parsed.data.subcategory?.trim().toLowerCase() ?? "";
  const category = normalizedSubcategory
    ? `${normalizedArea}/${normalizedSubcategory}`
    : normalizedArea;
  const normalizedContent = parsed.data.content?.trim();
  const content = normalizedContent?.length
    ? `Drive: ${parsed.data.driveUrl}\n\n${normalizedContent}`
    : `Drive: ${parsed.data.driveUrl}`;

  const { data, error } = await supabase
    .from("knowledge_pages")
    .insert({
      slug,
      title: parsed.data.title,
      category,
      content,
      is_published: parsed.data.isPublished,
      owner_id: user.id,
      last_edited_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await createActivityLog({
    module: "wiki",
    action: "page_created",
    entityType: "knowledge_page",
    entityId: data.id,
    metadata: { title: parsed.data.title, category },
  });

  revalidatePath("/wiki");
  revalidatePath("/logs");
}
