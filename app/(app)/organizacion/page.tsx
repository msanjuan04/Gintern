import { redirect } from "next/navigation";

/** El Kanban de tareas se eliminó; el módulo queda centrado en objetivos. */
export default function OrganizacionPage() {
  redirect("/organizacion/objetivos");
}
