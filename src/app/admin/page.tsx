"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { RutaProtegida } from "@/components/RutaProtegida";
import { Encabezado } from "@/components/Encabezado";
import { db } from "@/lib/firebase/client";
import { MODALIDADES, metaModalidad } from "@/lib/modalidades";
import type { Modalidad, Protocolo } from "@/types/database.types";

type FiltroModalidad = Modalidad | "TODAS";

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function PanelAdmin() {
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroModalidad, setFiltroModalidad] = useState<FiltroModalidad>("TODAS");
  const [filtroRegion, setFiltroRegion] = useState("");
  const [busqueda, setBusqueda] = useState("");

  async function cargar() {
    setCargando(true);
    const snap = await getDocs(collection(db, "protocolos"));
    const datos = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Protocolo)
      .sort(
        (a, b) =>
          a.modalidad.localeCompare(b.modalidad) ||
          a.region.localeCompare(b.region) ||
          a.patologia.localeCompare(b.patologia)
      );
    setProtocolos(datos);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este protocolo? Esta acción no se puede deshacer.")) return;
    await deleteDoc(doc(db, "protocolos", id));
    cargar();
  }

  function descargarBackup() {
    // El backup siempre incluye TODOS los protocolos, sin importar los filtros.
    const datos = JSON.stringify(protocolos, null, 2);
    const blob = new Blob([datos], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fecha = new Date().toISOString().slice(0, 10);
    a.download = `backup-protocolos-${fecha}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Cantidad por modalidad, para mostrarla en las pestañas.
  const conteoModalidad = useMemo(() => {
    const conteo: Record<string, number> = {};
    for (const p of protocolos) {
      conteo[p.modalidad] = (conteo[p.modalidad] ?? 0) + 1;
    }
    return conteo;
  }, [protocolos]);

  // Las regiones disponibles dependen de la modalidad elegida.
  const regionesDisponibles = useMemo(() => {
    const regiones = protocolos
      .filter((p) => filtroModalidad === "TODAS" || p.modalidad === filtroModalidad)
      .map((p) => p.region);
    return Array.from(new Set(regiones)).sort((a, b) => a.localeCompare(b));
  }, [protocolos, filtroModalidad]);

  // Si al cambiar de modalidad la región elegida ya no existe, se ignora.
  const regionActiva = regionesDisponibles.includes(filtroRegion) ? filtroRegion : "";

  const visibles = useMemo(() => {
    const q = normalizar(busqueda);
    return protocolos.filter((p) => {
      if (filtroModalidad !== "TODAS" && p.modalidad !== filtroModalidad) return false;
      if (regionActiva && p.region !== regionActiva) return false;
      if (q) {
        const texto = normalizar(`${p.patologia} ${p.region} ${p.subregion ?? ""}`);
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [protocolos, filtroModalidad, regionActiva, busqueda]);

  const hayFiltros = filtroModalidad !== "TODAS" || regionActiva !== "" || busqueda !== "";

  function limpiarFiltros() {
    setFiltroModalidad("TODAS");
    setFiltroRegion("");
    setBusqueda("");
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Encabezado />
      <main className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-ink">Administrar protocolos</h1>
              <p className="text-sm text-ink-dim">
                {hayFiltros
                  ? `${visibles.length} de ${protocolos.length} protocolos`
                  : `${protocolos.length} protocolo${protocolos.length !== 1 ? "s" : ""} cargado${
                      protocolos.length !== 1 ? "s" : ""
                    }`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={descargarBackup}
                disabled={protocolos.length === 0}
                className="rounded border border-border px-3 py-2 text-sm text-ink-dim hover:border-rm-dim hover:text-ink disabled:opacity-50"
              >
                ⬇ Backup completo
              </button>
              <Link
                href="/admin/nuevo"
                className="rounded bg-rm-dim px-3 py-2 text-sm font-medium text-ink hover:bg-rm hover:text-bg"
              >
                + Nuevo protocolo
              </Link>
            </div>
          </div>

          {/* Filtros */}
          {!cargando && protocolos.length > 0 && (
            <div className="mb-4 flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFiltroModalidad("TODAS")}
                  className={`rounded border px-3 py-1.5 text-sm transition-colors ${
                    filtroModalidad === "TODAS"
                      ? "border-ink-faint bg-surface2 text-ink"
                      : "border-border text-ink-faint hover:text-ink"
                  }`}
                >
                  Todas ({protocolos.length})
                </button>
                {MODALIDADES.map((m) => (
                  <button
                    key={m.valor}
                    onClick={() => setFiltroModalidad(m.valor)}
                    className={`rounded border px-3 py-1.5 text-sm transition-colors ${
                      filtroModalidad === m.valor
                        ? `${m.borde} ${m.fondoDim} text-ink`
                        : "border-border text-ink-faint hover:text-ink"
                    }`}
                  >
                    {m.etiqueta} ({conteoModalidad[m.valor] ?? 0})
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={regionActiva}
                  onChange={(e) => setFiltroRegion(e.target.value)}
                  className="rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
                >
                  <option value="">Todas las regiones</option>
                  {regionesDisponibles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre del estudio…"
                  className="min-w-[220px] flex-1 rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
                />
                {hayFiltros && (
                  <button
                    onClick={limpiarFiltros}
                    className="rounded border border-border px-3 py-2 text-sm text-ink-faint hover:text-ink"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          )}

          {cargando && <p className="font-mono text-sm text-ink-faint">Cargando…</p>}

          {!cargando && protocolos.length === 0 && (
            <div className="rounded border border-dashed border-border p-8 text-center">
              <p className="text-sm text-ink-dim">Todavía no cargaste ningún protocolo.</p>
            </div>
          )}

          {!cargando && protocolos.length > 0 && visibles.length === 0 && (
            <div className="rounded border border-dashed border-border p-8 text-center">
              <p className="text-sm text-ink-dim">
                No hay protocolos que coincidan con los filtros.
              </p>
            </div>
          )}

          {visibles.length > 0 && (
            <div className="overflow-hidden rounded border border-border">
              {visibles.map((p, i) => {
                const meta = metaModalidad(p.modalidad);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between bg-surface px-4 py-3 ${
                      i !== visibles.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded border ${meta.borde} px-1.5 py-0.5 font-mono text-[11px] ${meta.texto}`}
                      >
                        {p.modalidad}
                      </span>
                      <div>
                        <p className="text-sm text-ink">{p.patologia}</p>
                        <p className="text-xs text-ink-faint">{p.region}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <Link
                        href={`/protocolos/${p.id}`}
                        className="text-ink-faint hover:text-ink"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/admin/${p.id}/editar`}
                        className="text-ink-faint hover:text-rm"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => eliminar(p.id)}
                        className="text-ink-faint hover:text-alert"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RutaProtegida rolRequerido="admin">
      <PanelAdmin />
    </RutaProtegida>
  );
}
