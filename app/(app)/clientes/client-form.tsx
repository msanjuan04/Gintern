"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClientFormState } from "@/lib/clients/actions";
import type { ClientRow } from "@/types/database";

const initialState: ClientFormState = { status: "idle" };

function FieldError({
  state,
  field,
}: {
  state: ClientFormState;
  field: string;
}) {
  if (state.status !== "error") return null;
  const errors = state.fieldErrors?.[field];
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors.join(", ")}</p>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}

export function ClientForm({
  action,
  client,
  submitLabel = "Guardar",
  successMessage,
}: {
  action: (
    prev: ClientFormState,
    formData: FormData
  ) => Promise<ClientFormState>;
  client?: ClientRow;
  submitLabel?: string;
  successMessage?: string;
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nombre">Nombre / razón social *</Label>
          <Input
            id="nombre"
            name="nombre"
            required
            defaultValue={client?.nombre ?? ""}
            placeholder="Acme S.L."
          />
          <FieldError state={state} field="nombre" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nif">NIF / CIF</Label>
          <Input
            id="nif"
            name="nif"
            defaultValue={client?.nif ?? ""}
            placeholder="B12345678"
          />
          <FieldError state={state} field="nif" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={client?.email ?? ""}
            placeholder="facturacion@acme.com"
          />
          <FieldError state={state} field="email" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contacto">Persona de contacto</Label>
          <Input
            id="contacto"
            name="contacto"
            defaultValue={client?.contacto ?? ""}
            placeholder="Ana Pérez"
          />
          <FieldError state={state} field="contacto" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            name="telefono"
            defaultValue={client?.telefono ?? ""}
            placeholder="+34 600 000 000"
          />
          <FieldError state={state} field="telefono" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="direccion">Dirección</Label>
          <Input
            id="direccion"
            name="direccion"
            defaultValue={client?.direccion ?? ""}
            placeholder="Calle Mayor 1, 08001 Barcelona"
          />
          <FieldError state={state} field="direccion" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notas">Notas internas</Label>
          <Textarea
            id="notas"
            name="notas"
            rows={4}
            defaultValue={client?.notas ?? ""}
            placeholder="Detalles de facturación, contactos secundarios, etc."
          />
          <FieldError state={state} field="notas" />
        </div>

        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            name="activo"
            defaultChecked={client ? client.activo : true}
            className="h-4 w-4 rounded border-input"
          />
          Cliente activo
        </label>
      </div>

      {state.status === "error" && !state.fieldErrors && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
      {state.status === "saved" && successMessage && (
        <p className="text-sm text-emerald-700">{successMessage}</p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="outline" type="button">
          <Link href={client ? `/clientes/${client.id}` : "/clientes"}>
            Cancelar
          </Link>
        </Button>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
