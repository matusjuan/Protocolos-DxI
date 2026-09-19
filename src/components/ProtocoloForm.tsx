"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { MODALIDADES } from "@/lib/modalidades";
import { useAuth } from "@/lib/firebase/AuthProvider";
import type { Modalidad, PasoProtocolo, Protocolo } from "@/types/database.types";

export function ProtocoloForm({ inicial }: { inicial?: Protocolo }) {
  const router = useRouter();
  const { user } = useAuth();

  const [modalidad, setModalidad] = useState<Modalidad>(inicial?.modalidad ?? "RM");
  const [region, setRegion] = useState(inicial?.region ?? "");
  const [patologia, setPatologia] = useState(inicial?.patologia ?? "");
  const [indicacion, setIndicacion] = useState(inicial?.indicacion ?? "");
  const [usaContraste, setUsaContraste] = useState(inicial?.usaContraste ?? false);
  const [detalleContraste, setDetalleContraste] = useState(
    inicial?.detalleContraste ?? ""
  );
  const [pasos, setPasos] = useState<PasoProtocolo[]>(
    inicial?.pasos?.length ? inicial.pasos : [{ titulo: "", detalle: "" }]
  );
  const [notas, setNotas] = useState(inicial?.notas ?? "");
  const imagenes = inicial?.imagenes ?? [];
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function actualizarPaso(i: number, campo: keyof PasoProtocolo, valor: string) {
    setPasos((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  }

  function agregarPaso() {
    setPasos((prev) => [...prev, { titulo: "", detalle: "" }]);
  }

  function quitarPaso(i: number) {
    setPasos((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!region.trim() || !patologia.trim()) {
      setError("Región y patología son obligatorias.");
      return;
    }

    setGuardando(true);

    const payload = {
      modalidad,
      region: region.trim(),
      patologia: patologia.trim(),
      indicacion: indicacion.trim() || null,
      usaContraste,
      detalleContraste: usaContraste ? detalleContraste.trim() || null : null,
      pasos: pasos.filter((p) => p.titulo.trim().length > 0),
      notas: notas.trim() || null,
      imagenes,
      updatedAt: serverTimestamp(),
    };

    try {
      if (inicial) {
        await updateDoc(doc(db, "protocolos", inicial.id), payload);
      } else {
        await addDoc(collection(db, "protocolos"), {
          ...payload,
          createdBy: user?.uid ?? null,
          createdAt: serverTimestamp(),
        });
      }
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el protocolo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-dim">
            Modalidad
          </label>
          <select
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value as Modalidad)}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
          >
            {MODALIDADES.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.valor} — {m.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-dim">
            Región
          </label>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Ej: Cráneo, Columna, Abdomen"
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-dim">
            Patología / estudio
          </label>
          <input
            value={patologia}
            onChange={(e) => setPatologia(e.target.value)}
            placeholder="Ej: ACV isquémico"
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-dim">
          Indicación (cuándo se realiza este estudio)
        </label>
        <textarea
          value={indicacion}
          onChange={(e) => setIndicacion(e.target.value)}
          rows={2}
          className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
        />
      </div>

      <div className="rounded border border-border bg-surface p-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={usaContraste}
            onChange={(e) => setUsaContraste(e.target.checked)}
            className="h-4 w-4 accent-tc"
          />
          Este protocolo usa contraste
        </label>
        {usaContraste && (
          <textarea
            value={detalleContraste}
            onChange={(e) => setDetalleContraste(e.target.value)}
            rows={2}
            placeholder="Dosis, vía, tiempos de adquisición post-contraste…"
            className="mt-3 w-full rounded border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-tc"
          />
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-ink-dim">
            Técnica — pasos del protocolo
          </label>
          <button
            type="button"
            onClick={agregarPaso}
            className="text-xs text-rm hover:underline"
          >
            + Agregar paso
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {pasos.map((paso, i) => (
            <div key={i} className="flex gap-3 rounded border border-border bg-surface p-3">
              <span className="mt-2 font-mono text-xs text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 space-y-2">
                <input
                  value={paso.titulo}
                  onChange={(e) => actualizarPaso(i, "titulo", e.target.value)}
                  placeholder="Título del paso (ej: Secuencia axial T2)"
                  className="w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-ink outline-none focus:border-rm"
                />
                <textarea
                  value={paso.detalle}
                  onChange={(e) => actualizarPaso(i, "detalle", e.target.value)}
                  placeholder="Detalle / parámetros (grosor de corte, FOV, TR/TE, etc.)"
                  rows={2}
                  className="w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-ink outline-none focus:border-rm"
                />
              </div>
              {pasos.length > 1 && (
                <button
                  type="button"
                  onClick={() => quitarPaso(i)}
                  className="self-start text-xs text-ink-faint hover:text-alert"
                >
                  Quitar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-dim">
          Notas / contraindicaciones
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
        />
      </div>

      {error && (
        <p className="rounded border border-alert-dim bg-alert-dim/20 px-3 py-2 text-sm text-alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="rounded bg-rm-dim px-4 py-2 text-sm font-medium text-ink hover:bg-rm hover:text-bg disabled:opacity-50"
        >
          {guardando ? "Guardando…" : inicial ? "Guardar cambios" : "Crear protocolo"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded px-4 py-2 text-sm text-ink-faint hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
