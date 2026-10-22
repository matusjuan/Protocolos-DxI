export type Rol = "admin" | "tecnico";

export type Modalidad = "RM" | "TC" | "RX";

// Resonador donde se hace una secuencia. Si un paso no tiene "equipo", aplica a ambos.
export type Equipo = "1.5T" | "3T";

export interface PasoProtocolo {
  titulo: string;
  detalle: string;
  imagen?: string;
  condicionOpcional?: string;
  ocultarConCondicion?: string;
  zona?: string;
  equipo?: Equipo;
  notaManual?: string;
  soloConContraste?: boolean;
  soloSinContraste?: boolean;
  despuesDeInyeccion?: boolean;
  dinamico?: boolean;
}

export interface ValorParametro {
  posicion: string;
  kv: number;
  mas: number;
  angulacion?: string;
}

// Dato suelto de una ficha (ej: "Filtro" / "BonePlus"). "destacado" lo resalta.
export interface ParametroFicha {
  etiqueta: string;
  valor: string;
  destacado?: boolean;
}

// Reconstrucción de TC mostrada como tarjeta.
export interface ReconstruccionTC {
  titulo: string;
  destino?: string | null;
  parametros: ParametroFicha[];
}

// Qué bloques de la vista compacta de TC se muestran en un protocolo.
export interface VistaTC {
  ruta: boolean;
  ficha: boolean;
  reconstrucciones: boolean;
  aviso: boolean;
}

export interface ParametrosPorGrupo {
  grupo: string;
  distancia?: string;
  valores: ValorParametro[];
}

export interface ImagenProtocolo {
  etiqueta: string;
  url: string;
}

export interface Perfil {
  rol: Rol;
  nombre: string | null;
}

export interface VideoProtocolo {
  etiqueta: string;
  url: string;
  mostrarEn?: "sin" | "con" | "ambos";
}

export interface Protocolo {
  id: string;
  modalidad: Modalidad;
  region: string;
  subregion?: string | null;
  patologia: string;
  indicacion: string | null;
  usaContraste: boolean;
  // Si el estudio se hace en un solo resonador. Vacío = se hace en los dos.
  soloEquipo?: Equipo | null;
  detalleContraste: string | null;
  pasos: PasoProtocolo[];
  pasosConContraste?: PasoProtocolo[];
  // Vista compacta de TC (opcional): si es null/ausente, el protocolo se ve como siempre.
  vistaTC?: VistaTC | null;
  fichaAdquisicion?: ParametroFicha[];
  reconstruccionesTC?: ReconstruccionTC[];
  avisoImportante?: string | null;
  reconstrucciones?: PasoProtocolo[];
  parametrosPorEdad?: ParametrosPorGrupo[];
  postProceso: string | null;
  notas: string | null;
  imagenes: (ImagenProtocolo | string)[];
  videos?: VideoProtocolo[];
  createdBy: string | null;
  createdAt: number;
  updatedAt: number;
}
