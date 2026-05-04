import "server-only";

import { createClient } from "@/lib/supabase/server";

export type OrganizationTaskStatus = "todo" | "in_progress" | "done" | "blocked";
export type OrganizationTaskPriority = "low" | "medium" | "high";
export type OrganizationScope = "team" | "personal";

export type OrganizationTask = {
  id: string;
  title: string;
  description: string | null;
  status: OrganizationTaskStatus;
  priority: OrganizationTaskPriority;
  scope: OrganizationScope;
  assignee_id: string | null;
  created_by: string;
  due_date: string | null;
  created_at: string;
  assignee: { full_name: string | null; email: string | null } | null;
  creator: { full_name: string | null; email: string | null } | null;
};

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

export type OrganizationDashboardData = {
  me: { id: string; email: string | null };
  kpis: {
    teamPending: number;
    teamInProgress: number;
    teamBlocked: number;
    doneLast7d: number;
  };
  tasks: {
    team: OrganizationTask[];
    mine: OrganizationTask[];
    all: OrganizationTask[];
  };
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

  const [tasksRes, goalsRes, membersRes] = await Promise.all([
    supabase
      .from("organization_tasks")
      .select(
        "id, title, description, status, priority, scope, assignee_id, created_by, due_date, created_at, assignee:team_members!organization_tasks_assignee_id_fkey(full_name, email), creator:team_members!organization_tasks_created_by_fkey(full_name, email)"
      )
      .order("created_at", { ascending: false }),
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

  if (tasksRes.error && !isMissingRelationError(tasksRes.error)) throw tasksRes.error;
  if (goalsRes.error && !isMissingRelationError(goalsRes.error)) throw goalsRes.error;
  if (membersRes.error && !isMissingRelationError(membersRes.error)) throw membersRes.error;

  const tasks = ((tasksRes.data ?? []) as unknown as OrganizationTask[]).map((task) => ({
    ...task,
    assignee: Array.isArray(task.assignee) ? task.assignee[0] ?? null : task.assignee,
    creator: Array.isArray(task.creator) ? task.creator[0] ?? null : task.creator,
  }));
  const goals = ((goalsRes.data ?? []) as unknown as OrganizationGoal[]).map((goal) => ({
    ...goal,
    target_value: Number(goal.target_value ?? 0),
    current_value: Number(goal.current_value ?? 0),
    owner: Array.isArray(goal.owner) ? goal.owner[0] ?? null : goal.owner,
  }));
  const members = (membersRes.data ?? []) as OrganizationMember[];

  const teamTasks = tasks.filter((task) => task.scope === "team");
  const myTasks = tasks.filter(
    (task) =>
      task.assignee_id === user.id || (task.scope === "personal" && task.created_by === user.id)
  );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    me: { id: user.id, email: user.email ?? null },
    kpis: {
      teamPending: teamTasks.filter((task) => task.status === "todo").length,
      teamInProgress: teamTasks.filter((task) => task.status === "in_progress").length,
      teamBlocked: teamTasks.filter((task) => task.status === "blocked").length,
      doneLast7d: tasks.filter((task) => task.status === "done" && task.created_at >= sevenDaysAgo).length,
    },
    tasks: {
      team: teamTasks,
      mine: myTasks,
      all: tasks,
    },
    goals,
    members,
  };
}

