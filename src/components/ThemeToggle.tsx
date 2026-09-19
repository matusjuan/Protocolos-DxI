"use client";

import { useEffect, useState } from "react";

type Tema = "oscuro" | "claro";

function aplicarTema(tema: Tema) {
  document.documentElement.setAttribute(
    "data-theme",
    tema === "claro" ? "light" : "dark"
  );
  window.localStorage.setItem("tema", tema);
}

export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>("oscuro");

  useEffect(() => {
    const guardado = window.localStorage.getItem("tema");
    setTema(guardado === "claro" ? "claro" : "oscuro");
  }, []);

  function alternar() {
    const nuevo: Tema = tema === "claro" ? "oscuro" : "claro";
    setTema(nuevo);
    aplicarTema(nuevo);
  }

  return (
    <button
      onClick={alternar}
      aria-label="Cambiar a modo claro u oscuro"
      title={tema === "claro" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      className="flex h-7 w-7 items-center justify-center rounded border border-border text-sm text-ink-dim transition-colors hover:text-ink"
    >
      {tema === "claro" ? "🌙" : "☀️"}
    </button>
  );
}
