"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { RutaProtegida } from "@/components/RutaProtegida";
import { Encabezado } from "@/components/Encabezado";
import { ProtocoloForm } from "@/components/ProtocoloForm";
import { db } from "@/lib/firebase/client";
import type { Protocolo } from "@/types/database.types";

function EditarProtocolo() {
  const { id } = useParams<{ id: string }>();
  const [protocolo, setProtocolo] = useState<Protocolo | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    getDoc(doc(db, "protocolos", id)).then((snap) => {
      if (!activo) return;
      setProtocolo(snap.exists() ? ({ id: snap.id, ...snap.data() } as Protocolo) : null);
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [id]);

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Encabezado />
      <main className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/admin"
            className="mb-4 inline-block text-xs text-ink-faint hover:text-ink"
          >
            ← Volver
          </Link>
          <h1 className="mb-6 text-lg font-semibold text-ink">Editar protocolo</h1>
          {cargando && (
            <p className="font-mono text-sm text-ink-faint">Cargando…</p>
          )}
          {!cargando && protocolo && <ProtocoloForm inicial={protocolo} />}
          {!cargando && !protocolo && (
            <p className="text-sm text-ink-dim">No se encontró el protocolo.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function EditarProtocoloPage() {
  return (
    <RutaProtegida rolRequerido="admin">
      <EditarProtocolo />
    </RutaProtegida>
  );
}
