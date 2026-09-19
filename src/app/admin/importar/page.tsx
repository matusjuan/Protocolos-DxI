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

const MODALIDAD: Modalidad = "TC";

const tecnica = (detalle: string): PasoProtocolo[] => [
  { titulo: "Técnica", detalle },
];

const PROTOCOLOS_TC: ProtocoloSemilla[] = [
  {
    region: "Tórax",
    patologia: "TC de tórax con contraste endovenoso",
    usaContraste: true,
    detalleContraste: "Inyectar a 2 ml/seg y adquirir a los 65 seg, de arriba hacia abajo.",
    pasos: tecnica(
      "No hacer adquisiciones sin contraste endovenoso. Inyectar a 2 ml/seg y adquirir a los 65 segundos, de arriba hacia abajo."
    ),
  },
  {
    region: "Tórax",
    patologia: "TC de tórax en espiración",
    usaContraste: false,
    indicacion:
      "Asma. Presencia de patrón en mosaico en la TC en inspiración. Diagnóstico de traqueomalacia, estenosis de vías aéreas principales o enfermedad traqueobronquial. Síntomas de disnea y sibilancias, o disnea en paciente con antecedentes de intubación, cirugías o enfermedades traqueobronquiales, o posterior a traumatismo severo de tórax. Disociación entre la disnea y las imágenes. Patrón intersticial fibrosante con sospecha de hipersensibilidad crónica.",
    pasos: tecnica(
      "Siempre se hace después de una adquisición en inspiración. Si se solicita, hacer en decúbito prono. Adquisición de todo el tórax con baja dosis, 50 a 80 mAs dependiendo del peso, y 100 kV. Paciente obeso: 100 mAs y 120 kV. Explicar al paciente personalmente cómo realizar la espiración (inspiración profunda y luego largar todo el aire de golpe hasta la máxima espiración, manteniendo hasta el final de la adquisición). Si la espiración no es completa y sostenida, no sirve."
    ),
  },
  {
    region: "Tórax",
    patologia: "TC de tórax baja dosis",
    usaContraste: false,
    indicacion:
      "Adquisiciones solicitadas en espiración. Screening de cáncer de pulmón. Seguimiento de nódulo pulmonar o intersticio cuando lo solicitan con baja dosis.",
    pasos: tecnica(
      "Adquisición de todo el tórax con 50 a 80 mAs (dependiente del peso) y 100 kV. Paciente obeso: 100 mAs y 120 kV."
    ),
  },
  {
    region: "Abdomen y pelvis",
    patologia: "TC de abdomen y pelvis sin contraste endovenoso",
    usaContraste: false,
    pasos: tecnica(
      "Siempre va con contraste oral negativo, excepto indicación contraria. Dar el contraste oral antes del estudio, de ser posible agua fría y con tiempo suficiente para su distribución en el intestino. En excepciones con contraste oral positivo, delay de 40 a 60 minutos para que llegue hasta colon distal-recto. Antes de acostar al paciente, dar 2 o 3 vasos más de contraste para distender el estómago."
    ),
  },
  {
    region: "Abdomen y pelvis",
    patologia: "TC de abdomen y pelvis por urolitiasis",
    usaContraste: false,
    pasos: tecnica(
      "Se hace sin contraste oral ni endovenoso. Tratar de que el paciente tenga retención de orina para distender la vejiga; indicarle que no vaya al baño a orinar."
    ),
  },
  {
    region: "Abdomen y pelvis",
    patologia: "TC de abdomen y pelvis con contraste endovenoso",
    usaContraste: true,
    detalleContraste: "Inyectar a 2 ml/seg y adquirir a los 70 segundos (tiempo portal).",
    pasos: tecnica(
      "No dar contraste oral positivo, sí dar agua, 30 a 40 min antes del estudio. Antes de acostar al paciente, dar 2 o 3 vasos más de agua. Adquisición sin contraste endovenoso solo en abdomen superior (menor dosis). Si es el primer estudio del paciente, hacer sin contraste hasta pubis."
    ),
  },
  {
    region: "Abdomen y pelvis",
    patologia: "TC de hígado con contraste EV (trifásico)",
    usaContraste: true,
    detalleContraste:
      "Inyectar a 4 ml/seg (ideal) y adquirir a los 30 seg. Dosis de contraste EV 1,5 ml/kg de 350 o 370, alta concentración.",
    indicacion:
      "Estudio trifásico o dinámico de hígado (si tiene previo, evaluar en qué fase se ve mejor la lesión y repetir esa fase). Evaluar imagen focal hepática. Evaluar metástasis hepáticas de carcinoide, melanoma, cáncer de tiroides, mama o tumores neuroendocrinos: hacer sí o sí fase arterial.",
    pasos: tecnica(
      "No dar contraste oral positivo, sí dar agua, 30 a 40 min antes del estudio. Adquisición sin contraste EV solo en hígado. Adquisición con contraste EV en fase arterial tardía o tisular (30 seg) solo en hígado. Adquisición en fase portal (70 seg) de todo el abdomen y pelvis. Evaluar necesidad de cortes tardíos entre los 3 y 5 minutos, solo si es necesario."
    ),
  },
  {
    region: "Abdomen y pelvis",
    patologia: "TC de páncreas con contraste EV",
    usaContraste: true,
    detalleContraste: "Inyectar a 4 ml/seg (ideal) y adquirir a los 30 seg. Dosis 1,5 ml/kg de 350 o 370.",
    pasos: tecnica(
      "No dar contraste oral positivo, sí dar agua, 30 a 40 min antes del estudio. Adquisición sin contraste EV solo en abdomen. Adquisición con contraste EV en fase pancreática (40 seg) solo en páncreas. Adquisición en fase portal (70 seg) de todo el abdomen y pelvis. Adquisición en fase venosa tardía (3 a 5 min) de abdomen superior. Si es por tumor hipervascular o funcional (carcinoide, insulinoma, glucagonoma, neuroendocrino), hacer fase arterial (30 seg) en vez de pancreática."
    ),
  },
  {
    region: "Abdomen y pelvis",
    patologia: "TC de riñones con contraste EV",
    usaContraste: true,
    indicacion: "Lesiones renales focales (tumores, quistes, etc.).",
    pasos: tecnica(
      "No dar contraste oral positivo, sí dar agua, 30 a 40 min antes del estudio. Tratar de que el paciente tenga retención de orina. Adquisición sin contraste endovenoso solo en abdomen. Adquisición angiotomográfica (bolus track) solo en los riñones. Adquisición en fase portal (70 seg) de todo el abdomen y pelvis. Evaluar cortes tardíos entre 3 y 5 minutos (necesario en primer estudio; en controles, no hacer salvo caso particular)."
    ),
  },
  {
    region: "Abdomen y pelvis",
    patologia: "TC para evaluar sistema excretor / hematuria",
    usaContraste: true,
    indicacion:
      "Evaluar sistema ureteropielocalicial por doble sistema o prequirúrgico de pelvis. Reconstrucción 3D de árbol urinario. El pedido de urotomografía no siempre implica hacer uroexcresión.",
    pasos: tecnica(
      "No dar contraste oral positivo, sí dar agua, 30 a 40 min antes. Retención de orina para distender la vejiga. Considerar vía con solución salina a goteo rápido (300-400 ml) o 1 litro de agua antes del estudio. Adquisición sin contraste endovenoso en riñones hasta pubis. Adquisición en fase arterial + portal (70 seg) de riñones hasta pubis. Adquisición en uroexcresión a los 7-10 minutos (no antes), desde riñones hasta sínfisis pubiana. Ante estenosis ureteral, evaluar decúbito prono para esta adquisición."
    ),
  },
  {
    region: "Abdomen y pelvis",
    patologia: "TC de glándulas suprarrenales con contraste EV",
    usaContraste: true,
    pasos: tecnica(
      "No dar contraste oral positivo, sí dar agua, 30 a 40 min antes. Adquisición sin contraste endovenoso solo en abdomen superior. Adquisición en fase portal (70 seg) de todo el abdomen superior. No se efectúa fase de washout."
    ),
  },
  {
    region: "Abdomen y pelvis",
    patologia: "Hidrotomografía",
    usaContraste: true,
    indicacion: "Tumores esofágicos, cardias, gástricos o duodenales y otras patologías de la región.",
    pasos: tecnica(
      "No dar contraste oral positivo, sí dar agua, 30 a 40 min antes. Hidrotomografía de estómago: dar 3 o 4 vasos más de agua antes de acostar. Hidrotomografía de esófago: dar un vaso de agua con el paciente acostado (bombilla), comenzando a los 45 seg de iniciada la inyección de contraste EV, tragos grandes y seguidos, retirándose a los 60 seg. Administrar 1-2 ampollas de buscapina. Adquisición sin contraste endovenoso solo en abdomen. Adquisición en fase portal (70 seg) de todo el abdomen y pelvis. Dosis de contraste EV similar a la enterotomografía: 1,5 ml/kg de 350 o 370."
    ),
  },
  {
    region: "Abdomen y pelvis",
    patologia: "EnteroTC con manitol",
    usaContraste: true,
    notas:
      "Explicarle al paciente que debe tomar todo el contraste oral rápido, que se le inyectará buscapina, y que después del estudio va a tener diarrea porque el líquido ingerido no se absorbe.",
    pasos: tecnica(
      "Preparación oral negativo: manitol 15% (500 ml) diluido en 1 litro de agua bien fría, con 1 jugo Tang. Dilución total 1,5 litros, a tomar en 30 minutos rápido y constante, dejando 2 vasos para antes de la adquisición. Corte scan-scan con baja técnica (30 mAs) a nivel cecal para verificar llegada del contraste. Si llegó al ciego, colocar 1 buscapina IM o IV. Adquisición sin contraste EV de abdomen y pelvis. Adquisición en fase entérica (50 seg), inyectando a 4 ml/seg. Adquisición en fase portal (70 seg) de todo el abdomen y pelvis. En Crohn reagudizado, solo fase entérica sin fase portal. Buena carga de iodo: 1,5 ml/kg de 350 o 370."
    ),
  },
  {
    region: "Abdomen y pelvis",
    patologia: "EnteroTC con polietilenglicol",
    usaContraste: false,
    pasos: tecnica(
      "Preparación oral negativo: diluir 200 mg de polietilenglicol 4000 en 2 litros de agua (primero en 500 ml tibia, revolver, completar con 1,5 litros bien fría con hielo). Dilución total 2 litros, con 2 jugos Tang. No usar más cantidad que esta."
    ),
  },
  {
    region: "Abdomen y pelvis",
    patologia: "Colonoscopía virtual",
    usaContraste: false,
    notas:
      "Si el paciente refiere dolor, interrumpir el pasaje de aire; si cede, continuar hasta sentir en fosa ilíaca derecha el reborboteo de aire. Si no cede, hacer adquisición para chequear posible perforación colónica.",
    pasos: tecnica(
      "Explicar la preparación: dieta, fosfo-soda kit y los 3 frascos con dilución de bario. Deposición antes del estudio. Vaciar sachet de Gastropaque, rellenar de aire y armar la cánula con introductor rectal (chequear clamp del catéter). Colocar cánula rectal con lidocaína gel, decúbito lateral, llenado despacio y continuo. Vaciar 1 sachet, rellenar de aire, decúbito supino, continuar pasaje de aire. Si hay incontinencia, usar sonda balón. Primera adquisición en decúbito supino (valorar con scout mayor insuflación). Segunda adquisición en decúbito prono o lateral si no tolera el decúbito; si es continente y la supina fue adecuada, retirar la cánula (ante duda de continencia, no retirar)."
    ),
  },
  {
    region: "Osteoarticular pediátrico",
    patologia: "TC osteoarticular pediátrico",
    usaContraste: false,
    pasos: tecnica(
      "Pacientes menores de 18 años que solicitan tomografía de pies, tobillo, miembro inferior o cadera: adquisición de ambas articulaciones, reconstruir con filtro óseo ambas articulaciones y la pedida, y con filtro de partes blandas solo la articulación solicitada."
    ),
  },
  {
    region: "Cráneo y encéfalo",
    patologia: "TC de cerebro con contraste endovenoso",
    usaContraste: true,
    detalleContraste: "Adquisición con contraste EV recién a los 3-5 minutos. Inyectar solo 50 ml de contraste.",
    pasos: tecnica(
      "Adquisición sin contraste endovenoso del encéfalo. Realizar adquisición con contraste EV recién a los 3 a 5 minutos, inyectando solo 50 ml."
    ),
  },
  {
    region: "Cuello, laringe y órbitas",
    patologia: "TC de cuello con contraste EV",
    usaContraste: true,
    detalleContraste: "Inyectar 90 ml de contraste a 2 ml/seg, comenzando la adquisición a los 60 segundos.",
    pasos: tecnica(
      "No realizar adquisición sin contraste EV. Adquirir de arriba hacia abajo, desde línea orbito-meatal hasta el cayado de la aorta."
    ),
  },
  {
    region: "Cuello, laringe y órbitas",
    patologia: "TC de laringe sin contraste EV",
    usaContraste: false,
    pasos: tecnica(
      "Adquirir desde línea orbito-meatal hasta el cayado de la aorta. Hacer cortes en fonación solo en las cuerdas vocales. Explicar personalmente al paciente cómo fonar (inspiración profunda y fonar la letra \"e\" en voz baja y sostenida durante toda la adquisición)."
    ),
  },
  {
    region: "Cuello, laringe y órbitas",
    patologia: "TC de órbitas con contraste EV",
    usaContraste: true,
    detalleContraste: "Inyectar 90 ml de contraste a 2 ml/seg, comenzando la adquisición a los 60 segundos.",
    pasos: tecnica("No realizar adquisición sin contraste EV."),
  },
  {
    region: "Múltiples regiones",
    patologia: "TC de tórax, abdomen y pelvis con contraste EV",
    usaContraste: true,
    detalleContraste:
      "Inyectar a 2 ml/seg y adquirir a los 65 segundos, desde el tórax hasta la pelvis, en una sola adquisición.",
    notas: "Para el sector abdominal, usar el protocolo abdominal correspondiente.",
    pasos: tecnica(
      "No dar contraste oral positivo, sí dar agua, 30 a 40 min antes. Dar 2 o 3 vasos más de agua antes de acostar al paciente."
    ),
  },
  {
    region: "Múltiples regiones",
    patologia: "TC de cuello, tórax, abdomen y pelvis sin contraste EV",
    usaContraste: false,
    notas: "Para el sector abdominal, usar el protocolo abdominal correspondiente.",
    pasos: tecnica(
      "Adquirir siempre por separado: cuello con brazos abajo y FOV chico, y cuerpo con brazos arriba y FOV grande."
    ),
  },
  {
    region: "Múltiples regiones",
    patologia: "TC de cuello, tórax, abdomen y pelvis con contraste EV",
    usaContraste: true,
    detalleContraste:
      "Inyectar a 2 ml/seg, comenzando a los 50 seg en el cuello y a los 65 seg en tórax, abdomen y pelvis.",
    notas: "Para el sector abdominal, usar el protocolo abdominal correspondiente.",
    pasos: tecnica(
      "Dos adquisiciones por separado: cuello (FOV chico) y tórax/abdomen/pelvis (FOV grande). Comenzar con brazos arriba, escanograma y adquisición sin contraste en abdomen superior. Bajar brazos e inyectar, adquirir cuello y, en el intervalo de 15 seg, subir rápido los brazos para el cuerpo. Entrenar previamente al paciente en la movilización de brazos."
    ),
  },
  {
    region: "Múltiples regiones",
    patologia: "TC de cuello y tórax con contraste EV",
    usaContraste: true,
    detalleContraste: "Inyectar a 2 ml/seg, comenzando a los 50 seg en el cuello y a los 65 seg en el tórax.",
    pasos: tecnica(
      "No realizar adquisición sin contraste EV. Dos adquisiciones por separado: cuello (FOV chico) y tórax (FOV grande). Comenzar con brazos arriba, escanograma sin contraste en abdomen superior. Bajar brazos e inyectar, adquirir cuello y, en el intervalo de 15 seg, subir los brazos para el tórax."
    ),
  },
  {
    region: "Múltiples regiones",
    patologia: "TC de encéfalo y cuello sin contraste EV",
    usaContraste: false,
    pasos: tecnica(
      "Dos adquisiciones por separado. Encéfalo con alto mAs, cuello con mAs más bajo (el encéfalo no necesita tanto miliamperaje para el cuello)."
    ),
  },
  {
    region: "Múltiples regiones",
    patologia: "TC de encéfalo y cuello con contraste EV",
    usaContraste: true,
    detalleContraste: "Inyectar 90 ml de contraste a 2 ml/seg, comenzando la adquisición del cuello a los 50 segundos.",
    pasos: tecnica(
      "Dos adquisiciones por separado, encéfalo con alto mAs y cuello con mAs más bajo. Sin contraste EV solo en encéfalo. Adquirir el cuello de arriba hacia abajo desde peñascos hasta el cayado de la aorta. Adquirir el encéfalo a los 3-5 min, en una segunda etapa, con alto mAs."
    ),
  },
  {
    region: "Angiotomografía",
    patologia: "AngioTC de encéfalo",
    usaContraste: true,
    detalleContraste:
      "Inyección de 60 ml de contraste a 4 o 5 ml/seg (ideal) y 40 ml de solución fisiológica a 2 ml/seg. Alta concentración (350 o 370).",
    pasos: tecnica(
      "Adquisición sin contraste endovenoso del encéfalo (protocolo encéfalo). Fase arterial de todo el encéfalo, de abajo hacia arriba. Sin bolus track: colocar la adquisición de baja dosis a nivel del tronco basilar y carótidas cavernosas, y adquirir manualmente al empezar a llenarse."
    ),
  },
  {
    region: "Angiotomografía",
    patologia: "AngioTC de cuello",
    usaContraste: true,
    detalleContraste:
      "Inyección de 60 ml de contraste a 3 o 4 ml/seg (ideal) y 40 ml de solución fisiológica a 2 ml/seg.",
    pasos: tecnica(
      "No realizar sin contraste EV. Fase arterial de todo el cuello, de abajo hacia arriba, con bolus track. ROI del bolus track en cayado aórtico, disparo a 80-100 UH. Adquirir desde orbito-meatal hasta el cayado de la aorta inclusive. Doble cabezal: contraste (60 ml) y solución fisiológica (40 ml). Incluir cayado aórtico."
    ),
  },
  {
    region: "Angiotomografía",
    patologia: "AngioTC arterias subclavias",
    usaContraste: true,
    detalleContraste:
      "Inyección de 60 ml de contraste a 4 o 5 ml/seg (ideal) y 40 ml de solución fisiológica a 4 o 5 ml/seg.",
    pasos: tecnica(
      "No realizar sin contraste EV. Fase arterial desde mitad del cuello hasta mitad del tórax, incluyendo aorta torácica ascendente hasta su salida en el corazón. ROI del bolus track en cayado aórtico, disparo a 150 UH. Fase arterial con abducción de brazos y fase arterial tardía-venosa en aducción. Doble cabezal: contraste (60 ml) y solución fisiológica (40 ml a 4 ml/seg). Acceso venoso en el brazo contrario al estudiado."
    ),
  },
  {
    region: "Angiotomografía",
    patologia: "AngioTC de aorta torácica sin gatillado",
    usaContraste: true,
    detalleContraste:
      "Inyección de 60 ml de contraste a 3 o 4 ml/seg (ideal) y 40 ml de solución fisiológica a 2 ml/seg.",
    indicacion:
      "Todas las angiotomografías torácicas, salvo evaluación de válvula aórtica por TAVI o aneurisma de aorta torácica ascendente con compromiso de raíz.",
    pasos: tecnica(
      "Sin contraste EV desde cayado aórtico hasta cúpulas diafragmáticas. Fase arterial de todo el tórax, de arriba hacia abajo, con bolus track. ROI en aorta descendente, disparo a 150 UH. No realizar con monitoreo cardíaco. Doble cabezal: contraste (60 ml) y solución fisiológica (40 ml)."
    ),
  },
  {
    region: "Angiotomografía",
    patologia: "AngioTC de aorta torácica con gatillado",
    usaContraste: true,
    detalleContraste:
      "Inyección de 60 ml de contraste a 3 o 4 ml/seg (ideal) y 40 ml de solución fisiológica a 2 ml/seg.",
    indicacion:
      "Pedidos por TAVI. Evaluación de aneurisma de aorta torácica ascendente con compromiso de la raíz. Síndrome aórtico agudo (hematoma intramural, disección, úlcera).",
    pasos: tecnica(
      "Sin contraste EV únicamente en síndrome aórtico agudo. Fase arterial de todo el tórax, de arriba hacia abajo, con bolus track. ROI en aorta descendente, disparo a 150 UH. Electrodos para monitoreo cardíaco, reconstrucción al 75%. Doble cabezal: contraste (60 ml) y solución fisiológica (40 ml)."
    ),
  },
  {
    region: "Angiotomografía",
    patologia: "AngioTC pulmonar (x TEP)",
    usaContraste: true,
    detalleContraste: "Inyección de 90 ml de contraste a 4 o 5 ml/seg (ideal). ROI en aorta ascendente, disparo a 80 UH.",
    notas:
      "Caudal mínimo de inyección 2-2,5 ml/seg. Si se inyecta a 2,5 ml/seg: 100 ml de contraste 350, adquisición a los 35 seg, sin bolus track. Otra opción: 110 ml a 1,5 ml/seg, adquiriendo a los 50 seg, sin bolus track. No inyectar con solución fisiológica. En embarazadas, puérperas o interrupción transitoria de contraste previa, adquirir interrumpiendo la respiración.",
    pasos: tecnica(
      "No realizar sin contraste EV. Fase arterial de todo el tórax, de arriba a abajo, con bolus track, alta concentración. Adquisición en inspiración; entrenar al paciente y colocar oxígeno. Sin buen acceso venoso, 2 abocath 24 e inyectar a 3 ml/seg."
    ),
  },
  {
    region: "Angiotomografía",
    patologia: "AngioTC pulmonar (x TEP) en embarazadas",
    usaContraste: true,
    detalleContraste: "Inyección de 70-80 ml de contraste a 4 ml/seg. ROI en aorta ascendente, disparo a 80 UH.",
    notas: "Hacer la adquisición interrumpiendo la respiración (sin inspiración ni espiración forzada).",
    pasos: tecnica(
      "No realizar sin contraste EV. Fase arterial del tórax, de arriba a abajo, extensión mínima indispensable, desde cayado aórtico a cúpulas diafragmáticas. Alta concentración."
    ),
  },
  {
    region: "Angiotomografía",
    patologia: "AngioTC de aorta abdominal",
    usaContraste: true,
    detalleContraste:
      "Inyección de 60 ml de contraste a 3 o 4 ml/seg (ideal) y 40 ml de solución fisiológica a 2 ml/seg.",
    notas: "Si hay aneurisma de gran tamaño, poner el bolus track por debajo y adquirir a ojo con el ROI afuera.",
    pasos: tecnica(
      "Sin contraste EV solo si se sospecha rotura de aneurisma o hay prótesis endovascular (adquirir solo en el sector de la endoprótesis). Fase arterial de todo el abdomen y pelvis, de arriba hacia abajo, con bolus track. En endoprótesis, fase venosa a 90 seg (valorar endoleak). ROI en aorta abdominal suprarrenal, disparo a 150 UH."
    ),
  },
  {
    region: "Angiotomografía",
    patologia: "AngioTC de abdomen, pelvis y miembros inferiores",
    usaContraste: true,
    detalleContraste: "Inyección de 70 ml de contraste a 3 ml/seg (ideal) y 40 ml a 2 ml/seg para mantención.",
    notas: "Si hay aneurisma de gran tamaño, poner el bolus track por debajo y adquirir a ojo con el ROI afuera.",
    pasos: tecnica(
      "No realizar sin contraste EV. Fase arterial de abdomen, pelvis y miembros inferiores, hasta donde se pida, de arriba hacia abajo. Doble cabezal: contraste (70 ml) y solución fisiológica (40 ml)."
    ),
  },
  {
    region: "Angiotomografía",
    patologia: "AngioTC de tórax, abdomen, pelvis y miembros inferiores",
    usaContraste: true,
    detalleContraste: "Inyección de 70 ml de contraste a 3 ml/seg (ideal) y 40 ml a 2 ml/seg para mantención.",
    notas: "Si hay aneurisma de gran tamaño, poner el bolus track por debajo y adquirir a ojo con el ROI afuera.",
    pasos: tecnica(
      "No realizar sin contraste EV. Fase arterial de tórax, abdomen, pelvis y MMII, de arriba hacia abajo. No realizar con monitoreo cardíaco. Doble cabezal: contraste (70 ml) y solución fisiológica (40 ml)."
    ),
  },
  {
    region: "Angiotomografía",
    patologia: "AngioTC arterias renales o esplénica",
    usaContraste: true,
    detalleContraste: "Inyección de 60 ml de contraste a 4 ml/seg (ideal) y 40 ml de solución fisiológica a 2 ml/seg.",
    pasos: tecnica(
      "No realizar sin contraste EV. Fase arterial de todo el abdomen y pelvis, de arriba hacia abajo, con bolus track. ROI en aorta abdominal suprarrenal, disparo a 150 UH. Doble cabezal: contraste (60 ml) y solución fisiológica (40 ml)."
    ),
  },
  {
    region: "Angiotomografía",
    patologia: "Flebotomografía indirecta",
    usaContraste: true,
    detalleContraste: "Buena carga de iodo. Dosis de contraste EV 1,7 ml/kg de 350 o 370.",
    notas: "En un estudio aceptable, la densidad dentro de la vena a estudiar debe ser mayor a la del músculo.",
    pasos: tecnica(
      "No realizar sin contraste EV. Fase flebotomográfica (3 minutos) del lugar a estudiar. Tiempo de adquisición a los 3 minutos (180 seg)."
    ),
  },
  {
    region: "Angiotomografía",
    patologia: "Flebotomografía directa",
    usaContraste: true,
    detalleContraste:
      "Inyectar 200 ml de dilución de contraste yodado al 30% (50 ml de contraste 350/370 en 150 ml de solución fisiológica), a caudal bajo (1,2 ml/seg).",
    pasos: tecnica(
      "No realizar sin contraste EV. Comenzar la adquisición cuando falten 15 ml para terminar la inyección. Vía en el brazo o pie del miembro a estudiar (venas pelvianas/abdominales: ambos MMII; venas torácicas: ambos MMSS). Lazos a nivel infrapatelar (MMII) o por arriba de los codos (brazo/axila/subclavia/torácicas)."
    ),
  },
  {
    region: "Pediátricos",
    patologia: "Preparación general del paciente pediátrico",
    usaContraste: false,
    pasos: tecnica(
      "Ayuno solo si precisa contraste y/o sedación EV (RN: consultar neonatólogo; menores de 1 año: 3 horas; mayores de 1 año: 4 horas; adolescentes: 6 a 8 horas). Contraste oral en la mayoría de estudios abdominales, salvo estudio exclusivo de hígado, bazo, suprarrenales o parénquima renal; para opacificar el recto, enema de 50-100 ml. Venopunción con aguja mariposa o catéter del mayor calibre posible (25G-19G), preferentemente en brazo izquierdo. Inmovilización con cintas de velcro, sacos de arena y bandas plomadas, protegiendo gónadas y tiroides. Contraste EV siempre yodado no iónico: dosis habitual 2 ml/kg (máximo 100 ml); en neonato y lactante pequeño, 3 ml/kg. Calentar el contraste a temperatura corporal."
    ),
  },
  {
    region: "Pediátricos",
    patologia: "TC de tórax sin contraste (pediátrico)",
    usaContraste: false,
    indicacion: "Estudio de neumonías, malformaciones.",
    pasos: tecnica("Adquisición de todo el tórax con 50 a 80 mAs, dependiente del peso."),
  },
  {
    region: "Pediátricos",
    patologia: "TC de abdomen y pelvis con contraste endovenoso (pediátrico)",
    usaContraste: true,
    indicacion: "Tumor de Wilms, hepatoblastoma.",
    pasos: tecnica(
      "Realizar adquisición con contraste EV. Reducir el FOV al área a explorar, previamente hablado con el pediatra."
    ),
  },
  {
    region: "Pediátricos",
    patologia: "TC para evaluar sistema uroexcretor (pediátrico)",
    usaContraste: false,
    indicacion: "Malformaciones congénitas.",
    pasos: tecnica(
      "Evaluar si la patología puede evidenciarse sin contraste. De ser necesario, hacer solo fase tardía (5 minutos)."
    ),
  },
  {
    region: "Pediátricos",
    patologia: "TC osteoarticular (displasia de cadera congénita)",
    usaContraste: false,
    pasos: tecnica("Adquisición de ambas articulaciones, sin contraste."),
  },
  {
    region: "Pediátricos",
    patologia: "TC osteoarticular (tumores óseos, sarcoma de Ewing)",
    usaContraste: true,
    pasos: tecnica("Reducir el FOV a la lesión en estudio. Realizar solo secuencia con contraste."),
  },
  {
    region: "Pediátricos",
    patologia: "TC de cerebro (trauma, abuso, shaking baby)",
    usaContraste: false,
    pasos: tecnica("Solo exploración, sin contraste EV."),
  },
  {
    region: "Pediátricos",
    patologia: "TC de abdomen (sospecha de apendicitis)",
    usaContraste: false,
    pasos: tecnica("Dar contraste oral. Paquete reducido, solo en ciego."),
  },
  {
    region: "Procedimientos especiales",
    patologia: "Medición de miembros inferiores",
    usaContraste: false,
    pasos: tecnica(
      "Previo: pedir al paciente que camine 3-4 vueltas y detener la marcha sobre un papel; dibujar el contorno de la pisada y trazar el ángulo de dirección de ambos pies. En sala: posicionar al paciente en decúbito dorsal, ajustar ambos pies al ángulo medido en papel. Scout de ambos miembros inferiores. Adquisición en 3 paquetes de 5 cortes (cadera, rodilla, tobillo) en ultra baja dosis. Post-proceso: hacer las fusiones de las imágenes adquiridas."
    ),
  },
  {
    region: "Procedimientos especiales",
    patologia: "Histerosalpingografía virtual",
    usaContraste: true,
    detalleContraste:
      "Inyección por bomba: 0,2-0,5 ml/s de solución fisiológica (35 ml) + 15 ml de iodo 300, a pasar en 30 seg. En caso de pasaje manual: jeringa de 20 ml con 14 ml de solución fisiológica + 6 ml de contraste.",
    pasos: tecnica(
      "Colocar cartelería para evitar el ingreso de personal ajeno al estudio; usar biombo. Posición ginecológica, extremo cefálico orientado al gantry. Colocación de espéculo. Scout view de L5 hasta sínfisis pubiana, ajustar FOV. Colocación de cánula en OCE según características anatómicas y disponibilidad de material. Comunicar al médico que realiza el procedimiento cada 10 segundos durante la inyección. Adquisición en volumen óseo + volumen de partes blandas. Reconstrucciones óseas: axial, sagital y coronal, coronal MIP angulado al útero. Post-proceso: vista endoscópica, 3D y volumen de cavidad endometrial."
    ),
  },
];

function ImportarProtocolos() {
  const [estado, setEstado] = useState<"inicial" | "cargando" | "listo" | "error">("inicial");
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function importar() {
    setEstado("cargando");
    setProgreso(0);
    setError(null);
    try {
      for (const p of PROTOCOLOS_TC) {
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
          <h1 className="mb-2 text-lg font-semibold text-ink">Importar protocolos de tomografía</h1>
          <p className="mb-6 text-sm text-ink-dim">
            Esto va a crear {PROTOCOLOS_TC.length} protocolos de TC en la base de datos, tomados del
            documento de Intecnus. Usalo una sola vez — si lo corrés dos veces, va a duplicar todo.
          </p>

          {estado === "inicial" && (
            <button
              onClick={importar}
              className="rounded bg-rm-dim px-4 py-2 text-sm font-medium text-ink hover:bg-rm hover:text-bg"
            >
              Importar {PROTOCOLOS_TC.length} protocolos
            </button>
          )}

          {estado === "cargando" && (
            <p className="font-mono text-sm text-ink-faint">
              Cargando {progreso} / {PROTOCOLOS_TC.length}…
            </p>
          )}

          {estado === "listo" && (
            <div className="rounded border border-rx-dim bg-rx-dim/10 p-4">
              <p className="text-sm text-ink">
                Listo, se importaron {PROTOCOLOS_TC.length} protocolos.{" "}
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

export default function ImportarProtocolosPage() {
  return (
    <RutaProtegida rolRequerido="admin">
      <ImportarProtocolos />
    </RutaProtegida>
  );
}
