import type { ImagenProtocolo } from "@/types/database.types";

export function normalizarImagen(img: ImagenProtocolo | string, i: number): ImagenProtocolo {
  if (typeof img === "string") {
    return { etiqueta: `Imagen ${i + 1}`, url: img };
  }
  return img;
}

export function slugRegion(region: string) {
  return region
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
