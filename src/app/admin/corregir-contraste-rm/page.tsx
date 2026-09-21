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

const PATOLOGIAS_A_CORREGIR = ["Columna total", "Plexo braquial", "Plexo lumbar"];

function AplicarCorreccion() {
  const [estado, setEstado] = useState<"inicial" | "cargando" | "listo" | "error">("inicial");
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function aplicar() {
    setEstado("cargando");
    setError(null);
    const lineas: string[] = [];
    try {
      const q = query(collection(db, "protocolos"), where("modalidad", "==", "RM"));
      const snap = await getDocs(q);

      for (const d of snap.docs) {
        const data = d.data();
        const patologia = (data.patologia as string) ?? "";
        if (!PATOLOGIAS_A_CORREGIR.includes(patologia)) continue;

        const pasos = (data.pasos as PasoProtocolo[]) ?? [];
        const indiceDivisor = pasos.findIndex((p) => p.titulo.includes("Se inyecta contraste"));

        if (indiceDivisor === -1) {
          lineas.push(`— ${patologia}: ya estaba corregido, no tenía separador.`);
          setLog([...lineas]);
          continue;
        }

        const pasosSinContraste = pasos.slice(0, indiceDivisor);
        const pasosConContraste = pasos.slice(indiceDivisor + 1);

        await updateDoc(d.ref, {
          pasos: pasosSinContraste,
          pasosConContraste,
          updatedAt: serverTimestamp(),
        });
        lineas.push(
          `OK ${patologia}: ${pasosSinContraste.length} sin contraste + ${pasosConContraste.length} con contraste`
        );
        setLog([...lineas]);
      }
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
            Corregir Columna total y Plexos (selector de contraste)
          </h1>
          <p className="mb-6 text-sm text-ink-dim">
            Separa la lista de secuencias de estos 3 protocolos en “sin contraste” / “con
            contraste”, usando el separador de texto que tenían como corte. Se puede correr
            más de una vez sin problema.
          </p>

          {estado === "inicial" && (
            <button
              onClick={aplicar}
              className="rounded bg-rm-dim px-4 py-2 text-sm font-medium text-ink hover:bg-rm hover:text-bg"
            >
              Aplicar corrección
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

export default function CorregirContrasteRMPage() {
  return (
    <RutaProtegida rolRequerido="admin">
      <AplicarCorreccion />
    </RutaProtegida>
  );
}
