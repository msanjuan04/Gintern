"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Check,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteInvoiceAction,
  markInvoicePaidAction,
  setInvoiceStatusAction,
} from "@/lib/invoices/actions";
import type { InvoiceStatus } from "@/types/database";

export function InvoiceActionsBar({
  id,
  status,
}: {
  id: string;
  status: InvoiceStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPaidPanel, setShowPaidPanel] = useState(false);
  const [paidDate, setPaidDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

  const handle = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (err) {
        alert((err as Error).message);
      }
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" && (
        <>
          <Button
            variant="brand"
            size="sm"
            onClick={() => handle(() => setInvoiceStatusAction(id, "sent"))}
            disabled={isPending}
          >
            <Send className="mr-2 h-4 w-4" />
            Marcar como enviada
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              confirm("¿Eliminar este borrador? No se puede deshacer.") &&
              handle(() => deleteInvoiceAction(id))
            }
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </>
      )}

      {status === "sent" && !showPaidPanel && (
        <>
          <Button
            variant="brand"
            size="sm"
            onClick={() => setShowPaidPanel(true)}
            disabled={isPending}
          >
            <Check className="mr-2 h-4 w-4" />
            Marcar como cobrada
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              confirm("¿Anular esta factura?") &&
              handle(() => setInvoiceStatusAction(id, "cancelled"))
            }
            disabled={isPending}
          >
            <Ban className="mr-2 h-4 w-4" />
            Anular
          </Button>
        </>
      )}

      {status === "sent" && showPaidPanel && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="h-9 w-auto"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
          />
          <Button
            variant="brand"
            size="sm"
            disabled={isPending}
            onClick={() => handle(() => markInvoicePaidAction(id, paidDate))}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Confirmar cobro
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPaidPanel(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
        </div>
      )}

      {status === "paid" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handle(() => setInvoiceStatusAction(id, "sent"))}
          disabled={isPending}
        >
          Revertir cobro
        </Button>
      )}

      {status === "cancelled" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handle(() => setInvoiceStatusAction(id, "sent"))}
          disabled={isPending}
        >
          Reactivar
        </Button>
      )}
    </div>
  );
}
