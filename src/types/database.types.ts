export type Rol = "admin" | "tecnico";

export type Modalidad = "RM" | "TC" | "RX";

export interface PasoProtocolo {
  titulo: string;
  detalle: string;
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
  notas: string | null;
  imagenes: string[];
  createdBy: string | null;
  createdAt: number;
  updatedAt: number;
}
