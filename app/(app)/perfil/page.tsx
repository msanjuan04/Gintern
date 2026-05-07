import { Card, CardContent } from "@/components/ui/card";
import { getMyProfile } from "@/lib/profile/queries";

import { ProfileForm } from "./profile-form";

export const metadata = {
  title: "Perfil · GNERAI OS",
};

export default async function PerfilPage() {
  const profile = await getMyProfile();

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No se encontró tu perfil en el sistema. Contacta con un administrador.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10 pb-16">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Tu foto y nombre se muestran al equipo. El resto es opcional.
        </p>
      </header>

      <ProfileForm user={profile} />
    </div>
  );
}
