export type Rol = "admin" | "tecnico";

export type Modalidad = "RM" | "TC" | "RX";

export interface PasoProtocolo {
  titulo: string;
  detalle: string;
  imagen?: string;
}

export interface ValorParametro {
  posicion: string;
  kv: number;
  mas: number;
  angulacion?: string;
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
  detalleContraste: string | null;
  pasos: PasoProtocolo[];
  pasosConContraste?: PasoProtocolo[];
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
