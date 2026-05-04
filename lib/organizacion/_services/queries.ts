import "server-only";

import { createClient } from "@/lib/supabase/server";

export type OrganizationScope = "team" | "personal";

export type OrganizationGoal = {
  id: string;
  title: string;
  description: string | null;
  scope: OrganizationScope;
  owner_id: string | null;
  target_value: number;
  current_value: number;
  target_date: string | null;
  created_by: string;
  created_at: string;
  owner: { full_name: string | null; email: string | null } | null;
};

export type OrganizationMember = {
  id: string;
  full_name: string | null;
  email: string | null;
};

/** Datos para la pantalla de objetivos (sin Kanban / tareas). */
export type OrganizationDashboardData = {
  me: { id: string; email: string | null };
  goals: OrganizationGoal[];
  members: OrganizationMember[];
};

function isMissingRelationError(error: { code?: string } | null) {
  return error?.code === "PGRST205";
}

export async function getOrganizationDashboardData(): Promise<OrganizationDashboardData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const [goalsRes, membersRes] = await Promise.all([
    supabase
      .from("organization_goals")
      .select(
        "id, title, description, scope, owner_id, target_value, current_value, target_date, created_by, created_at, owner:team_members!organization_goals_owner_id_fkey(full_name, email)"
      )
      .order("target_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("team_members")
      .select("id, full_name, email")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
  ]);

  if (goalsRes.error && !isMissingRelationError(goalsRes.error)) throw goalsRes.error;
  if (membersRes.error && !isMissingRelationError(membersRes.error)) throw membersRes.error;

  const goals = ((goalsRes.data ?? []) as unknown as OrganizationGoal[]).map((goal) => ({
    ...goal,
    target_value: Number(goal.target_value ?? 0),
    current_value: Number(goal.current_value ?? 0),
    owner: Array.isArray(goal.owner) ? goal.owner[0] ?? null : goal.owner,
  }));
  const members = (membersRes.data ?? []) as OrganizationMember[];

  return {
    me: { id: user.id, email: user.email ?? null },
    goals,
    members,
  };
}
