import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listWikiPages } from "@/lib/wiki/queries";
import { ExternalLink, Folder, FolderOpen } from "lucide-react";

const AREA_CONFIG: Array<{ key: string; label: string; description: string; subfolders: string[] }> = [
  {
    key: "accesos",
    label: "Accesos",
    description: "Credenciales, usuarios, invitaciones y puntos de entrada a herramientas.",
    subfolders: [],
  },
  {
    key: "administrativo-legal",
    label: "Administrativo & Legal",
    description: "Documentación jurídica y administrativa del negocio.",
    subfolders: ["contratos", "facturas"],
  },
  {
    key: "clientes",
    label: "Clientes",
    description: "Una carpeta por cliente con entregables, acuerdos y seguimiento.",
    subfolders: ["por-cliente"],
  },
  {
    key: "contabilidad",
    label: "Contabilidad",
    description: "Cierres, reportes, impuestos y control económico mensual.",
    subfolders: [],
  },
  {
    key: "disenos-webs",
    label: "Diseños Webs",
    description: "Recursos visuales, prototipos, versiones y activos web.",
    subfolders: [],
  },
  {
    key: "documentos-internos",
    label: "Documentos Internos",
    description: "Documentación operativa interna, políticas y coordinación de equipo.",
    subfolders: [],
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Estrategia, branding y piezas para campañas y contenido.",
    subfolders: ["branding", "estrategia-marketing"],
  },
  {
    key: "tareas-planning",
    label: "Tareas & Planning",
    description: "Planificación de trabajo, roadmaps, sprints y organización semanal.",
    subfolders: [],
  },
  {
    key: "tech-docs",
    label: "Tech Docs",
    description: "Guías técnicas, arquitectura, decisiones y documentación de desarrollo.",
    subfolders: [],
  },
];

function prettifyFolderName(value: string) {
  if (value === "por-cliente") return "Por cliente";
  if (value === "estrategia-marketing") return "Estrategia de marketing";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractDriveUrl(content: string) {
  const match = content.match(/https?:\/\/drive\.google\.com\/[^\s)]+/i);
  return match?.[0] ?? null;
}

export const metadata = {
  title: "Drive · GNERAI",
};

export default async function WikiPage() {
  const pages = await listWikiPages();
  const rootDriveUrl =
    process.env.NEXT_PUBLIC_WIKI_DRIVE_URL ?? "https://drive.google.com/drive/my-drive";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Drive</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mapa de referencia para saber qué va en cada carpeta del Drive compartido.
          </p>
        </div>
      </div>

      <Card className="border-brand/30 bg-brand/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Drive maestro de GNERAI</p>
            <p className="text-xs text-muted-foreground">
              Gestionad carpetas y archivos directamente en Drive. Esta vista sirve como guía rápida.
            </p>
          </div>
          <Link
            href={rootDriveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-5 text-sm font-medium text-brand-foreground hover:opacity-95"
          >
            Abrir Drive
            <ExternalLink className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>

      <Card className="border-brand/20">
        <CardHeader>
          <CardTitle className="text-lg">Guía de carpetas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {AREA_CONFIG.map((area) => (
            <article key={area.key} className="rounded-xl border border-border/70 bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Folder className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <p className="mt-3 text-sm font-semibold">{area.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{area.description}</p>
                {area.subfolders.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {area.subfolders.map((sub) => (
                      <div
                        key={sub}
                        className="flex items-center rounded-md border border-border/60 px-2.5 py-1.5 text-xs"
                      >
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <FolderOpen className="h-3.5 w-3.5" />
                          {prettifyFolderName(sub)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
          ))}
        </CardContent>
      </Card>

      {pages.length > 0 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Archivos recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pages.map((page) => (
                  (() => {
                    const driveUrl = extractDriveUrl(page.content);
                    return (
                      <article
                        key={page.id}
                        className="grid gap-2 rounded-md border border-border/70 p-3 md:grid-cols-[1fr_auto]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{page.title}</p>
                          <p className="text-xs text-muted-foreground">
                            /{page.slug} · {page.owner_name ?? "Equipo"} ·{" "}
                            <span className="font-mono">{page.category}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {driveUrl ? (
                            <Link
                              href={driveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-brand hover:bg-secondary"
                            >
                              Abrir <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          ) : null}
                          <Badge variant="outline">{page.category}</Badge>
                          <Badge variant={page.is_published ? "success" : "muted"}>
                            {page.is_published ? "Publicada" : "Borrador"}
                          </Badge>
                        </div>
                      </article>
                    );
                  })()
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
