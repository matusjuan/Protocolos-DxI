"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { RutaProtegida } from "@/components/RutaProtegida";
import { Encabezado } from "@/components/Encabezado";
import { db } from "@/lib/firebase/client";
import { notaAutomatica } from "@/lib/notasAutomaticas";
import { esOsteoarticular } from "@/lib/regionesEspeciales";
import type { PasoProtocolo, Protocolo } from "@/types/database.types";

interface ItemMezcla extends PasoProtocolo {
  _origen: string;
  _noUnir?: boolean;
}

function ArmarCombinado() {
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionIds, setSeleccionIds] = useState<string[]>([]);
  const [contraste, setContraste] = useState<Record<string, boolean>>({});
  const [pasosAbiertos, setPasosAbiertos] = useState<Set<number>>(new Set());
  const [condicionesActivas, setCondicionesActivas] = useState<Set<string>>(new Set());
  const [zonasDesactivadas, setZonasDesactivadas] = useState<Set<string>>(new Set());
  const [zonaDinamicaManual, setZonaDinamicaManual] = useState<string | null>(null);

  function alternarCondicion(condicion: string) {
    setCondicionesActivas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(condicion)) nuevo.delete(condicion);
      else nuevo.add(condicion);
      return nuevo;
    });
  }

  function alternarZona(zona: string) {
    setZonasDesactivadas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(zona)) nuevo.delete(zona);
      else nuevo.add(zona);
      return nuevo;
    });
  }

  useEffect(() => {
    let activo = true;
    const q = query(collection(db, "protocolos"), where("modalidad", "==", "RM"));
    getDocs(q)
      .then((snap) => {
        if (!activo) return;
        const datos = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Protocolo)
          .sort((a, b) => a.patologia.localeCompare(b.patologia));
        setProtocolos(datos);
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

  const seleccionados = useMemo(
    () => seleccionIds.map((id) => protocolos.find((p) => p.id === id)).filter((p): p is Protocolo => !!p),
    [seleccionIds, protocolos]
  );

  const disponibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return protocolos
      .filter((p) => !seleccionIds.includes(p.id))
      .filter(
        (p) =>
          !q ||
          p.patologia.toLowerCase().includes(q) ||
          p.region.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [protocolos, seleccionIds, busqueda]);

  function agregar(id: string) {
    setSeleccionIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setContraste((prev) => ({ ...prev, [id]: false }));
    setBusqueda("");
  }

  function quitar(id: string) {
    setSeleccionIds((prev) => prev.filter((x) => x !== id));
  }

  function mover(i: number, direccion: -1 | 1) {
    setSeleccionIds((prev) => {
      const j = i + direccion;
      if (j < 0 || j >= prev.length) return prev;
      const copia = [...prev];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });
  }

  function alternarPaso(i: number) {
    setPasosAbiertos((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(i)) nuevo.delete(i);
      else nuevo.add(i);
      return nuevo;
    });
  }

  const itemsFinal: ItemMezcla[] = useMemo(() => {
    const partes = seleccionados.map((p) => {
      const fija = p.pasos.filter((x) => !x.soloConContraste);
      const pasosConContraste = p.pasos.filter((x) => !x.soloSinContraste);
      const antes = pasosConContraste.filter((x) => !x.despuesDeInyeccion);
      const despues = pasosConContraste.filter((x) => x.despuesDeInyeccion);
      const on = !!contraste[p.id];
      const noUnir = esOsteoarticular(p.region, p.patologia);
      return { p, fija, antes, despues, on, noUnir };
    });

    const conOrigen = (lista: PasoProtocolo[], origen: string, noUnir: boolean): ItemMezcla[] =>
      lista.map((x) => ({ ...x, _origen: origen, _noUnir: noUnir }));

    const clave = (titulo: string) => titulo.trim().toLowerCase();

    function deduplicar(lista: ItemMezcla[]): ItemMezcla[] {
      const vistos = new Map<string, ItemMezcla>();
      const resultado: ItemMezcla[] = [];
      lista.forEach((item, idx) => {
        // Los pasos de regiones osteoarticulares/pelvis ósea nunca se unen
        // entre sí, aunque compartan el mismo título: son articulaciones
        // distintas, no la misma toma repetida.
        const k = item._noUnir
          ? `__sin-unir__${idx}__${item._origen}__${clave(item.titulo)}`
          : clave(item.titulo);
        const existente = vistos.get(k);
        if (existente) {
          if (!existente._origen.includes(item._origen)) {
            existente._origen = `${existente._origen} + ${item._origen}`;
          }
        } else {
          const copia = { ...item };
          vistos.set(k, copia);
          resultado.push(copia);
        }
      });
      return resultado;
    }

    const algunaOn = partes.some((x) => x.on);

    const preTotal = deduplicar(
      partes.flatMap((x) =>
        x.on
          ? conOrigen(x.antes, x.p.patologia, x.noUnir)
          : conOrigen(x.fija, x.p.patologia, x.noUnir)
      )
    );

    const postCandidatos = algunaOn
      ? deduplicar(
          [...partes]
            .reverse()
            .filter((x) => x.on)
            .flatMap((x) => conOrigen(x.despues, x.p.patologia, x.noUnir))
        )
      : [];

    // Una secuencia que ya se hace antes de inyectar (para cualquier estudio
    // seleccionado) no debe repetirse después, aunque otro protocolo la tenga
    // cargada como "después de inyección". Se fusiona el origen en el ítem
    // que ya está antes en vez de duplicarlo — salvo en las regiones que
    // nunca se unen (osteoarticular / pelvis ósea).
    const preClaves = new Map(
      preTotal.filter((item) => !item._noUnir).map((item) => [clave(item.titulo), item])
    );
    const postTotal: ItemMezcla[] = [];
    for (const item of postCandidatos) {
      if (item._noUnir) {
        postTotal.push(item);
        continue;
      }
      const existente = preClaves.get(clave(item.titulo));
      if (existente) {
        if (!existente._origen.includes(item._origen)) {
          existente._origen = `${existente._origen} + ${item._origen}`;
        }
      } else {
        postTotal.push(item);
      }
    }

    // Las secuencias dinámicas (ej: TRICKS) van enseguida de inyectar,
    // antes que cualquier otra secuencia post-contraste.
    postTotal.sort((a, b) => (a.dinamico ? 0 : 1) - (b.dinamico ? 0 : 1));

    return algunaOn
      ? [
          ...preTotal,
          { titulo: "💉 Acá se inyecta el contraste", detalle: "", _origen: "" },
          ...postTotal,
        ]
      : preTotal;
  }, [seleccionados, contraste]);

  const condicionesDisponibles = useMemo(
    () =>
      itemsFinal
        .map((p) => p.condicionOpcional)
        .filter((c, idx, arr): c is string => !!c && arr.indexOf(c) === idx),
    [itemsFinal]
  );

  const zonasDisponibles = useMemo(
    () =>
      itemsFinal
        .map((p) => p.zona)
        .filter((z, idx, arr): z is string => !!z && arr.indexOf(z) === idx),
    [itemsFinal]
  );

  // Si más de un estudio combinado tiene su propia secuencia dinámica
  // (ej: Abdomen + Pelvis, cada uno con su TRICKS), el contraste solo se
  // dispara en una zona por vez — el técnico elige cuál, y la del otro
  // estudio se oculta.
  const origenesConDinamico = useMemo(
    () =>
      itemsFinal
        .filter((p) => p.dinamico)
        .map((p) => p._origen)
        .filter((o, idx, arr): o is string => !!o && arr.indexOf(o) === idx),
    [itemsFinal]
  );

  const zonaDinamicaActiva =
    zonaDinamicaManual && origenesConDinamico.includes(zonaDinamicaManual)
      ? zonaDinamicaManual
      : origenesConDinamico[0];

  const itemsVisibles = useMemo(
    () =>
      itemsFinal.filter((p) => {
        if (p.condicionOpcional && !condicionesActivas.has(p.condicionOpcional)) {
          return false;
        }
        if (p.ocultarConCondicion && condicionesActivas.has(p.ocultarConCondicion)) {
          return false;
        }
        if (p.zona && zonasDesactivadas.has(p.zona)) {
          return false;
        }
        if (p.dinamico && origenesConDinamico.length > 1 && p._origen !== zonaDinamicaActiva) {
          return false;
        }
        return true;
      }),
    [itemsFinal, condicionesActivas, zonasDesactivadas, origenesConDinamico, zonaDinamicaActiva]
  );

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Encabezado />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Link href="/protocolos" className="mb-4 inline-block text-xs text-ink-faint hover:text-ink">
            ← Volver a Protocolos
          </Link>
          <h1 className="mb-1 text-lg font-semibold text-ink">Armar estudio combinado</h1>
          <p className="mb-1 text-sm text-ink-dim">
            Elegí los estudios que se piden juntos (ej: Cerebro + Cervical), decidí cuáles van
            con contraste, y armamos la técnica combinada.
          </p>
          <p className="mb-6 text-xs font-medium text-rm">
            Esta herramienta es solo para protocolos de Resonancia (RM).
          </p>

          {error && (
            <div className="mb-4 rounded border border-alert-dim bg-alert-dim/10 p-4">
              <p className="text-sm text-alert">Error al cargar protocolos: {error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-ink-dim">
              Buscar y agregar un estudio
            </label>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej: Cerebro, Cervical, Órbitas…"
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
            />
            {busqueda && (
              <div className="mt-2 overflow-hidden rounded border border-border">
                {cargando && (
                  <p className="p-3 font-mono text-xs text-ink-faint">Cargando…</p>
                )}
                {!cargando && disponibles.length === 0 && (
                  <p className="p-3 text-xs text-ink-faint">No se encontraron estudios.</p>
                )}
                {disponibles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => agregar(p.id)}
                    className="flex w-full items-center justify-between border-b border-border bg-surface px-3 py-2 text-left text-sm last:border-b-0 hover:bg-surface2"
                  >
                    <span className="text-ink">{p.patologia}</span>
                    <span className="text-xs text-ink-faint">{p.region} · + Agregar</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {seleccionados.length > 0 && (
            <div className="mb-6">
              <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-faint">
                Estudios elegidos (en este orden)
              </p>
              <div className="flex flex-col gap-2">
                {seleccionados.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded border border-border bg-surface p-3"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => mover(i, -1)}
                        disabled={i === 0}
                        className="text-ink-faint hover:text-ink disabled:opacity-20"
                        aria-label="Subir"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => mover(i, 1)}
                        disabled={i === seleccionados.length - 1}
                        className="text-ink-faint hover:text-ink disabled:opacity-20"
                        aria-label="Bajar"
                      >
                        ▼
                      </button>
                    </div>
                    <span className="flex-1 text-sm font-medium text-ink">{p.patologia}</span>
                    <div className="flex gap-1 rounded border border-border p-0.5">
                      <button
                        onClick={() => setContraste((c) => ({ ...c, [p.id]: false }))}
                        className={`rounded px-2 py-1 text-xs transition-colors ${
                          !contraste[p.id] ? "bg-rm-dim text-ink" : "text-ink-faint hover:text-ink"
                        }`}
                      >
                        Sin contraste
                      </button>
                      <button
                        onClick={() => setContraste((c) => ({ ...c, [p.id]: true }))}
                        className={`rounded px-2 py-1 text-xs transition-colors ${
                          contraste[p.id] ? "bg-tc-dim text-ink" : "text-ink-faint hover:text-ink"
                        }`}
                      >
                        Con contraste
                      </button>
                    </div>
                    <button
                      onClick={() => quitar(p.id)}
                      className="text-xs text-ink-faint hover:text-alert"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {seleccionados.length === 0 && !cargando && (
            <div className="rounded border border-dashed border-border p-8 text-center">
              <p className="text-sm text-ink-dim">
                Buscá arriba y agregá los estudios que se piden juntos para ver la técnica
                combinada.
              </p>
            </div>
          )}

          {seleccionados.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-faint">
                Técnica combinada
              </p>
              {seleccionados.some(
                (p) => esOsteoarticular(p.region, p.patologia) && contraste[p.id]
              ) && (
                <div className="mb-3 rounded border border-tc-dim bg-tc-dim/10 p-4">
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-tc">Contraste</p>
                  <p className="text-sm font-semibold text-ink">
                    📋 Hablar con residente para ver en qué plano realizar secuencias sin y con
                    contraste.
                  </p>
                </div>
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
              {zonasDisponibles.length > 1 && (
                <div className="mb-3 rounded border border-border bg-surface p-3">
                  <p className="mb-2 text-xs font-medium text-ink-dim">
                    Zonas incluidas (destildá la que no corresponda)
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {zonasDisponibles.map((zona) => (
                      <label key={zona} className="flex items-center gap-2 text-sm text-ink">
                        <input
                          type="checkbox"
                          checked={!zonasDesactivadas.has(zona)}
                          onChange={() => alternarZona(zona)}
                          className="h-4 w-4 accent-rm"
                        />
                        {zona}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {origenesConDinamico.length > 1 && (
                <div className="mb-3 rounded border border-border bg-surface p-3">
                  <p className="mb-2 text-xs font-medium text-ink-dim">
                    ¿En qué zona se dispara el contraste (dinámica)? Depende del paciente.
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {origenesConDinamico.map((origen) => (
                      <label key={origen} className="flex items-center gap-2 text-sm text-ink">
                        <input
                          type="radio"
                          name="zona-dinamica"
                          checked={zonaDinamicaActiva === origen}
                          onChange={() => setZonaDinamicaManual(origen)}
                          className="h-4 w-4 accent-rm"
                        />
                        {origen}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <ol className="flex flex-col gap-2">
                {itemsVisibles.map((paso, i) => {
                  const esMarcador = paso.titulo.includes("inyecta el contraste");
                  if (esMarcador) {
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
                  const tieneContenido = (paso.detalle && paso.detalle.trim().length > 0) || paso.imagen;
                  const nota = paso.notaManual || notaAutomatica(paso.titulo);
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
                        <div className="flex-1">
                          <span className="text-sm font-medium text-ink">
                            {paso.titulo}
                            {paso.condicionOpcional && (
                              <span className="ml-2 rounded border border-rm-dim px-1.5 py-0.5 text-[10px] font-normal text-rm">
                                {paso.condicionOpcional}
                              </span>
                            )}
                            <span className="ml-2 rounded border border-border px-1.5 py-0.5 text-[10px] font-normal text-ink-faint">
                              {paso._origen}
                            </span>
                          </span>
                          {nota && (
                            <p className="mt-1 text-xs font-semibold text-tc">📋 {nota}</p>
                          )}
                        </div>
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
                              alt=""
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
          )}
        </div>
      </main>
    </div>
  );
}

export default function ArmarCombinadoPage() {
  return (
    <RutaProtegida>
      <ArmarCombinado />
    </RutaProtegida>
  );
}
