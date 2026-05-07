"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { signInWithPassword, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="default"
      size="lg"
      disabled={pending}
      className="group h-12 w-full justify-center rounded-md text-sm font-medium tracking-tight"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Entrando…
        </>
      ) : (
        <>
          Entrar
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(signInWithPassword, initialState);
  const [showPassword, setShowPassword] = useState(false);

  const isError = state.status === "error";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label
          htmlFor="email"
          className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
        >
          Email
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@gnerai.com"
            className={cn(
              "h-12 pl-10 text-[15px]",
              isError && "border-destructive/60 focus-visible:ring-destructive/40"
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
        >
          Contraseña
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={cn(
              "h-12 pr-12 text-[15px]",
              isError && "border-destructive/60 focus-visible:ring-destructive/40"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {isError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/[0.06] px-3.5 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
