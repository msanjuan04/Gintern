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
export type ProposalStatus =
  | "draft"
  | "sent"
  | "in_review"
  | "negotiation"
  | "won"
  | "lost";
export type BillingPeriod = "monthly" | "quarterly" | "annual";
export type TransactionKind = "income" | "expense";
export type TransactionCategory =
  | "saas"
  | "structural"
  | "variable"
  | "service"
  | "uncategorized"
  | "internal_movement";
export type OrganizationScope = "team" | "personal";
export type OrganizationTaskStatus = "todo" | "in_progress" | "done" | "blocked";
export type OrganizationTaskPriority = "low" | "medium" | "high";

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
  stage:
    | "lead"
    | "meeting"
    | "proposal"
    | "negotiation"
    | "active"
    | "inactive";
  estimated_ltv: number;
  owner_id: string | null;
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

export type ProposalRow = {
  id: string;
  code: string | null;
  client_id: string;
  owner_id: string;
  title: string;
  status: ProposalStatus;
  amount: number;
  valid_until: string | null;
  sent_at: string | null;
  responded_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionRow = {
  id: string;
  name: string;
  provider: string;
  amount: number;
  currency: string;
  billing_period: BillingPeriod;
  starts_on: string;
  next_renewal: string | null;
  owner_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TransactionRow = {
  id: string;
  concept: string;
  type: TransactionKind;
  category: TransactionCategory;
  amount_net: number;
  tax_amount: number;
  amount_total: number;
  issued_at: string;
  paid_at: string | null;
  client_id: string | null;
  project_id: string | null;
  invoice_file_path: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CredentialRow = {
  id: string;
  service: string;
  account_identifier: string;
  scope: "internal" | "client";
  client_id: string | null;
  secret_hint: string | null;
  vault_secret_ref: string | null;
  environment: "prod" | "staging" | "dev" | "other";
  owner_id: string;
  rotation_due_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type FileRow = {
  id: string;
  name: string;
  tag: string | null;
  external_url: string | null;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  version: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type KnowledgePageRow = {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  is_published: boolean;
  owner_id: string;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityLogRow = {
  id: string;
  actor_id: string | null;
  module: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type OrganizationTaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: OrganizationTaskStatus;
  priority: OrganizationTaskPriority;
  scope: OrganizationScope;
  assignee_id: string | null;
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationGoalRow = {
  id: string;
  title: string;
  description: string | null;
  scope: OrganizationScope;
  owner_id: string | null;
  target_value: number;
  current_value: number;
  target_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};
