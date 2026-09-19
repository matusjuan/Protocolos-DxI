"use client";

import Link from "next/link";
import { RutaProtegida } from "@/components/RutaProtegida";
import { Encabezado } from "@/components/Encabezado";
import { ProtocoloForm } from "@/components/ProtocoloForm";

function NuevoProtocolo() {
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
          <h1 className="mb-6 text-lg font-semibold text-ink">Nuevo protocolo</h1>
          <ProtocoloForm />
        </div>
      </main>
    </div>
  );
}

export default function NuevoProtocoloPage() {
  return (
    <RutaProtegida rolRequerido="admin">
      <NuevoProtocolo />
    </RutaProtegida>
  );
}
