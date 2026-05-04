"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createInvoiceAction,
  type InvoiceFormState,
} from "@/lib/invoices/actions";
import {
  KIND_LABELS,
  RECURRENCE_LABELS,
} from "@/lib/invoices/labels";
import { fmtMoney } from "@/lib/utils";
import type {
  ClientRow,
  InvoiceKind,
  RecurrenceType,
  Scope,
  UserRow,
} from "@/types/database";

type Line = {
  id: string;
  descripcion: string;
  cantidad: string;
  precio_unitario: string;
};

const newLine = (): Line => ({
  id: crypto.randomUUID(),
  descripcion: "",
  cantidad: "1",
  precio_unitario: "",
});

export type InvoiceFormDefaults = {
  kind: InvoiceKind;
  clientId: string | null;
  counterpartyId: string | null;
  concepto: string;
  initialLine: {
    descripcion: string;
    cantidad: string;
    precio_unitario: string;
  } | null;
};

const initialState: InvoiceFormState = { status: "idle" };

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function FieldError({
  state,
  field,
}: {
  state: InvoiceFormState;
  field: string;
}) {
  if (state.status !== "error") return null;
  const errors = state.fieldErrors?.[field];
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors.join(", ")}</p>;
}

export function InvoiceForm({
  clients,
  partners,
  currentUserId,
  defaults,
}: {
  clients: ClientRow[];
  partners: UserRow[];
  currentUserId: string;
  defaults?: InvoiceFormDefaults;
}) {
  const [state, formAction] = useActionState(createInvoiceAction, initialState);
  const [, startTransition] = useTransition();

  const [kind, setKind] = useState<InvoiceKind>(defaults?.kind ?? "client");
  const [scope, setScope] = useState<Scope>("gnerai");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("unique");
  const [ivaPct, setIvaPct] = useState("21");
  const [irpfPct, setIrpfPct] = useState("15");
  const [lines, setLines] = useState<Line[]>(() => {
    if (defaults?.initialLine) {
      return [
        {
          id: crypto.randomUUID(),
          descripcion: defaults.initialLine.descripcion,
          cantidad: defaults.initialLine.cantidad,
          precio_unitario: defaults.initialLine.precio_unitario,
        },
      ];
    }
    return [newLine()];
  });
  const [submitMode, setSubmitMode] = useState<"draft" | "sent">("draft");

  const otherPartners = partners.filter((p) => p.id !== currentUserId);

  const totals = useMemo(() => {
    const base = lines.reduce((acc, l) => {
      const c = Number(l.cantidad.replace(",", ".")) || 0;
      const p = Number(l.precio_unitario.replace(",", ".")) || 0;
      return acc + c * p;
    }, 0);
    const baseR = Number(base.toFixed(2));
    const iva = Number(((baseR * Number(ivaPct || "0")) / 100).toFixed(2));
    const irpf = Number(((baseR * Number(irpfPct || "0")) / 100).toFixed(2));
    const total = Number((baseR + iva - irpf).toFixed(2));
    return { base: baseR, iva, irpf, total };
  }, [lines, ivaPct, irpfPct]);

  const updateLine = (id: string, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const submitWithStatus = (status: "draft" | "sent") => {
    setSubmitMode(status);
  };

  return (
    <form
      action={(formData) => {
        formData.set("status", submitMode);
        formData.set(
          "lines",
          JSON.stringify(
            lines.map((l) => ({
              descripcion: l.descripcion,
              cantidad: Number(l.cantidad.replace(",", ".")) || 0,
              precio_unitario:
                Number(l.precio_unitario.replace(",", ".")) || 0,
            }))
          )
        );
        formData.set("scope", scope);
        formData.set("recurrence", recurrence);
        formData.set("kind", kind);
        startTransition(() => formAction(formData));
      }}
      className="space-y-6"
    >
      {/* Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de factura</CardTitle>
          <CardDescription>
            Determina qué campos pedimos y cómo afecta al balance.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {(Object.keys(KIND_LABELS) as InvoiceKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={
                kind === k
                  ? "rounded-md border-2 border-brand bg-brand-soft px-4 py-3 text-left text-sm shadow-soft transition-all"
                  : "rounded-md border border-border bg-background px-4 py-3 text-left text-sm transition-all hover:border-foreground/20"
              }
            >
              <div className="font-medium">{KIND_LABELS[k]}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {k === "client"
                  ? "Factura emitida a un cliente externo."
                  : k === "internal_compensation"
                    ? "Factura cruzada al otro socio para igualar bases."
                    : "Gasto recibido de un proveedor externo."}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Receptor */}
      {kind === "client" && (
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="client_id">Selecciona cliente *</Label>
            <Select
              id="client_id"
              name="client_id"
              required
              defaultValue={defaults?.clientId ?? ""}
            >
              <option value="" disabled>
                — Elige un cliente —
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
            <FieldError state={state} field="client_id" />
            {clients.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No tienes clientes activos.{" "}
                <Link href="/clientes/nuevo" className="text-brand underline">
                  Crear uno
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {kind === "internal_compensation" && (
        <Card>
          <CardHeader>
            <CardTitle>Socio contraparte</CardTitle>
            <CardDescription>
              El socio que va a recibir esta factura interna.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="counterparty_user_id">Selecciona socio *</Label>
            <Select
              id="counterparty_user_id"
              name="counterparty_user_id"
              required
              defaultValue={
                defaults?.counterpartyId ?? otherPartners[0]?.id ?? ""
              }
            >
              {otherPartners.length === 0 && (
                <option value="" disabled>
                  No hay otros socios registrados
                </option>
              )}
              {otherPartners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellidos ?? ""} ({p.prefix_factura})
                </option>
              ))}
            </Select>
            <FieldError state={state} field="counterparty_user_id" />
          </CardContent>
        </Card>
      )}

      {/* Concepto y fechas */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="concepto">Concepto *</Label>
            <Input
              id="concepto"
              name="concepto"
              required
              defaultValue={defaults?.concepto ?? ""}
              placeholder="Servicios profesionales de desarrollo y consultoría"
            />
            <FieldError state={state} field="concepto" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_emision">Fecha de emisión *</Label>
            <Input
              id="fecha_emision"
              name="fecha_emision"
              type="date"
              required
              defaultValue={todayISO()}
            />
            <FieldError state={state} field="fecha_emision" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_vencimiento">Vencimiento *</Label>
            <Input
              id="fecha_vencimiento"
              name="fecha_vencimiento"
              type="date"
              required
              defaultValue={todayISO(30)}
            />
            <FieldError state={state} field="fecha_vencimiento" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurrence">Recurrencia</Label>
            <Select
              id="recurrence"
              value={recurrence}
              onChange={(e) =>
                setRecurrence(e.currentTarget.value as RecurrenceType)
              }
            >
              {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map((r) => (
                <option key={r} value={r}>
                  {RECURRENCE_LABELS[r]}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Líneas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Líneas</CardTitle>
            <CardDescription>Concepto detallado de cada partida.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLines((prev) => [...prev, newLine()])}
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir línea
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((line, idx) => {
            const c = Number(line.cantidad.replace(",", ".")) || 0;
            const p = Number(line.precio_unitario.replace(",", ".")) || 0;
            const lineTotal = c * p;
            return (
              <div
                key={line.id}
                className="grid gap-3 rounded-md border border-border/60 bg-background p-3 md:grid-cols-[1fr,90px,120px,110px,40px] md:items-end md:gap-2"
              >
                <div className="space-y-1">
                  {idx === 0 && <Label className="text-xs">Descripción</Label>}
                  <Input
                    value={line.descripcion}
                    onChange={(e) =>
                      updateLine(line.id, { descripcion: e.target.value })
                    }
                    placeholder="Trabajo realizado en…"
                  />
                </div>
                <div className="space-y-1">
                  {idx === 0 && <Label className="text-xs">Cantidad</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={line.cantidad}
                    onChange={(e) =>
                      updateLine(line.id, { cantidad: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  {idx === 0 && <Label className="text-xs">Precio (€)</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={line.precio_unitario}
                    onChange={(e) =>
                      updateLine(line.id, { precio_unitario: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  {idx === 0 && <Label className="text-xs">Total</Label>}
                  <div className="flex h-11 items-center justify-end rounded-md bg-secondary/50 px-3 text-sm font-medium tabular-nums">
                    {fmtMoney(lineTotal)}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setLines((prev) =>
                      prev.length > 1
                        ? prev.filter((l) => l.id !== line.id)
                        : prev
                    )
                  }
                  disabled={lines.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Eliminar línea</span>
                </Button>
              </div>
            );
          })}
          <FieldError state={state} field="lines" />
        </CardContent>
      </Card>

      {/* Impuestos y totales */}
      <Card>
        <CardHeader>
          <CardTitle>Impuestos y total</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="iva_pct">IVA %</Label>
              <Input
                id="iva_pct"
                name="iva_pct"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={ivaPct}
                onChange={(e) => setIvaPct(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="irpf_pct">IRPF %</Label>
              <Input
                id="irpf_pct"
                name="irpf_pct"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={irpfPct}
                onChange={(e) => setIrpfPct(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Pon 0 si no aplica retención.
              </p>
            </div>
          </div>
          <div className="space-y-2 rounded-md bg-secondary/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Base imponible</span>
              <span className="tabular-nums">{fmtMoney(totals.base)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">IVA {ivaPct}%</span>
              <span className="tabular-nums">{fmtMoney(totals.iva)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">IRPF -{irpfPct}%</span>
              <span className="tabular-nums">-{fmtMoney(totals.irpf)}</span>
            </div>
            <div className="border-t border-border pt-2" />
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{fmtMoney(totals.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scope + notas */}
      <Card>
        <CardHeader>
          <CardTitle>Ámbito</CardTitle>
          <CardDescription>
            Afecta al balance solo si es GNERAI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setScope("gnerai")}
              className={
                scope === "gnerai"
                  ? "rounded-md border-2 border-brand bg-brand-soft px-4 py-3 text-left text-sm shadow-soft"
                  : "rounded-md border border-border bg-background px-4 py-3 text-left text-sm hover:border-foreground/20"
              }
            >
              <div className="font-medium">GNERAI</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Cuenta para el reparto entre socios.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setScope("personal")}
              className={
                scope === "personal"
                  ? "rounded-md border-2 border-foreground bg-secondary px-4 py-3 text-left text-sm shadow-soft"
                  : "rounded-md border border-border bg-background px-4 py-3 text-left text-sm hover:border-foreground/20"
              }
            >
              <div className="font-medium">Personal</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Movimiento privado, no entra en GNERAI.
              </div>
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas internas</Label>
            <Textarea
              id="notas"
              name="notas"
              rows={3}
              placeholder="No se imprimen en la factura."
            />
          </div>
        </CardContent>
      </Card>

      {state.status === "error" && !state.fieldErrors && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-md border border-border/60 bg-card p-3 shadow-card-hover">
        <Button asChild variant="ghost" type="button">
          <Link href="/facturas">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          variant="outline"
          onClick={() => submitWithStatus("draft")}
        >
          Guardar borrador
        </Button>
        <Button
          type="submit"
          variant="brand"
          onClick={() => submitWithStatus("sent")}
        >
          Crear factura
        </Button>
      </div>
    </form>
  );
}
