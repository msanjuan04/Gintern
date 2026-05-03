"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toggleClientActivoAction } from "@/lib/clients/actions";

export function ArchiveButton({ id, activo }: { id: string; activo: boolean }) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      await toggleClientActivoAction(id, !activo);
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : activo ? (
        <Archive className="mr-2 h-4 w-4" />
      ) : (
        <ArchiveRestore className="mr-2 h-4 w-4" />
      )}
      {activo ? "Archivar" : "Reactivar"}
    </Button>
  );
}
