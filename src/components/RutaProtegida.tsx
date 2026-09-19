"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthProvider";
import type { Rol } from "@/types/database.types";

export function RutaProtegida({
  rolRequerido,
  children,
}: {
  rolRequerido?: Rol;
  children: React.ReactNode;
}) {
  const { cargando, user, rol } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (rolRequerido && rol !== rolRequerido) {
      router.replace("/protocolos");
    }
  }, [cargando, user, rol, rolRequerido, router]);

  if (cargando || !user || (rolRequerido && rol !== rolRequerido)) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <p className="font-mono text-sm text-ink-faint">Cargando…</p>
      </div>
    );
  }

  return <>{children}</>;
}
