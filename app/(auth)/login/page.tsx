import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "Acceder · GNERAI Finance",
};

export default function LoginPage() {
  return (
    <Card className="border-border/40 shadow-card-hover">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <span className="text-base font-bold tracking-tight">GN</span>
        </div>
        <div>
          <CardTitle className="text-xl">
            <span className="text-brand">GNERAI</span> Finance
          </CardTitle>
          <CardDescription className="mt-2">
            Acceso restringido a los socios.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <LoginForm />
      </CardContent>
    </Card>
  );
}
