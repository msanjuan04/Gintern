import { z } from "zod";

export const clientSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(200),
  nif: z
    .string()
    .max(20)
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  email: z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null))
    .refine(
      (v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
      "Email no válido"
    ),
  contacto: z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  telefono: z
    .string()
    .max(40)
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  direccion: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  notas: z
    .string()
    .max(2000)
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  activo: z.boolean().default(true),
});

export type ClientInput = z.infer<typeof clientSchema>;
