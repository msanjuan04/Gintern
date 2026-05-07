import Link from "next/link";
import { redirect } from "next/navigation";

import { GneraiLogo } from "@/components/gnerai-logo";
import { UserAvatar } from "@/components/user-avatar";
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

  const { data: profileRow } = await supabase
    .from("users")
    .select("avatar_url, nombre, apellidos")
    .eq("id", user.id)
    .maybeSingle();

  const avatarUrl = profileRow?.avatar_url ?? null;
  const nombre = profileRow?.nombre ?? null;
  const apellidos = profileRow?.apellidos ?? null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        role={role}
        userEmail={user.email ?? "Sin email"}
        avatarUrl={avatarUrl}
        nombre={nombre}
        apellidos={apellidos}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 items-center justify-between gap-4 border-b border-border/60 bg-card px-4 lg:hidden lg:px-8">
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
              <UserAvatar
                avatarUrl={avatarUrl}
                nombre={nombre}
                apellidos={apellidos}
                email={user.email ?? ""}
                size="sm"
              />
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
    <Link href="/dashboard" className="flex min-w-0 shrink items-center lg:hidden" title="Ir al panel">
      <GneraiLogo compact priority />
    </Link>
  );
}
