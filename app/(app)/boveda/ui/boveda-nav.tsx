import Link from "next/link";

export function BovedaNav({ active }: { active: "clientes" | "internas" }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/boveda/clientes"
        className={`rounded-full px-3 py-1.5 text-xs ${
          active === "clientes"
            ? "bg-brand text-brand-foreground"
            : "border border-border text-muted-foreground hover:bg-secondary"
        }`}
      >
        Contraseñas de clientes
      </Link>
      <Link
        href="/boveda/internas"
        className={`rounded-full px-3 py-1.5 text-xs ${
          active === "internas"
            ? "bg-brand text-brand-foreground"
            : "border border-border text-muted-foreground hover:bg-secondary"
        }`}
      >
        Contraseñas GNERAI
      </Link>
    </div>
  );
}
