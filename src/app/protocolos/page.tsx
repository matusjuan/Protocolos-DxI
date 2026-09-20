"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { RutaProtegida } from "@/components/RutaProtegida";
import { Encabezado } from "@/components/Encabezado";
import { IconoRegion } from "@/components/IconoRegion";
import { db } from "@/lib/firebase/client";
import { MODALIDADES, metaModalidad } from "@/lib/modalidades";
import type { Modalidad, Protocolo } from "@/types/database.types";

function SelectorModalidad({ onElegir }: { onElegir: (m: Modalidad) => void }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <h1 className="mb-1 text-center text-lg font-semibold text-ink">
          ¿Qué protocolos querés ver?
        </h1>
        <p className="mb-8 text-center text-sm text-ink-dim">
          Elegí una modalidad para empezar.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {MODALIDADES.map((m) => (
            <button
              key={m.valor}
              onClick={() => onElegir(m.valor)}
              className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-rm-dim hover:bg-surface2 hover:shadow-lg"
            >
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full ${m.fondoDim} ${m.texto} font-mono text-lg font-semibold transition-transform group-hover:scale-105`}
              >
                {m.valor}
              </span>
              <span className="text-sm font-medium text-ink">{m.etiqueta}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ListaProtocolos({
  modalidad,
  onVolverAModalidades,
}: {
  modalidad: Modalidad;
  onVolverAModalidades: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [regionSeleccionada, setRegionSeleccionada] = useState<string | null>(null);
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);
    setRegionSeleccionada(null);
    setBusqueda("");
    const q = query(collection(db, "protocolos"), where("modalidad", "==", modalidad));
    getDocs(q)
      .then((snap) => {
        if (!activo) return;
        const datos = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Protocolo)
          .sort(
            (a, b) =>
              a.region.localeCompare(b.region) || a.patologia.localeCompare(b.patologia)
          );
        setProtocolos(datos);
        setCargando(false);
      })
      .catch((err) => {
        if (!activo) return;
        console.error("Error al cargar protocolos:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [modalidad]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return protocolos;
    return protocolos.filter(
      (p) =>
        p.patologia.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q) ||
        (p.indicacion ?? "").toLowerCase().includes(q)
    );
  }, [protocolos, busqueda]);

  const buscando = busqueda.trim().length > 0;

  const regiones = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of protocolos) {
      mapa.set(p.region, (mapa.get(p.region) ?? 0) + 1);
    }
    return Array.from(mapa.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [protocolos]);

  const porRegion = useMemo(() => {
    const base = buscando
      ? filtrados
      : filtrados.filter((p) => p.region === regionSeleccionada);
    const mapa = new Map<string, Protocolo[]>();
    for (const p of base) {
      const lista = mapa.get(p.region) ?? [];
      lista.push(p);
      mapa.set(p.region, lista);
    }
    return Array.from(mapa.entries());
  }, [filtrados, buscando, regionSeleccionada]);

  const meta = metaModalidad(modalidad);
  const mostrarTarjetasDeRegion = !buscando && !regionSeleccionada;

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-48 shrink-0 border-r border-border bg-surface p-3">
        <button
          onClick={onVolverAModalidades}
          className="mb-3 px-1 text-xs text-ink-faint hover:text-ink"
        >
          ← Modalidades
        </button>
        <p className="mb-2 px-1 text-[11px] uppercase tracking-wide text-ink-faint">
          Modalidad
        </p>
        <div className="flex flex-col gap-1">
          {MODALIDADES.map((m) => (
            <span
              key={m.valor}
              className={`flex items-center gap-2 rounded px-3 py-2 text-left text-sm ${
                modalidad === m.valor ? "bg-surface2 text-ink" : "text-ink-faint"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${m.fondo}`} aria-hidden />
              <span>
                <span className="font-mono text-xs">{m.valor}</span>
                <span className="ml-1.5">{m.etiqueta}</span>
              </span>
            </span>
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="sticky top-0 z-10 border-b border-border bg-bg/95 px-6 py-4 backdrop-blur">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={`Buscar en ${meta.etiqueta.toLowerCase()}: patología, región…`}
            className="w-full max-w-md rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
          />
        </div>

        <div className="px-6 py-5">
          {cargando && (
            <p className="font-mono text-sm text-ink-faint">Cargando protocolos…</p>
          )}

          {error && (
            <div className="rounded border border-alert-dim bg-alert-dim/10 p-4">
              <p className="text-sm text-alert">Error al cargar protocolos: {error}</p>
            </div>
          )}

          {!cargando && !error && protocolos.length === 0 && (
            <div className="rounded border border-dashed border-border p-8 text-center">
              <p className="text-sm text-ink-dim">
                Todavía no hay protocolos cargados para {meta.etiqueta.toLowerCase()}.
              </p>
            </div>
          )}

          {!cargando && !error && mostrarTarjetasDeRegion && regiones.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {regiones.map(([region, cantidad]) => (
                <button
                  key={region}
                  onClick={() => setRegionSeleccionada(region)}
                  className="group flex flex-col items-start gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:border-rm-dim hover:bg-surface2 hover:shadow-lg"
                >
                  <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-surface2 ring-1 ring-border transition-transform group-hover:scale-105">
                    <IconoRegion region={region} claseColor="text-ink-dim" className="h-9 w-9" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{region}</p>
                    <p className="mt-0.5 font-mono text-xs text-ink-faint">
                      {cantidad} protocolo{cantidad !== 1 ? "s" : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!cargando && !error && !mostrarTarjetasDeRegion && (
            <>
              {!buscando && (
                <button
                  onClick={() => setRegionSeleccionada(null)}
                  className="mb-4 text-xs text-ink-faint hover:text-ink"
                >
                  ← Regiones
                </button>
              )}

              {porRegion.length === 0 && (
                <div className="rounded border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-ink-dim">No se encontraron protocolos.</p>
                </div>
              )}

              <div className="flex flex-col gap-6">
                {porRegion.map(([region, items]) => (
                  <section key={region}>
                    {buscando && (
                      <h2 className="mb-2 text-sm font-semibold text-ink">{region}</h2>
                    )}
                    <div className="overflow-hidden rounded border border-border">
                      {items.map((p, i) => (
                        <Link
                          key={p.id}
                          href={`/protocolos/${p.id}`}
                          className={`flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-surface2 ${
                            i !== items.length - 1 ? "border-b border-border" : ""
                          } bg-surface`}
                        >
                          <span className="text-ink">{p.patologia}</span>
                          <span className="flex items-center gap-3 text-xs text-ink-faint">
                            {p.usaContraste && (
                              <span className="rounded border border-tc-dim px-1.5 py-0.5 text-tc">
                                contraste
                              </span>
                            )}
                            <span className="font-mono">{p.pasos?.length ?? 0} pasos</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Contenido() {
  const [modalidad, setModalidad] = useState<Modalidad | null>(null);

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Encabezado />
      {modalidad === null ? (
        <SelectorModalidad onElegir={setModalidad} />
      ) : (
        <ListaProtocolos modalidad={modalidad} onVolverAModalidades={() => setModalidad(null)} />
      )}
    </div>
  );
}

export default function ProtocolosPage() {
  return (
    <RutaProtegida>
      <Contenido />
    </RutaProtegida>
  );
}
