"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/AuthProvider";

function aEmail(usuario: string) {
  const limpio = usuario.trim();
  return limpio.includes("@") ? limpio : `${limpio}@intecnus.local`;
}

export default function LoginPage() {
  const router = useRouter();
  const { cargando, user } = useAuth();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!cargando && user) router.replace("/protocolos");
  }, [cargando, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await signInWithEmailAndPassword(auth, aEmail(usuario), password);
      router.replace("/protocolos");
    } catch {
      setError("Usuario o contraseña incorrectos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded border border-rm-dim bg-surface font-mono text-sm text-rm">
            DI
          </div>
          <h1 className="text-lg font-semibold text-ink">
            Protocolos de Diagnóstico por Imágenes
          </h1>
          <p className="mt-1 text-sm text-ink-dim">
            Resonancia · Tomografía · Rayos X
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-md border border-border bg-surface p-6"
        >
          <div className="mb-4">
            <label
              htmlFor="usuario"
              className="mb-1.5 block text-xs font-medium text-ink-dim"
            >
              Usuario
            </label>
            <input
              id="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              autoFocus
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-rm"
              placeholder="tecnico"
            />
          </div>

          <div className="mb-5">
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium text-ink-dim"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-rm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="mb-4 rounded border border-alert-dim bg-alert-dim/20 px-3 py-2 text-xs text-alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded bg-rm-dim px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-rm hover:text-bg disabled:opacity-50"
          >
            {enviando ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
