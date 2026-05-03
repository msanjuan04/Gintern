import { z } from "zod";

const trim = (v: unknown) => (typeof v === "string" ? v.trim() : v);

const optionalString = (max: number) =>
  z
    .preprocess(trim, z.string().max(max))
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v !== "" ? (v as string) : null));

export const profileSchema = z.object({
  nombre: z.preprocess(trim, z.string().min(1, "Nombre obligatorio").max(200)),
  apellidos: optionalString(200),
  nif: z.preprocess(trim, z.string().min(1, "NIF obligatorio").max(20)),
  direccion: optionalString(500),
  cp: optionalString(20),
  ciudad: optionalString(120),
  iban: optionalString(40),
  irpf_pct: z
    .number({ invalid_type_error: "IRPF debe ser un número" })
    .min(0)
    .max(100),
  iva_pct: z
    .number({ invalid_type_error: "IVA debe ser un número" })
    .min(0)
    .max(100),
  telegram_chat_id: z
    .preprocess(trim, z.string().max(40))
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v !== "" ? (v as string) : null))
    .refine(
      (v) => v == null || /^-?\d+$/.test(v),
      "El chat_id debe ser un número (puede empezar por -)"
    ),
});

export type ProfileInput = z.infer<typeof profileSchema>;
