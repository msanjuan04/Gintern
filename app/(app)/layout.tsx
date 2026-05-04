import Link from "next/link";
import { redirect } from "next/navigation";

import { getEmailRole, isAllowedEmail } from "@/lib/auth/allowlist";
import { createClient } from "@/lib/supabase/server";

import { LogoutButton } from "./logout-button";
import { MobileNav, Sidebar } from "./sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedEmail(user.email)) {
    redirect("/login");
  }

  const role = getEmailRole(user.email) ?? "socio";

  const initials = (user.email ?? "??")
    .split("@")[0]
    .split(/[._-]/)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        role={role}
        userEmail={user.email ?? "Sin email"}
        userInitials={initials || "•"}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-card/40 px-4 lg:hidden lg:px-8">
          <MobileHeaderTitle />
          <div className="flex items-center gap-3 lg:hidden">
            <Link
              href="/perfil"
              className="flex items-center gap-3 rounded-full p-1 transition-colors hover:bg-secondary"
              title="Editar perfil"
            >
              <div className="hidden flex-col items-end leading-tight sm:flex">
                <span className="text-sm font-medium">{user.email}</span>
                <span className="text-[11px] text-muted-foreground">
                  {role === "colaborador" ? "Colaborador" : "Ver perfil"}
                </span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                {initials || "•"}
              </div>
            </Link>
            <LogoutButton />
          </div>
        </header>
        <MobileNav role={role} />
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function MobileHeaderTitle() {
  return (
    <div className="lg:hidden">
      <span className="text-lg font-semibold tracking-tight">
        <span className="text-brand">GNERAI</span>
        <span className="ml-1.5 text-foreground/80">Finance</span>
      </span>
    </div>
  );
}
