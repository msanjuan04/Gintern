"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";

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
import {
  sendTelegramTestAction,
  updateProfileAction,
  type ProfileFormState,
  type TelegramTestResult,
} from "@/lib/profile/actions";
import type { UserRow } from "@/types/database";

const initialState: ProfileFormState = { status: "idle" };

function FieldError({
  state,
  field,
}: {
  state: ProfileFormState;
  field: string;
}) {
  if (state.status !== "error") return null;
  const errors = state.fieldErrors?.[field];
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors.join(", ")}</p>;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Guardar cambios
    </Button>
  );
}

export function ProfileForm({ user }: { user: UserRow }) {
  const [state, formAction] = useFormState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
          <CardDescription>
            Aparecen en el bloque «Emisor» de tus PDFs.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              name="nombre"
              required
              defaultValue={user.nombre ?? ""}
            />
            <FieldError state={state} field="nombre" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apellidos">Apellidos</Label>
            <Input
              id="apellidos"
              name="apellidos"
              defaultValue={user.apellidos ?? ""}
            />
            <FieldError state={state} field="apellidos" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nif">NIF *</Label>
            <Input
              id="nif"
              name="nif"
              required
              defaultValue={user.nif ?? ""}
            />
            <FieldError state={state} field="nif" />
          </div>
          <div className="space-y-2">
            <Label>Email (no editable)</Label>
            <Input value={user.email} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dirección</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              name="direccion"
              defaultValue={user.direccion ?? ""}
              placeholder="Calle, número, piso"
            />
            <FieldError state={state} field="direccion" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp">CP</Label>
            <Input id="cp" name="cp" defaultValue={user.cp ?? ""} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ciudad">Ciudad</Label>
            <Input
              id="ciudad"
              name="ciudad"
              defaultValue={user.ciudad ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos fiscales y bancarios</CardTitle>
          <CardDescription>
            Defaults usados al crear facturas. El IBAN aparece en los PDFs.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              name="iban"
              defaultValue={user.iban ?? ""}
              placeholder="ES00 0000 0000 0000 0000 0000"
              className="font-mono"
            />
            <FieldError state={state} field="iban" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iva_pct">IVA % por defecto</Label>
            <Input
              id="iva_pct"
              name="iva_pct"
              type="number"
              step="0.01"
              inputMode="decimal"
              defaultValue={user.iva_pct ?? 21}
            />
            <FieldError state={state} field="iva_pct" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="irpf_pct">IRPF % por defecto</Label>
            <Input
              id="irpf_pct"
              name="irpf_pct"
              type="number"
              step="0.01"
              inputMode="decimal"
              defaultValue={user.irpf_pct ?? 15}
            />
            <FieldError state={state} field="irpf_pct" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Prefijo de factura (no editable)</Label>
            <Input value={user.prefix_factura} disabled className="font-mono" />
            <p className="text-xs text-muted-foreground">
              No se puede cambiar — afecta a la numeración correlativa ya
              emitida ({user.prefix_factura}-AÑO/NÚMERO).
            </p>
          </div>
        </CardContent>
      </Card>

      <TelegramSection user={user} state={state} />

      {state.status === "error" && !state.fieldErrors && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
      {state.status === "saved" && (
        <p className="text-sm text-emerald-700">Cambios guardados.</p>
      )}

      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}

function TelegramSection({
  user,
  state,
}: {
  user: UserRow;
  state: ProfileFormState;
}) {
  const [testing, startTest] = useTransition();
  const [testResult, setTestResult] = useState<TelegramTestResult | null>(null);

  const runTest = () => {
    setTestResult(null);
    startTest(async () => {
      const r = await sendTelegramTestAction();
      setTestResult(r);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificaciones Telegram</CardTitle>
        <CardDescription>
          Pega aquí tu chat_id para recibir avisos automáticos del bot.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="telegram_chat_id">Chat ID</Label>
          <Input
            id="telegram_chat_id"
            name="telegram_chat_id"
            defaultValue={user.telegram_chat_id ?? ""}
            placeholder="123456789"
            className="font-mono"
          />
          <FieldError state={state} field="telegram_chat_id" />
        </div>

        <details className="rounded-md border border-border/60 bg-secondary/30 p-3 text-sm">
          <summary className="cursor-pointer font-medium">
            ¿Cómo encontrar tu chat_id?
          </summary>
          <ol className="mt-2 ml-5 list-decimal space-y-1 text-xs text-muted-foreground">
            <li>
              Abre Telegram y busca <strong>@userinfobot</strong>.
            </li>
            <li>Pulsa Start. Te responde con tu Id.</li>
            <li>Pega el número en el campo de arriba y guarda.</li>
            <li>
              Asegúrate de haber hablado al menos una vez con el bot de GNERAI
              Finance (manda /start) para que pueda escribirte.
            </li>
          </ol>
        </details>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={runTest}
            disabled={testing}
          >
            {testing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar mensaje de prueba
          </Button>
          {testResult?.ok && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Mensaje enviado.
            </span>
          )}
          {testResult && !testResult.ok && (
            <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              {testResult.message}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
