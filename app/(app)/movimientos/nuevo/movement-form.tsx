"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";

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
  createMovementAction,
  type MovementFormState,
} from "@/lib/movements/actions";
import { fmtMoney } from "@/lib/utils";
import type { ClientRow, MovementType, Scope } from "@/types/database";

const initialState: MovementFormState = { status: "idle" };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function FieldError({
  state,
  field,
}: {
  state: MovementFormState;
  field: string;
}) {
  if (state.status !== "error") return null;
  const errors = state.fieldErrors?.[field];
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors.join(", ")}</p>;
}

export function MovementForm({ clients }: { clients: ClientRow[] }) {
  const [state, formAction] = useActionState(createMovementAction, initialState);
  const [, startTransition] = useTransition();

  const [tipo, setTipo] = useState<MovementType>("income");
  const [scope, setScope] = useState<Scope>("gnerai");
  const [cobrado, setCobrado] = useState(false);
  const [base, setBase] = useState("");
  const [iva, setIva] = useState("");
  const [irpf, setIrpf] = useState("");

  const totals = useMemo(() => {
    const b = Number(base.replace(",", ".")) || 0;
    const i = Number(iva.replace(",", ".")) || 0;
    const r = Number(irpf.replace(",", ".")) || 0;
    return Number((b + i - r).toFixed(2));
  }, [base, iva, irpf]);

  return (
    <form
      action={(formData) => {
        formData.set("tipo", tipo);
        formData.set("scope", scope);
        formData.set("cobrado", cobrado ? "true" : "");
        startTransition(() => formAction(formData));
      }}
      className="space-y-6"
    >
      {/* Scope toggle muy visible */}
      <Card>
        <CardHeader>
          <CardTitle>Ámbito</CardTitle>
          <CardDescription>
            Solo los movimientos GNERAI cuentan para el balance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setScope("gnerai")}
              className={
                scope === "gnerai"
                  ? "rounded-md border-2 border-brand bg-brand-soft px-4 py-3 text-left shadow-soft"
                  : "rounded-md border border-border bg-background px-4 py-3 text-left hover:border-foreground/20"
              }
            >
              <div className="text-sm font-medium">GNERAI</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Cuenta para el reparto entre socios.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setScope("personal")}
              className={
                scope === "personal"
                  ? "rounded-md border-2 border-foreground bg-secondary px-4 py-3 text-left shadow-soft"
                  : "rounded-md border border-border bg-background px-4 py-3 text-left hover:border-foreground/20"
              }
            >
              <div className="text-sm font-medium">Personal</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                No entra en el balance.
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de movimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setTipo("income")}
              className={
                tipo === "income"
                  ? "rounded-md border-2 border-brand bg-brand-soft px-4 py-3 text-left"
                  : "rounded-md border border-border px-4 py-3 text-left hover:border-foreground/20"
              }
            >
              <div className="text-sm font-medium">Ingreso</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Cobro recibido sin factura formal.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTipo("expense")}
              className={
                tipo === "expense"
                  ? "rounded-md border-2 border-foreground bg-secondary px-4 py-3 text-left"
                  : "rounded-md border border-border px-4 py-3 text-left hover:border-foreground/20"
              }
            >
              <div className="text-sm font-medium">Gasto</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Pago efectuado sin factura formal.
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Datos */}
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
              placeholder={tipo === "income" ? "Cobro proyecto X" : "Gasto en …"}
            />
            <FieldError state={state} field="concepto" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha *</Label>
            <Input
              id="fecha"
              name="fecha"
              type="date"
              required
              defaultValue={todayISO()}
            />
            <FieldError state={state} field="fecha" />
          </div>

          {tipo === "income" && (
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente</Label>
              <Select id="client_id" name="client_id" defaultValue="">
                <option value="">— Sin cliente asociado —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="base_imponible">Base imponible (€) *</Label>
            <Input
              id="base_imponible"
              name="base_imponible"
              type="number"
              step="0.01"
              inputMode="decimal"
              required
              value={base}
              onChange={(e) => setBase(e.target.value)}
            />
            <FieldError state={state} field="base_imponible" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="iva_amount">IVA (€)</Label>
              <Input
                id="iva_amount"
                name="iva_amount"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={iva}
                onChange={(e) => setIva(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="irpf_amount">IRPF (€)</Label>
              <Input
                id="irpf_amount"
                name="irpf_amount"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={irpf}
                onChange={(e) => setIrpf(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="rounded-md bg-secondary/50 p-4 md:col-span-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                Total {tipo === "income" ? "a cobrar" : "a pagar"}
              </span>
              <span className="text-2xl font-semibold tabular-nums">
                {fmtMoney(totals)}
              </span>
            </div>
          </div>

          <div className="space-y-3 md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={cobrado}
                onChange={(e) => setCobrado(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              {tipo === "income" ? "Ya cobrado" : "Ya pagado"}
            </label>
            {cobrado && (
              <div className="space-y-2">
                <Label htmlFor="fecha_cobro">
                  Fecha de {tipo === "income" ? "cobro" : "pago"} *
                </Label>
                <Input
                  id="fecha_cobro"
                  name="fecha_cobro"
                  type="date"
                  defaultValue={todayISO()}
                  required={cobrado}
                />
                <FieldError state={state} field="fecha_cobro" />
              </div>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" name="notas" rows={3} />
          </div>
        </CardContent>
      </Card>

      {state.status === "error" && !state.fieldErrors && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="ghost" type="button">
          <Link href="/movimientos">Cancelar</Link>
        </Button>
        <Button type="submit" variant="brand">
          Guardar movimiento
        </Button>
      </div>
    </form>
  );
}
