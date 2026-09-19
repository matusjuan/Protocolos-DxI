import type { Modalidad } from "@/types/database.types";

export const MODALIDADES: {
  valor: Modalidad;
  etiqueta: string;
  texto: string;
  textoDim: string;
  fondo: string;
  fondoDim: string;
  borde: string;
}[] = [
  {
    valor: "RM",
    etiqueta: "Resonancia",
    texto: "text-rm",
    textoDim: "text-rm-dim",
    fondo: "bg-rm",
    fondoDim: "bg-rm-dim",
    borde: "border-rm-dim",
  },
  {
    valor: "TC",
    etiqueta: "Tomografía",
    texto: "text-tc",
    textoDim: "text-tc-dim",
    fondo: "bg-tc",
    fondoDim: "bg-tc-dim",
    borde: "border-tc-dim",
  },
  {
    valor: "RX",
    etiqueta: "Rayos X",
    texto: "text-rx",
    textoDim: "text-rx-dim",
    fondo: "bg-rx",
    fondoDim: "bg-rx-dim",
    borde: "border-rx-dim",
  },
];

export function metaModalidad(m: Modalidad) {
  return MODALIDADES.find((x) => x.valor === m) ?? MODALIDADES[0];
}
