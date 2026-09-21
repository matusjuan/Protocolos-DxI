"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { RutaProtegida } from "@/components/RutaProtegida";
import { Encabezado } from "@/components/Encabezado";
import { TablaParametros } from "@/components/TablaParametros";
import { GaleriaImagenes } from "@/components/GaleriaImagenes";
import { VideoEmbed } from "@/components/VideoEmbed";
import { db } from "@/lib/firebase/client";
import { metaModalidad } from "@/lib/modalidades";
import { useAuth } from "@/lib/firebase/AuthProvider";
import type { Protocolo } from "@/types/database.types";

function DetalleProtocolo() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { rol } = useAuth();
  const [protocolo, setProtocolo] = useState<Protocolo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conContraste, setConContraste] = useState(false);
  const [condicionesActivas, setCondicionesActivas] = useState<Set<string>>(new Set());

  function alternarCondicion(condicion: string) {
    setCondicionesActivas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(condicion)) nuevo.delete(condicion);
      else nuevo.add(condicion);
      return nuevo;
    });
  }
  const [pasosAbiertos, setPasosAbiertos] = useState<Set<number>>(new Set());

  function alternarPaso(i: number) {
    setPasosAbiertos((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(i)) nuevo.delete(i);
      else nuevo.add(i);
      return nuevo;
    });
  }

  useEffect(() => {
    if (!id) {
      setCargando(false);
      return;
    }
    let activo = true;
    getDoc(doc(db, "protocolos", id))
      .then((snap) => {
        if (!activo) return;
        setProtocolo(snap.exists() ? ({ id: snap.id, ...snap.data() } as Protocolo) : null);
        setCargando(false);
      })
      .catch((err) => {
        if (!activo) return;
        console.error("Error al cargar el protocolo:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="flex h-screen flex-col bg-bg">
        <Encabezado />
        <p className="p-6 text-sm text-alert">Error al cargar el protocolo: {error}</p>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="flex h-screen flex-col bg-bg">
        <Encabezado />
        <p className="p-6 font-mono text-sm text-ink-faint">Cargando…</p>
      </div>
    );
  }

  if (!protocolo) {
    return (
      <div className="flex h-screen flex-col bg-bg">
        <Encabezado />
        <p className="p-6 text-sm text-ink-dim">No se encontró el protocolo.</p>
      </div>
    );
  }

  const meta = metaModalidad(protocolo.modalidad);

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Encabezado />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <div className="mb-4 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-xs text-ink-faint hover:text-ink"
            >
              ← Volver
            </button>
            <Link href="/protocolos" className="text-xs text-ink-faint hover:text-ink">
              Inicio
            </Link>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <span
              className={`rounded border ${meta.borde} px-2 py-0.5 font-mono text-xs ${meta.texto}`}
            >
              {protocolo.modalidad}
            </span>
            <span className="text-sm text-ink-dim">{protocolo.region}</span>
            {rol === "admin" && (
              <Link
                href={`/admin/${protocolo.id}/editar`}
                className="ml-auto text-xs text-ink-faint hover:text-rm"
              >
                Editar
              </Link>
            )}
          </div>

          <h1 className="mb-6 text-2xl font-semibold text-ink">
            {protocolo.patologia}
          </h1>

          {protocolo.indicacion && (
            <div className="mb-6 rounded border border-border bg-surface p-4">
              <p className="mb-1 text-[11px] uppercase tracking-wide text-ink-faint">
                Indicación
              </p>
              <p className="text-sm text-ink-dim">{protocolo.indicacion}</p>
            </div>
          )}

          {protocolo.parametrosPorEdad && protocolo.parametrosPorEdad.length > 0 && (
            <TablaParametros grupos={protocolo.parametrosPorEdad} />
          )}

          {protocolo.pasos?.length > 0 && (() => {
            const itemsFinal =
              conContraste && protocolo.pasosConContraste?.length
                ? protocolo.pasosConContraste
                : protocolo.pasos;

            const condicionesDisponibles = itemsFinal
              .map((p) => p.condicionOpcional)
              .filter((c, idx, arr): c is string => !!c && arr.indexOf(c) === idx);

            const itemsVisibles = itemsFinal.filter(
              (p) => !p.condicionOpcional || condicionesActivas.has(p.condicionOpcional)
            );

            return (
              <div className="mb-6">
                {protocolo.modalidad === "RM" && (
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setConContraste(false)}
                      className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                        !conContraste
                          ? "border-rm bg-rm-dim text-ink"
                          : "border-border bg-surface text-ink-faint hover:border-rm-dim hover:text-ink"
                      }`}
                    >
                      Sin contraste
                    </button>
                    <button
                      onClick={() => setConContraste(true)}
                      className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                        conContraste
                          ? "border-tc bg-tc-dim text-ink"
                          : "border-border bg-surface text-ink-faint hover:border-tc-dim hover:text-ink"
                      }`}
                    >
                      Con contraste
                    </button>
                  </div>
                )}

                {protocolo.usaContraste && (protocolo.modalidad !== "RM" || conContraste) && (
                  <div className="mb-4 rounded border border-tc-dim bg-tc-dim/10 p-4">
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-tc">
                      Contraste
                    </p>
                    <p className="text-sm text-ink">
                      {protocolo.detalleContraste || "Este estudio requiere contraste."}
                    </p>
                  </div>
                )}

                <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-faint">
                  Técnica
                </p>

                {conContraste && !protocolo.pasosConContraste?.length && (
                  <p className="mb-2 text-xs text-ink-faint">
                    Todavía no hay una lista de secuencias con contraste cargada para este
                    estudio — se muestra la misma técnica de base.
                  </p>
                )}

                {condicionesDisponibles.length > 0 && (
                  <div className="mb-3 rounded border border-border bg-surface p-3">
                    <p className="mb-2 text-xs font-medium text-ink-dim">
                      ¿Alguna indicación especial? (tildá las que correspondan)
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {condicionesDisponibles.map((condicion) => (
                        <label key={condicion} className="flex items-center gap-2 text-sm text-ink">
                          <input
                            type="checkbox"
                            checked={condicionesActivas.has(condicion)}
                            onChange={() => alternarCondicion(condicion)}
                            className="h-4 w-4 accent-rm"
                          />
                          {condicion}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <ol className="flex flex-col gap-2">
                  {itemsVisibles.map((paso, i) => {
                    const esMarcadorInyeccion = paso.titulo.includes("inyecta el contraste");

                    if (esMarcadorInyeccion) {
                      return (
                        <li key={i} className="my-1 flex items-center gap-3 py-1">
                          <span className="h-px flex-1 bg-tc-dim" />
                          <span className="whitespace-nowrap text-xs font-semibold text-tc">
                            {paso.titulo}
                          </span>
                          <span className="h-px flex-1 bg-tc-dim" />
                        </li>
                      );
                    }

                    const abierto = pasosAbiertos.has(i);
                    const tieneContenido =
                      (paso.detalle && paso.detalle.trim().length > 0) || paso.imagen;
                    return (
                      <li key={i} className="overflow-hidden rounded border border-border bg-surface">
                        <button
                          type="button"
                          onClick={() => tieneContenido && alternarPaso(i)}
                          className={`flex w-full items-center gap-3 p-4 text-left ${
                            tieneContenido ? "cursor-pointer hover:bg-surface2" : "cursor-default"
                          }`}
                        >
                          <span className="font-mono text-sm text-ink-faint">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="flex-1 text-sm font-medium text-ink">
                            {paso.titulo}
                            {paso.condicionOpcional && (
                              <span className="ml-2 rounded border border-rm-dim px-1.5 py-0.5 text-[10px] font-normal text-rm">
                                {paso.condicionOpcional}
                              </span>
                            )}
                          </span>
                          {tieneContenido && (
                            <span className="text-xs text-ink-faint">{abierto ? "▲" : "▼"}</span>
                          )}
                        </button>
                        {tieneContenido && abierto && (
                          <div className="border-t border-border bg-bg px-4 py-3 pl-11">
                            {paso.detalle && (
                              <p className="whitespace-pre-line text-sm text-ink-dim">
                                {paso.detalle}
                              </p>
                            )}
                            {paso.imagen && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={paso.imagen}
                                alt={`Cómo programar: ${paso.titulo}`}
                                className={`max-h-72 rounded border border-border object-contain ${
                                  paso.detalle ? "mt-3" : ""
                                }`}
                              />
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })()}

          {protocolo.reconstrucciones && protocolo.reconstrucciones.length > 0 && (
            <div className="mb-6">
              <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-faint">
                Reconstrucciones
              </p>
              <ol className="flex flex-col gap-3">
                {protocolo.reconstrucciones.map((r, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded border border-rm-dim bg-rm-dim/10 p-4"
                  >
                    <span className="font-mono text-sm text-ink-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">{r.titulo}</p>
                      {r.detalle && (
                        <p className="mt-1 whitespace-pre-line text-sm text-ink-dim">
                          {r.detalle}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {protocolo.imagenes?.length > 0 && (
            <GaleriaImagenes imagenes={protocolo.imagenes} />
          )}

          {protocolo.videos && protocolo.videos.length > 0 && (() => {
            const videosVisibles =
              protocolo.modalidad === "RM"
                ? protocolo.videos.filter(
                    (v) =>
                      !v.mostrarEn ||
                      v.mostrarEn === "ambos" ||
                      (conContraste && v.mostrarEn === "con") ||
                      (!conContraste && v.mostrarEn === "sin")
                  )
                : protocolo.videos;

            if (videosVisibles.length === 0) return null;

            return (
              <div className="mb-6">
                <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-faint">
                  Videos
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {videosVisibles.map((v, i) => (
                    <VideoEmbed key={i} etiqueta={v.etiqueta} url={v.url} />
                  ))}
                </div>
              </div>
            );
          })()}

          {protocolo.postProceso && (
            <div className="mb-6 rounded border border-rm-dim bg-rm-dim/10 p-4">
              <p className="mb-1 text-[11px] uppercase tracking-wide text-rm">
                Post-proceso
              </p>
              <p className="whitespace-pre-line text-sm text-ink">{protocolo.postProceso}</p>
            </div>
          )}

          {protocolo.notas && (
            <div className="rounded border border-alert-dim bg-alert-dim/10 p-4">
              <p className="mb-1 text-[11px] uppercase tracking-wide text-alert">
                Notas / contraindicaciones
              </p>
              <p className="whitespace-pre-line text-sm text-ink">{protocolo.notas}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ProtocoloDetallePage() {
  return (
    <RutaProtegida>
      <DetalleProtocolo />
    </RutaProtegida>
  );
}
