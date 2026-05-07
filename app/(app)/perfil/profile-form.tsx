"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Send,
  XCircle,
} from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  removeAvatarAction,
  sendTelegramTestAction,
  type AvatarActionState,
  uploadAvatarAction,
  updateProfileAction,
  type ProfileFormState,
  type TelegramTestResult,
} from "@/lib/profile/actions";
import type { UserRow } from "@/types/database";

const profileInitial: ProfileFormState = { status: "idle" };
const avatarInitial: AvatarActionState = { status: "idle" };

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

function SaveProfileButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" disabled={pending} className="min-w-[140px]">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Guardar
    </Button>
  );
}

function AvatarSubmitSpinner() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </span>
  );
}

function RemoveAvatarButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="mt-4 flex justify-center sm:justify-start">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        className="text-muted-foreground"
        onClick={() =>
          start(async () => {
            await removeAvatarAction();
            router.refresh();
          })
        }
      >
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Quitar foto
      </Button>
    </div>
  );
}

export function ProfileForm({ user }: { user: UserRow }) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateProfileAction, profileInitial);
  const [avatarState, avatarAction] = useActionState(uploadAvatarAction, avatarInitial);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "saved" || avatarState.status === "saved") {
      router.refresh();
    }
  }, [state.status, avatarState.status, router]);

  return (
    <div className="space-y-10">
      {/* Foto */}
      <section className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-10 sm:text-left">
        <div className="relative shrink-0">
          <form action={avatarAction} className="relative inline-block">
            <AvatarSubmitSpinner />
            <input
              ref={fileRef}
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) {
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button
              type="button"
              className="group relative block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => fileRef.current?.click()}
              aria-label="Cambiar foto de perfil"
            >
              <UserAvatar
                avatarUrl={user.avatar_url}
                nombre={user.nombre}
                apellidos={user.apellidos}
                email={user.email}
                size="lg"
                className="transition-opacity group-hover:opacity-90"
              />
              <span className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-soft">
                <Camera className="h-4 w-4 text-muted-foreground" />
              </span>
            </button>
          </form>
          {user.avatar_url ? <RemoveAvatarButton /> : null}
          {avatarState.status === "error" && (
            <p className="mt-2 max-w-xs text-center text-xs text-destructive sm:text-left">
              {avatarState.message}
            </p>
          )}
          {avatarState.status === "saved" && (
            <p className="mt-2 text-xs text-brand">Foto actualizada.</p>
          )}
        </div>

        <div className="mt-6 max-w-md space-y-1 sm:mt-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {[user.nombre, user.apellidos].filter(Boolean).join(" ") || "Tu nombre"}
          </h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground">
            La foto se usa en la barra lateral y aquí. JPG o PNG, máximo 2 MB.
          </p>
        </div>
      </section>

      {/* Esencial */}
      <form action={formAction} className="space-y-8">
        <Card className="border-border/80 shadow-none">
          <CardContent className="space-y-6 pt-8">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre para mostrar</Label>
              <Input
                id="nombre"
                name="nombre"
                required
                autoComplete="name"
                placeholder="Cómo te verá el equipo"
                defaultValue={user.nombre ?? ""}
                className="max-w-md"
              />
              <FieldError state={state} field="nombre" />
            </div>

            {state.status === "error" && !state.fieldErrors && (
              <p className="text-sm text-destructive">{state.message}</p>
            )}
            {state.status === "saved" && (
              <p className="text-sm text-brand">Cambios guardados.</p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <SaveProfileButton />
            </div>
          </CardContent>
        </Card>

        {/* Opcional: facturación y Telegram */}
        <details className="rounded-lg border border-border/70 bg-card/30 open:bg-card/40">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
            <span>Más datos (opcional)</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </summary>
          <div className="space-y-6 border-t border-border/60 px-4 pb-6 pt-4">
            <p className="text-xs text-muted-foreground">
              Solo si necesitáis estos campos para procesos internos o facturación. Podéis dejarlos vacíos.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="nif">NIF</Label>
                <Input id="nif" name="nif" defaultValue={user.nif ?? ""} />
                <FieldError state={state} field="nif" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                name="direccion"
                defaultValue={user.direccion ?? ""}
              />
              <FieldError state={state} field="direccion" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cp">CP</Label>
                <Input id="cp" name="cp" defaultValue={user.cp ?? ""} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input id="ciudad" name="ciudad" defaultValue={user.ciudad ?? ""} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                name="iban"
                defaultValue={user.iban ?? ""}
                className="font-mono text-sm"
              />
              <FieldError state={state} field="iban" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>

            <div className="rounded-md border border-border/60 bg-secondary/20 px-3 py-2 text-xs text-muted-foreground">
              Prefijo de factura asignado:{" "}
              <span className="font-mono text-foreground">{user.prefix_factura}</span>{" "}
              (no editable)
            </div>

            <TelegramBlock user={user} state={state} />

            <div className="flex flex-wrap gap-3 pt-2">
              <SaveProfileButton />
            </div>
          </div>
        </details>
      </form>
    </div>
  );
}

function TelegramBlock({
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
    <div className="space-y-3 rounded-lg border border-border/50 bg-background/80 p-4">
      <p className="text-sm font-medium">Telegram (opcional)</p>
      <div className="space-y-2">
        <Label htmlFor="telegram_chat_id">Chat ID</Label>
        <Input
          id="telegram_chat_id"
          name="telegram_chat_id"
          defaultValue={user.telegram_chat_id ?? ""}
          placeholder="123456789"
          className="max-w-xs font-mono text-sm"
        />
        <FieldError state={state} field="telegram_chat_id" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={runTest} disabled={testing}>
          {testing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Probar envío
        </Button>
        {testResult?.ok && (
          <span className="inline-flex items-center gap-1.5 text-sm text-brand">
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
    </div>
  );
}
