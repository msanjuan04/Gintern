// Tipos manuales que reflejan el schema de supabase/migrations/0001_init.sql.
// Cuando estabilice todo, podemos generar este archivo con
//   npx supabase gen types typescript --project-id <ref> > types/database.ts

export type InvoiceDirection = "issued" | "received";
export type InvoiceKind = "client" | "internal_compensation" | "expense_received";
export type RecurrenceType = "unique" | "monthly" | "quarterly" | "annual";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type MovementType = "income" | "expense";
export type Scope = "gnerai" | "personal";
export type UserRole = "socio" | "colaborador";

export type UserRow = {
  id: string;
  email: string;
  nombre: string;
  apellidos: string | null;
  nif: string;
  direccion: string | null;
  cp: string | null;
  ciudad: string | null;
  iban: string | null;
  prefix_factura: string;
  irpf_pct: number | null;
  iva_pct: number | null;
  share_gnerai: number | null;
  telegram_chat_id: string | null;
  role: UserRole;
  created_at: string;
};

export type ClientRow = {
  id: string;
  nombre: string;
  nif: string | null;
  email: string | null;
  contacto: string | null;
  direccion: string | null;
  telefono: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  created_by: string | null;
};

export type InvoiceRow = {
  id: string;
  issuer_id: string;
  year: number;
  sequence_number: number;
  invoice_number: string;
  direction: InvoiceDirection;
  kind: InvoiceKind;
  client_id: string | null;
  counterparty_user_id: string | null;
  base_imponible: number;
  iva_pct: number;
  iva_amount: number;
  irpf_pct: number;
  irpf_amount: number;
  total: number;
  fecha_emision: string;
  fecha_vencimiento: string;
  fecha_cobro: string | null;
  recurrence: RecurrenceType;
  recurrence_parent_id: string | null;
  next_due_date: string | null;
  status: InvoiceStatus;
  concepto: string;
  notas: string | null;
  pdf_storage_path: string | null;
  scope: Scope;
  created_at: string;
  updated_at: string;
};

export type InvoiceLineRow = {
  id: string;
  invoice_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  orden: number;
};

export type MovementRow = {
  id: string;
  user_id: string;
  invoice_id: string | null;
  tipo: MovementType;
  scope: Scope;
  fecha: string;
  base_imponible: number;
  iva_amount: number | null;
  irpf_amount: number | null;
  total: number;
  concepto: string;
  client_id: string | null;
  cobrado: boolean;
  fecha_cobro: string | null;
  attachment_path: string | null;
  created_at: string;
};
