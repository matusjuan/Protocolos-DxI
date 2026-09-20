import type { Metadata } from "next";
import { AuthProvider } from "@/lib/firebase/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Protocolos — Diagnóstico por Imágenes",
  description: "Protocolos de resonancia, tomografía y rayos X para técnicos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <script
          // Evita el parpadeo: aplica el tema guardado antes de pintar la página.
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('tema')==='claro'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}",
          }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <p className="pointer-events-none fixed bottom-1.5 right-2 z-40 text-[10px] text-ink-faint/70">
          Diseño: Lic. Juan Ignacio Matus · Septiembre &apos;26
        </p>
      </body>
    </html>
  );
}
