"use client";

import { useState } from "react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { RutaProtegida } from "@/components/RutaProtegida";
import { Encabezado } from "@/components/Encabezado";
import { db } from "@/lib/firebase/client";
import type { Modalidad, PasoProtocolo } from "@/types/database.types";

interface ProtocoloSemilla {
  region: string;
  patologia: string;
  indicacion?: string;
  usaContraste: boolean;
  detalleContraste?: string;
  notas?: string;
  pasos: PasoProtocolo[];
}

const MODALIDAD: Modalidad = "RX";

const tecnica = (detalle: string): PasoProtocolo[] => [
  { titulo: "Técnica", detalle },
];

const NOTA_PEDIATRICA =
  "Los valores de kV/mAs para pacientes pediátricos (0-12 meses, 1-4a, 5-9a, 10-15a) están en el documento original de Intecnus, que varía según franja etaria.";

const PROTOCOLOS_RX: ProtocoloSemilla[] = [
  {
    region: "Cabeza",
    patologia: "Cráneo (frente, perfil, MNP, FNP, cavum, Towne, Hirtz)",
    usaContraste: false,
    detalleContraste:
      "Distancia paciente-tubo: 1 m. Adulto — kV/mAs: 72/25 (frente AP, frente PA, perfil, MNP, FNP, Towne, Hirtz), 60/30 (cavum). Angulación perpendicular, salvo Towne y Hirtz: 10° caudo-cefálico.",
    notas:
      "Quitar todo elemento metálico y plástico duro, gel de pelo; desarmar trenzas. " + NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente AP: apoya la parte posterior del cráneo, con leve inclinación del mentón hacia abajo. Frente PA: apoya la punta de la nariz sobre el detector. MNP: de frente al detector, apoya nariz y mentón; se le indica abrir la boca despegando la nariz del detector, dejando caer la cabeza hacia atrás sin despegar el mentón. FNP: apoya punta de nariz y frente sobre el detector, luego apoya la frente. Perfil: mirando al técnico, cráneo paralelo al detector y mandíbula paralela al suelo (huesos propios: igual pero focalizado en nariz, colimar). Cavum: igual que perfil, colimando la zona a estudiar. Towne: OM paralela al chasis, de pie o en decúbito dorsal, angulación 30° caudo-cefálico. Hirtz: decúbito supino o sentado, hiperextensión del cuello, cráneo en contacto con el detector y OM paralela al mismo."
    ),
  },
  {
    region: "Tronco",
    patologia: "Tórax",
    usaContraste: false,
    detalleContraste:
      "Distancia tubo-detector: 1,80 m. Adulto — kV/mAs: 115/3,2 (frente), 115/4 (perfil). Angulación perpendicular.",
    notas:
      "AP sentado (silla de ruedas): detector entre espalda y respaldo, angulación caudal de 10°. AP en decúbito: detector entre espalda y camilla, RC perpendicular al detector. " +
      NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: apoyando el pecho sobre el detector, manos a la cadera y codos hacia adelante, relajando hombros (intentar que ambos apoyen en el detector); RC a nivel escapular. Perfil: siempre izquierdo salvo indicación contraria; detector vertical, eleva los brazos o lleva las manos a la cabeza juntando los codos (alternativas: sujetar un elemento vertical con brazos extendidos, o cruzar los brazos sujetando los codos y elevarlos). Detector horizontal salvo pacientes muy altos y delgados (vertical)."
    ),
  },
  {
    region: "Tronco",
    patologia: "Parrilla costal",
    usaContraste: false,
    detalleContraste: "Distancia: 1,80 m. Adulto — kV/mAs: 90/32 (frente y oblicua). Angulación perpendicular.",
    notas: NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente PA: igual que un tórax frente; si se piden ambos lados, se repite modificando parámetros en consola; para un solo lado, centrar la parrilla de interés en el medio del detector. Oblicuo: desde una posición inicial PA, apoya la parrilla que no es objeto de estudio contra el detector y coloca el miembro superior contralateral sobre la cabeza; despegando el tórax con un ángulo imaginario de 45°, las costillas se despliegan."
    ),
  },
  {
    region: "Tronco",
    patologia: "Esternón",
    usaContraste: false,
    detalleContraste: "Distancia: 1 m. Adulto — kV/mAs: 90/32 (frente y perfil). Angulación perpendicular.",
    notas: NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: de pie, brazo derecho al lado del cuerpo y brazo izquierdo hacia arriba, formando un ángulo imaginario de 15-20° con el detector (parte derecha elevada). Perfil: a 90° respecto al detector, de ser posible con las manos atrás del cuerpo para elevar el tórax, hombros y brazos hacia atrás; colimar para focalizar la región."
    ),
  },
  {
    region: "Tronco",
    patologia: "Clavícula",
    usaContraste: false,
    detalleContraste:
      "Adulto — kV/mAs: 70/32 (frente y descentrada de vértice). Angulación descentrada: céfalo-caudal 15°-30°.",
    notas:
      "Para imagen comparativa, ambas clavículas en la misma placa (aumentando la distancia del tubo). Una sola imagen debe incluir ambas articulaciones (acromion y esternón). Cuidado con elásticos de ropa interior. " +
      NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: antero al tubo apoyando la espalda en el detector, centrar la clavícula a estudiar y colimar. Descentrada de vértice: misma posición que frente, con angulación del tubo céfalo-caudal de 15° a 30°."
    ),
  },
  {
    region: "Tronco",
    patologia: "Abdomen",
    usaContraste: false,
    detalleContraste: "Adulto — kV/mAs: 90/80 (frente y perfil).",
    notas:
      "La imagen debe incluir la pelvis; en pacientes de grandes dimensiones, leer el diagnóstico para evaluar la zona a abarcar. Siempre que sea posible, de pie para ver niveles. Todas las posiciones en inspiración. " +
      NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente AP de pie: brazos al costado del cuerpo; la imagen se toma del hígado hacia abajo, usando de referencia el chasis vertical desde las axilas. Frente AP en decúbito: igual que de pie, pero en decúbito supino. Perfil de pie: perpendicular al detector, con los brazos elevados; de ser posible, el tubo se ubica a un costado del paciente y el chasis del otro."
    ),
  },
  {
    region: "Columna",
    patologia: "Columna cervical – cuello",
    usaContraste: false,
    detalleContraste:
      "Adulto — kV/mAs: 72/40 (todas las posiciones). Angulación: frente 15°-30° caudo-cefálico, resto perpendicular.",
    notas:
      "Cuidado con prótesis dentales de metal. Se ofrecen métodos de apoyo para las dinámicas de flexión y extensión. " +
      NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: AP al tubo con angulación de 15° cráneo-caudal. Perfil: de costado, mirando al técnico si es posible, a 90° respecto al detector, mandíbulas simétricas. Máxima flexión: igual que perfil, acercando el mentón al pecho. Máxima extensión: igual que perfil, inclinando la cabeza hacia atrás hasta donde pueda. Oblicuas: desde frente, rotación de 45° de todo el cuerpo; se adquiere de ambos lados (izquierda y derecha). Transoral: desde cervical frente, tubo perpendicular, se le pide abrir la boca y fonar “AAAAA” para desproyectar la lengua."
    ),
  },
  {
    region: "Columna",
    patologia: "Columna dorsal",
    usaContraste: false,
    detalleContraste: "Adulto — kV/mAs: 85/80 (frente), 85/125 (perfil). Angulación perpendicular.",
    notas: "Cuidado con elásticos de ropa interior. Todas las posiciones en inspiración. " + NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: AP, apoyando la espalda en el detector, mirando al frente. Perfil: de costado, mirando al técnico si es posible, a 90° respecto al Potter, brazos elevados (puede sostener un elemento o abrazarse los codos), sin modificar la curvatura natural y liberando la zona a estudiar."
    ),
  },
  {
    region: "Columna",
    patologia: "Columna lumbar",
    usaContraste: false,
    detalleContraste:
      "Adulto — kV/mAs: 85/80 (frente), 85/125 (perfil), 85/100 (oblicua), 85/125 (máx. flexión y máx. extensión).",
    notas:
      "Cuidado con elásticos de ropa interior. Todas las posiciones en inspiración. Se ofrecen métodos de apoyo para flexión y extensión. " +
      NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: AP. Perfil: de costado, mirando al técnico si es posible, ancho de caderas en apertura de piernas para estabilidad, a 90° respecto al detector. Máxima flexión: igual que perfil, flexionando la espalda desde la cadera (dar un elemento para sostener o pedir que estire los brazos). Máxima extensión: igual que perfil, inclinando el cuerpo hacia atrás hasta donde sea posible, con los brazos extendidos sosteniendo un elemento. Oblicuas: desde frente, rotación de 45° de todo el cuerpo; se adquiere de ambos lados."
    ),
  },
  {
    region: "Columna",
    patologia: "Sacro y coxis",
    usaContraste: false,
    detalleContraste:
      "Adulto — kV/mAs: 85/80 (sacro AP), 85/100 (sacro LAT), 85/80 (coxis AP), 85/100 (coxis LAT), 85/80 (Ferguson). Angulación: sacro 10°-15° caudo-cefálico, coxis 10°-15° céfalo-caudal, Ferguson 30°-35° caudo-cefálico.",
    notas: "Cuidado con elásticos de ropa interior. Todas las posiciones en inspiración. " + NOTA_PEDIATRICA,
    pasos: tecnica(
      "Sacro AP: decúbito supino. Sacro LAT: decúbito lateral, misma posición que columna lumbar perfil (colimar). Coxis AP: decúbito supino. Coxis LAT: decúbito lateral, misma posición que columna lumbar perfil (colimar). Ferguson: decúbito supino, rayo angulado 30°-35° caudo-cefálico, entrando a la altura de las espinas ilíacas (colimar)."
    ),
  },
  {
    region: "Columna",
    patologia: "Espinograma y miembros inferiores (MMII)",
    usaContraste: false,
    detalleContraste: "Adulto — kV/mAs: 85/80 (frente), 85/125 (perfil), igual para MMII.",
    notas:
      "Cuidado con prótesis dentales de metal, aros a la altura de la columna, gel de pelo y trenzas. Se realiza en inspiración. Informar al paciente que son 3 imágenes consecutivas. " +
      NOTA_PEDIATRICA,
    pasos: tecnica(
      "Espinograma frente: AP (en pediátricos, PA). Espinograma perfil: de costado, mirando al técnico si es posible, ancho de caderas en apertura de piernas, a 90° respecto al detector. MMII frente: AP (en pediátricos, PA). MMII perfil: igual que espinograma perfil (aporta poca información, casi no se solicita)."
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Hombro",
    usaContraste: false,
    detalleContraste:
      "Adulto — kV/mAs: 70/32 (frente, perfil, rot. interna, rot. externa), 75/40 (axial Y/outlet), 70/40 (axial vuelo pájaro), 80/40 (transtorácica). Angulación: axial Y/outlet 10° cráneo-caudal; transtorácica 10°-15° hacia distal.",
    notas: "Cuidado con prótesis dentales de metal, aros a la altura de la columna, gel de pelo y trenzas. " + NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: AP, posición anatómica. Perfil: PA, apoya la mano en el abdomen formando 90° entre brazo y antebrazo, apoyando el hombro de interés en el detector. Rotación interna: desde frente, dorso de la mano sobre la cadera (leve flexión del codo). Rotación externa: desde frente, supinación de la mano (si no está contraindicado) y ligera abducción del brazo. Axial Y/outlet: mano apoyada en el abdomen, posición PA; se localiza la escápula y se tracciona respecto al detector. Axial vuelo pájaro: sentado lateralmente junto a la mesa a 90°, brazo en abducción de 180°, antebrazo apoyado en pronación sobre la mesa, girando y bajando la cabeza hacia el lado contrario. Transtorácica: a 90° respecto al detector, apoya el hombro afectado en el detector y eleva el brazo sano sobre la cabeza, relajando el hombro lesionado; rotar levemente el cuerpo para proyectar la cabeza humeral entre columna y esternón."
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Brazo (húmero)",
    usaContraste: false,
    detalleContraste: "Adulto — kV/mAs: 60/12,5 (frente y perfil).",
    notas: NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: AP, separando el brazo con la palma hacia adelante. Perfil: palma de la mano apoyada en el abdomen, posición PA, separando el brazo para liberar la estructura de interés."
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Codo",
    usaContraste: false,
    detalleContraste: "Adulto — kV/mAs: 60/10 (frente, perfil y oblicuas).",
    notas: NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: brazo extendido en AP, mano en supinación, sin rotar (colimar). Perfil: codo flexionado 90° entre brazo y antebrazo, apoyando en bloque sobre el detector (el brazo debe descender hasta apoyar en el detector). Oblicua interna: desde frente, se prona la mano hasta 45° respecto al colimador. Oblicua externa: desde frente, se rota el brazo completo hasta 45° (puede necesitar inclinarse)."
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Antebrazo",
    usaContraste: false,
    detalleContraste: "Adulto — kV/mAs: 64/10 (frente y perfil).",
    notas: "Incluir ambas articulaciones. " + NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: brazo estirado, AP al detector. Perfil: codo flexionado 90° entre brazo y antebrazo, apoyando en bloque sobre el detector (debe descender hasta apoyar en el detector para mejor imagen)."
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Muñeca",
    usaContraste: false,
    detalleContraste:
      "Adulto — kV/mAs: 60/10 (todas las posiciones). Angulación: túnel carpiano 15°-20° céfalo-caudal, resto perpendicular.",
    notas: NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: cierra el puño y flexiona el antebrazo, apoyando toda la muñeca contra el detector. Perfil: desde frente, se rota 90° respecto al detector. Rot. interna: desde frente, se inclina la mano hacia radial. Rot. externa: desde frente, se inclina hacia cubital. 3/4 escafoides: desde frente, se inclina hacia cubital “desplegando el escafoides”. Túnel carpiano: de espaldas al chasis, apoya toda la palma flexionando un poco el antebrazo."
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Mano",
    usaContraste: false,
    detalleContraste: "Adulto — kV/mAs: 50/6,3 (frente, perfil y oblicua).",
    notas: NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: toda la palma apoyada en el chasis con los dedos extendidos, incluyendo el carpo. Perfil: mano de canto sobre el lado cubital, separando levemente el pulgar en abducción. Oblicua: se une pulgar con índice y se apoya la palma en bloque en el chasis, armando imaginariamente un abanico."
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Dedos",
    usaContraste: false,
    detalleContraste: "Adulto — kV/mAs: 50/6,3 (frente y perfil).",
    notas: NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: palma apoyada separando los dedos, colimando en el dedo de interés. Perfil: se despeja el dedo de interés y se coloca de perfil, sin que descienda, paralelo al detector."
    ),
  },
  {
    region: "Miembros superiores",
    patologia: "Pulgar",
    usaContraste: false,
    detalleContraste: "Adulto — kV/mAs: 50/6,3 (frente AP, frente PA y perfil).",
    notas: NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente AP: dorso del pulgar sobre el chasis, pronando toda la mano, todo el pulgar en contacto con el chasis sin girarse. Frente PA: misma modalidad que mano perfil, pulgar paralelo al chasis. Perfil: desde mano frente, se levantan los otros 4 dedos para que el pulgar quede de perfil."
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Pelvis",
    usaContraste: false,
    detalleContraste:
      "Adulto — kV/mAs: 90/80 (todas). Angulación: outlet 45° caudo-cefálico, inlet 45° céfalo-caudal.",
    notas: NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: decúbito dorsal, rotación interna de 15° en ambas piernas (se diferencia de cadera porque incluye crestas ilíacas). Perfil: decúbito dorsal, flexión de 45° entre pierna y cadera a estudiar. Outlet e inlet: misma posición que pelvis frente, variando la angulación del rayo."
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Cadera",
    usaContraste: false,
    detalleContraste:
      "Adulto — kV/mAs: 90/80 (todas). Angulación: obturatriz 10° caudo-cefálico, resto perpendicular.",
    notas: "Cuidado con elásticos de ropa interior. " + NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: decúbito supino, rotación interna de 15° en ambas piernas. Perfil/Lowenstein: decúbito supino, piernas flexionadas y abiertas unos 45°. Obturatriz: rotación interna de 45° elevando la cadera de interés. Alar: rotación externa de 45° elevando la cadera contraria. Dunn: decúbito supino, caderas flexionadas a 90°, 20° de abducción y cadera en neutro; la tibia debe quedar paralela al eje del cuerpo, sin unir el eje de los pies."
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Fémur",
    usaContraste: false,
    detalleContraste: "Adulto — kV/mAs: 70/32 (frente y perfil).",
    notas: "Incluir ambas articulaciones (rodilla y cadera); el perfil se puede hacer por separado para mejor imagen. " + NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: decúbito supino, chasis transversal, rotación interna de 15° del fémur de interés. Perfil: decúbito lateral sobre el muslo afectado; para incluir la cadera, girar al paciente unos 15° manteniendo el apoyo, colocar la pierna opuesta detrás de la afectada flexionando su rodilla hasta apoyar el pie en la mesa, y flexionar la rodilla del lado afectado hasta que la rótula quede perpendicular al plano de la mesa."
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Rodilla",
    usaContraste: false,
    detalleContraste:
      "Adulto — kV/mAs: 60/10 (frente y perfil), 70/12,5 (axiales y monopodálica frente/perfil). Angulación frente: 5° caudo-cefálico.",
    notas: "En monopodálicas, explicar bien lo que se va a realizar y recrearlo si es necesario. " + NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: decúbito supino, mínima rotación interna de 5°. Perfil: decúbito lateral, flexionando la rodilla de interés a 30°, con la contralateral apoyada arriba en la mesa para estabilidad; chasis transversal. Axiales: decúbito supino, flexión de 120° (60°) entre fémur y tibia, chasis en el muslo. Monopodálica frente: de pie AP al detector sobre un banco, con apoyo, levantando la pierna que no es de interés. Monopodálica perfil: de pie a 90° respecto al detector sobre un banco, con apoyo, levantando la pierna que no es de interés (la rodilla de interés queda más cerca del detector)."
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Pierna",
    usaContraste: false,
    detalleContraste: "Adulto — kV/mAs: 70/12,5 (frente y perfil).",
    notas: "Incluir ambas articulaciones. " + NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: decúbito supino, chasis transversal. Perfil: decúbito lateral, pierna contralateral por arriba apoyada en la mesa para estabilidad."
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Tobillo",
    usaContraste: false,
    detalleContraste:
      "Adulto — kV/mAs: 60/10 (frente, perfil, oblicuo, perfil calcáneo), 70/12,5 (axial calcáneo). Angulación axial calcáneo: 40° caudo-cefálico en decúbito ventral, o 20° de pie.",
    notas: "Cuidado con elásticos de ropa interior. " + NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: decúbito supino, flexión dorsal si es posible y una pequeña rotación interna. Perfil: decúbito lateral apoyando el maléolo externo, flexión de 90° del pie si lo tolera. Oblicuo: decúbito supino, rotación interna del pie de 15°-20°. Perfil calcáneo: decúbito lateral apoyando el maléolo externo, flexión de 90° del pie. Axial calcáneo: variante en decúbito ventral dorsiflexionando el pie con una gasa, o de pie de espaldas al tubo flexionando la rodilla."
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Pie",
    usaContraste: false,
    detalleContraste:
      "Adulto — kV/mAs: 50/6,3 (frente, perfil, oblicuo), 50/10 (axial sesamoideos). Angulación frente: 15° caudo-cefálico.",
    notas: "Quitar medias. " + NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: decúbito supino, flexión de rodilla apoyando toda la planta sobre el chasis (o de pie, sobre la estructura que protege al chasis). Perfil: variantes en decúbito lateral con flexión del pie de 90°, o de pie. Oblicuo: desde pie frente, rotación interna de 45°. Axial sesamoideos: de espaldas al tubo o en decúbito ventral, con flexión de los dedos del pie."
    ),
  },
  {
    region: "Miembros inferiores",
    patologia: "Pie con carga",
    usaContraste: false,
    detalleContraste: "Adulto — kV/mAs: 60/10 (frente), 70/10 (perfil). Angulación frente: 15° caudo-cefálico.",
    notas: "Quitar medias. Tener en cuenta la distancia detector-tubo. " + NOTA_PEDIATRICA,
    pasos: tecnica(
      "Frente: de pie sobre un soporte de acrílico, detector bajo el soporte (identificar lado derecho). Perfil: se posiciona el tubo como en un espinograma, con el mismo elemento que en MMII; detector entre las piernas, primero un pie y luego se le indica girar posicionando el pie contrario contra el detector, de cara al tubo."
    ),
  },
  {
    region: "Procedimientos especiales",
    patologia: "Espinograma y medición de MMII — procedimiento en equipo y consola",
    usaContraste: false,
    pasos: tecnica(
      "En el equipo: encender el espinógrafo; colocar el tubo de RX coincidente con la camilla (mirar las marcas en ambos ejes); medir al paciente y colimar la zona a irradiar; la luz media del colimador debe coincidir con la mitad del espinógrafo (paso importante, no olvidar). En consola: seleccionar al paciente y cargar imágenes desde STITCHING, eligiendo columna total o miembro inferior según el pedido médico (columna total: frente AP sup/medio/inf y lateral sup/medio/inf; MMII: mismo esquema). En menores de edad o baja estatura puede no usarse la imagen SUP. Posicionarse en AP INF, volver al equipo y presionar 1 para resetear; presionar junto con el 2 la luz del colimador para que el equipo lea la zona a irradiar (hacerlo en conjunto para que la luz no se apague en el proceso); presionar junto con el 3 para posicionar el equipo en el inicio del estudio. Debe encenderse una luz azul y aparecer el cartel “listo” en consola (si no, repetir los pasos). Comienzo del estudio: seleccionar siempre los parámetros de columna lumbar (modificándolos según corresponda) según sea frente o perfil; seleccionar la opción de chasis sobre la mesa (otra opción activa las cámaras y da error); avisar al paciente que serán 3 imágenes para evitar repeticiones; si se pide también lateral, posicionarse en LAT INF y repetir solo el paso de posicionamiento del detector. Edición: grapar (unir) las 3 imágenes verificando que coincidan las estructuras; seleccionar “quick” y editar como cualquier imagen de RX; al enviar al PACS se envían la imagen grapada y las tres que la forman — verificar en PACS que esté enviada y luego borrar las tres sueltas para dejar la entrega correcta del estudio."
    ),
  },
];

function ImportarProtocolosRX() {
  const [estado, setEstado] = useState<"inicial" | "cargando" | "listo" | "error">("inicial");
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
          usaContraste: p.usaContraste,
          detalleContraste: p.detalleContraste ?? null,
          pasos: p.pasos,
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
          <p className="mb-6 text-sm text-ink-dim">
            Esto va a crear {PROTOCOLOS_RX.length} protocolos de RX en la base de datos, tomados del
            documento de Intecnus. Usalo una sola vez — si lo corrés dos veces, va a duplicar todo.
          </p>

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
