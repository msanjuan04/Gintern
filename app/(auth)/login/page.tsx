import { GneraiLogo } from "@/components/gnerai-logo";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "Acceder · GNERAI OS",
};

export default function LoginPage() {
  const year = new Date().getFullYear();

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.12fr_0.88fr]">
      <aside className="relative hidden overflow-hidden border-r border-border/60 bg-card lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04] [color:hsl(var(--foreground))]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-36 top-0 h-[26rem] w-[26rem] rounded-full bg-brand/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-44 -right-36 h-[30rem] w-[30rem] rounded-full bg-foreground/[0.04] blur-3xl"
        />

        <div className="relative flex w-full flex-col justify-between px-14 py-12 xl:px-20">
          <div>
            <span className="rounded-full border border-border/70 bg-background/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              GNERAI · PRIVATE ACCESS
            </span>
          </div>

          <div className="max-w-xl space-y-5">
            <div className="-mt-5 xl:-mt-6">
              <GneraiLogo priority heightClass="h-48 xl:h-56" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/90">
              Internal Operating System
            </p>
            <h1 className="text-[2.35rem] font-semibold leading-[1.05] tracking-tight text-foreground/95 xl:text-[2.7rem]">
              Elegancia operativa
              <br />
              <span className="whitespace-nowrap">para equipos de alto nivel.</span>
            </h1>
            <div className="flex items-center gap-3 pt-1 text-xs text-foreground/75">
              <span className="rounded-full border border-border/60 bg-background/50 px-3 py-1.5">
                Strategy
              </span>
              <span className="rounded-full border border-border/60 bg-background/50 px-3 py-1.5">
                Finance
              </span>
              <span className="rounded-full border border-border/60 bg-background/50 px-3 py-1.5">
                Execution
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© {year} GNERAI</span>
            <span className="rounded-full border border-border/70 bg-background/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em]">
              Confidential
            </span>
          </div>
        </div>
      </aside>

      <main className="relative flex min-h-screen flex-col bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-card to-transparent"
        />
        <header className="flex items-center justify-between border-b border-border/60 bg-card px-6 py-5 lg:hidden">
          <GneraiLogo priority heightClass="h-16" />
          <span className="rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Private Access
          </span>
        </header>

        <div className="relative flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/95 p-8 shadow-card backdrop-blur sm:p-10">
            <div className="mb-8 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Acceso seguro
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">Bienvenido</h2>
            </div>

            <LoginForm />

            <p className="mt-6 text-[11px] text-muted-foreground">
              Acceso restringido al equipo GNERAI.
            </p>
          </div>
        </div>

        <footer className="border-t border-border/60 px-6 py-4 text-center text-[11px] text-muted-foreground lg:hidden">
          © {year} GNERAI · Acceso restringido
        </footer>
      </main>
    </div>
  );
}
