"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { RutaProtegida } from "@/components/RutaProtegida";
import { Encabezado } from "@/components/Encabezado";
import { db } from "@/lib/firebase/client";
import type { ParametroFicha, Protocolo, ReconstruccionTC } from "@/types/database.types";

/**
 * PÁGINA DE USO ÚNICO.
 * Carga en los protocolos de TC la tabla de parámetros (espesor, filtro,
 * ventana, etc.) como tarjetas de reconstrucción + el SFOV en la ficha.
 * Cuando termines, podés borrar esta carpeta (src/app/admin/importar-tc).
 */

interface FilaTabla {
  etiqueta: string;
  espesor: string;
  filtro: string;
  opcion: string;
  ventana: string; // "ancho/nivel", tal cual está en la planilla
  ss: string;
  revisar?: boolean; // dato dudoso de la planilla, para que lo mires
}

interface GrupoTabla {
  clave: string;
  nombre: string;
  alias: string[]; // nombres con los que puede estar cargado el protocolo
  sfov?: string;
  filas: FilaTabla[];
}

const GRUPOS: GrupoTabla[] = [
  {
    clave: "abdomen",
    nombre: "Abdomen",
    alias: ["abdomen"],
    sfov: "Large body",
    filas: [
      { etiqueta: "ADQ", espesor: "3,75", filtro: "Soft", opcion: "FULL", ventana: "400/40", ss: "40" },
      { etiqueta: "VOL", espesor: "1,25", filtro: "Soft", opcion: "FULL", ventana: "400/40", ss: "60" },
    ],
  },
  {
    clave: "partes-blandas-tx-abd-pelvis",
    nombre: "Partes blandas: Tx, Abd y Pelvis. Uro TC",
    alias: ["partes blandas tx abd y pelvis uro tc", "partes blandas tx abd y pelvis", "uro tc"],
    sfov: "Large body",
    filas: [
      { etiqueta: "ADQ", espesor: "3,75", filtro: "Soft", opcion: "FULL", ventana: "400/40", ss: "40" },
      { etiqueta: "VOL", espesor: "1,25", filtro: "Standard", opcion: "PLUS-E", ventana: "400/40", ss: "60" },
    ],
  },
  {
    clave: "torax",
    nombre: "Tórax",
    alias: ["torax"],
    sfov: "Large body",
    filas: [
      { etiqueta: "ADQ", espesor: "3,75", filtro: "Large body", opcion: "FULL", ventana: "400/40", ss: "40", revisar: true },
      { etiqueta: "Mediastino", espesor: "1,25", filtro: "Standard", opcion: "PLUS-E", ventana: "400/40", ss: "50" },
      { etiqueta: "Parénquima", espesor: "1,25", filtro: "Lung", opcion: "PLUS-E", ventana: "1500/-600", ss: "30" },
    ],
  },
  {
    clave: "torax-hd",
    nombre: "Tórax HD",
    alias: ["torax hd"],
    sfov: "Large body",
    filas: [
      { etiqueta: "ADQ", espesor: "0,625", filtro: "Large body", opcion: "FULL", ventana: "400/40", ss: "40", revisar: true },
      { etiqueta: "Mediastino", espesor: "0,625", filtro: "Standard", opcion: "PLUS-E", ventana: "400/40", ss: "50" },
      { etiqueta: "Parénquima", espesor: "0,625", filtro: "Lung", opcion: "PLUS-E", ventana: "1500/-600", ss: "30" },
    ],
  },
  {
    clave: "columna-rutina",
    nombre: "Columna rutina",
    alias: ["columna rutina"],
    sfov: "Small body",
    filas: [
      { etiqueta: "Estándar", espesor: "1,25", filtro: "Standard", opcion: "FULL", ventana: "400/40", ss: "20" },
      { etiqueta: "Óseo", espesor: "1,25", filtro: "Bone Plus", opcion: "PLUS-E", ventana: "3000/800", ss: "30" },
    ],
  },
  {
    clave: "cuello",
    nombre: "Cuello",
    alias: ["cuello"],
    sfov: "Small body",
    filas: [
      { etiqueta: "ADQ", espesor: "1,25", filtro: "Standard", opcion: "PLUS-E", ventana: "400/50", ss: "40" },
    ],
  },
  {
    clave: "spn-macizo",
    nombre: "SPN / Macizo",
    alias: ["spn macizo", "spn", "macizo", "senos paranasales", "macizo facial"],
    sfov: "Head",
    filas: [
      { etiqueta: "Estándar", espesor: "0,625", filtro: "Standard", opcion: "PLUS-E", ventana: "100/50", ss: "40" },
      { etiqueta: "Óseo", espesor: "0,625", filtro: "Bone Plus", opcion: "PLUS-E", ventana: "2000/350", ss: "20" },
    ],
  },
  {
    clave: "cerebro",
    nombre: "Cerebro",
    alias: ["cerebro"],
    sfov: "Head",
    filas: [
      { etiqueta: "ADQ", espesor: "2,5", filtro: "Standard", opcion: "FULL", ventana: "400/40", ss: "40" },
      { etiqueta: "VOL", espesor: "1,25", filtro: "Soft", opcion: "PLUS-E", ventana: "100/50", ss: "40" },
      { etiqueta: "Óseo", espesor: "1,25", filtro: "Bone Plus", opcion: "PLUS-E", ventana: "2000/350", ss: "20" },
    ],
  },
  {
    clave: "columna-cervical",
    nombre: "Columna cervical",
    alias: ["columna cervical", "cervical"],
    filas: [
      { etiqueta: "VOL soft", espesor: "0,625", filtro: "Soft", opcion: "PLUS-E", ventana: "400/40", ss: "60" },
      { etiqueta: "Óseo", espesor: "0,625", filtro: "Bone Plus", opcion: "PLUS-E", ventana: "2500/700", ss: "30" },
    ],
  },
  {
    clave: "oseo-estandar",
    nombre: "Óseo estándar",
    alias: ["oseo estandar"],
    filas: [
      { etiqueta: "VOL óseo", espesor: "1,25", filtro: "Bone Plus", opcion: "PLUS-E", ventana: "3000/800", ss: "30" },
    ],
  },
  {
    clave: "partes-blandas-estandar",
    nombre: "Partes blandas estándar",
    alias: ["partes blandas estandar"],
    filas: [
      { etiqueta: "VOL", espesor: "1,25", filtro: "Standard", opcion: "PLUS-E", ventana: "400/40", ss: "60" },
    ],
  },
];

function normalizar(t: string) {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function textoVentana(v: string) {
  const [ancho, ...resto] = v.split("/");
  return `Ancho ${ancho} · Nivel ${resto.join("/")}`;
}

function parametrosDe(f: FilaTabla): ParametroFicha[] {
  return [
    { etiqueta: "Espesor", valor: `${f.espesor} mm`, destacado: false },
    { etiqueta: "Filtro", valor: f.filtro, destacado: false },
    { etiqueta: "Opción de recon", valor: f.opcion, destacado: false },
    { etiqueta: "Ventana", valor: textoVentana(f.ventana), destacado: false },
    { etiqueta: "SS", valor: f.ss, destacado: false },
  ];
}

// Busca a qué protocolo de TC corresponde cada grupo (solo si hay una coincidencia clara).
function sugerir(grupo: GrupoTabla, lista: Protocolo[]): string {
  const exactos = lista.filter((p) => grupo.alias.includes(normalizar(p.patologia)));
  if (exactos.length === 1) return exactos[0].id;
  if (exactos.length > 1) return "";
  const parciales = lista.filter((p) => {
    const n = normalizar(p.patologia);
    return grupo.alias.some((a) => n.includes(a));
  });
  return parciales.length === 1 ? parciales[0].id : "";
}

type Estado = "aplicando" | "ok" | "error";

function PanelImportar() {
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<Record<string, Estado>>({});
  const [aplicando, setAplicando] = useState(false);

  useEffect(() => {
    let activo = true;
    getDocs(query(collection(db, "protocolos"), where("modalidad", "==", "TC")))
      .then((snap) => {
        if (!activo) return;
        const datos = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Protocolo)
          .sort((a, b) => `${a.region} ${a.patologia}`.localeCompare(`${b.region} ${b.patologia}`));
        setProtocolos(datos);
        const inicial: Record<string, string> = {};
        for (const g of GRUPOS) inicial[g.clave] = sugerir(g, datos);
        setSeleccion(inicial);
        setCargando(false);
      })
      .catch((err) => {
        if (!activo) return;
        setError(err instanceof Error ? err.message : "Error desconocido");
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const aAplicar = useMemo(() => GRUPOS.filter((g) => !!seleccion[g.clave]), [seleccion]);

  function descargarBackup() {
    const blob = new Blob([JSON.stringify(protocolos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-protocolos-TC-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function aplicar() {
    if (aAplicar.length === 0) return;
    if (
      !confirm(
        `Se van a modificar ${aAplicar.length} protocolo(s). Las tarjetas de reconstrucción que ya tengan se reemplazan. ¿Seguro?`
      )
    )
      return;

    setAplicando(true);
    for (const g of aAplicar) {
      const p = protocolos.find((x) => x.id === seleccion[g.clave]);
      if (!p) continue;
      setEstado((prev) => ({ ...prev, [g.clave]: "aplicando" }));
      try {
        const reconstruccionesTC: ReconstruccionTC[] = g.filas.map((f) => ({
          titulo: f.etiqueta,
          destino: null,
          parametros: parametrosDe(f),
        }));

        // La ficha previa se conserva; solo se agrega/reemplaza el SFOV.
        const fichaPrevia = (p.fichaAdquisicion ?? []).filter(
          (x) => x.etiqueta.trim().toLowerCase() !== "sfov"
        );
        const fichaAdquisicion: ParametroFicha[] = g.sfov
          ? [...fichaPrevia, { etiqueta: "SFOV", valor: g.sfov, destacado: false }]
          : fichaPrevia;

        const vistaPrevia = p.vistaTC ?? { ruta: false, ficha: false, reconstrucciones: false, aviso: false };

        await updateDoc(doc(db, "protocolos", p.id), {
          reconstruccionesTC,
          fichaAdquisicion,
          vistaTC: {
            ...vistaPrevia,
            ficha: fichaAdquisicion.length > 0 ? true : vistaPrevia.ficha,
            reconstrucciones: true,
          },
          updatedAt: serverTimestamp(),
        });
        setEstado((prev) => ({ ...prev, [g.clave]: "ok" }));
      } catch {
        setEstado((prev) => ({ ...prev, [g.clave]: "error" }));
      }
    }
    setAplicando(false);
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Encabezado />
      <main className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <Link href="/admin" className="mb-4 inline-block text-xs text-ink-faint hover:text-ink">
            ← Volver al panel
          </Link>
          <h1 className="mb-1 text-lg font-semibold text-ink">Cargar parámetros de TC</h1>
          <p className="mb-4 text-sm text-ink-dim">
            Elegí a qué protocolo corresponde cada fila de la planilla. Al aplicar, cada protocolo
            recibe sus tarjetas de reconstrucción y el SFOV en la ficha, y activa esa vista. Los
            pasos no se tocan.
          </p>

          <div className="mb-6 rounded border border-border bg-surface p-4 text-sm text-ink-dim">
            <p className="mb-2">
              Antes de aplicar, descargá un backup por las dudas. Es de uso único: cuando termines
              podés borrar esta pantalla.
            </p>
            <button
              onClick={descargarBackup}
              disabled={protocolos.length === 0}
              className="rounded border border-border px-3 py-1.5 text-sm text-ink hover:border-rm-dim disabled:opacity-50"
            >
              ⬇ Descargar backup de TC
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded border border-alert-dim bg-alert-dim/10 p-4">
              <p className="text-sm text-alert">Error al cargar protocolos: {error}</p>
            </div>
          )}
          {cargando && <p className="font-mono text-sm text-ink-faint">Cargando…</p>}

          <div className="flex flex-col gap-4">
            {GRUPOS.map((g) => {
              const elegido = protocolos.find((p) => p.id === seleccion[g.clave]);
              const yaTiene = elegido?.reconstruccionesTC?.length ?? 0;
              const est = estado[g.clave];
              return (
                <div key={g.clave} className="rounded border border-border bg-surface p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <p className="min-w-[10rem] flex-1 text-sm font-semibold text-ink">{g.nombre}</p>
                    <select
                      value={seleccion[g.clave] ?? ""}
                      onChange={(e) =>
                        setSeleccion((prev) => ({ ...prev, [g.clave]: e.target.value }))
                      }
                      disabled={aplicando}
                      className="w-72 rounded border border-border bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-rm"
                    >
                      <option value="">— No aplicar —</option>
                      {protocolos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.region} · {p.patologia}
                        </option>
                      ))}
                    </select>
                    {est === "aplicando" && <span className="text-xs text-ink-faint">Guardando…</span>}
                    {est === "ok" && <span className="text-xs font-semibold text-rm">Listo</span>}
                    {est === "error" && <span className="text-xs font-semibold text-alert">Error</span>}
                  </div>

                  {yaTiene > 0 && (
                    <p className="mb-2 text-xs text-tc">
                      Este protocolo ya tiene {yaTiene} tarjeta(s) de reconstrucción: se van a
                      reemplazar.
                    </p>
                  )}

                  <div className="overflow-x-auto rounded border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-bg text-ink-faint">
                        <tr>
                          <th className="px-2 py-1.5 font-normal">Tarjeta</th>
                          <th className="px-2 py-1.5 font-normal">Espesor</th>
                          <th className="px-2 py-1.5 font-normal">Filtro</th>
                          <th className="px-2 py-1.5 font-normal">Opción</th>
                          <th className="px-2 py-1.5 font-normal">Ventana</th>
                          <th className="px-2 py-1.5 font-normal">SS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.filas.map((f, i) => (
                          <tr key={i} className="border-t border-border text-ink">
                            <td className="px-2 py-1.5 font-medium">{f.etiqueta}</td>
                            <td className="px-2 py-1.5">{f.espesor} mm</td>
                            <td className="px-2 py-1.5">
                              {f.filtro}
                              {f.revisar && (
                                <span className="ml-1 text-tc">(revisar: así dice la planilla)</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5">{f.opcion}</td>
                            <td className="px-2 py-1.5">{textoVentana(f.ventana)}</td>
                            <td className="px-2 py-1.5">{f.ss}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {g.sfov && <p className="mt-2 text-xs text-ink-dim">SFOV (ficha): {g.sfov}</p>}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-3 pb-8">
            <button
              onClick={aplicar}
              disabled={aplicando || aAplicar.length === 0}
              className="rounded bg-rm-dim px-4 py-2 text-sm font-medium text-ink hover:bg-rm hover:text-bg disabled:opacity-50"
            >
              {aplicando ? "Aplicando…" : `Aplicar a ${aAplicar.length} protocolo(s)`}
            </button>
            <p className="text-xs text-ink-faint">
              Los grupos en “No aplicar” se saltean.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ImportarTCPage() {
  return (
    <RutaProtegida rolRequerido="admin">
      <PanelImportar />
    </RutaProtegida>
  );
}
