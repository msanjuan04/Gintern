import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ProfitabilityRow = {
  project_id: string;
  project_name: string;
  client_name: string | null;
  budget: number;
  spent_hours: number;
  eur_per_hour: number;
  status: "verde" | "ambar" | "rojo";
};

export async function listProfitabilityRows(): Promise<ProfitabilityRow[]> {
  const supabase = await createClient();
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, budget, client:clients(nombre)")
    .order("created_at", { ascending: false });
  if (projectsError) {
    if (projectsError.code === "PGRST205") return [];
    throw projectsError;
  }
  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);
  const { data: tickets, error: ticketsError } = await supabase
    .from("tickets")
    .select("id, project_id")
    .in("project_id", projectIds);
  if (ticketsError) {
    if (ticketsError.code === "PGRST205") return [];
    throw ticketsError;
  }

  const ticketIds = (tickets ?? []).map((t) => t.id);
  const { data: tracking, error: trackingError } =
    ticketIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("time_tracking")
          .select("ticket_id, minutes_spent, start_at, end_at")
          .in("ticket_id", ticketIds);
  if (trackingError) {
    if (trackingError.code === "PGRST205") return [];
    throw trackingError;
  }

  const projectByTicket = new Map<string, string>();
  for (const ticket of tickets ?? []) projectByTicket.set(ticket.id, ticket.project_id);

  const spentMinutesByProject = new Map<string, number>();
  for (const row of tracking ?? []) {
    const projectId = projectByTicket.get(row.ticket_id);
    if (!projectId) continue;
    const current = spentMinutesByProject.get(projectId) ?? 0;
    let delta = 0;
    if (typeof row.minutes_spent === "number") {
      delta = row.minutes_spent;
    } else if (row.start_at && row.end_at) {
      delta = Math.max(
        0,
        Math.floor((new Date(row.end_at).getTime() - new Date(row.start_at).getTime()) / 60000)
      );
    }
    spentMinutesByProject.set(projectId, current + delta);
  }

  return projects.map((project) => {
    const spentHours = Number(((spentMinutesByProject.get(project.id) ?? 0) / 60).toFixed(2));
    const budget = Number(project.budget ?? 0);
    const eurPerHour = spentHours > 0 ? Number((budget / spentHours).toFixed(2)) : 0;
    const status: "verde" | "ambar" | "rojo" =
      eurPerHour >= 80 ? "verde" : eurPerHour >= 45 ? "ambar" : "rojo";
    const client = Array.isArray(project.client) ? project.client[0] : project.client;

    return {
      project_id: project.id,
      project_name: project.name,
      client_name: client?.nombre ?? null,
      budget,
      spent_hours: spentHours,
      eur_per_hour: eurPerHour,
      status,
    };
  });
}
