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

const divisor = (): PasoProtocolo => ({ titulo: "— Se inyecta contraste —", detalle: "" });

interface ProtocoloSemilla {
  region: string;
  subregion?: string;
  patologia: string;
  usaContraste?: boolean;
  detalleContraste?: string;
  notas?: string;
  pasos: PasoProtocolo[];
}

const secuencias = (lista: string[]): PasoProtocolo[] =>
  lista.map((s) => ({ titulo: s, detalle: "" }));

const PROTOCOLOS: ProtocoloSemilla[] = [
  {
    region: "Osteoarticular",
    subregion: "Miembros inferiores",
    patologia: "Antepié",
    notas: NOTA_CONTRASTE_OSEO,
    pasos: secuencias(["Sag PD FSE FS", "Ax T1 FSE", "Ax PD FSE FS", "Cor PD FSE Flex", "Cor T1 FSE"]),
  },
  {
    region: "Osteoarticular",
    subregion: "Miembros inferiores",
    patologia: "Cadera",
    notas: NOTA_CONTRASTE_OSEO,
    pasos: secuencias([
      "Cor STIR (bilateral)",
      "Cor T1 FSE (unilateral)",
      "Cor PD FSE FS (unilateral)",
      "Sag PD FSE FS (unilateral)",
      "Ax PD FSE FS (unilateral)",
      "Ax 2D Merge (unilateral)",
    ]),
  },
  {
    region: "Osteoarticular",
    subregion: "Miembros inferiores",
    patologia: "Muslo",
    notas: NOTA_CONTRASTE_OSEO,
    pasos: secuencias(["Sag T1 FSE", "Sag DP FS FSE", "Sag T2 STIR", "Cor T1 FSE", "Ax T1 FSE", "Ax PD FSE FS"]),
  },
  {
    region: "Osteoarticular",
    subregion: "Miembros inferiores",
    patologia: "Pierna",
    notas: NOTA_CONTRASTE_OSEO,
    pasos: secuencias([
      "Sag T1 FSE",
      "Sag DP FSE Flex",
      "Sag T2 STIR",
      "Cor T1 FSE",
      "Cor DP FSE Flex",
      "Ax T1 FSE",
      "Ax PD FSE FS",
    ]),
  },
  {
    region: "Osteoarticular",
    subregion: "Miembros inferiores",
    patologia: "Rodilla",
    notas: NOTA_CONTRASTE_OSEO,
    pasos: secuencias([
      "3D Ax PD FS Cube (1.5T) / Ax PD FS (3T)",
      "Cor PD FSE FS (1.5T) / Cor T2 FS (3T)",
      "Sag T1 FSE",
      "Sag T2 FSE FS",
      "Cor T2 FSE (LCA)",
    ]),
  },
  {
    region: "Osteoarticular",
    subregion: "Miembros inferiores",
    patologia: "Tobillo",
    notas: NOTA_CONTRASTE_OSEO,
    pasos: secuencias([
      "Sag T1 FSE",
      "Sag T2 FSE FS",
      "Cor T1 FSE",
      "Cor T2 FSE FS",
      "Ax T1 FSE",
      "Ax PD FSE FS",
    ]),
  },
  {
    region: "Osteoarticular",
    subregion: "Miembros superiores",
    patologia: "Escápula",
    notas: NOTA_CONTRASTE_OSEO,
    pasos: secuencias(["Ax PD FS", "Sag PD FS", "Cor PD FS", "Cor T1 FS", "Ax T1", "Ax T1 FS"]),
  },
  {
    region: "Osteoarticular",
    subregion: "Miembros superiores",
    patologia: "Dedos - Pulgar",
    notas: NOTA_CONTRASTE_OSEO,
    pasos: secuencias(["Ax PD FS Flex", "Cor PD FS Flex", "Cor T1", "Sag PD FS Flex", "Cor 3D Merge"]),
  },
  {
    region: "Columna",
    patologia: "Columna total",
    usaContraste: true,
    detalleContraste:
      "Protocolo combinado de cervical, dorsal y lumbar, con fase sin contraste (S/C) y con contraste (C/C).",
    pasos: [
      ...secuencias([
        "Cor T2 FS (cervical)",
        "Cor T2 FS (dorsal)",
        "Cor T2 FS (lumbar)",
        "Sag T1 (cervical)",
        "Sag T1 (dorsal)",
        "Sag T1 (lumbar)",
        "Sag T2 (cervical)",
        "Sag T2 (dorsal)",
        "Sag T2 (lumbar)",
        "Sag T2 STIR (cervical)",
        "Sag T2 STIR (dorsal)",
        "Sag T2 STIR (lumbar)",
        "Ax 2D T2* Merge (cervical)",
        "Ax T2 FSE (dorsal)",
        "Ax T2 FSE (lumbar)",
        "3D Ax LAVA S/C (cervical)",
        "3D Ax LAVA S/C (dorsal)",
        "3D Ax LAVA S/C (lumbar)",
      ]),
      divisor(),
      ...secuencias([
        "3D Ax LAVA C/C (cervical)",
        "3D Ax LAVA C/C (dorsal)",
        "3D Ax LAVA C/C (lumbar)",
        "Sag T1 C/C (cervical)",
        "Sag T1 C/C (dorsal)",
        "Sag T1 C/C (lumbar)",
      ]),
    ],
  },
  {
    region: "Neuro",
    patologia: "Plexo braquial",
    usaContraste: true,
    pasos: [
      ...secuencias(["Sag T PROPELLER", "Ax T1 FSE", "3D Cor Lava (S/C)"]),
      divisor(),
      ...secuencias([
        "3D Cor CUBE STIR (C/C)",
        "3D Cor MENSA (C/C) (1.5T)",
        "3D Cor T2 Cube (C/C)",
        "3D Cor Lava (C/C)",
        "Ax DWI b500-1000 (C/C)",
      ]),
    ],
  },
  {
    region: "Neuro",
    patologia: "Plexo lumbar",
    usaContraste: true,
    pasos: [
      ...secuencias(["Sag T PROPELLER", "Ax T1 FSE", "3D Cor Lava (S/C)"]),
      divisor(),
      ...secuencias([
        "3D Cor CUBE STIR (C/C)",
        "3D Cor MENSA (C/C) (1.5T)",
        "3D Cor T2 Cube (C/C)",
        "3D Cor Lava (C/C)",
        "Ax DWI b500-1000 (C/C)",
      ]),
    ],
  },
];

function ImportarRMOsteo2() {
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
          usaContraste: p.usaContraste ?? false,
          detalleContraste: p.detalleContraste ?? null,
          pasos: p.pasos,
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
            Importar protocolos de RM — parte 2 (miembro inferior, escápula, dedos-pulgar,
            columna total, plexos)
          </h1>
          <p className="mb-6 text-sm text-ink-dim">
            Crea {PROTOCOLOS.length} protocolos nuevos. No duplica los 13 que ya cargaste con el
            importador anterior. Usalo una sola vez.
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

export default function ImportarRMOsteo2Page() {
  return (
    <RutaProtegida rolRequerido="admin">
      <ImportarRMOsteo2 />
    </RutaProtegida>
  );
}
