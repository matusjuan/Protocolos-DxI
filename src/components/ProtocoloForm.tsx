"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { MODALIDADES } from "@/lib/modalidades";
import { normalizarImagen } from "@/lib/imagenes";
import { useAuth } from "@/lib/firebase/AuthProvider";
import type {
  ImagenProtocolo,
  Modalidad,
  PasoProtocolo,
  Protocolo,
  VideoProtocolo,
} from "@/types/database.types";

const MAX_IMAGENES = 4;
const ANCHO_MAXIMO = 900;
const CALIDAD_JPEG = 0.6;

function comprimirImagen(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, ANCHO_MAXIMO / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo procesar la imagen."));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", CALIDAD_JPEG));
      };
      img.onerror = () => reject(new Error("No se pudo leer la imagen."));
      img.src = lector.result as string;
    };
    lector.onerror = () => reject(new Error("No se pudo leer el archivo."));
    lector.readAsDataURL(file);
  });
}

export function ProtocoloForm({ inicial }: { inicial?: Protocolo }) {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalidad, setModalidad] = useState<Modalidad>(inicial?.modalidad ?? "RM");
  const [region, setRegion] = useState(inicial?.region ?? "");
  const [subregion, setSubregion] = useState(inicial?.subregion ?? "");
  const [patologia, setPatologia] = useState(inicial?.patologia ?? "");
  const [indicacion, setIndicacion] = useState(inicial?.indicacion ?? "");
  const [usaContraste, setUsaContraste] = useState(inicial?.usaContraste ?? false);
  const [detalleContraste, setDetalleContraste] = useState(
    inicial?.detalleContraste ?? ""
  );
  const [pasos, setPasos] = useState<PasoProtocolo[]>(
    inicial?.pasos?.length ? inicial.pasos : [{ titulo: "", detalle: "" }]
  );
  const [arrastrandoPaso, setArrastrandoPaso] = useState<number | null>(null);
  const [opcionalAbiertoPaso, setOpcionalAbiertoPaso] = useState<Set<number>>(new Set());
  const [reconstrucciones, setReconstrucciones] = useState<PasoProtocolo[]>(
    inicial?.reconstrucciones ?? []
  );
  const [notas, setNotas] = useState(inicial?.notas ?? "");
  const [postProceso, setPostProceso] = useState(inicial?.postProceso ?? "");
  const [videos, setVideos] = useState<VideoProtocolo[]>(inicial?.videos ?? []);
  const [imagenes, setImagenes] = useState<ImagenProtocolo[]>(
    (inicial?.imagenes ?? []).map(normalizarImagen)
  );
  const [procesandoImagen, setProcesandoImagen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function actualizarPaso(i: number, campo: keyof PasoProtocolo, valor: string) {
    setPasos((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  }

  function agregarPaso() {
    setPasos((prev) => [...prev, { titulo: "", detalle: "" }]);
  }

  function moverPaso(i: number, direccion: -1 | 1) {
    setPasos((prev) => {
      const j = i + direccion;
      if (j < 0 || j >= prev.length) return prev;
      const copia = [...prev];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });
  }

  function reordenarPasos(desde: number, hasta: number) {
    if (desde === hasta) return;
    setPasos((prev) => {
      const copia = [...prev];
      const [item] = copia.splice(desde, 1);
      copia.splice(hasta, 0, item);
      return copia;
    });
  }

  function quitarPaso(i: number) {
    setPasos((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function agregarImagenAPaso(i: number, file: File) {
    setError(null);
    try {
      const dataUrl = await comprimirImagen(file);
      setPasos((prev) => prev.map((p, idx) => (idx === i ? { ...p, imagen: dataUrl } : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la imagen.");
    }
  }

  function quitarImagenDePaso(i: number) {
    setPasos((prev) => prev.map((p, idx) => (idx === i ? { ...p, imagen: undefined } : p)));
  }

  function alternarPostContraste(i: number) {
    setPasos((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, postContraste: !p.postContraste } : p))
    );
  }

  function actualizarReconstruccion(i: number, campo: keyof PasoProtocolo, valor: string) {
    setReconstrucciones((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [campo]: valor } : r))
    );
  }

  function agregarReconstruccion() {
    setReconstrucciones((prev) => [...prev, { titulo: "", detalle: "" }]);
  }

  function quitarReconstruccion(i: number) {
    setReconstrucciones((prev) => prev.filter((_, idx) => idx !== i));
  }

  function agregarVideo() {
    setVideos((prev) => [...prev, { etiqueta: `Video ${prev.length + 1}`, url: "" }]);
  }

  function actualizarVideo(i: number, campo: keyof VideoProtocolo, valor: string) {
    setVideos((prev) => prev.map((v, idx) => (idx === i ? { ...v, [campo]: valor } : v)));
  }

  function quitarVideo(i: number) {
    setVideos((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function agregarImagen(file: File) {
    if (imagenes.length >= MAX_IMAGENES) {
      setError(`Máximo ${MAX_IMAGENES} imágenes por protocolo.`);
      return;
    }
    setProcesandoImagen(true);
    setError(null);
    try {
      const dataUrl = await comprimirImagen(file);
      setImagenes((prev) => [...prev, { etiqueta: `Imagen ${prev.length + 1}`, url: dataUrl }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la imagen.");
    } finally {
      setProcesandoImagen(false);
    }
  }

  function quitarImagen(i: number) {
    setImagenes((prev) => prev.filter((_, idx) => idx !== i));
  }

  function renombrarImagen(i: number, etiqueta: string) {
    setImagenes((prev) => prev.map((img, idx) => (idx === i ? { ...img, etiqueta } : img)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!region.trim() || !patologia.trim()) {
      setError("Región y patología son obligatorias.");
      return;
    }

    setGuardando(true);

    const payload = {
      modalidad,
      region: region.trim(),
      subregion: subregion.trim() || null,
      patologia: patologia.trim(),
      indicacion: indicacion.trim() || null,
      usaContraste,
      detalleContraste: usaContraste ? detalleContraste.trim() || null : null,
      pasos: pasos.filter((p) => p.titulo.trim().length > 0),
      pasosConContraste: [],
      reconstrucciones: reconstrucciones.filter((r) => r.titulo.trim().length > 0),
      postProceso: postProceso.trim() || null,
      notas: notas.trim() || null,
      imagenes,
      videos: videos.filter((v) => v.url.trim().length > 0),
      updatedAt: serverTimestamp(),
    };

    try {
      if (inicial) {
        await updateDoc(doc(db, "protocolos", inicial.id), payload);
      } else {
        await addDoc(collection(db, "protocolos"), {
          ...payload,
          createdBy: user?.uid ?? null,
          createdAt: serverTimestamp(),
        });
      }
      router.push("/admin");
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "No se pudo guardar el protocolo.";
      setError(
        mensaje.includes("longer than")
          ? "Las imágenes son muy pesadas para guardar juntas. Sacá alguna o repetila con menos calidad."
          : mensaje
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-dim">
            Modalidad
          </label>
          <select
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value as Modalidad)}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
          >
            {MODALIDADES.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.valor} — {m.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-dim">
            Región
          </label>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Ej: Columna, Osteoarticular"
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-dim">
            Subregión (opcional)
          </label>
          <input
            value={subregion}
            onChange={(e) => setSubregion(e.target.value)}
            placeholder="Ej: Miembros superiores"
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-dim">
            Patología / estudio
          </label>
          <input
            value={patologia}
            onChange={(e) => setPatologia(e.target.value)}
            placeholder="Ej: ACV isquémico"
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-dim">
          Indicación (cuándo se realiza este estudio)
        </label>
        <textarea
          value={indicacion}
          onChange={(e) => setIndicacion(e.target.value)}
          rows={2}
          className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
        />
      </div>

      <div className="rounded border border-border bg-surface p-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={usaContraste}
            onChange={(e) => setUsaContraste(e.target.checked)}
            className="h-4 w-4 accent-tc"
          />
          Este protocolo usa contraste
        </label>
        {usaContraste && (
          <textarea
            value={detalleContraste}
            onChange={(e) => setDetalleContraste(e.target.value)}
            rows={2}
            placeholder="Dosis, vía, tiempos de adquisición post-contraste…"
            className="mt-3 w-full rounded border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-tc"
          />
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-ink-dim">
            Técnica — pasos del protocolo
          </label>
          <button
            type="button"
            onClick={agregarPaso}
            className="text-xs text-rm hover:underline"
          >
            + Agregar paso
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {pasos.map((paso, i) => (
            <div
              key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (arrastrandoPaso !== null) reordenarPasos(arrastrandoPaso, i);
                setArrastrandoPaso(null);
              }}
              className={`flex gap-3 rounded border bg-surface p-3 transition-colors ${
                arrastrandoPaso === i ? "border-rm-dim opacity-50" : "border-border"
              }`}
            >
              <div className="mt-1 flex flex-col items-center gap-1">
                <span
                  draggable
                  onDragStart={() => setArrastrandoPaso(i)}
                  onDragEnd={() => setArrastrandoPaso(null)}
                  className="cursor-grab select-none text-ink-faint hover:text-ink active:cursor-grabbing"
                  title="Arrastrar para reordenar"
                >
                  ⠿
                </span>
                <span className="font-mono text-xs text-ink-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => moverPaso(i, -1)}
                  disabled={i === 0}
                  className="text-ink-faint hover:text-ink disabled:opacity-20"
                  aria-label="Subir"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moverPaso(i, 1)}
                  disabled={i === pasos.length - 1}
                  className="text-ink-faint hover:text-ink disabled:opacity-20"
                  aria-label="Bajar"
                >
                  ▼
                </button>
              </div>
              <div className="flex-1 space-y-2">
                <input
                  value={paso.titulo}
                  onChange={(e) => actualizarPaso(i, "titulo", e.target.value)}
                  placeholder="Título del paso (ej: Secuencia axial T2)"
                  className="w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-ink outline-none focus:border-rm"
                />
                <textarea
                  value={paso.detalle}
                  onChange={(e) => actualizarPaso(i, "detalle", e.target.value)}
                  placeholder="Cómo se programa esta secuencia (plano, FOV, espesor, TR/TE, matriz, etc.)"
                  rows={2}
                  className="w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-ink outline-none focus:border-rm"
                />
                <label className="flex items-center gap-1.5 text-xs text-ink-dim">
                  <input
                    type="checkbox"
                    checked={opcionalAbiertoPaso.has(i) || !!paso.condicionOpcional}
                    onChange={(e) => {
                      setOpcionalAbiertoPaso((prev) => {
                        const nuevo = new Set(prev);
                        if (e.target.checked) nuevo.add(i);
                        else nuevo.delete(i);
                        return nuevo;
                      });
                      if (!e.target.checked) actualizarPaso(i, "condicionOpcional", "");
                    }}
                    className="h-3.5 w-3.5 accent-rm"
                  />
                  Es opcional (solo para cierta indicación)
                </label>
                {(opcionalAbiertoPaso.has(i) || !!paso.condicionOpcional) && (
                  <input
                    value={paso.condicionOpcional ?? ""}
                    onChange={(e) => actualizarPaso(i, "condicionOpcional", e.target.value)}
                    placeholder="¿Cuándo se hace? (ej: Sospecha de metástasis o tumor)"
                    className="w-full rounded border border-rm-dim bg-bg px-3 py-1.5 text-sm text-ink outline-none focus:border-rm"
                  />
                )}
                {usaContraste && (
                  <label className="flex items-center gap-1.5 text-xs text-tc">
                    <input
                      type="checkbox"
                      checked={!!paso.postContraste}
                      onChange={() => alternarPostContraste(i)}
                      className="h-3.5 w-3.5 accent-tc"
                    />
                    Es post-contraste (solo aparece al elegir &quot;Con contraste&quot;)
                  </label>
                )}
                {paso.imagen ? (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={paso.imagen}
                      alt=""
                      className="h-16 w-16 rounded border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => quitarImagenDePaso(i)}
                      className="text-xs text-ink-faint hover:text-alert"
                    >
                      Quitar imagen
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-rm hover:underline">
                    + Imagen de cómo se programa
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) agregarImagenAPaso(i, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 self-start">
                {pasos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => quitarPaso(i)}
                    className="text-xs text-ink-faint hover:text-alert"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalidad === "TC" && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-ink-dim">
              Reconstrucciones
            </label>
            <button
              type="button"
              onClick={agregarReconstruccion}
              className="text-xs text-rm hover:underline"
            >
              + Agregar reconstrucción
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {reconstrucciones.map((r, i) => (
              <div key={i} className="flex gap-3 rounded border border-border bg-surface p-3">
                <span className="mt-2 font-mono text-xs text-ink-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 space-y-2">
                  <input
                    value={r.titulo}
                    onChange={(e) => actualizarReconstruccion(i, "titulo", e.target.value)}
                    placeholder="Título (ej: MIP coronal 20mm)"
                    className="w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-ink outline-none focus:border-rm"
                  />
                  <textarea
                    value={r.detalle}
                    onChange={(e) => actualizarReconstruccion(i, "detalle", e.target.value)}
                    placeholder="Detalle (grosor, plano, filtro, secuencia de origen, etc.)"
                    rows={2}
                    className="w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-ink outline-none focus:border-rm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => quitarReconstruccion(i)}
                  className="self-start text-xs text-ink-faint hover:text-alert"
                >
                  Quitar
                </button>
              </div>
            ))}
            {reconstrucciones.length === 0 && (
              <p className="text-xs text-ink-faint">
                Todavía no agregaste reconstrucciones para este estudio.
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs font-medium text-ink-dim">
            Imágenes de referencia
          </label>
          <span className="text-[11px] text-ink-faint">
            {imagenes.length}/{MAX_IMAGENES}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {imagenes.map((img, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="h-20 w-20 rounded border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => quitarImagen(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-alert text-xs text-bg"
                >
                  ×
                </button>
              </div>
              <input
                value={img.etiqueta}
                onChange={(e) => renombrarImagen(i, e.target.value)}
                placeholder="Ej: Frente, Perfil…"
                className="w-20 rounded border border-border bg-bg px-1 py-0.5 text-center text-[11px] text-ink outline-none focus:border-rm"
              />
            </div>
          ))}
          {imagenes.length < MAX_IMAGENES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={procesandoImagen}
              className="flex h-20 w-20 items-center justify-center rounded border border-dashed border-border text-xs text-ink-faint hover:border-rm hover:text-rm disabled:opacity-50"
            >
              {procesandoImagen ? "Procesando…" : "+ Imagen"}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) agregarImagen(file);
              e.target.value = "";
            }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-ink-faint">
          Se comprimen automáticamente al subirlas. Máximo {MAX_IMAGENES} por protocolo.
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-ink-dim">
            Videos (link de YouTube o Google Drive)
          </label>
          <button
            type="button"
            onClick={agregarVideo}
            className="text-xs text-rm hover:underline"
          >
            + Agregar video
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {videos.map((v, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                value={v.etiqueta}
                onChange={(e) => actualizarVideo(i, "etiqueta", e.target.value)}
                placeholder="Nombre"
                className="w-32 rounded border border-border bg-surface px-2 py-1.5 text-sm text-ink outline-none focus:border-rm"
              />
              <input
                value={v.url}
                onChange={(e) => actualizarVideo(i, "url", e.target.value)}
                placeholder="https://youtube.com/... o https://drive.google.com/..."
                className="min-w-[14rem] flex-1 rounded border border-border bg-surface px-2 py-1.5 text-sm text-ink outline-none focus:border-rm"
              />
              {usaContraste && (
                <select
                  value={v.mostrarEn ?? "ambos"}
                  onChange={(e) => actualizarVideo(i, "mostrarEn", e.target.value)}
                  className="rounded border border-border bg-surface px-2 py-1.5 text-xs text-ink outline-none focus:border-rm"
                >
                  <option value="ambos">Sin y con contraste</option>
                  <option value="sin">Solo sin contraste</option>
                  <option value="con">Solo con contraste</option>
                </select>
              )}
              <button
                type="button"
                onClick={() => quitarVideo(i)}
                className="text-xs text-ink-faint hover:text-alert"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-dim">
          Post-proceso
        </label>
        <textarea
          value={postProceso}
          onChange={(e) => setPostProceso(e.target.value)}
          rows={3}
          placeholder="Qué hay que hacer con las secuencias después de la adquisición (reconstrucciones, fusiones, mediciones, etc.)"
          className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-dim">
          Notas / contraindicaciones
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rm"
        />
      </div>

      {error && (
        <p className="rounded border border-alert-dim bg-alert-dim/20 px-3 py-2 text-sm text-alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="rounded bg-rm-dim px-4 py-2 text-sm font-medium text-ink hover:bg-rm hover:text-bg disabled:opacity-50"
        >
          {guardando ? "Guardando…" : inicial ? "Guardar cambios" : "Crear protocolo"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded px-4 py-2 text-sm text-ink-faint hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
