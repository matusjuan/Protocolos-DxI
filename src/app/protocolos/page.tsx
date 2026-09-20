"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { RutaProtegida } from "@/components/RutaProtegida";
import { Encabezado } from "@/components/Encabezado";
import { IconoRegion } from "@/components/IconoRegion";
import { db } from "@/lib/firebase/client";
import { MODALIDADES, metaModalidad } from "@/lib/modalidades";
import type { Modalidad, Protocolo } from "@/types/database.types";

function esModalidad(v: string | null): v is Modalidad {
  return v === "RM" || v === "TC" || v === "RX";
}

function IconoModalidad({ modalidad, className }: { modalidad: Modalidad; className?: string }) {
  const [error, setError] = useState(false);
  const slug = modalidad.toLowerCase();

  if (error) {
    return (
      <span className={`flex items-center justify-center font-mono text-lg font-semibold ${className ?? ""}`}>
        {modalidad}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/iconos-modalidad/${slug}.png`}
      alt=""
      className={`object-cover ${className ?? ""}`}
      onError={() => setError(true)}
    />
  );
}

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
                className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full ${m.fondoDim} ${m.texto} ring-1 ring-border transition-transform group-hover:scale-105`}
              >
                <IconoModalidad modalidad={m.valor} className="h-full w-full" />
              </span>
              <span className="text-sm font-medium text-ink">{m.etiqueta}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TarjetaCard({
  titulo,
  cantidad,
  onClick,
}: {
  titulo: string;
  cantidad: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:border-rm-dim hover:bg-surface2 hover:shadow-lg"
    >
      <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-surface2 ring-1 ring-border transition-transform group-hover:scale-105">
        <IconoRegion region={titulo} claseColor="text-ink-dim" className="h-9 w-9" />
      </span>
      <div>
        <p className="text-sm font-medium text-ink">{titulo}</p>
        <p className="mt-0.5 font-mono text-xs text-ink-faint">
          {cantidad} protocolo{cantidad !== 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
}

function ListaProtocolos({
  modalidad,
  regionInicial,
  subregionInicial,
  onCambiarModalidad,
  onVolverAModalidades,
  onElegirRegion,
  onElegirSubregion,
  onVolverARegiones,
  onVolverASubregiones,
}: {
  modalidad: Modalidad;
  regionInicial: string | null;
  subregionInicial: string | null;
  onCambiarModalidad: (m: Modalidad) => void;
  onVolverAModalidades: () => void;
  onElegirRegion: (region: string) => void;
  onElegirSubregion: (subregion: string) => void;
  onVolverARegiones: () => void;
  onVolverASubregiones: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);
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
        (p.subregion ?? "").toLowerCase().includes(q) ||
        (p.indicacion ?? "").toLowerCase().includes(q)
    );
  }, [protocolos, busqueda]);

  const buscando = busqueda.trim().length > 0;

  // Regiones (nivel 1)
  const regiones = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of protocolos) {
      mapa.set(p.region, (mapa.get(p.region) ?? 0) + 1);
    }
    return Array.from(mapa.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [protocolos]);

  // Protocolos de la región elegida
  const protocolosDeRegion = useMemo(
    () => protocolos.filter((p) => p.region === regionInicial),
    [protocolos, regionInicial]
  );

  // ¿Esta región tiene subregiones?
  const subregiones = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of protocolosDeRegion) {
      if (p.subregion) mapa.set(p.subregion, (mapa.get(p.subregion) ?? 0) + 1);
    }
    return Array.from(mapa.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [protocolosDeRegion]);

  const tieneSubregiones = subregiones.length > 0;

  const porRegion = useMemo(() => {
    const base = buscando
      ? filtrados
      : tieneSubregiones
        ? protocolosDeRegion.filter((p) => p.subregion === subregionInicial)
        : protocolosDeRegion;
    const mapa = new Map<string, Protocolo[]>();
    for (const p of base) {
      const clave = buscando ? p.region : p.patologia;
      const lista = mapa.get(clave) ?? [];
      lista.push(p);
      mapa.set(clave, lista);
    }
    return Array.from(mapa.entries());
  }, [filtrados, buscando, protocolosDeRegion, tieneSubregiones, subregionInicial]);

  const meta = metaModalidad(modalidad);

  // Qué nivel mostrar
  const nivel = buscando
    ? "resultados"
    : !regionInicial
      ? "regiones"
      : tieneSubregiones && !subregionInicial
        ? "subregiones"
        : "protocolos";

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
            <button
              key={m.valor}
              onClick={() => onCambiarModalidad(m.valor)}
              className={`flex items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors ${
                modalidad === m.valor
                  ? "bg-surface2 text-ink"
                  : "text-ink-dim hover:bg-surface2/50"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${m.fondo}`} aria-hidden />
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

          {!cargando && !error && nivel === "regiones" && regiones.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {regiones.map(([region, cantidad]) => (
                <TarjetaCard
                  key={region}
                  titulo={region}
                  cantidad={cantidad}
                  onClick={() => onElegirRegion(region)}
                />
              ))}
            </div>
          )}

          {!cargando && !error && nivel === "subregiones" && (
            <>
              <button
                onClick={onVolverARegiones}
                className="mb-4 text-xs text-ink-faint hover:text-ink"
              >
                ← Regiones
              </button>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {subregiones.map(([sub, cantidad]) => (
                  <TarjetaCard
                    key={sub}
                    titulo={sub}
                    cantidad={cantidad}
                    onClick={() => onElegirSubregion(sub)}
                  />
                ))}
              </div>
            </>
          )}

          {!cargando && !error && (nivel === "protocolos" || nivel === "resultados") && (
            <>
              {nivel === "protocolos" && (
                <button
                  onClick={tieneSubregiones ? onVolverASubregiones : onVolverARegiones}
                  className="mb-4 text-xs text-ink-faint hover:text-ink"
                >
                  {tieneSubregiones ? "← " + regionInicial : "← Regiones"}
                </button>
              )}

              {porRegion.length === 0 && (
                <div className="rounded border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-ink-dim">No se encontraron protocolos.</p>
                </div>
              )}

              <div className="flex flex-col gap-6">
                {porRegion.map(([clave, items]) => (
                  <section key={clave}>
                    {nivel === "resultados" && (
                      <h2 className="mb-2 text-sm font-semibold text-ink">{clave}</h2>
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const modalidadParam = searchParams.get("modalidad");
  const modalidad = esModalidad(modalidadParam) ? modalidadParam : null;
  const region = searchParams.get("region");
  const subregion = searchParams.get("subregion");

  function irA(m: Modalidad | null, r?: string | null, s?: string | null) {
    const params = new URLSearchParams();
    if (m) params.set("modalidad", m);
    if (r) params.set("region", r);
    if (s) params.set("subregion", s);
    const qs = params.toString();
    router.push(qs ? `/protocolos?${qs}` : "/protocolos");
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Encabezado />
      {modalidad === null ? (
        <SelectorModalidad onElegir={(m) => irA(m)} />
      ) : (
        <ListaProtocolos
          modalidad={modalidad}
          regionInicial={region}
          subregionInicial={subregion}
          onCambiarModalidad={(m) => irA(m)}
          onVolverAModalidades={() => irA(null)}
          onElegirRegion={(r) => irA(modalidad, r)}
          onElegirSubregion={(s) => irA(modalidad, region, s)}
          onVolverARegiones={() => irA(modalidad)}
          onVolverASubregiones={() => irA(modalidad, region)}
        />
      )}
    </div>
  );
}

export default function ProtocolosPage() {
  return (
    <RutaProtegida>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-bg">
            <p className="font-mono text-sm text-ink-faint">Cargando…</p>
          </div>
        }
      >
        <Contenido />
      </Suspense>
    </RutaProtegida>
  );
}
