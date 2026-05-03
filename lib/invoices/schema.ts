import { z } from "zod";

export const invoiceLineSchema = z.object({
  descripcion: z.string().min(1, "Descripción obligatoria").max(500),
  cantidad: z
    .number({ invalid_type_error: "Cantidad debe ser un número" })
    .positive("Cantidad debe ser positiva"),
  precio_unitario: z.number({
    invalid_type_error: "Precio debe ser un número",
  }),
});

export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida (formato YYYY-MM-DD)");

export const invoiceSchema = z
  .object({
    kind: z.enum(["client", "internal_compensation", "expense_received"]),
    client_id: z.string().uuid().nullable().optional(),
    counterparty_user_id: z.string().uuid().nullable().optional(),
    concepto: z.string().min(1, "Concepto obligatorio").max(500),
    fecha_emision: isoDate,
    fecha_vencimiento: isoDate,
    iva_pct: z.number().min(0).max(100),
    irpf_pct: z.number().min(0).max(100),
    recurrence: z.enum(["unique", "monthly", "quarterly", "annual"]),
    scope: z.enum(["gnerai", "personal"]),
    notas: z
      .string()
      .max(2000)
      .optional()
      .transform((v) => (v && v.trim() ? v.trim() : null)),
    status: z.enum(["draft", "sent"]),
    lines: z.array(invoiceLineSchema).min(1, "Añade al menos una línea"),
  })
  .refine(
    (d) => d.kind !== "client" || !!d.client_id,
    { message: "Selecciona un cliente", path: ["client_id"] }
  )
  .refine(
    (d) => d.kind !== "internal_compensation" || !!d.counterparty_user_id,
    {
      message: "Selecciona el socio contraparte",
      path: ["counterparty_user_id"],
    }
  )
  .refine(
    (d) =>
      new Date(d.fecha_vencimiento).getTime() >=
      new Date(d.fecha_emision).getTime(),
    {
      message: "El vencimiento no puede ser anterior a la emisión",
      path: ["fecha_vencimiento"],
    }
  );

export type InvoiceInput = z.infer<typeof invoiceSchema>;

export function calculateTotals(input: InvoiceInput) {
  const base = input.lines.reduce(
    (acc, l) => acc + Number((l.cantidad * l.precio_unitario).toFixed(2)),
    0
  );
  const baseRounded = Number(base.toFixed(2));
  const ivaAmount = Number(((baseRounded * input.iva_pct) / 100).toFixed(2));
  const irpfAmount = Number(((baseRounded * input.irpf_pct) / 100).toFixed(2));
  const total = Number((baseRounded + ivaAmount - irpfAmount).toFixed(2));
  return {
    base_imponible: baseRounded,
    iva_amount: ivaAmount,
    irpf_amount: irpfAmount,
    total,
  };
}

export function deriveDirection(
  kind: InvoiceInput["kind"]
): "issued" | "received" {
  return kind === "expense_received" ? "received" : "issued";
}
