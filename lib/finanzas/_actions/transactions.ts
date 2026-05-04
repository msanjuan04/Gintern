"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const createTransactionSchema = z.object({
  concept: z.string().min(2, "Concepto obligatorio."),
  type: z.enum(["income", "expense"]),
  category: z.enum([
    "saas",
    "structural",
    "variable",
    "service",
    "uncategorized",
    "internal_movement",
  ]),
  amountNet: z.coerce.number().min(0, "Base imponible inválida."),
  taxAmount: z.coerce.number().min(0, "Impuestos inválidos."),
  amountTotal: z.coerce.number().min(0, "Total inválido."),
  issuedAt: z.string().min(1, "Fecha de emisión obligatoria."),
  paidAt: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
});

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function createTransactionAction(formData: FormData) {
  const parsed = createTransactionSchema.safeParse({
    concept: String(formData.get("concept") ?? ""),
    type: String(formData.get("type") ?? ""),
    category: String(formData.get("category") ?? ""),
    amountNet: String(formData.get("amountNet") ?? "0"),
    taxAmount: String(formData.get("taxAmount") ?? "0"),
    amountTotal: String(formData.get("amountTotal") ?? "0"),
    issuedAt: String(formData.get("issuedAt") ?? ""),
    paidAt: String(formData.get("paidAt") ?? "") || undefined,
    clientId: String(formData.get("clientId") ?? "") || undefined,
    projectId: String(formData.get("projectId") ?? "") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  let invoiceFilePath: string | null = null;
  const rawFile = formData.get("invoiceFile");
  if (rawFile instanceof File && rawFile.size > 0) {
    const bytes = Buffer.from(await rawFile.arrayBuffer());
    const safeName = sanitizeFilename(rawFile.name || "adjunto");
    const path = `finanzas/transactions/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("invoices").upload(path, bytes, {
      contentType: rawFile.type || "application/octet-stream",
      upsert: false,
    });
    if (uploadError) throw new Error(uploadError.message);
    invoiceFilePath = path;
  }

  const { error } = await supabase.from("transactions").insert({
    concept: parsed.data.concept,
    type: parsed.data.type,
    category: parsed.data.category,
    amount_net: parsed.data.amountNet,
    tax_amount: parsed.data.taxAmount,
    amount_total: parsed.data.amountTotal,
    issued_at: parsed.data.issuedAt,
    paid_at: parsed.data.paidAt || null,
    client_id: parsed.data.clientId || null,
    project_id: parsed.data.projectId || null,
    invoice_file_path: invoiceFilePath,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/finanzas");
}

