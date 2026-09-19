# Protocolos — Diagnóstico por Imágenes

Web interna para consultar los protocolos de Resonancia, Tomografía y Rayos X,
organizados por región y patología. Hay dos roles:

- **Admin** (vos): puede crear, editar y borrar protocolos.
- **Técnico**: solo puede ver los protocolos (no puede editar nada).

Stack: **Next.js 14 + Tailwind + Firebase** (Authentication + Firestore),
pensado para deployar en **Vercel** con el repo en **GitHub**, igual que tus
otros proyectos.

> Las imágenes de referencia por protocolo quedan para más adelante: Firebase
> pide pasar al plan Blaze (pago por uso) para habilitar Storage. El modelo de
> datos ya las contempla, así que cuando lo actives no hay que migrar nada —
> ver la sección "Más adelante" al final de este archivo.

---

## 1. Crear el proyecto en Firebase

1. Entrá a [console.firebase.google.com](https://console.firebase.google.com) →
   **Agregar proyecto** (podés desactivar Google Analytics, no hace falta).
2. Adentro del proyecto, andá a **Compilación → Authentication → Comenzar** →
   pestaña **Sign-in method** → habilitá **Correo electrónico/contraseña**.
3. Andá a **Authentication → Users → Agregar usuario** y creá dos usuarios:
   - `admin@intecnus.local` con la contraseña que quieras usar vos.
   - `tecnico@intecnus.local` con la contraseña `tecnico` (la vas a compartir
     con todo el equipo de técnicos).
4. Andá a **Compilación → Firestore Database → Crear base de datos** (modo
   producción, la región no importa mucho, elegí una cercana como `southamerica-east1`).
5. Copiá el **UID** de cada usuario (Authentication → Users, columna "User UID")
   y creá a mano los perfiles: en Firestore Database → **Iniciar colección** →
   nombre `perfiles` → **ID del documento** = el UID del admin → agregale los
   campos:
   - `rol` (string) = `admin`
   - `nombre` (string) = `Nacho`

   Repetí para el técnico, con `rol` = `tecnico` y el UID correspondiente como
   ID del documento.
6. Andá a **Firestore Database → Reglas** y pegá el contenido de
   [`firestore.rules`](./firestore.rules) (reemplazando lo que haya) → **Publicar**.
7. Andá a **Configuración del proyecto** (el engranaje) → bajá hasta "Tus apps"
   → ícono `</>` (Web) → registrá una app (el nombre que quieras, no hace falta
   Firebase Hosting) → copiá el objeto `firebaseConfig` que te muestra.

   (Por ahora no hace falta tocar **Storage** — ver "Más adelante" al final.)

---

## 2. Correrlo en tu computadora (opcional)

```bash
npm install
cp .env.local.example .env.local
# pegá ahí los valores de firebaseConfig que copiaste en el paso 7
npm run dev
```

Abrí `http://localhost:3000`. Vas a poder entrar con usuario `admin` (o
`tecnico`) y la contraseña que hayas puesto — no hace falta escribir el
`@intecnus.local`, la app lo agrega sola.

Este paso es solo para probarlo antes de publicarlo; si preferís, podés saltarlo
e ir directo al paso 3.

---

## 3. Subir a GitHub y deployar en Vercel

```bash
git init
git add .
git commit -m "Primer versión de la web de protocolos"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/intecnus-protocolos.git
git push -u origin main
```

Después, en [vercel.com](https://vercel.com):

1. **New Project** → importá el repo.
2. En **Environment Variables**, agregá las mismas 6 variables
   `NEXT_PUBLIC_FIREBASE_*` que pusiste en tu `.env.local`.
3. **Deploy**.

---

## Cómo se usa

- **Vos (admin)**: entrás → pestaña "Administrar" → "+ Nuevo protocolo".
  Elegís modalidad (RM/TC/RX), región, patología, indicación, si usa
  contraste, y cargás los pasos de la técnica (podés agregar los que
  necesites).
- **Técnicos**: entran con el usuario `tecnico` / `tecnico`, eligen la
  modalidad en la barra lateral, buscan por región o patología, y ven el
  detalle del protocolo. No ven el botón de "Administrar" ni pueden editar.

## Más adelante

- **Imágenes de referencia por protocolo**: cuando quieras sumarlas, hay que
  1) pasar el proyecto de Firebase al plan Blaze (podés poner una alerta de
  presupuesto en $0 para no llevarte sorpresas), 2) habilitar Storage,
  3) pegar las reglas de [`storage.rules`](./storage.rules), y 4) volver a
  agregar la parte de subida de imágenes al formulario de admin (el campo
  `imagenes` ya existe en cada protocolo, así que no hace falta migrar datos
  viejos). Avisame cuando quieras y lo hacemos.
- Pasar de una contraseña compartida a un usuario por técnico (la colección
  `perfiles` ya soporta cualquier cantidad de usuarios con rol `tecnico`;
  solo habría que crear un usuario por persona en Firebase Authentication).
- Historial de cambios por protocolo.
- Buscador global que cruce las tres modalidades a la vez.
