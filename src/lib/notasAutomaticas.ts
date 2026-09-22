/**
 * Notas automáticas que dependen del NOMBRE de la secuencia, para no tener
 * que cargarlas a mano en el campo "detalle" de cada paso de cada protocolo.
 *
 * Si mañana cambia el texto o la regla, se edita en un solo lugar.
 */
export function notaAutomatica(titulo: string): string | null {
  const t = titulo.toLowerCase();

  // "T1 Flex", "Ax Flex", etc. — pero NO "Lava Flex" (esa es otra secuencia
  // y no requiere este envío a PACS).
  if (t.includes("flex") && !t.includes("lava")) {
    return 'Enviar "Water" e "In-Phase" a PACS';
  }

  return null;
}
