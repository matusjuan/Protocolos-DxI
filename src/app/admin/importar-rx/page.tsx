"use client";

import { useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { RutaProtegida } from "@/components/RutaProtegida";
import { Encabezado } from "@/components/Encabezado";
import { db } from "@/lib/firebase/client";
import type {
  Modalidad,
  PasoProtocolo,
  ParametrosPorGrupo,
  ValorParametro,
} from "@/types/database.types";

interface ProtocoloSemilla {
  region: string;
  patologia: string;
  indicacion?: string;
  notas?: string;
  pasos: PasoProtocolo[];
  parametrosPorEdad?: ParametrosPorGrupo[];
}

const MODALIDAD: Modalidad = "RX";

const tecnica = (detalle: string): PasoProtocolo[] => [
  { titulo: "Técnica", detalle },
];

function v(posicion: string, kv: number, mas: number, angulacion?: string): ValorParametro {
  return { posicion, kv, mas, angulacion };
}

function grupos(
  distanciaComun: string | undefined,
  bebe: ValorParametro[],
  n1a4: ValorParametro[],
  n5a9: ValorParametro[],
  n10a15: ValorParametro[],
  adulto: ValorParametro[]
): ParametrosPorGrupo[] {
  return [
    { grupo: "Bebé (0-12 m)", distancia: distanciaComun, valores: bebe },
    { grupo: "1-4 años", distancia: distanciaComun, valores: n1a4 },
    { grupo: "5-9 años", distancia: distanciaComun, valores: n5a9 },
    { grupo: "10-15 años", distancia: distanciaComun, valores: n10a15 },
    { grupo: "Adulto (16+)", distancia: distanciaComun, valores: adulto },
  ];
}

const PROTOCOLOS_RX: ProtocoloSemilla[] = [
  {
    region: "Cabeza",
    patologia: "Cráneo (frente, perfil, MNP, FNP, cavum, Towne, Hirtz)",
    notas: "Quitar todo elemento metálico y plástico duro, gel de pelo; desarmar trenzas.",
    pasos: tecnica(
      "Frente AP: apoya la parte posterior del cráneo, con leve inclinación del mentón hacia abajo. Frente PA: apoya la punta de la nariz sobre el detector. MNP: de frente al detector, apoya nariz y mentón; se le indica abrir la boca despegando la nariz del detector, dejando caer la cabeza hacia atrás sin despegar el mentón. FNP: apoya punta de nariz y frente sobre el detector, luego apoya la frente. Perfil: mirando al técnico, cráneo paralelo al detector y mandíbula paralela al suelo (huesos propios: igual pero focalizado en nariz, colimar). Cavum: igual que perfil, colimando la zona a estudiar. Towne: OM paralela al chasis, de pie o en decúbito dorsal, angulación 30° caudo-cefálico. Hirtz: decúbito supino o sentado, hiperextensión del cuello, cráneo en contacto con el detector y OM paralela al mismo."
    ),
    parametrosPorEdad: grupos(
      "1 m",
      [v("Frente AP", 50, 12.5), v("Frente PA", 50, 12.5), v("Perfil", 50, 12.5), v("MNP", 50, 12.5), v("FNP", 50, 12.5), v("Cavum", 50, 20), v("Towne", 50, 12.5, "Caudo-cefálico 10°"), v("Hirtz", 50, 12.5, "Caudo-cefálico 10°")],
      [v("Frente AP", 40, 20), v("Frente PA", 40, 20), v("Perfil", 40, 20), v("MNP", 40, 20), v("FNP", 40, 20), v("Cavum", 60, 25), v("Towne", 40, 20, "Caudo-cefálico 10°"), v("Hirtz", 40, 20, "Caudo-cefálico 10°")],
      [v("Frente AP", 65, 25), v("Frente PA", 65, 25), v("Perfil", 65, 25), v("MNP", 65, 25), v("FNP", 65, 25), v("Cavum", 65, 25), v("Towne", 65, 25, "Caudo-cefálico 10°"), v("Hirtz", 65, 25, "Caudo-cefálico 10°")],
      [v("Frente AP", 72, 25), v("Frente PA", 72, 25), v("Perfil", 72, 25), v("MNP", 72, 25), v("FNP", 72, 25), v("Cavum", 60, 30), v("Towne", 72, 25, "Caudo-cefálico 10°"), v("Hirtz", 72, 25, "Caudo-cefálico 10°")],
      [v("Frente AP", 72, 25), v("Frente PA", 72, 25), v("Perfil", 72, 25), v("MNP", 72, 25), v("FNP", 72, 25), v("Cavum", 60, 30), v("Towne", 72, 25, "Caudo-cefálico 10°"), v("Hirtz", 72, 25, "Caudo-cefálico 10°")]
    ),
  },
  {
    region: "Tronco",
    patologia: "Tórax",
    notas: "AP sentado (silla de ruedas): detector entre espalda y respaldo, angulación caudal de 10°. AP en decúbito: detector entre espalda y camilla, RC perpendicular al detector.",
    pasos: tecnica(
      "Frente: apoyando el pecho sobre el detector, manos a la cadera y codos hacia adelante, relajando hombros (intentar que ambos apoyen en el detector); RC a nivel escapular. Perfil: siempre izquierdo salvo indicación contraria; detector vertical, eleva los brazos o lleva las manos a la cabeza juntando los codos (alternativas: sujetar un elemento vertical con brazos extendidos, o cruzar los brazos sujetando los codos y elevarlos). Detector horizontal salvo pacientes muy altos y delgados (vertical)."
    ),
    parametrosPorEdad: grupos(
      "1,80 m",
      [v("Frente", 65, 2), v("Perfil", 65, 2)],
      [v("Frente", 80, 2), v("Perfil", 80, 2)],
      [v("Frente", 90, 2), v("Perfil", 90, 2)],
      [v("Frente", 100, 3.2), v("Perfil", 100, 4)],
      [v("Frente", 115, 3.2), v("Perfil", 115, 4)]
    ),
  },
  {
    region: "Tronco",
    patologia: "Parrilla costal",
    pasos: tecnica(
      "Frente PA: igual que un tórax frente; si se piden ambos lados, se repite modificando parámetros en consola; para un solo lado, centrar la parrilla de interés en el medio del detector. Oblicuo: desde una posición inicial PA, apoya la parrilla que no es objeto de estudio contra el detector y coloca el miembro superior contralateral sobre la cabeza; despegando el tórax con un ángulo imaginario de 45°, las costillas se despliegan."
    ),
    parametrosPorEdad: grupos(
      "1,80 m",
      [v("Frente", 60, 8), v("Oblicua", 60, 8)],
      [v("Frente", 70, 12.5), v("Oblicua", 70, 12.5)],
      [v("Frente", 75, 16), v("Oblicua", 75, 16)],
      [v("Frente", 80, 25), v("Oblicua", 80, 25)],
      [v("Frente", 90, 32), v("Oblicua", 90, 32)]
    ),
  },
  {
    region: "Tronco",
    patologia: "Esternón",
    pasos: tecnica(
      "Frente: de pie, brazo derecho al lado del cuerpo y brazo izquierdo hacia arriba, formando un ángulo imaginario de 15-20° con el detector (parte derecha elevada). Perfil: a 90° respecto al detector, de ser posible con las manos atrás del cuerpo para elevar el tórax, hombros y brazos hacia atrás; colimar para focalizar la región."
    ),
    parametrosPorEdad: grupos(
      "1 m",
      [v("Frente", 60, 8), v("Perfil", 60, 8)],
      [v("Frente", 70, 12.5), v("Perfil", 70, 12.5)],
      [v("Frente", 75, 16), v("Perfil", 75, 16)],
      [v("Frente", 80, 25), v("Perfil", 80, 25)],
      [v("Frente", 90, 32), v("Perfil", 90, 32)]
    ),
  },
  {
    region: "Tronco",
    patologia: "Clavícula",
    notas: "Para imagen comparativa, ambas clavículas en la misma placa (aumentando la distancia del tubo). Una sola imagen debe incluir ambas articulaciones (acromion y esternón). Cuidado con elásticos de ropa interior.",
    pasos: tecnica(
      "Frente: antero al tubo apoyando la espalda en el detector, centrar la clavícula a estudiar y colimar. Descentrada de vértice: misma posición que frente, con angulación del tubo céfalo-caudal de 15° a 30°."
    ),
    parametrosPorEdad: grupos(
      "1 m",
      [v("Frente", 60, 16), v("Descentrada de vértice", 60, 16, "15°-30° caudo-cefálico")],
      [v("Frente", 60, 20), v("Descentrada de vértice", 60, 20, "15°-30° caudo-cefálico")],
      [v("Frente", 60, 25), v("Descentrada de vértice", 60, 25, "15°-30° caudo-cefálico")],
      [v("Frente", 70, 25), v("Descentrada de vértice", 70, 25, "15°-30° caudo-cefálico")],
      [v("Frente", 70, 32), v("Descentrada de vértice", 70, 32, "15°-30° caudo-cefálico")]
    ),
  },
  {
    region: "Tronco",
    patologia: "Abdomen",
    notas: "La imagen debe incluir la pelvis; en pacientes de grandes dimensiones, leer el diagnóstico para evaluar la zona a abarcar. Siempre que sea posible, de pie para ver niveles. Todas las posiciones en inspiración.",
    pasos: tecnica(
      "Frente AP de pie: brazos al costado del cuerpo; la imagen se toma del hígado hacia abajo, usando de referencia el chasis vertical desde las axilas. Frente AP en decúbito: igual que de pie, pero en decúbito supino. Perfil de pie: perpendicular al detector, con los brazos elevados; de ser posible, el tubo se ubica a un costado del paciente y el chasis del otro."
    ),
    parametrosPorEdad: grupos(
      "1 m",
      [v("Frente", 60, 40), v("Perfil", 60, 40)],
      [v("Frente", 70, 50), v("Perfil", 70, 50)],
      [v("Frente", 70, 50), v("Perfil", 70, 50)],
      [v("Frente", 90, 63), v("Perfil", 90, 63)],
      [v("Frente", 90, 80), v("Perfil", 90, 80)]
    ),
  },
  {
    region: "Columna",
    patologia: "Columna cervical – cuello",
    notas: "Cuidado con prótesis dentales de metal. Se ofrecen métodos de apoyo para las dinámicas de flexión y extensión.",
    pasos: tecnica(
      "Frente: AP al tubo con angulación de 15° cráneo-caudal. Perfil: de costado, mirando al técnico si es posible, a 90° respecto al detector, mandíbulas simétricas. Máxima flexión: igual que perfil, acercando el mentón al pecho. Máxima extensión: igual que perfil, inclinando la cabeza hacia atrás hasta donde pueda. Oblicuas: desde frente, rotación de 45° de todo el cuerpo; se adquiere de ambos lados. Transoral: desde cervical frente, tubo perpendicular, se le pide abrir la boca y fonar “AAAAA” para desproyectar la lengua."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 50, 20, "15°-30° caudo-cefálico"), v("Perfil", 50, 20), v("Oblicua", 50, 20), v("Máx. flexión", 50, 20), v("Máx. extensión", 50, 20), v("Transoral", 50, 20)],
      [v("Frente", 50, 20, "15°-30° caudo-cefálico"), v("Perfil", 50, 20), v("Oblicua", 50, 20), v("Máx. flexión", 50, 20), v("Máx. extensión", 50, 20), v("Transoral", 50, 20)],
      [v("Frente", 60, 25, "15°-30° caudo-cefálico"), v("Perfil", 60, 25), v("Oblicua", 60, 25), v("Máx. flexión", 60, 25), v("Máx. extensión", 60, 25), v("Transoral", 60, 25)],
      [v("Frente", 72, 30, "15°-30° caudo-cefálico"), v("Perfil", 72, 30), v("Oblicua", 72, 30), v("Máx. flexión", 72, 30), v("Máx. extensión", 72, 30), v("Transoral", 72, 30)],
      [v("Frente", 72, 40, "15°-30° caudo-cefálico"), v("Perfil", 72, 40), v("Oblicua", 72, 40), v("Máx. flexión", 72, 40), v("Máx. extensión", 72, 40), v("Transoral", 72, 40)]
    ),
  },
  {
    region: "Columna",
    patologia: "Columna dorsal",
    notas: "Cuidado con elásticos de ropa interior. Todas las posiciones en inspiración.",
    pasos: tecnica(
      "Frente: AP, apoyando la espalda en el detector, mirando al frente. Perfil: de costado, mirando al técnico si es posible, a 90° respecto al Potter, brazos elevados (puede sostener un elemento o abrazarse los codos), sin modificar la curvatura natural y liberando la zona a estudiar."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 60, 50), v("Perfil", 60, 60)],
      [v("Frente", 60, 60), v("Perfil", 60, 75)],
      [v("Frente", 75, 60), v("Perfil", 70, 100)],
      [v("Frente", 75, 80), v("Perfil", 75, 100)],
      [v("Frente", 85, 80), v("Perfil", 85, 125)]
    ),
  },
  {
    region: "Columna",
    patologia: "Columna lumbar",
    notas: "Cuidado con elásticos de ropa interior. Todas las posiciones en inspiración. Se ofrecen métodos de apoyo para flexión y extensión.",
    pasos: tecnica(
      "Frente: AP. Perfil: de costado, mirando al técnico si es posible, ancho de caderas en apertura de piernas para estabilidad, a 90° respecto al detector. Máxima flexión: igual que perfil, flexionando la espalda desde la cadera (dar un elemento para sostener o pedir que estire los brazos). Máxima extensión: igual que perfil, inclinando el cuerpo hacia atrás hasta donde sea posible, con los brazos extendidos sosteniendo un elemento. Oblicuas: desde frente, rotación de 45° de todo el cuerpo; se adquiere de ambos lados."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 60, 50), v("Perfil", 60, 60), v("Oblicua", 60, 60), v("Máx. flexión", 60, 60), v("Máx. extensión", 60, 60)],
      [v("Frente", 60, 60), v("Perfil", 60, 75), v("Oblicua", 60, 75), v("Máx. flexión", 60, 75), v("Máx. extensión", 60, 75)],
      [v("Frente", 70, 60), v("Perfil", 70, 80), v("Oblicua", 70, 80), v("Máx. flexión", 70, 80), v("Máx. extensión", 70, 80)],
      [v("Frente", 75, 80), v("Perfil", 75, 100), v("Oblicua", 75, 100), v("Máx. flexión", 75, 100), v("Máx. extensión", 75, 100)],
      [v("Frente", 85, 80), v("Perfil", 85, 125), v("Oblicua", 85, 100), v("Máx. flexión", 85, 125), v("Máx. extensión", 85, 125)]
    ),
  },
  {
    region: "Columna",
    patologia: "Sacro y coxis",
    notas: "Cuidado con elásticos de ropa interior. Todas las posiciones en inspiración.",
    pasos: tecnica(
      "Sacro AP: decúbito supino. Sacro LAT: decúbito lateral, misma posición que columna lumbar perfil (colimar). Coxis AP: decúbito supino. Coxis LAT: decúbito lateral, misma posición que columna lumbar perfil (colimar). Ferguson: decúbito supino, rayo angulado 30°-35° caudo-cefálico, entrando a la altura de las espinas ilíacas (colimar)."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Sacro AP", 60, 45, "10°-15° caudo-cefálico"), v("Sacro lateral", 60, 50, "10°-15° caudo-cefálico"), v("Coxis AP", 60, 45, "10°-15° céfalo-caudal"), v("Coxis lateral", 60, 50, "10°-15° céfalo-caudal"), v("Ferguson", 60, 45, "30°-35° caudo-cefálico")],
      [v("Sacro AP", 60, 60, "10°-15° caudo-cefálico"), v("Sacro lateral", 60, 65, "10°-15° caudo-cefálico"), v("Coxis AP", 60, 60, "10°-15° céfalo-caudal"), v("Coxis lateral", 60, 65, "10°-15° céfalo-caudal"), v("Ferguson", 60, 60, "30°-35° caudo-cefálico")],
      [v("Sacro AP", 70, 60, "10°-15° caudo-cefálico"), v("Sacro lateral", 70, 80, "10°-15° caudo-cefálico"), v("Coxis AP", 70, 60, "10°-15° céfalo-caudal"), v("Coxis lateral", 70, 80, "10°-15° céfalo-caudal"), v("Ferguson", 70, 60, "30°-35° caudo-cefálico")],
      [v("Sacro AP", 75, 80, "10°-15° caudo-cefálico"), v("Sacro lateral", 75, 100, "10°-15° caudo-cefálico"), v("Coxis AP", 75, 80, "10°-15° céfalo-caudal"), v("Coxis lateral", 75, 100, "10°-15° céfalo-caudal"), v("Ferguson", 75, 80, "30°-35° caudo-cefálico")],
      [v("Sacro AP", 85, 80, "10°-15° caudo-cefálico"), v("Sacro lateral", 85, 100, "10°-15° caudo-cefálico"), v("Coxis AP", 85, 80, "10°-15° céfalo-caudal"), v("Coxis lateral", 85, 100, "10°-15° céfalo-caudal"), v("Ferguson", 85, 80, "30°-35° caudo-cefálico")]
    ),
  },
  {
    region: "Columna",
    patologia: "Espinograma y miembros inferiores (MMII)",
    notas: "Cuidado con prótesis dentales de metal, aros a la altura de la columna, gel de pelo y trenzas. Se realiza en inspiración. Informar al paciente que son 3 imágenes consecutivas.",
    pasos: tecnica(
      "Espinograma frente: AP (en pediátricos, PA). Espinograma perfil: de costado, mirando al técnico si es posible, ancho de caderas en apertura de piernas, a 90° respecto al detector. MMII frente: AP (en pediátricos, PA). MMII perfil: igual que espinograma perfil (aporta poca información, casi no se solicita)."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Espinograma frente", 55, 32), v("Espinograma perfil", 55, 32), v("MMII frente", 55, 32), v("MMII perfil", 55, 32)],
      [v("Espinograma frente", 65, 50), v("Espinograma perfil", 65, 50), v("MMII frente", 65, 50), v("MMII perfil", 65, 50)],
      [v("Espinograma frente", 75, 63), v("Espinograma perfil", 75, 80), v("MMII frente", 75, 63), v("MMII perfil", 75, 80)],
      [v("Espinograma frente", 80, 80), v("Espinograma perfil", 80, 100), v("MMII frente", 80, 80), v("MMII perfil", 80, 100)],
      [v("Espinograma frente", 85, 80), v("Espinograma perfil", 85, 125), v("MMII frente", 85, 80), v("MMII perfil", 85, 125)]
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Hombro",
    notas: "Cuidado con prótesis dentales de metal, aros a la altura de la columna, gel de pelo y trenzas.",
    pasos: tecnica(
      "Frente: AP, posición anatómica. Perfil: PA, apoya la mano en el abdomen formando 90° entre brazo y antebrazo, apoyando el hombro de interés en el detector. Rotación interna: desde frente, dorso de la mano sobre la cadera (leve flexión del codo). Rotación externa: desde frente, supinación de la mano (si no está contraindicado) y ligera abducción del brazo. Axial Y/outlet: mano apoyada en el abdomen, posición PA; se localiza la escápula y se tracciona respecto al detector. Axial vuelo pájaro: sentado lateralmente junto a la mesa a 90°, brazo en abducción de 180°, antebrazo apoyado en pronación sobre la mesa, girando y bajando la cabeza hacia el lado contrario. Transtorácica: a 90° respecto al detector, apoya el hombro afectado en el detector y eleva el brazo sano sobre la cabeza, relajando el hombro lesionado; rotar levemente el cuerpo para proyectar la cabeza humeral entre columna y esternón."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 50, 10), v("Perfil", 50, 10), v("Rot. interna", 50, 10), v("Rot. externa", 50, 10), v("Axial Y/outlet", 50, 10, "10° cráneo-caudal"), v("Axial vuelo pájaro", 50, 10), v("Transtorácica", 50, 10, "10°-15° hacia distal")],
      [v("Frente", 55, 10), v("Perfil", 55, 10), v("Rot. interna", 55, 10), v("Rot. externa", 55, 10), v("Axial Y/outlet", 60, 12.5, "10° cráneo-caudal"), v("Axial vuelo pájaro", 60, 12.5), v("Transtorácica", 60, 12.5, "10°-15° hacia distal")],
      [v("Frente", 60, 12.5), v("Perfil", 60, 12.5), v("Rot. interna", 60, 12.5), v("Rot. externa", 60, 12.5), v("Axial Y/outlet", 60, 20, "10° cráneo-caudal"), v("Axial vuelo pájaro", 60, 20), v("Transtorácica", 60, 32, "10°-15° hacia distal")],
      [v("Frente", 60, 20), v("Perfil", 60, 20), v("Rot. interna", 60, 20), v("Rot. externa", 60, 20), v("Axial Y/outlet", 70, 32, "10° cráneo-caudal"), v("Axial vuelo pájaro", 70, 32), v("Transtorácica", 70, 32, "10°-15° hacia distal")],
      [v("Frente", 70, 32), v("Perfil", 70, 32), v("Rot. interna", 70, 32), v("Rot. externa", 70, 32), v("Axial Y/outlet", 75, 40, "10° cráneo-caudal"), v("Axial vuelo pájaro", 70, 40), v("Transtorácica", 80, 40, "10°-15° hacia distal")]
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Brazo (húmero)",
    pasos: tecnica(
      "Frente: AP, separando el brazo con la palma hacia adelante. Perfil: palma de la mano apoyada en el abdomen, posición PA, separando el brazo para liberar la estructura de interés."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 50, 6.3), v("Perfil", 50, 6.3)],
      [v("Frente", 50, 8), v("Perfil", 50, 8)],
      [v("Frente", 50, 10), v("Perfil", 50, 10)],
      [v("Frente", 60, 12.5), v("Perfil", 60, 12.5)],
      [v("Frente", 60, 12.5), v("Perfil", 60, 12.5)]
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Codo",
    pasos: tecnica(
      "Frente: brazo extendido en AP, mano en supinación, sin rotar (colimar). Perfil: codo flexionado 90° entre brazo y antebrazo, apoyando en bloque sobre el detector (el brazo debe descender hasta apoyar en el detector). Oblicua interna: desde frente, se prona la mano hasta 45° respecto al colimador. Oblicua externa: desde frente, se rota el brazo completo hasta 45° (puede necesitar inclinarse)."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 50, 6.3), v("Perfil", 50, 6.3), v("Oblicua interna", 50, 6.3), v("Oblicua externa", 50, 6.3)],
      [v("Frente", 55, 8), v("Perfil", 55, 8), v("Oblicua interna", 55, 8), v("Oblicua externa", 55, 8)],
      [v("Frente", 55, 8), v("Perfil", 55, 8), v("Oblicua interna", 55, 8), v("Oblicua externa", 55, 8)],
      [v("Frente", 60, 10), v("Perfil", 60, 10), v("Oblicua interna", 60, 10), v("Oblicua externa", 60, 10)],
      [v("Frente", 60, 10), v("Perfil", 60, 10), v("Oblicua interna", 60, 10), v("Oblicua externa", 60, 10)]
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Antebrazo",
    notas: "Incluir ambas articulaciones.",
    pasos: tecnica(
      "Frente: brazo estirado, AP al detector. Perfil: codo flexionado 90° entre brazo y antebrazo, apoyando en bloque sobre el detector (debe descender hasta apoyar en el detector para mejor imagen)."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 50, 6.3), v("Perfil", 50, 6.3)],
      [v("Frente", 55, 8), v("Perfil", 55, 8)],
      [v("Frente", 60, 8), v("Perfil", 60, 8)],
      [v("Frente", 64, 10), v("Perfil", 64, 10)],
      [v("Frente", 64, 10), v("Perfil", 64, 10)]
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Muñeca",
    pasos: tecnica(
      "Frente: cierra el puño y flexiona el antebrazo, apoyando toda la muñeca contra el detector. Perfil: desde frente, se rota 90° respecto al detector. Rot. interna: desde frente, se inclina la mano hacia radial. Rot. externa: desde frente, se inclina hacia cubital. 3/4 escafoides: desde frente, se inclina hacia cubital “desplegando el escafoides”. Túnel carpiano: de espaldas al chasis, apoya toda la palma flexionando un poco el antebrazo."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 40, 5), v("Perfil", 40, 5), v("Rot. interna", 40, 5), v("Rot. externa", 40, 5), v("3/4 escafoides", 40, 5), v("Túnel carpiano", 40, 5, "15°-20° céfalo-caudal")],
      [v("Frente", 50, 8), v("Perfil", 50, 8), v("Rot. interna", 50, 8), v("Rot. externa", 50, 8), v("3/4 escafoides", 50, 8), v("Túnel carpiano", 50, 8, "15°-20° céfalo-caudal")],
      [v("Frente", 55, 8), v("Perfil", 55, 8), v("Rot. interna", 55, 8), v("Rot. externa", 55, 8), v("3/4 escafoides", 55, 8), v("Túnel carpiano", 55, 8, "15°-20° céfalo-caudal")],
      [v("Frente", 60, 10), v("Perfil", 60, 10), v("Rot. interna", 60, 10), v("Rot. externa", 60, 10), v("3/4 escafoides", 60, 10), v("Túnel carpiano", 60, 10, "15°-20° céfalo-caudal")],
      [v("Frente", 60, 10), v("Perfil", 60, 10), v("Rot. interna", 60, 10), v("Rot. externa", 60, 10), v("3/4 escafoides", 60, 10), v("Túnel carpiano", 60, 10, "15°-20° céfalo-caudal")]
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Mano",
    pasos: tecnica(
      "Frente: toda la palma apoyada en el chasis con los dedos extendidos, incluyendo el carpo. Perfil: mano de canto sobre el lado cubital, separando levemente el pulgar en abducción. Oblicua: se une pulgar con índice y se apoya la palma en bloque en el chasis, armando imaginariamente un abanico."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 40, 5), v("Perfil", 40, 5), v("Oblicua", 40, 5)],
      [v("Frente", 45, 6.3), v("Perfil", 45, 6.3), v("Oblicua", 45, 6.3)],
      [v("Frente", 45, 6.3), v("Perfil", 45, 6.3), v("Oblicua", 45, 6.3)],
      [v("Frente", 50, 6.3), v("Perfil", 50, 6.3), v("Oblicua", 50, 6.3)],
      [v("Frente", 50, 6.3), v("Perfil", 50, 6.3), v("Oblicua", 50, 6.3)]
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Dedos",
    pasos: tecnica(
      "Frente: palma apoyada separando los dedos, colimando en el dedo de interés. Perfil: se despeja el dedo de interés y se coloca de perfil, sin que descienda, paralelo al detector."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 40, 4), v("Perfil", 40, 4)],
      [v("Frente", 45, 5), v("Perfil", 45, 5)],
      [v("Frente", 45, 5), v("Perfil", 45, 5)],
      [v("Frente", 50, 6.3), v("Perfil", 50, 6.3)],
      [v("Frente", 50, 6.3), v("Perfil", 50, 6.3)]
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Pulgar",
    pasos: tecnica(
      "Frente AP: dorso del pulgar sobre el chasis, pronando toda la mano, todo el pulgar en contacto con el chasis sin girarse. Frente PA: misma modalidad que mano perfil, pulgar paralelo al chasis. Perfil: desde mano frente, se levantan los otros 4 dedos para que el pulgar quede de perfil."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente AP", 40, 4), v("Frente PA", 40, 4), v("Perfil", 40, 4)],
      [v("Frente AP", 40, 5), v("Frente PA", 40, 5), v("Perfil", 40, 5)],
      [v("Frente AP", 45, 5), v("Frente PA", 45, 5), v("Perfil", 45, 5)],
      [v("Frente AP", 50, 6.3), v("Frente PA", 50, 6.3), v("Perfil", 50, 6.3)],
      [v("Frente AP", 50, 6.3), v("Frente PA", 50, 6.3), v("Perfil", 50, 6.3)]
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Pelvis",
    pasos: tecnica(
      "Frente: decúbito dorsal, rotación interna de 15° en ambas piernas (se diferencia de cadera porque incluye crestas ilíacas). Perfil: decúbito dorsal, flexión de 45° entre pierna y cadera a estudiar. Outlet e inlet: misma posición que pelvis frente, variando la angulación del rayo."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 70, 32), v("Perfil", 70, 32), v("Outlet", 70, 32, "45° caudo-cefálico"), v("Inlet", 70, 32, "45° céfalo-caudal")],
      [v("Frente", 70, 40), v("Perfil", 70, 40), v("Outlet", 70, 40, "45° caudo-cefálico"), v("Inlet", 70, 40, "45° céfalo-caudal")],
      [v("Frente", 75, 50), v("Perfil", 75, 50), v("Outlet", 75, 50, "45° caudo-cefálico"), v("Inlet", 75, 50, "45° céfalo-caudal")],
      [v("Frente", 80, 63), v("Perfil", 80, 63), v("Outlet", 80, 63, "45° caudo-cefálico"), v("Inlet", 80, 63, "45° céfalo-caudal")],
      [v("Frente", 90, 80), v("Perfil", 90, 80), v("Outlet", 90, 80, "45° caudo-cefálico"), v("Inlet", 90, 80, "45° céfalo-caudal")]
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Cadera",
    notas: "Cuidado con elásticos de ropa interior.",
    pasos: tecnica(
      "Frente: decúbito supino, rotación interna de 15° en ambas piernas. Perfil/Lowenstein: decúbito supino, piernas flexionadas y abiertas unos 45°. Obturatriz: rotación interna de 45° elevando la cadera de interés. Alar: rotación externa de 45° elevando la cadera contraria. Dunn: decúbito supino, caderas flexionadas a 90°, 20° de abducción y cadera en neutro; la tibia debe quedar paralela al eje del cuerpo, sin unir el eje de los pies."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 70, 32), v("Perfil/Lowenstein", 70, 32), v("Obturatriz", 70, 32, "10° caudo-cefálico"), v("Alar", 70, 32), v("Dunn", 70, 32)],
      [v("Frente", 70, 40), v("Perfil/Lowenstein", 70, 40), v("Obturatriz", 70, 40, "10° caudo-cefálico"), v("Alar", 70, 40), v("Dunn", 70, 40)],
      [v("Frente", 75, 50), v("Perfil/Lowenstein", 75, 50), v("Obturatriz", 75, 50, "10° caudo-cefálico"), v("Alar", 75, 50), v("Dunn", 75, 50)],
      [v("Frente", 80, 63), v("Perfil/Lowenstein", 80, 63), v("Obturatriz", 80, 63, "10° caudo-cefálico"), v("Alar", 80, 63), v("Dunn", 80, 63)],
      [v("Frente", 90, 80), v("Perfil/Lowenstein", 90, 80), v("Obturatriz", 90, 80, "10° caudo-cefálico"), v("Alar", 90, 80), v("Dunn", 90, 80)]
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Fémur",
    notas: "Incluir ambas articulaciones (rodilla y cadera); el perfil se puede hacer por separado para mejor imagen.",
    pasos: tecnica(
      "Frente: decúbito supino, chasis transversal, rotación interna de 15° del fémur de interés. Perfil: decúbito lateral sobre el muslo afectado; para incluir la cadera, girar al paciente unos 15° manteniendo el apoyo, colocar la pierna opuesta detrás de la afectada flexionando su rodilla hasta apoyar el pie en la mesa, y flexionar la rodilla del lado afectado hasta que la rótula quede perpendicular al plano de la mesa."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 50, 12.5), v("Perfil", 50, 12.5)],
      [v("Frente", 50, 12.5), v("Perfil", 50, 12.5)],
      [v("Frente", 50, 16), v("Perfil", 50, 16)],
      [v("Frente", 60, 20), v("Perfil", 60, 20)],
      [v("Frente", 70, 32), v("Perfil", 70, 32)]
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Rodilla",
    notas: "En monopodálicas, explicar bien lo que se va a realizar y recrearlo si es necesario.",
    pasos: tecnica(
      "Frente: decúbito supino, mínima rotación interna de 5°. Perfil: decúbito lateral, flexionando la rodilla de interés a 30°, con la contralateral apoyada arriba en la mesa para estabilidad; chasis transversal. Axiales: decúbito supino, flexión de 120° (60°) entre fémur y tibia, chasis en el muslo. Monopodálica frente: de pie AP al detector sobre un banco, con apoyo, levantando la pierna que no es de interés. Monopodálica perfil: de pie a 90° respecto al detector sobre un banco, con apoyo, levantando la pierna que no es de interés (la rodilla de interés queda más cerca del detector)."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 45, 6.3), v("Perfil", 45, 6.3, "5° caudo-cefálico"), v("Axiales", 50, 8), v("Monopodálica frente", 50, 8), v("Monopodálica perfil", 50, 8)],
      [v("Frente", 50, 8), v("Perfil", 50, 8, "5° caudo-cefálico"), v("Axiales", 60, 10), v("Monopodálica frente", 60, 10), v("Monopodálica perfil", 60, 10)],
      [v("Frente", 50, 8), v("Perfil", 50, 8, "5° caudo-cefálico"), v("Axiales", 60, 10), v("Monopodálica frente", 60, 10), v("Monopodálica perfil", 60, 10)],
      [v("Frente", 60, 10), v("Perfil", 60, 10, "5° caudo-cefálico"), v("Axiales", 70, 12.5), v("Monopodálica frente", 70, 12.5), v("Monopodálica perfil", 70, 12.5)],
      [v("Frente", 60, 10), v("Perfil", 60, 10, "5° caudo-cefálico"), v("Axiales", 70, 12.5), v("Monopodálica frente", 70, 12.5), v("Monopodálica perfil", 70, 12.5)]
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Pierna",
    notas: "Incluir ambas articulaciones.",
    pasos: tecnica(
      "Frente: decúbito supino, chasis transversal. Perfil: decúbito lateral, pierna contralateral por arriba apoyada en la mesa para estabilidad."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 50, 8), v("Perfil", 50, 8)],
      [v("Frente", 54, 10), v("Perfil", 54, 10)],
      [v("Frente", 60, 10), v("Perfil", 60, 10)],
      [v("Frente", 60, 12.5), v("Perfil", 60, 12.5)],
      [v("Frente", 70, 12.5), v("Perfil", 70, 12.5)]
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Tobillo",
    notas: "Cuidado con elásticos de ropa interior.",
    pasos: tecnica(
      "Frente: decúbito supino, flexión dorsal si es posible y una pequeña rotación interna. Perfil: decúbito lateral apoyando el maléolo externo, flexión de 90° del pie si lo tolera. Oblicuo: decúbito supino, rotación interna del pie de 15°-20°. Perfil calcáneo: decúbito lateral apoyando el maléolo externo, flexión de 90° del pie. Axial calcáneo: variante en decúbito ventral dorsiflexionando el pie con una gasa, o de pie de espaldas al tubo flexionando la rodilla."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 45, 6.3), v("Perfil", 45, 6.3), v("Oblicuo", 45, 6.3), v("Axial calcáneo", 50, 8, "40°/20° caudo-cefálico"), v("Perfil calcáneo", 50, 8)],
      [v("Frente", 50, 8), v("Perfil", 50, 8), v("Oblicuo", 50, 8), v("Axial calcáneo", 60, 10, "40°/20° caudo-cefálico"), v("Perfil calcáneo", 50, 8)],
      [v("Frente", 50, 8), v("Perfil", 50, 8), v("Oblicuo", 50, 8), v("Axial calcáneo", 60, 10, "40°/20° caudo-cefálico"), v("Perfil calcáneo", 50, 8)],
      [v("Frente", 60, 10), v("Perfil", 60, 10), v("Oblicuo", 60, 10), v("Axial calcáneo", 70, 12.5, "40°/20° caudo-cefálico"), v("Perfil calcáneo", 60, 10)],
      [v("Frente", 60, 10), v("Perfil", 60, 10), v("Oblicuo", 60, 10), v("Axial calcáneo", 70, 12.5, "40°/20° caudo-cefálico"), v("Perfil calcáneo", 60, 10)]
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Pie",
    notas: "Quitar medias.",
    pasos: tecnica(
      "Frente: decúbito supino, flexión de rodilla apoyando toda la planta sobre el chasis (o de pie, sobre la estructura que protege al chasis). Perfil: variantes en decúbito lateral con flexión del pie de 90°, o de pie. Oblicuo: desde pie frente, rotación interna de 45°. Axial sesamoideos: de espaldas al tubo o en decúbito ventral, con flexión de los dedos del pie."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 40, 2.5, "15° caudo-cefálico"), v("Perfil", 40, 2.5), v("Oblicuo", 40, 2.5), v("Axial sesamoideos", 40, 4)],
      [v("Frente", 40, 4, "15° caudo-cefálico"), v("Perfil", 40, 4), v("Oblicuo", 40, 4), v("Axial sesamoideos", 50, 6.3)],
      [v("Frente", 40, 4, "15° caudo-cefálico"), v("Perfil", 40, 4), v("Oblicuo", 40, 4), v("Axial sesamoideos", 50, 6.3)],
      [v("Frente", 50, 6.3, "15° caudo-cefálico"), v("Perfil", 50, 6.3), v("Oblicuo", 50, 6.3), v("Axial sesamoideos", 50, 10)],
      [v("Frente", 50, 6.3, "15° caudo-cefálico"), v("Perfil", 50, 6.3), v("Oblicuo", 50, 6.3), v("Axial sesamoideos", 50, 10)]
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Pie con carga",
    notas: "Quitar medias. Tener en cuenta la distancia detector-tubo.",
    pasos: tecnica(
      "Frente: de pie sobre un soporte de acrílico, detector bajo el soporte (identificar lado derecho). Perfil: se posiciona el tubo como en un espinograma, con el mismo elemento que en MMII; detector entre las piernas, primero un pie y luego se le indica girar posicionando el pie contrario contra el detector, de cara al tubo."
    ),
    parametrosPorEdad: grupos(
      "Variable",
      [v("Frente", 40, 2.5, "15° caudo-cefálico"), v("Perfil", 40, 2.5)],
      [v("Frente", 40, 4, "15° caudo-cefálico"), v("Perfil", 40, 4)],
      [v("Frente", 50, 6.3, "15° caudo-cefálico"), v("Perfil", 50, 6.3)],
      [v("Frente", 50, 6.3, "15° caudo-cefálico"), v("Perfil", 50, 6.3)],
      [v("Frente", 60, 10, "15° caudo-cefálico"), v("Perfil", 70, 10)]
    ),
  },
  {
    region: "Procedimientos especiales",
    patologia: "Espinograma y medición de MMII — procedimiento en equipo y consola",
    pasos: tecnica(
      "En el equipo: encender el espinógrafo; colocar el tubo de RX coincidente con la camilla (mirar las marcas en ambos ejes); medir al paciente y colimar la zona a irradiar; la luz media del colimador debe coincidir con la mitad del espinógrafo (paso importante, no olvidar). En consola: seleccionar al paciente y cargar imágenes desde STITCHING, eligiendo columna total o miembro inferior según el pedido médico (columna total: frente AP sup/medio/inf y lateral sup/medio/inf; MMII: mismo esquema). En menores de edad o baja estatura puede no usarse la imagen SUP. Posicionarse en AP INF, volver al equipo y presionar 1 para resetear; presionar junto con el 2 la luz del colimador para que el equipo lea la zona a irradiar (hacerlo en conjunto para que la luz no se apague en el proceso); presionar junto con el 3 para posicionar el equipo en el inicio del estudio. Debe encenderse una luz azul y aparecer el cartel “listo” en consola (si no, repetir los pasos). Comienzo del estudio: seleccionar siempre los parámetros de columna lumbar (modificándolos según corresponda) según sea frente o perfil; seleccionar la opción de chasis sobre la mesa (otra opción activa las cámaras y da error); avisar al paciente que serán 3 imágenes para evitar repeticiones; si se pide también lateral, posicionarse en LAT INF y repetir solo el paso de posicionamiento del detector. Edición: grapar (unir) las 3 imágenes verificando que coincidan las estructuras; seleccionar “quick” y editar como cualquier imagen de RX; al enviar al PACS se envían la imagen grapada y las tres que la forman — verificar en PACS que esté enviada y luego borrar las tres sueltas para dejar la entrega correcta del estudio."
    ),
  },
];

function ImportarProtocolosRX() {
  const [estado, setEstado] = useState<"inicial" | "borrando" | "cargando" | "listo" | "error">(
    "inicial"
  );
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [borrados, setBorrados] = useState<number | null>(null);

  async function borrarRxExistentes() {
    setEstado("borrando");
    setError(null);
    try {
      const q = query(collection(db, "protocolos"), where("modalidad", "==", "RX"));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "protocolos", d.id));
      }
      setBorrados(snap.size);
      setEstado("inicial");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al borrar");
      setEstado("error");
    }
  }

  async function importar() {
    setEstado("cargando");
    setProgreso(0);
    setError(null);
    try {
      for (const p of PROTOCOLOS_RX) {
        await addDoc(collection(db, "protocolos"), {
          modalidad: MODALIDAD,
          region: p.region,
          patologia: p.patologia,
          indicacion: p.indicacion ?? null,
          usaContraste: false,
          detalleContraste: null,
          pasos: p.pasos,
          parametrosPorEdad: p.parametrosPorEdad ?? [],
          notas: p.notas ?? null,
          imagenes: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setProgreso((n) => n + 1);
      }
      setEstado("listo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setEstado("error");
    }
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Encabezado />
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-xl">
          <Link href="/admin" className="mb-4 inline-block text-xs text-ink-faint hover:text-ink">
            ← Volver
          </Link>
          <h1 className="mb-2 text-lg font-semibold text-ink">Importar protocolos de RX</h1>
          <p className="mb-4 text-sm text-ink-dim">
            Esto va a crear {PROTOCOLOS_RX.length} protocolos de RX, cada uno con su tabla de kV/mAs
            por franja etaria (bebé, 1-4a, 5-9a, 10-15a, adulto).
          </p>

          <div className="mb-6 rounded border border-alert-dim bg-alert-dim/10 p-4">
            <p className="mb-2 text-sm text-ink">
              Si ya importaste RX antes con el botón viejo, borralos primero para no duplicar.
            </p>
            <button
              onClick={borrarRxExistentes}
              disabled={estado === "borrando"}
              className="rounded border border-alert-dim px-3 py-1.5 text-xs text-alert hover:bg-alert-dim/20 disabled:opacity-50"
            >
              {estado === "borrando" ? "Borrando…" : "Borrar protocolos de RX existentes"}
            </button>
            {borrados !== null && (
              <p className="mt-2 text-xs text-ink-faint">Se borraron {borrados} protocolos de RX.</p>
            )}
          </div>

          {estado === "inicial" && (
            <button
              onClick={importar}
              className="rounded bg-rm-dim px-4 py-2 text-sm font-medium text-ink hover:bg-rm hover:text-bg"
            >
              Importar {PROTOCOLOS_RX.length} protocolos
            </button>
          )}

          {estado === "cargando" && (
            <p className="font-mono text-sm text-ink-faint">
              Cargando {progreso} / {PROTOCOLOS_RX.length}…
            </p>
          )}

          {estado === "listo" && (
            <div className="rounded border border-rx-dim bg-rx-dim/10 p-4">
              <p className="text-sm text-ink">
                Listo, se importaron {PROTOCOLOS_RX.length} protocolos.{" "}
                <Link href="/protocolos" className="text-rm hover:underline">
                  Ir a Protocolos
                </Link>
              </p>
            </div>
          )}

          {estado === "error" && (
            <p className="rounded border border-alert-dim bg-alert-dim/20 px-3 py-2 text-sm text-alert">
              {error}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ImportarProtocolosRXPage() {
  return (
    <RutaProtegida rolRequerido="admin">
      <ImportarProtocolosRX />
    </RutaProtegida>
  );
}
