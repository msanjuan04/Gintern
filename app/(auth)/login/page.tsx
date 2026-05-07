import { GneraiLogo } from "@/components/gnerai-logo";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "Acceder · GNERAI OS",
};

export default function LoginPage() {
  const year = new Date().getFullYear();

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Panel izquierdo · marca */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border/60 bg-card px-12 py-12 lg:flex xl:px-16">
        {/* Decoración: dot grid + glows muy sutiles */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05] [color:hsl(var(--foreground))]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-foreground/[0.04] blur-3xl"
        />

        {/* Top: logo */}
        <div className="relative">
          <GneraiLogo priority heightClass="h-16" />
        </div>

        {/* Middle: claim */}
        <div className="relative max-w-md space-y-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Sistema operativo interno
          </p>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight xl:text-[2.75rem]">
            Todo el equipo,
            <br />
            <span className="text-foreground/70">una sola plataforma.</span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Operaciones, finanzas y conocimiento del estudio centralizados con la
            elegancia que merece tu trabajo diario.
          </p>
          <ul className="space-y-3 pt-2 text-sm">
            <li className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              <span className="text-foreground/80">
                Tickets, clientes y propuestas
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              <span className="text-foreground/80">
                Finanzas, calendario y bóveda de credenciales
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              <span className="text-foreground/80">
                Drive, wiki y registro completo de actividad
              </span>
            </li>
          </ul>
        </div>

        {/* Bottom: footer */}
        <div className="relative flex items-center justify-between text-xs text-muted-foreground">
          <span>© {year} GNERAI</span>
          <span className="rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em]">
            OS · v1
          </span>
        </div>
      </aside>

      {/* Panel derecho · formulario */}
      <main className="flex min-h-screen flex-col">
        {/* Header móvil con logo */}
        <header className="flex items-center justify-between border-b border-border/60 bg-card px-6 py-5 lg:hidden">
          <GneraiLogo priority heightClass="h-10" />
          <span className="rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            OS · v1
          </span>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="text-2xl font-semibold tracking-tight">
                Bienvenido de nuevo
              </h2>
              <p className="text-sm text-muted-foreground">
                Accede con tu correo del equipo para continuar.
              </p>
            </div>

            <LoginForm />

            <p className="text-center text-xs text-muted-foreground sm:text-left">
              ¿Problemas para entrar? Contacta con un socio para revisar tu acceso.
            </p>
          </div>
        </div>

        {/* Footer móvil */}
        <footer className="border-t border-border/60 px-6 py-4 text-center text-[11px] text-muted-foreground lg:hidden">
          © {year} GNERAI · Acceso restringido
        </footer>
      </main>
    </div>
  );
}
