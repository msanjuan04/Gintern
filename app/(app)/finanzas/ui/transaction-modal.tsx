"use client";

import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { createTransactionAction } from "@/lib/finanzas/_actions/transactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  concept: z.string().min(2),
  type: z.enum(["income", "expense"]),
  category: z.enum([
    "saas",
    "structural",
    "variable",
    "service",
    "uncategorized",
    "internal_movement",
  ]),
  amountNet: z.coerce.number().min(0),
  taxAmount: z.coerce.number().min(0),
  amountTotal: z.coerce.number().min(0),
  issuedAt: z.string().min(1),
  paidAt: z.string().optional(),
  clientId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function TransactionModal({
  clients,
}: {
  clients: Array<{ id: string; nombre: string | null }>;
}) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "expense",
      category: "saas",
      taxAmount: 0,
    },
  });
  const selectedType = watch("type");
  const availableCategories = useMemo(() => {
    if (selectedType === "income") {
      return [
        { value: "service", label: "Servicio" },
        { value: "uncategorized", label: "Sin clasificar" },
        { value: "internal_movement", label: "Movimiento interno" },
      ];
    }
    return [
      { value: "saas", label: "SaaS" },
      { value: "structural", label: "Estructural" },
      { value: "variable", label: "Variable" },
      { value: "internal_movement", label: "Movimiento interno" },
    ];
  }, [selectedType]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-xl px-6">Nueva Operacion</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Nueva Operacion</DialogTitle>
          <DialogDescription>Flujo simple y rapido para registrar ingresos o gastos.</DialogDescription>
        </DialogHeader>
        <Tabs
          value={selectedType}
          onValueChange={(value) => {
            const nextType = value as "income" | "expense";
            setValue("type", nextType);
            setValue("category", nextType === "income" ? "service" : "saas");
          }}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl bg-muted/70">
            <TabsTrigger value="expense" className="rounded-lg">Gasto</TabsTrigger>
            <TabsTrigger value="income" className="rounded-lg">Ingreso</TabsTrigger>
          </TabsList>
          <TabsContent value="expense" />
          <TabsContent value="income" />
        </Tabs>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={handleSubmit((values) => {
            const formData = new FormData();
            Object.entries(values).forEach(([key, value]) => {
              if (value !== undefined && value !== null) formData.set(key, String(value));
            });
            const fileInput = document.getElementById("invoiceFile") as HTMLInputElement | null;
            if (fileInput?.files?.[0]) formData.set("invoiceFile", fileInput.files[0]);
            startTransition(async () => {
              await createTransactionAction(formData);
              reset({ type: "expense", category: "saas", taxAmount: 0 });
            });
          })}
        >
          <Input type="hidden" {...register("type")} />
          <div className="md:col-span-2">
            <Input placeholder={selectedType === "income" ? "Concepto del ingreso" : "Concepto del gasto"} {...register("concept")} />
          </div>
          <select className="h-11 rounded-md border border-input px-3 text-sm" {...register("category")}>
            {availableCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <Input type="number" step="0.01" placeholder="Importe base" {...register("amountNet")} />
          <Input type="number" step="0.01" placeholder="Impuestos (opcional)" {...register("taxAmount")} />
          <Input type="number" step="0.01" placeholder="Importe total" {...register("amountTotal")} />
          <Input type="date" {...register("issuedAt")} />
          <Input type="date" {...register("paidAt")} />
          <select className="h-11 rounded-md border border-input px-3 text-sm md:col-span-2" {...register("clientId")}>
            <option value="">Sin cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre ?? "Sin nombre"}
              </option>
            ))}
          </select>
          <input
            id="invoiceFile"
            name="invoiceFile"
            type="file"
            accept="application/pdf,image/*"
            className="md:col-span-2 text-sm"
          />
          {formState.errors.concept && (
            <p className="md:col-span-2 text-xs text-rose-600">Revisa los campos obligatorios.</p>
          )}
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : selectedType === "income" ? "Guardar ingreso" : "Guardar gasto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

