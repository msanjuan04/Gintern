"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  deleteMovementAction,
  toggleMovementCobradoAction,
} from "@/lib/movements/actions";
import type { MovementType } from "@/types/database";

export function MovementRowActions({
  id,
  tipo,
  cobrado,
  hasInvoice,
}: {
  id: string;
  tipo: MovementType;
  cobrado: boolean;
  hasInvoice: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (err) {
        alert((err as Error).message);
      }
    });

  return (
    <div className="flex items-center justify-end gap-1">
      {!cobrado ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={tipo === "income" ? "Marcar cobrado" : "Marcar pagado"}
          disabled={isPending}
          onClick={() => run(() => toggleMovementCobradoAction(id, true))}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          <span className="sr-only">Marcar cobrado/pagado</span>
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Revertir"
          disabled={isPending}
          onClick={() => run(() => toggleMovementCobradoAction(id, false))}
        >
          <RotateCcw className="h-4 w-4" />
          <span className="sr-only">Revertir</span>
        </Button>
      )}
      {!hasInvoice && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Eliminar"
          disabled={isPending}
          onClick={() =>
            confirm("¿Eliminar este movimiento?") &&
            run(() => deleteMovementAction(id))
          }
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Eliminar</span>
        </Button>
      )}
    </div>
  );
}
