import { redirect } from "next/navigation";

export const metadata = {
  title: "Contraseñas · GNERAI",
};

export default function BovedaPage() {
  redirect("/boveda/clientes");
}
