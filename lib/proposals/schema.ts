import { z } from "zod";

export const proposalStatusSchema = z.enum([
  "draft",
  "sent",
  "in_review",
  "negotiation",
  "won",
  "lost",
]);

export const createProposalSchema = z.object({
  title: z.string().min(3, "El título es obligatorio."),
  clientId: z.string().uuid("Selecciona un cliente válido."),
  ownerId: z.string().uuid("Selecciona un responsable válido.").optional(),
  amount: z.coerce.number().min(0, "El importe no puede ser negativo."),
  validUntil: z.string().optional(),
  notes: z.string().max(3000).optional(),
});
