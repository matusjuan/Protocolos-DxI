"use client";

import { useState } from "react";
import { slugRegion } from "@/lib/imagenes";

export function IconoRegion({
  region,
  claseColor,
  className,
}: {
  region: string;
  claseColor: string;
  className?: string;
}) {
  const slug = slugRegion(region);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <span className={`flex items-center justify-center text-lg font-semibold ${className ?? ""}`}>
        {region.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/iconos-regiones/${slug}.png`}
      alt=""
      className={`object-contain ${className ?? ""} ${claseColor}`}
      onError={(e) => {
        // Si no existe el ícono específico, probamos con uno genérico antes de rendirnos.
        if (!e.currentTarget.src.endsWith("generico.png")) {
          e.currentTarget.src = "/iconos-regiones/generico.png";
        } else {
          setError(true);
        }
      }}
    />
  );
}
