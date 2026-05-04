import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createWikiPageAction } from "@/lib/wiki/actions";
import { listWikiPages } from "@/lib/wiki/queries";

export const metadata = {
  title: "Wiki · GNERAI",
};

export default async function WikiPage() {
  const pages = await listWikiPages();
  const recentByCategory = new Map<string, number>();
  for (const page of pages) {
    recentByCategory.set(
      page.category,
      (recentByCategory.get(page.category) ?? 0) + 1
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Wiki</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Wiki interna para procesos, playbooks y documentación viva.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{pages.length} páginas</Badge>
          <Badge variant="secondary">{recentByCategory.size} categorías</Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Biblioteca reciente</CardTitle>
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
                          /{page.slug} · {page.owner_name ?? "Equipo"}
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
                title="Playbook Operativo"
                body="Objetivo, pasos, checklist, fallos comunes y owner."
              />
              <TemplateCard
                title="SOP Cliente"
                body="Accesos, ritual semanal, entregables, riesgos y escalado."
              />
              <TemplateCard
                title="Postmortem"
                body="Qué pasó, impacto, causa raíz, acciones y seguimiento."
              />
              <TemplateCard
                title="Guía Comercial"
                body="Objeciones, pricing, casos de uso y FAQs de cierre."
              />
            </CardContent>
          </Card>
        </div>

        <Card className="border-brand/30 xl:sticky xl:top-6 xl:h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Nueva página</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createWikiPageAction} className="grid gap-3">
              <input
                name="title"
                required
                placeholder="Título de la página"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
              <input
                name="category"
                required
                placeholder="Categoría (ventas, ops, legal...)"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
              <textarea
                name="content"
                required
                placeholder="Contenido inicial (markdown simple)"
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
                Crear página
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TemplateCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-md border border-border/70 bg-secondary/20 p-3">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </article>
  );
}
