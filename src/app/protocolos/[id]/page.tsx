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

          {protocolo.usaContraste && (
            <div className="mb-6 rounded border border-tc-dim bg-tc-dim/10 p-4">
              <p className="mb-1 text-[11px] uppercase tracking-wide text-tc">
                Contraste
              </p>
              <p className="text-sm text-ink">
                {protocolo.detalleContraste || "Este estudio requiere contraste."}
              </p>
            </div>
          )}

          {protocolo.pasos?.length > 0 && (
            <div className="mb-6">
              <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-faint">
                Técnica
              </p>
              <ol className="flex flex-col gap-3">
                {protocolo.pasos.map((paso, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded border border-border bg-surface p-4"
                  >
                    <span className="font-mono text-sm text-ink-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">{paso.titulo}</p>
                      {paso.detalle && (
                        <p className="mt-1 whitespace-pre-line text-sm text-ink-dim">
                          {paso.detalle}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

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

          {protocolo.videos && protocolo.videos.length > 0 && (
            <div className="mb-6">
              <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-faint">
                Videos
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {protocolo.videos.map((v, i) => (
                  <VideoEmbed key={i} etiqueta={v.etiqueta} url={v.url} />
                ))}
              </div>
            </div>
          )}

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
