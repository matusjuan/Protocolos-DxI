import { slugRegion } from "@/lib/imagenes";

/**
 * Regiones que tienen reglas especiales:
 *  - No se unen secuencias con el mismo nombre al combinar estudios
 *    (son la misma toma en apariencia, pero corresponden a articulaciones
 *    distintas).
 *  - Muestran automáticamente el cartel de "hablar con residente" cuando
 *    el estudio se hace con contraste.
 *
 * Estas regiones son SIEMPRE óseas/osteoarticulares, sin importar la
 * patología. Si agregás una región nueva que necesite este mismo
 * comportamiento, sumala acá (usando el mismo formato que devuelve
 * slugRegion).
 */
const SLUGS_SIEMPRE_OSTEOARTICULARES = [
  "osteoarticular",
  "miembro-inferior",
  "miembros-inferiores",
  "miembro-superior",
  "miembros-superiores",
];

/**
 * "Pelvis" sola es ambigua: puede ser Pelvis Ósea (sí aplica) o Pelvis
 * Ginecológica / Próstata (no aplica). Para esos casos, se decide por la
 * patología: si contiene "ósea", es la ósea.
 */
const SLUG_REGION_PELVIS = "pelvis";

export function esOsteoarticular(region: string, patologia?: string): boolean {
  const slugReg = slugRegion(region);

  if (SLUGS_SIEMPRE_OSTEOARTICULARES.includes(slugReg)) {
    return true;
  }

  if (slugReg === SLUG_REGION_PELVIS) {
    return !!patologia && slugRegion(patologia).includes("osea");
  }

  return false;
}
