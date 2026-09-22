"use client";

import { useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { RutaProtegida } from "@/components/RutaProtegida";
import { Encabezado } from "@/components/Encabezado";
import { db } from "@/lib/firebase/client";
import type { PasoProtocolo } from "@/types/database.types";

function esMarcador(p: PasoProtocolo) {
  return p.titulo.includes("inyecta el contraste");
}

function MigrarPostContraste() {
  const [estado, setEstado] = useState<"inicial" | "cargando" | "listo" | "error">("inicial");
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function migrar() {
    setEstado("cargando");
    setError(null);
    const lineas: string[] = [];
    try {
      const q = query(collection(db, "protocolos"), where("modalidad", "==", "RM"));
      const snap = await getDocs(q);

      for (const d of snap.docs) {
        const data = d.data();
        const patologia = (data.patologia as string) ?? "";
        const pasosViejos = (data.pasos as PasoProtocolo[]) ?? [];
        const pasosConContrasteViejos = (data.pasosConContraste as PasoProtocolo[]) ?? [];

        if (pasosConContrasteViejos.length === 0) continue;

        const pasosLimpios = pasosViejos.filter((p) => !esMarcador(p));
        const extrasLimpios = pasosConContrasteViejos
          .filter((p) => !esMarcador(p))
          .map((p) => ({ ...p, soloConContraste: true, despuesDeInyeccion: true }));

        const pasosNuevos = [...pasosLimpios, ...extrasLimpios];

        await updateDoc(d.ref, {
          pasos: pasosNuevos,
          pasosConContraste: [],
          updatedAt: serverTimestamp(),
        });
        lineas.push(
          `OK ${patologia}: ${pasosLimpios.length} fijas + ${extrasLimpios.length} post-contraste`
        );
        setLog([...lineas]);
      }
      if (lineas.length === 0) lineas.push("No había ningún protocolo para migrar.");
      setLog([...lineas]);
      setEstado("listo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setEstado("error");
    }
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Encabezado />
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-xl">
          <Link href="/admin" className="mb-4 inline-block text-xs text-ink-faint hover:text-ink">
            ← Volver
          </Link>
          <h1 className="mb-2 text-lg font-semibold text-ink">
            Migrar al nuevo formato de post-contraste
          </h1>
          <p className="mb-4 text-sm text-ink-dim">
            Junta la técnica base y la lista vieja de &quot;con contraste&quot; en una sola
            lista, marcando cada secuencia agregada como post-contraste. No duplica
            contenido genuino. Corré esto una sola vez.
          </p>

          <div className="mb-6 rounded border border-tc-dim bg-tc-dim/10 p-3">
            <p className="text-xs text-ink-dim">
              <strong>Ojo con &quot;Cerebro Rutina&quot;:</strong> ese protocolo tiene
              secuencias duplicadas a propósito (por el bug anterior) en la lista vieja de
              contraste. Este script las va a migrar tal cual, duplicadas. Después de correr
              esto, andá a editarlo a mano y borrá las filas post-contraste que sean
              copias exactas de una fija (dejá solo las que son realmente nuevas, como las
              que llevan &quot;(C/C)&quot;).
            </p>
          </div>

          {estado === "inicial" && (
            <button
              onClick={migrar}
              className="rounded bg-rm-dim px-4 py-2 text-sm font-medium text-ink hover:bg-rm hover:text-bg"
            >
              Migrar protocolos
            </button>
          )}

          {estado === "cargando" && (
            <p className="mb-3 font-mono text-sm text-ink-faint">Procesando…</p>
          )}

          {log.length > 0 && (
            <div className="mt-4 max-h-96 overflow-y-auto rounded border border-border bg-surface p-3">
              {log.map((l, i) => (
                <p key={i} className="font-mono text-xs text-ink-dim">
                  {l}
                </p>
              ))}
            </div>
          )}

          {estado === "listo" && (
            <div className="mt-4 rounded border border-rm-dim bg-rm-dim/10 p-4">
              <p className="text-sm text-ink">
                Listo.{" "}
                <Link href="/protocolos" className="text-rm hover:underline">
                  Ir a Protocolos
                </Link>
              </p>
            </div>
          )}

          {estado === "error" && (
            <p className="mt-4 rounded border border-alert-dim bg-alert-dim/20 px-3 py-2 text-sm text-alert">
              {error}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function MigrarPostContrastePage() {
  return (
    <RutaProtegida rolRequerido="admin">
      <MigrarPostContraste />
    </RutaProtegida>
  );
}
