import { Card, CardContent } from "@/components/ui/card";
import { getMyProfile } from "@/lib/profile/queries";

import { ProfileForm } from "./profile-form";

export const metadata = {
  title: "Perfil · GNERAI Finance",
};

export default async function PerfilPage() {
  const profile = await getMyProfile();

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No se encontró tu fila en <code>public.users</code>. Pide al admin
            que ejecute el seed o que te dé de alta manualmente.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Tu perfil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Datos que aparecen en tus facturas y configuración personal.
        </p>
      </div>

      <ProfileForm user={profile} />
    </div>
  );
}
