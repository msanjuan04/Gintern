import { z } from "zod";

export const ticketStatusSchema = z.enum([
  "backlog",
  "in_progress",
  "blocked",
  "in_review",
  "done",
]);

export const ticketPrioritySchema = z.enum(["normal", "high", "fire"]);

export const createTicketSchema = z.object({
  title: z.string().min(3, "El título es obligatorio").max(160),
  description: z
    .string()
    .max(4000)
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  clientId: z
    .string()
    .uuid()
    .optional()
    .transform((v) => v ?? null),
  assigneeId: z
    .string()
    .uuid()
    .optional()
    .transform((v) => v ?? null),
  priority: ticketPrioritySchema.default("normal"),
  dueDate: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v : null)),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
