"use client";

import { useState } from "react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { RutaProtegida } from "@/components/RutaProtegida";
import { Encabezado } from "@/components/Encabezado";
import { db } from "@/lib/firebase/client";
import type { Modalidad, PasoProtocolo } from "@/types/database.types";

const MODALIDAD: Modalidad = "RM";

const NOTA_CONTRASTE_OSEO =
  "Todas las secuencias óseas, si se solicitan con contraste, se realizan además en los 3 planos (coronal, sagital y axial) T1 FS, sin y con gadolinio.";

interface ProtocoloSemilla {
  region: string;
  subregion?: string;
  patologia: string;
  notas?: string;
  secuencias: string[];
}

const secuencias = (lista: string[]): PasoProtocolo[] =>
  lista.map((s) => ({ titulo: s, detalle: "" }));

const PROTOCOLOS: ProtocoloSemilla[] = [
  {
    region: "Osteoarticular",
    subregion: "Miembros superiores",
    patologia: "Brazo - Antebrazo",
    notas: NOTA_CONTRASTE_OSEO,
    secuencias: ["Cor DP FSE Flex", "Cor T1 FSE", "Sag DP FSE Flex", "Ax T1 FSE", "Ax PD FSE Flex"],
  },
  {
    region: "Osteoarticular",
    subregion: "Miembros superiores",
    patologia: "Clavícula",
    notas: NOTA_CONTRASTE_OSEO,
    secuencias: ["Ax T1 FSE", "Cor T1 FSE", "Ax T2 STIR PROPELLER", "Sag DP FSE FS", "Cor DP FSE FS"],
  },
  {
    region: "Osteoarticular",
    subregion: "Miembros superiores",
    patologia: "Codo",
    notas: NOTA_CONTRASTE_OSEO,
    secuencias: ["Cor T1 FSE", "Cor PD FSE FS", "Ax T1", "Ax PD FSE FS", "Sag PD FSE FS"],
  },
  {
    region: "Osteoarticular",
    subregion: "Miembros superiores",
    patologia: "Hombro",
    notas: NOTA_CONTRASTE_OSEO,
    secuencias: ["Ax 2D Merge", "Cor T1 FSE", "Cor T2 FSE FS", "Sag DP FSE FS"],
  },
  {
    region: "Osteoarticular",
    subregion: "Miembros superiores",
    patologia: "Mano",
    notas: NOTA_CONTRASTE_OSEO,
    secuencias: ["Cor T1 FSE", "Ax T1 FSE", "Cor DP FSE Flex", "Sag DP FSE Flex", "Cor 3D Merge"],
  },
  {
    region: "Osteoarticular",
    subregion: "Miembros superiores",
    patologia: "Muñeca",
    notas: NOTA_CONTRASTE_OSEO,
    secuencias: ["Cor T1 FSE", "Cor PD FSE FS", "Ax PD FSE FS", "Ax T1 FSE", "Sag PD FSE FS"],
  },
  {
    region: "Columna",
    patologia: "Cervical",
    secuencias: ["3D Sag Cube T2", "Sag T1 FSE", "Sag T2 FSE STIR", "Ax 2D T2* Merge"],
  },
  {
    region: "Columna",
    patologia: "Dorsal",
    secuencias: ["Cor T2 FS", "Sag T1", "Sag T2", "Sag T2 STIR", "Ax T2 FSE"],
  },
  {
    region: "Columna",
    patologia: "Lumbar",
    secuencias: ["Cor T2 FS", "Sag T1", "Sag T2 Flex", "Ax T2 FSE"],
  },
  {
    region: "Columna",
    patologia: "Sacro Ilíacas",
    secuencias: ["Ax PD FSE FS", "Ax STIR", "Ax 3D Merge", "Cor PD FSE FS", "Cor T1 FSE", "Sag PD FSE FS"],
  },
  {
    region: "Pelvis",
    patologia: "Pelvis ósea",
    notas: NOTA_CONTRASTE_OSEO,
    secuencias: ["Cor STIR", "Cor T1 FSE", "Cor PD FSE FS", "Sag PD FSE FS", "Ax PD FSE FS", "Ax T1 FSE"],
  },
  {
    region: "Tórax",
    patologia: "Tórax MSK",
    secuencias: [
      "Ax T1",
      "Cor T1",
      "Sag T1",
      "Ax T2 Propeller FS RT",
      "Ax STIR Propeller RT",
      "Sag STIR PROPELLER RT",
    ],
  },
  {
    region: "Tórax",
    patologia: "Parrilla costal",
    secuencias: ["Sag PD FS", "Cor T1", "Ax PD FS", "Ax T1", "Cor DP FS", "Ax DIF B50/400/800"],
  },
];

function ImportarRMOsteo() {
  const [estado, setEstado] = useState<"inicial" | "cargando" | "listo" | "error">("inicial");
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function importar() {
    setEstado("cargando");
    setProgreso(0);
    setError(null);
    try {
      for (const p of PROTOCOLOS) {
        await addDoc(collection(db, "protocolos"), {
          modalidad: MODALIDAD,
          region: p.region,
          subregion: p.subregion ?? null,
          patologia: p.patologia,
          indicacion: null,
          usaContraste: false,
          detalleContraste: null,
          pasos: secuencias(p.secuencias),
          notas: p.notas ?? null,
          imagenes: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setProgreso((n) => n + 1);
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
            Importar protocolos de RM (osteoarticular, columna, pelvis, tórax)
          </h1>
          <p className="mb-6 text-sm text-ink-dim">
            Crea {PROTOCOLOS.length} protocolos de RM: 6 de Osteoarticular (miembros
            superiores), 4 de Columna, 1 de Pelvis y 2 de Tórax. Usalo una sola vez — si lo
            corrés dos veces, va a duplicar.
          </p>

          {estado === "inicial" && (
            <button
              onClick={importar}
              className="rounded bg-rm-dim px-4 py-2 text-sm font-medium text-ink hover:bg-rm hover:text-bg"
            >
              Importar {PROTOCOLOS.length} protocolos
            </button>
          )}

          {estado === "cargando" && (
            <p className="font-mono text-sm text-ink-faint">
              Cargando {progreso} / {PROTOCOLOS.length}…
            </p>
          )}

          {estado === "listo" && (
            <div className="rounded border border-rm-dim bg-rm-dim/10 p-4">
              <p className="text-sm text-ink">
                Listo, se importaron {PROTOCOLOS.length} protocolos.{" "}
                <Link href="/protocolos" className="text-rm hover:underline">
                  Ir a Protocolos
                </Link>
              </p>
            </div>
          )}

          {estado === "error" && (
            <p className="rounded border border-alert-dim bg-alert-dim/20 px-3 py-2 text-sm text-alert">
              {error}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ImportarRMOsteoPage() {
  return (
    <RutaProtegida rolRequerido="admin">
      <ImportarRMOsteo />
    </RutaProtegida>
  );
}
