import Image from "next/image";

import { cn } from "@/lib/utils";

type GneraiLogoProps = {
  className?: string;
  /** Alto del logo (el ancho escala con proporción). */
  heightClass?: string;
  /** Cabecera móvil: más compacto. */
  compact?: boolean;
  priority?: boolean;
};

/**
 * Logo oficial GNERAI (`public/gnerai-logo.jpeg`).
 *
 * El JPEG tiene fondo blanco, así que usamos `mix-blend-mode` para fusionar
 * ese blanco con el fondo de la app:
 *   - light: `multiply` → el blanco se "elimina" sobre fondos claros.
 *   - dark : invertimos la imagen (negro→blanco) + `screen` para que el negro
 *            del fondo invertido se funda con el dark mode.
 */
export function GneraiLogo({
  className,
  heightClass,
  compact = false,
  priority = false,
}: GneraiLogoProps) {
  const h =
    heightClass ?? (compact ? "h-12" : "h-16 sm:h-20");

  return (
    <Image
      src="/gnerai-logo.jpeg"
      alt="GNERAI · Engineering business intelligence"
      width={1024}
      height={680}
      sizes={compact ? "180px" : "(max-width: 768px) 240px, 320px"}
      className={cn(
        "w-auto object-contain object-left select-none",
        "mix-blend-multiply dark:invert dark:mix-blend-screen",
        h,
        className
      )}
      priority={priority}
    />
  );
}
