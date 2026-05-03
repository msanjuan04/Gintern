import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida (YYYY-MM-DD)");

export const movementSchema = z
  .object({
    tipo: z.enum(["income", "expense"]),
    scope: z.enum(["gnerai", "personal"]),
    fecha: isoDate,
    concepto: z.string().min(1, "Concepto obligatorio").max(500),
    base_imponible: z.number({
      invalid_type_error: "La base debe ser un número",
    }),
    iva_amount: z.number().default(0),
    irpf_amount: z.number().default(0),
    client_id: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    cobrado: z.boolean().default(false),
    fecha_cobro: z
      .union([isoDate, z.literal("")])
      .nullable()
      .optional()
      .transform((v) => (v && v !== "" ? v : null)),
    notas: z
      .string()
      .max(2000)
      .optional()
      .transform((v) => (v && v.trim() ? v.trim() : null)),
  })
  .refine(
    (d) => !d.cobrado || !!d.fecha_cobro,
    {
      message:
        "Si marcas como cobrado/pagado, indica la fecha del cobro/pago",
      path: ["fecha_cobro"],
    }
  );

export type MovementInput = z.infer<typeof movementSchema>;

export function calculateMovementTotal(input: MovementInput) {
  return Number(
    (input.base_imponible + input.iva_amount - input.irpf_amount).toFixed(2)
  );
}
