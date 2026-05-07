import Image from "next/image";

import { cn } from "@/lib/utils";

function initialsFromParts(
  nombre: string | null | undefined,
  apellidos: string | null | undefined,
  email: string
): string {
  const full = [nombre, apellidos].filter(Boolean).join(" ").trim();
  if (full) {
    const parts = full.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (
        parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)
      ).toUpperCase();
    }
    return full.slice(0, 2).toUpperCase();
  }
  const local = email.split("@")[0] ?? "?";
  return local.slice(0, 2).toUpperCase();
}

const dimensionClass = {
  sm: "h-9 w-9 text-[11px]",
  md: "h-11 w-11 text-xs",
  lg: "h-28 w-28 text-2xl",
};

const pixelSize = {
  sm: 36,
  md: 44,
  lg: 112,
};

export function UserAvatar({
  avatarUrl,
  nombre,
  apellidos,
  email,
  size = "md",
  className,
}: {
  avatarUrl: string | null | undefined;
  nombre?: string | null;
  apellidos?: string | null;
  email: string;
  size?: keyof typeof dimensionClass;
  className?: string;
}) {
  const initials = initialsFromParts(nombre, apellidos, email);
  const px = pixelSize[size];
  const ring =
    size === "lg"
      ? "ring-2 ring-border/80 ring-offset-2 ring-offset-background"
      : "";

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={px}
        height={px}
        className={cn(
          "rounded-full object-cover",
          dimensionClass[size],
          ring,
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-secondary font-semibold tracking-tight text-foreground/85",
        dimensionClass[size],
        ring,
        className
      )}
      aria-hidden
    >
      {initials || "?"}
    </div>
  );
}

export { initialsFromParts };
