import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "No autorizado · GNERAI Finance",
};

export default function NoAutorizadoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-xl">Acceso no autorizado</CardTitle>
          <CardDescription>
            Tu correo no está en la lista de socios autorizados de GNERAI
            Finance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" variant="outline">
            <Link href="/login">Volver a iniciar sesión</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
