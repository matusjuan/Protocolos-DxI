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

const recon = (titulo: string, detalle = ""): PasoProtocolo => ({ titulo, detalle });

const ANGIO_RECON: PasoProtocolo[] = [
  recon("MPR coronal y sagital", "Sobre el volumen adquirido."),
  recon("MIP", "Espesor 18 mm."),
  recon("Reconstrucción 3D"),
];

const CEREBRO_RECON: PasoProtocolo[] = [
  recon("Volumen soft — MPR coronal, sagital y axial"),
  recon(
    "Volumen bone — MPR coronal, sagital y axial",
    "Si el estudio no es por trauma, enviar únicamente el volumen (sin necesidad de hacer los MPR)."
  ),
];

const CUELLO_RECON: PasoProtocolo[] = [recon("Volumen soft — MPR coronal, sagital y axial")];

const TORAX_RECON: PasoProtocolo[] = [
  recon("Volumen mediastino — MINIP coronal", "Espesor 18 mm."),
  recon("Volumen parénquima — MPR coronal y sagital"),
  recon("Volumen parénquima — MIP axial", "Espesor 18 mm."),
];

const TORAX_SIN_MEDIASTINO_RECON: PasoProtocolo[] = [
  recon(
    "Tórax — MINIP coronal desde volumen portal",
    "En este protocolo combinado no existe volumen mediastino: el MINIP (18 mm) se hace desde el volumen portal."
  ),
  recon("Tórax — MIP axial", "Espesor 18 mm."),
];

const ABDOMEN_PELVIS_RECON: PasoProtocolo[] = [
  recon(
    "MPR coronal y sagital",
    "Sobre los volúmenes adquiridos: sin contraste, arterial, portal y/o tardío, según corresponda al estudio."
  ),
];

const RECONSTRUCCIONES_TC: Record<string, PasoProtocolo[]> = {
  "TC de abdomen y pelvis con contraste endovenoso": ABDOMEN_PELVIS_RECON,

  "Colonoscopía virtual": [
    recon("MPR coronal y sagital", "Sobre los volúmenes en decúbito supino y en decúbito prono."),
    recon("Reconstrucción 3D", "Sobre ambos volúmenes (supino y prono)."),
  ],

  "TC de cerebro con contraste endovenoso": CEREBRO_RECON,
  "TC de cuello con contraste EV": CUELLO_RECON,
  "TC de laringe sin contraste EV": CUELLO_RECON,

  "TC de órbitas con contraste EV": [
    recon(
      "Reconstrucción con FOV dedicado",
      "Acotada a ambas órbitas, para maximizar la resolución espacial."
    ),
    recon(
      "Cortes sagitales oblicuos del nervio óptico",
      "Sobre el volumen de FOV reducido, orientados al eje longitudinal de cada nervio óptico, derecho e izquierdo por separado."
    ),
    recon("MPR coronal, axial y sagital"),
  ],

  "TC de tórax con contraste endovenoso": TORAX_RECON,

  "TC de cuello y tórax con contraste EV": [...CUELLO_RECON, ...TORAX_RECON],

  "TC de cuello, tórax, abdomen y pelvis con contraste EV": [
    ...CUELLO_RECON,
    ...TORAX_SIN_MEDIASTINO_RECON,
    ...ABDOMEN_PELVIS_RECON,
  ],
  "TC de cuello, tórax, abdomen y pelvis sin contraste EV": [
    ...CUELLO_RECON,
    recon("Tórax — Volumen parénquima: MPR coronal y sagital"),
  ],

  "TC de tórax, abdomen y pelvis con contraste EV": [
    ...TORAX_SIN_MEDIASTINO_RECON,
    ...ABDOMEN_PELVIS_RECON,
  ],

  "TC de encéfalo y cuello con contraste EV": [...CEREBRO_RECON, ...CUELLO_RECON],
  "TC de encéfalo y cuello sin contraste EV": [...CEREBRO_RECON, ...CUELLO_RECON],

  "AngioTC de encéfalo": ANGIO_RECON,
  "AngioTC de cuello": ANGIO_RECON,
  "AngioTC arterias subclavias": ANGIO_RECON,
  "AngioTC de aorta torácica sin gatillado": ANGIO_RECON,
  "AngioTC de aorta torácica con gatillado": ANGIO_RECON,
  "AngioTC pulmonar (x TEP)": ANGIO_RECON,
  "AngioTC pulmonar (x TEP) en embarazadas": ANGIO_RECON,
  "AngioTC de aorta abdominal": ANGIO_RECON,
  "AngioTC de abdomen, pelvis y miembros inferiores": ANGIO_RECON,
  "AngioTC de tórax, abdomen, pelvis y miembros inferiores": ANGIO_RECON,
  "AngioTC arterias renales o esplénica": ANGIO_RECON,
};

const SIN_PROTOCOLO_TODAVIA = ["Oídos (FOV dedicado + MPR coronal, axial y sagital)"];

function AplicarReconstrucciones() {
  const [estado, setEstado] = useState<"inicial" | "cargando" | "listo" | "error">("inicial");
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function aplicar() {
    setEstado("cargando");
    setError(null);
    const lineas: string[] = [];
    try {
      const q = query(collection(db, "protocolos"), where("modalidad", "==", "TC"));
      const snap = await getDocs(q);

      for (const d of snap.docs) {
        const patologia = (d.data().patologia as string) ?? "";
        const reconstrucciones = RECONSTRUCCIONES_TC[patologia];
        if (reconstrucciones) {
          await updateDoc(d.ref, { reconstrucciones, updatedAt: serverTimestamp() });
          lineas.push(`OK ${patologia} - ${reconstrucciones.length} reconstruccion(es)`);
        }
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
            Aplicar reconstrucciones a los protocolos de TC
          </h1>
          <p className="mb-4 text-sm text-ink-dim">
            Busca cada protocolo de TC existente por su nombre y le agrega las reconstrucciones
            correspondientes (MPR, MIP, 3D, etc.). Se puede correr más de una vez sin problema.
          </p>

          <div className="mb-6 rounded border border-tc-dim bg-tc-dim/10 p-3">
            <p className="text-xs text-ink-dim">
              Todavía no tenés un protocolo cargado para: {SIN_PROTOCOLO_TODAVIA.join(", ")}. Si
              querés, creálo desde &quot;+ Nuevo protocolo&quot; y después avisame para agregarle
              la reconstrucción.
            </p>
          </div>

          {estado === "inicial" && (
            <button
              onClick={aplicar}
              className="rounded bg-rm-dim px-4 py-2 text-sm font-medium text-ink hover:bg-rm hover:text-bg"
            >
              Aplicar reconstrucciones
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
            <div className="mt-4 rounded border border-rx-dim bg-rx-dim/10 p-4">
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

export default function AplicarReconstruccionesPage() {
  return (
    <RutaProtegida rolRequerido="admin">
      <AplicarReconstrucciones />
    </RutaProtegida>
  );
}
