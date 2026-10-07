"use client";

import { useEffect, useState } from "react";
import type { Equipo, PasoProtocolo } from "@/types/database.types";

export const EQUIPOS: Equipo[] = ["1.5T", "3T"];

const CLAVE_GUARDADO = "resonador-elegido";

/**
 * Resonador elegido (1.5T o 3T). Se recuerda en cada PC, así el técnico no
 * tiene que volver a elegirlo cada vez que abre un protocolo.
 */
export function useEquipo(): [Equipo, (e: Equipo) => void] {
  const [equipo, setEquipoState] = useState<Equipo>("1.5T");

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(CLAVE_GUARDADO);
      if (guardado === "1.5T" || guardado === "3T") setEquipoState(guardado);
    } catch {
      // Si el navegador no deja leer el almacenamiento, queda el valor por defecto.
    }
  }, []);

  function setEquipo(e: Equipo) {
    setEquipoState(e);
    try {
      window.localStorage.setItem(CLAVE_GUARDADO, e);
    } catch {
      // Si no se puede guardar, igual funciona durante esta visita.
    }
  }

  return [equipo, setEquipo];
}

/** Un paso sin "equipo" aplica a los dos resonadores. */
export function aplicaAEquipo(paso: PasoProtocolo, equipo: Equipo): boolean {
  return !paso.equipo || paso.equipo === equipo;
}

/** ¿Este protocolo tiene algún paso que cambie según el resonador? */
export function tieneVariantesPorEquipo(pasos: PasoProtocolo[]): boolean {
  return pasos.some((p) => !!p.equipo);
}
