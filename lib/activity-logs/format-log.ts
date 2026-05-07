import type { ActivityLogListItem } from "@/lib/activity-logs/queries";

/** Etiquetas de módulo para filtros y cabeceras. */
export const MODULE_LABEL: Record<string, string> = {
  tickets: "Tickets",
  clientes: "Clientes",
  finanzas: "Finanzas",
  organizacion: "Organización",
  boveda: "Contraseñas",
  wiki: "Drive",
  propuestas: "Propuestas",
  archivos: "Archivos",
};

function str(meta: Record<string, unknown>, key: string): string | undefined {
  const v = meta[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/**
 * Resume un evento técnico en lenguaje operativo (español).
 * Así la auditoría sirve de verdad sin leer claves internas.
 */
export function describeActivityLog(log: ActivityLogListItem): {
  headline: string;
  subline: string | null;
  href: string | null;
} {
  const meta = log.metadata ?? {};
  const moduleLabel = MODULE_LABEL[log.module] ?? log.module;

  let headline = `${moduleLabel}: ${log.action.replace(/_/g, " ")}`;
  let subline: string | null = null;
  let href: string | null = null;

  switch (log.module) {
    case "tickets": {
      const title = str(meta, "title");
      if (log.action === "ticket_created") {
        headline = title ? `Nuevo ticket: ${title}` : "Nuevo ticket";
        href = "/tickets";
      } else if (log.action === "ticket_status_changed") {
        headline = title ? `Ticket actualizado: ${title}` : "Estado de ticket cambiado";
        subline = str(meta, "status") ? `Nuevo estado: ${String(meta.status)}` : null;
        href = "/tickets";
      } else if (log.action === "ticket_deleted") {
        headline = title ? `Ticket eliminado: ${title}` : "Ticket eliminado";
        href = "/tickets";
      }
      break;
    }
    case "clientes": {
      const nombre = str(meta, "nombre");
      if (log.entity_id) href = `/clientes/${log.entity_id}`;
      if (log.action === "client_created") {
        headline = nombre ? `Cliente creado: ${nombre}` : "Cliente creado";
      } else if (log.action === "client_updated") {
        headline = nombre ? `Cliente actualizado: ${nombre}` : "Cliente actualizado";
      } else if (log.action === "client_interaction_added") {
        headline = nombre ? `Interacción en ${nombre}` : "Nueva interacción con cliente";
        subline = str(meta, "type") ? `Tipo: ${String(meta.type)}` : null;
      } else if (log.action === "client_activo_toggled") {
        headline = nombre ? `Cliente ${nombre}: activo cambiado` : "Estado activo del cliente cambiado";
        subline =
          typeof meta.activo === "boolean" ? (meta.activo ? "Activo" : "Inactivo") : null;
      }
      break;
    }
    case "finanzas": {
      href = "/finanzas";
      const concept = str(meta, "concept");
      const type = str(meta, "type");
      if (log.action === "transaction_created") {
        headline = concept ? `Operación: ${concept}` : "Nueva operación";
        subline = type ? `Tipo: ${type === "income" ? "ingreso" : "gasto"}` : null;
      }
      break;
    }
    case "organizacion": {
      href = "/organizacion/objetivos";
      const t = str(meta, "title");
      if (log.action === "goal_created") {
        headline = t ? `Objetivo: ${t}` : "Nuevo objetivo";
      }
      break;
    }
    case "boveda": {
      href = "/boveda/internas";
      const service = str(meta, "service");
      if (log.action === "credential_created") {
        headline = service ? `Credencial: ${service}` : "Nueva credencial";
        if (meta.scope === "client") href = "/boveda/clientes";
      }
      break;
    }
    case "wiki": {
      href = "/wiki";
      const slug = str(meta, "slug");
      if (slug) subline = slug;
      break;
    }
    case "propuestas": {
      href = "/propuestas";
      break;
    }
    case "archivos": {
      href = "/wiki";
      break;
    }
    default:
      subline = log.entity_id ? `ID: ${log.entity_id.slice(0, 8)}…` : null;
  }

  return { headline, subline, href };
}

export function formatMetadataPreview(meta: Record<string, unknown>): Array<{ k: string; v: string }> {
  const skip = new Set(["title", "nombre", "concept", "service", "slug"]);
  const out: Array<{ k: string; v: string }> = [];
  for (const [k, v] of Object.entries(meta)) {
    if (skip.has(k)) continue;
    if (v === null || v === undefined) continue;
    if (typeof v === "object") continue;
    out.push({ k, v: String(v) });
    if (out.length >= 4) break;
  }
  return out;
}
