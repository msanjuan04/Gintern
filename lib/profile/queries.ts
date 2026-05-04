import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { UserRow } from "@/types/database";

export async function getMyProfile(): Promise<UserRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return (data as UserRow | null) ?? null;
}
