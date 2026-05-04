import Link from "next/link";

import { Button } from "@/components/ui/button";
import { listTicketFormData } from "@/lib/tickets/queries";

import { NewTicketForm } from "../new-ticket-form";

export const metadata = {
  title: "Crear ticket · GNERAI",
};

export default async function NuevoTicketPage() {
  const formData = await listTicketFormData();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Crear ticket</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea una nueva tarea operativa y vuelve a la vista principal de tickets.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/tickets">Volver a tickets</Link>
        </Button>
      </div>

      <NewTicketForm clients={formData.clients} members={formData.members} />
    </div>
  );
}
