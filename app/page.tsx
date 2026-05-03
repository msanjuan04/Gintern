import { redirect } from "next/navigation";

import { getEmailRole, landingPathForRole } from "@/lib/auth/allowlist";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  redirect(landingPathForRole(getEmailRole(user.email)));
}
