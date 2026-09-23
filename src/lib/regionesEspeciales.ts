import { slugRegion } from "@/lib/imagenes";

/**
 * Regiones que tienen reglas especiales:
 *  - No se unen secuencias con el mismo nombre al combinar estudios
 *    (son la misma toma en apariencia, pero corresponden a articulaciones
 *    distintas).
 *  - Muestran automáticamente el cartel de "hablar con residente" cuando
 *    el estudio se hace con contraste.
 *
 * Si agregás una región nueva que necesite este mismo comportamiento,
 * sumala acá (usando el mismo formato que devuelve slugRegion).
 */
const SLUGS_OSTEOARTICULARES = [
  "osteoarticular",
  "miembro-inferior",
  "miembros-inferiores",
  "miembro-superior",
  "miembros-superiores",
  "pelvis",
  "pelvis-osea",
];

export function esOsteoarticular(region: string): boolean {
  return SLUGS_OSTEOARTICULARES.includes(slugRegion(region));
}
