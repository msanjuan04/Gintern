"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTicketWithExtrasAction } from "@/lib/tickets/actions";

export function NewTicketForm({
  clients,
  members,
}: {
  clients: Array<{ id: string; nombre: string }>;
  members: Array<{ id: string; name: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");

  const canSubmit = useMemo(() => title.trim().length >= 3, [title]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={(formData) => {
            startTransition(async () => {
              await createTicketWithExtrasAction(formData);
              window.location.href = "/tickets";
            });
          }}
          className="grid gap-4 md:grid-cols-2"
        >
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              placeholder="Ej: Landing QA cliente X"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Contexto, bloqueos, criterios de cierre y @menciones"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientId">Cliente vinculado</Label>
            <select
              id="clientId"
              name="clientId"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue=""
            >
              <option value="">Sin cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigneeId">Responsable</Label>
            <select
              id="assigneeId"
              name="assigneeId"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue=""
            >
              <option value="">Sin asignar</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridad</Label>
            <select
              id="priority"
              name="priority"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue="normal"
            >
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="fire">Fuego</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Fecha límite</Label>
            <Input id="dueDate" name="dueDate" type="date" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Copia a compañeros (CC)</Label>
            <div className="grid gap-2 rounded-md border border-border/70 p-3 md:grid-cols-3">
              {members.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-xs">
                  <input type="checkbox" name="ccMemberIds" value={m.id} />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="label">Etiqueta adjunto (opcional)</Label>
            <Input id="label" name="label" placeholder="Brief, contrato, etc." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="externalUrl">Link adjunto (opcional)</Label>
            <Input id="externalUrl" name="externalUrl" placeholder="https://..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="file">Archivo adjunto (opcional)</Label>
            <div className="flex items-center justify-center rounded-md border border-dashed border-border p-4">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary">
                Seleccionar archivo
                <input id="file" name="file" type="file" className="hidden" />
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 md:col-span-2">
            <Button asChild type="button" variant="outline">
              <Link href="/tickets">Cancelar</Link>
            </Button>
            <Button type="submit" variant="brand" disabled={isPending || !canSubmit}>
              Crear ticket
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
