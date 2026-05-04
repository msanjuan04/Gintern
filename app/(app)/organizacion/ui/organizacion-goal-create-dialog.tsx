"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrganizationGoalAction } from "@/lib/organizacion/_actions/goals";
import type { OrganizationDashboardData } from "@/lib/organizacion/_services/queries";

function CreateGoalSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Crear objetivo"}
    </Button>
  );
}

export function OrganizacionGoalCreateDialog({
  members,
  currentUserId,
}: {
  members: OrganizationDashboardData["members"];
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"team" | "personal">("team");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="brand">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo objetivo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Crear objetivo</DialogTitle>
          <DialogDescription>
            Meta medible; el progreso se actualiza desde cada tarjeta.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            await createOrganizationGoalAction(formData);
            setOpen(false);
            router.refresh();
          }}
          className="grid gap-4"
        >
          <div className="space-y-2">
            <Label htmlFor="og-title">Título</Label>
            <Input
              id="og-title"
              name="title"
              required
              minLength={3}
              placeholder="Ej. Facturación trimestral, NPS clientes…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="og-desc">Descripción (opcional)</Label>
            <Textarea
              id="og-desc"
              name="description"
              placeholder="Contexto, criterio de éxito, enlaces internos…"
              rows={3}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="og-scope">Alcance</Label>
              <select
                id="og-scope"
                name="scope"
                value={scope}
                onChange={(e) => setScope(e.target.value as "team" | "personal")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="team">Equipo</option>
                <option value="personal">Personal</option>
              </select>
            </div>
            {scope === "team" ? (
              <div className="space-y-2">
                <Label htmlFor="og-owner">Responsable</Label>
                <select
                  id="og-owner"
                  name="ownerId"
                  defaultValue={currentUserId}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name || member.email || member.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <input type="hidden" name="ownerId" value={currentUserId} />
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="og-target">Meta (valor objetivo)</Label>
              <Input
                id="og-target"
                name="targetValue"
                type="number"
                step="0.01"
                min={0}
                required
                defaultValue={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="og-current">Valor actual</Label>
              <Input
                id="og-current"
                name="currentValue"
                type="number"
                step="0.01"
                min={0}
                required
                defaultValue={0}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="og-date">Fecha objetivo (opcional)</Label>
            <Input id="og-date" name="targetDate" type="date" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <CreateGoalSubmit />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
