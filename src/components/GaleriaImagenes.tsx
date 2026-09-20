"use client";

import { useState } from "react";
import { normalizarImagen } from "@/lib/imagenes";
import type { ImagenProtocolo } from "@/types/database.types";

export function GaleriaImagenes({ imagenes }: { imagenes: (ImagenProtocolo | string)[] }) {
  const lista = imagenes.map(normalizarImagen);
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <div className="mb-6">
      <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-faint">
        Imágenes de referencia
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {lista.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setAbierta(i)}
            className="flex flex-col overflow-hidden rounded border border-border bg-surface text-left transition-colors hover:border-rm-dim"
          >
            <div className="flex aspect-[4/3] items-center justify-center bg-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.etiqueta} className="max-h-full max-w-full object-contain" />
            </div>
            <p className="truncate px-2 py-1.5 text-xs text-ink-dim">{img.etiqueta}</p>
          </button>
        ))}
      </div>

      {abierta !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setAbierta(null)}
        >
          <div
            className="relative flex max-h-full max-w-3xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lista[abierta].url}
              alt={lista[abierta].etiqueta}
              className="max-h-[80vh] max-w-full rounded object-contain"
            />
            <p className="mt-3 text-sm text-ink">{lista[abierta].etiqueta}</p>

            <button
              type="button"
              onClick={() => setAbierta(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink hover:bg-surface2"
              aria-label="Cerrar"
            >
              ×
            </button>

            {lista.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setAbierta((abierta - 1 + lista.length) % lista.length)}
                  className="absolute left-0 top-1/2 -translate-x-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink hover:bg-surface2 sm:-translate-x-14"
                  aria-label="Anterior"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setAbierta((abierta + 1) % lista.length)}
                  className="absolute right-0 top-1/2 translate-x-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink hover:bg-surface2 sm:translate-x-14"
                  aria-label="Siguiente"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
