"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/AuthProvider";

export function Encabezado() {
  const { rol, nombre } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function salir() {
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-5">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-rm-dim font-mono text-[11px] text-rm">
            DI
          </div>
          <span className="text-sm font-semibold text-ink">Protocolos</span>
        </div>

        <nav className="flex items-center gap-1">
          <Link
            href="/protocolos"
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              pathname?.startsWith("/protocolos")
                ? "bg-surface2 text-ink"
                : "text-ink-dim hover:text-ink"
            }`}
          >
            Protocolos
          </Link>
          {rol === "admin" && (
            <Link
              href="/admin"
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                pathname?.startsWith("/admin")
                  ? "bg-surface2 text-ink"
                  : "text-ink-dim hover:text-ink"
              }`}
            >
              Administrar
            </Link>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded border border-border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-ink-dim">
          {rol === "admin" ? "Admin" : "Técnico"}
        </span>
        {nombre && <span className="text-sm text-ink-dim">{nombre}</span>}
        <button
          onClick={salir}
          className="rounded px-2 py-1 text-sm text-ink-faint hover:text-alert"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
