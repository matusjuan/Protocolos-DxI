"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthProvider";

export default function Home() {
  const { cargando, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    router.replace(user ? "/protocolos" : "/login");
  }, [cargando, user, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <p className="font-mono text-sm text-ink-faint">Cargando…</p>
    </div>
  );
}
