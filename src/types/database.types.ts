export type Rol = "admin" | "tecnico";

export type Modalidad = "RM" | "TC" | "RX";

export interface PasoProtocolo {
  titulo: string;
  detalle: string;
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

export interface Perfil {
  rol: Rol;
  nombre: string | null;
}

export interface Protocolo {
  id: string;
  modalidad: Modalidad;
  region: string;
  patologia: string;
  indicacion: string | null;
  usaContraste: boolean;
  detalleContraste: string | null;
  pasos: PasoProtocolo[];
  parametrosPorEdad?: ParametrosPorGrupo[];
  notas: string | null;
  imagenes: string[];
  createdBy: string | null;
  createdAt: number;
  updatedAt: number;
}
