"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { RutaProtegida } from "@/components/RutaProtegida";
import { Encabezado } from "@/components/Encabezado";
import { db } from "@/lib/firebase/client";
import { metaModalidad } from "@/lib/modalidades";
import type { Protocolo } from "@/types/database.types";

function PanelAdmin() {
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    const snap = await getDocs(collection(db, "protocolos"));
    const datos = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Protocolo)
      .sort(
        (a, b) =>
          a.modalidad.localeCompare(b.modalidad) || a.region.localeCompare(b.region)
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

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Encabezado />
      <main className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-ink">Administrar protocolos</h1>
              <p className="text-sm text-ink-dim">
                {protocolos.length} protocolo{protocolos.length !== 1 ? "s" : ""} cargado
                {protocolos.length !== 1 ? "s" : ""}
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

          {cargando && (
            <p className="font-mono text-sm text-ink-faint">Cargando…</p>
          )}

          {!cargando && protocolos.length === 0 && (
            <div className="rounded border border-dashed border-border p-8 text-center">
              <p className="text-sm text-ink-dim">Todavía no cargaste ningún protocolo.</p>
            </div>
          )}

          <div className="overflow-hidden rounded border border-border">
            {protocolos.map((p, i) => {
              const meta = metaModalidad(p.modalidad);
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between bg-surface px-4 py-3 ${
                    i !== protocolos.length - 1 ? "border-b border-border" : ""
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
