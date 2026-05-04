"use server";

import { revalidatePath } from "next/cache";

import { createActivityLog } from "@/lib/activity-logs/server";
import { createClient } from "@/lib/supabase/server";

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function createKnowledgeFileAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const tag = String(formData.get("tag") ?? "").trim() || null;
  const externalUrl = String(formData.get("externalUrl") ?? "").trim() || null;
  const rawFile = formData.get("file");
  const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;

  if (!name) throw new Error("Nombre obligatorio.");
  if (!externalUrl && !file) throw new Error("Añade enlace o archivo.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  let storagePath: string | null = null;
  let sizeBytes: number | null = null;
  let mimeType: string | null = null;
  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = sanitizeFilename(file.name || "archivo");
    storagePath = `knowledge/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(storagePath, buffer, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
    if (uploadError) throw new Error(uploadError.message);
    sizeBytes = file.size;
    mimeType = file.type || null;
  }

  const { data, error } = await supabase
    .from("files")
    .insert({
      name,
      tag,
      external_url: externalUrl,
      storage_path: storagePath,
      owner_id: user.id,
      size_bytes: sizeBytes,
      mime_type: mimeType,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await createActivityLog({
    module: "archivos",
    action: "file_created",
    entityType: "file",
    entityId: data.id,
    metadata: { name, tag, hasUpload: Boolean(file), hasUrl: Boolean(externalUrl) },
  });

  revalidatePath("/archivos");
  revalidatePath("/logs");
}
