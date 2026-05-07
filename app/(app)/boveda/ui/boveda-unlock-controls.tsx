"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { lockBovedaSecretsAction, unlockBovedaSecretsAction } from "@/lib/boveda/actions";

export function BovedaUnlockControls({ unlocked }: { unlocked: boolean }) {
  const router = useRouter();
  const [unlockState, unlockAction, unlockPending] = useActionState(unlockBovedaSecretsAction, {
    ok: false,
  });
  const [lockState, lockAction, lockPending] = useActionState(lockBovedaSecretsAction, {
    ok: false,
  });

  useEffect(() => {
    if (unlockState.ok || lockState.ok) {
      router.refresh();
    }
  }, [unlockState.ok, lockState.ok, router]);

  if (unlocked) {
    return (
      <form action={lockAction} className="flex items-center gap-2">
        <span className="text-xs text-brand">Contraseñas desbloqueadas</span>
        <button
          type="submit"
          disabled={lockPending}
          className="h-8 rounded-md border border-border px-3 text-xs font-medium hover:bg-secondary disabled:opacity-60"
        >
          Bloquear
        </button>
      </form>
    );
  }

  return (
    <form action={unlockAction} className="flex flex-wrap items-center gap-2">
      <input
        type="password"
        name="masterPassword"
        required
        placeholder="Contraseña maestra"
        className="h-8 rounded-md border border-input bg-background px-2.5 text-xs"
      />
      <button
        type="submit"
        disabled={unlockPending}
        className="h-8 rounded-md bg-brand px-3 text-xs font-medium text-brand-foreground disabled:opacity-60"
      >
        Desbloquear
      </button>
      {unlockState.message ? (
        <span className="text-xs text-destructive">{unlockState.message}</span>
      ) : (
        <span className="text-xs text-muted-foreground">Las contraseñas quedan ocultas por defecto.</span>
      )}
    </form>
  );
}
