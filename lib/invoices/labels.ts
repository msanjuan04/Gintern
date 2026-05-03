import type { InvoiceKind, InvoiceStatus, RecurrenceType } from "@/types/database";

export const KIND_LABELS: Record<InvoiceKind, string> = {
  client: "Cliente",
  internal_compensation: "Compensación interna",
  expense_received: "Gasto recibido",
};

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Cobrada",
  overdue: "Vencida",
  cancelled: "Anulada",
};

export const STATUS_BADGE: Record<
  InvoiceStatus,
  "success" | "warning" | "destructive" | "muted" | "outline"
> = {
  draft: "muted",
  sent: "outline",
  paid: "success",
  overdue: "warning",
  cancelled: "destructive",
};

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  unique: "Única",
  monthly: "Mensual",
  quarterly: "Trimestral",
  annual: "Anual",
};
