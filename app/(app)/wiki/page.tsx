import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createWikiPageAction } from "@/lib/wiki/actions";
import { listWikiPages } from "@/lib/wiki/queries";
import { BookOpen, Folder, FolderOpen } from "lucide-react";

const AREA_CONFIG: Array<{ key: string; label: string; subfolders: string[] }> = [
  { key: "marketing", label: "Marketing", subfolders: ["branding", "creacion-contenido"] },
  { key: "clientes", label: "Clientes", subfolders: ["onboarding", "seguimiento"] },
  { key: "operaciones", label: "Operaciones", subfolders: ["procesos", "checklists"] },
  { key: "ventas", label: "Ventas", subfolders: ["propuestas", "cierres"] },
];

function prettifyFolderName(value: string) {
  if (value === "creacion-contenido") return "Creacion de contenido";
  if (value === "onboarding") return "Onboarding";
  if (value === "checklists") return "Checklists";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const metadata = {
  title: "Wiki · GNERAI",
};

export default async function WikiPage() {
  const pages = await listWikiPages();
  const recentByCategory = new Map<string, number>();
  const areaStats = new Map<string, { total: number; subfolders: Map<string, number> }>();
  for (const page of pages) {
    recentByCategory.set(
      page.category,
      (recentByCategory.get(page.category) ?? 0) + 1
    );

    const [areaRaw, subfolderRaw] = page.category.toLowerCase().split("/");
    const area = areaRaw || "general";
    const subfolder = subfolderRaw || "_root";
    const current = areaStats.get(area) ?? { total: 0, subfolders: new Map<string, number>() };
    current.total += 1;
    current.subfolders.set(subfolder, (current.subfolders.get(subfolder) ?? 0) + 1);
    areaStats.set(area, current);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Wiki Drive</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Espacio visual de documentación por áreas y carpetas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{pages.length} páginas</Badge>
          <Badge variant="secondary">{recentByCategory.size} categorías</Badge>
        </div>
      </div>

      <Card className="border-brand/20">
        <CardHeader>
          <CardTitle className="text-lg">Explorador de carpetas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {AREA_CONFIG.map((area) => {
            const stats = areaStats.get(area.key);
            return (
              <article key={area.key} className="rounded-xl border border-border/70 bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Folder className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Badge variant="outline">{stats?.total ?? 0}</Badge>
                </div>
                <p className="mt-3 text-sm font-semibold">{area.label}</p>
                <div className="mt-3 space-y-2">
                  {area.subfolders.map((sub) => (
                    <div
                      key={sub}
                      className="flex items-center justify-between rounded-md border border-border/60 px-2.5 py-1.5 text-xs"
                    >
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <FolderOpen className="h-3.5 w-3.5" />
                        {prettifyFolderName(sub)}
                      </span>
                      <span className="tabular-nums">
                        {stats?.subfolders.get(sub) ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Archivos recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {pages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todavía no hay páginas creadas.
                </p>
              ) : (
                <div className="space-y-2">
                  {pages.map((page) => (
                    <article
                      key={page.id}
                      className="grid gap-2 rounded-md border border-border/70 p-3 md:grid-cols-[1fr_auto]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{page.title}</p>
                        <p className="text-xs text-muted-foreground">
                          /{page.slug} · {page.owner_name ?? "Equipo"} · <span className="font-mono">{page.category}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{page.category}</Badge>
                        <Badge variant={page.is_published ? "success" : "muted"}>
                          {page.is_published ? "Publicada" : "Borrador"}
                        </Badge>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plantillas rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <TemplateCard
                title="Carpeta Marketing"
                body="Branding y creación de contenido listos para documentar."
              />
              <TemplateCard
                title="Carpeta Clientes"
                body="Onboarding, seguimiento y acuerdos por cliente."
              />
              <TemplateCard
                title="Carpeta Operaciones"
                body="Procesos internos, checklists y playbooks."
              />
              <TemplateCard
                title="Carpeta Ventas"
                body="Propuestas, scripts de cierre y FAQs comerciales."
              />
            </CardContent>
          </Card>
        </div>

        <Card className="border-brand/30 xl:sticky xl:top-6 xl:h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Nuevo archivo</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createWikiPageAction} className="grid gap-3">
              <input
                name="title"
                required
                placeholder="Título de la página"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
              <select name="area" required className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Selecciona área</option>
                {AREA_CONFIG.map((area) => (
                  <option key={area.key} value={area.key}>
                    {area.label}
                  </option>
                ))}
              </select>
              <select name="subcategory" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Sin subcarpeta</option>
                {AREA_CONFIG.flatMap((area) =>
                  area.subfolders.map((sub) => (
                    <option key={`${area.key}-${sub}`} value={sub}>
                      {area.label} / {prettifyFolderName(sub)}
                    </option>
                  ))
                )}
              </select>
              <textarea
                name="content"
                required
                placeholder="Contenido inicial"
                className="min-h-56 rounded-md border border-input bg-background p-3 text-sm"
              />
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPublished" defaultChecked className="h-4 w-4" />
                Publicar ahora
              </label>
              <button
                type="submit"
                className="h-10 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground"
              >
                Crear archivo
              </button>
            </form>
            <div className="mt-3 rounded-md border border-border/70 bg-secondary/20 p-3 text-xs text-muted-foreground">
              Consejo: usa estructura corta, por ejemplo <span className="font-mono">marketing/branding</span>.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TemplateCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-md border border-border/70 bg-secondary/20 p-3">
      <p className="inline-flex items-center gap-2 text-sm font-medium">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        {title}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </article>
  );
}
