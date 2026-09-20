"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { RutaProtegida } from "@/components/RutaProtegida";
import { Encabezado } from "@/components/Encabezado";
import { db } from "@/lib/firebase/client";
import { MODALIDADES, metaModalidad } from "@/lib/modalidades";
import type { Modalidad, Protocolo } from "@/types/database.types";

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Iconos ilustrativos simples (línea, sin fotos) para representar cada zona del cuerpo.
function IconoRegion({ region, className }: { region: string; className?: string }) {
  const r = normalizar(region);
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  if (r.includes("crane") || r.includes("cabeza") || r.includes("encefalo") || r.includes("orbita")) {
    return (
      <svg {...props}>
        <circle cx="12" cy="10" r="6.5" />
        <path d="M9 15.5c0 2 .5 4 1 5M15 15.5c0 2-.5 4-1 5" />
        <path d="M9 9.5c1-1 2-1 3-1s2 0 3 1" />
      </svg>
    );
  }
  if (r.includes("cuello") || r.includes("laringe")) {
    return (
      <svg {...props}>
        <circle cx="12" cy="6" r="3.2" />
        <path d="M9.5 9c0 3-.5 3.5-.5 5.5M14.5 9c0 3 .5 3.5.5 5.5" />
        <path d="M7 20c1.5-2 3.5-2.5 5-2.5s3.5.5 5 2.5" />
      </svg>
    );
  }
  if (r.includes("torax") || r.includes("costal") || r.includes("esternon") || r.includes("clavicula")) {
    return (
      <svg {...props}>
        <path d="M12 4v3" />
        <path d="M12 7c-2.5 0-4 1.5-5 3-1 2-1 6 0 9" />
        <path d="M12 7c2.5 0 4 1.5 5 3 1 2 1 6 0 9" />
        <path d="M9 9.5c1 .5 2 .5 3 .5s2 0 3-.5" />
        <path d="M8.5 13h7M8.7 16h6.6" />
      </svg>
    );
  }
  if (r.includes("abdomen") || r.includes("pelvis") || r.includes("cadera")) {
    return (
      <svg {...props}>
        <path d="M9 4v3.5c0 1-.5 1.5-1 2-1 1-1.5 2.5-1.5 4.5 0 3 1 6.5 1 8" />
        <path d="M15 4v3.5c0 1 .5 1.5 1 2 1 1 1.5 2.5 1.5 4.5 0 3-1 6.5-1 8" />
        <path d="M8 12.5c1.3.7 2.7 1 4 1s2.7-.3 4-1" />
      </svg>
    );
  }
  if (r.includes("columna") || r.includes("sacro") || r.includes("coxis") || r.includes("espinograma")) {
    return (
      <svg {...props}>
        <path d="M12 3v2.2M12 18.8V21" />
        {[5.4, 7.6, 9.8, 12, 14.2, 16.4].map((y) => (
          <path key={y} d={`M9 ${y}h6`} />
        ))}
        <path d="M9 5.4c0 5-1.5 4-1.5 7s1.5 3 1.5 7M15 5.4c0 5 1.5 4 1.5 7s-1.5 3-1.5 7" />
      </svg>
    );
  }
  if (
    r.includes("miembros superiores") ||
    r.includes("hombro") ||
    r.includes("brazo") ||
    r.includes("codo") ||
    r.includes("antebrazo") ||
    r.includes("muneca") ||
    r.includes("mano") ||
    r.includes("dedo") ||
    r.includes("pulgar")
  ) {
    return (
      <svg {...props}>
        <circle cx="8" cy="5" r="2.3" />
        <path d="M8 7.3v5.7l3 3.5" />
        <path d="M11 16.5l1.2 3.8M8.5 20.5l2.5-4" />
        <path d="M8.3 13.5l4.7-.3" />
      </svg>
    );
  }
  if (
    r.includes("miembros inferiores") ||
    r.includes("femur") ||
    r.includes("rodilla") ||
    r.includes("pierna") ||
    r.includes("tobillo") ||
    r.includes("pie")
  ) {
    return (
      <svg {...props}>
        <circle cx="12" cy="4.5" r="2.2" />
        <path d="M12 6.7v6.3" />
        <path d="M12 13l-2 6.5h3" />
        <path d="M12 13l2 6.5-1.2 1" />
      </svg>
    );
  }
  // genérico / múltiples regiones / procedimientos especiales
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function ListaProtocolos() {
  const [modalidad, setModalidad] = useState<Modalidad>("RM");
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
    <div className="flex h-screen flex-col bg-bg">
      <Encabezado />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-48 shrink-0 border-r border-border bg-surface p-3">
          <p className="mb-2 px-1 text-[11px] uppercase tracking-wide text-ink-faint">
            Modalidad
          </p>
          <div className="flex flex-col gap-1">
            {MODALIDADES.map((m) => (
              <button
                key={m.valor}
                onClick={() => setModalidad(m.valor)}
                className={`flex items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors ${
                  modalidad === m.valor
                    ? "bg-surface2 text-ink"
                    : "text-ink-dim hover:bg-surface2/50"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${m.fondo}`}
                  aria-hidden
                />
                <span>
                  <span className="font-mono text-xs">{m.valor}</span>
                  <span className="ml-1.5">{m.etiqueta}</span>
                </span>
              </button>
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
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-full ${meta.fondoDim} ${meta.texto} transition-transform group-hover:scale-105`}
                    >
                      <IconoRegion region={region} className="h-6 w-6" />
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
    </div>
  );
}

export default function ProtocolosPage() {
  return (
    <RutaProtegida>
      <ListaProtocolos />
    </RutaProtegida>
  );
}
