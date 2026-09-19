"use client";

import { useState } from "react";
import type { ParametrosPorGrupo } from "@/types/database.types";

export function TablaParametros({ grupos }: { grupos: ParametrosPorGrupo[] }) {
  const indiceInicial = grupos.length - 1;
  const [seleccionado, setSeleccionado] = useState(indiceInicial);
  const grupo = grupos[seleccionado];

  if (!grupo) return null;

  return (
    <div className="mb-6 overflow-hidden rounded border border-border">
      <div className="flex flex-wrap gap-1 border-b border-border bg-surface p-2">
        {grupos.map((g, i) => (
          <button
            key={g.grupo}
            onClick={() => setSeleccionado(i)}
            className={`rounded px-3 py-1.5 text-xs transition-colors ${
              i === seleccionado
                ? "bg-surface2 text-ink"
                : "text-ink-dim hover:bg-surface2/50"
            }`}
          >
            {g.grupo}
          </button>
        ))}
      </div>

      <div className="bg-surface p-3">
        {grupo.distancia && (
          <p className="mb-2 text-xs text-ink-faint">
            Distancia paciente-tubo: <span className="font-mono">{grupo.distancia}</span>
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="py-1.5 pr-3 font-medium">Posición</th>
                <th className="py-1.5 pr-3 font-medium">kV</th>
                <th className="py-1.5 pr-3 font-medium">mAs</th>
                <th className="py-1.5 font-medium">Angulación</th>
              </tr>
            </thead>
            <tbody>
              {grupo.valores.map((v, i) => (
                <tr
                  key={v.posicion + i}
                  className={i !== grupo.valores.length - 1 ? "border-b border-border" : ""}
                >
                  <td className="py-1.5 pr-3 text-ink">{v.posicion}</td>
                  <td className="py-1.5 pr-3 font-mono text-ink-dim">{v.kv}</td>
                  <td className="py-1.5 pr-3 font-mono text-ink-dim">{v.mas}</td>
                  <td className="py-1.5 text-xs text-ink-faint">{v.angulacion ?? "Perpendicular"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
