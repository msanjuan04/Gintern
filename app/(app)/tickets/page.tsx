import { TicketsBoard } from "./tickets-board";

import { listTicketBoard, listTicketFormData } from "@/lib/tickets/queries";

export const metadata = {
  title: "Tickets · GNERAI",
};

export default async function TicketsPage() {
  const [tickets, formData] = await Promise.all([
    listTicketBoard(),
    listTicketFormData(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Tickets activos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vista operativa de trabajo en curso.
        </p>
      </div>

      <TicketsBoard
        tickets={tickets}
        members={formData.members}
        currentUserId={formData.currentUserId}
        scope="active"
      />
    </div>
  );
}
