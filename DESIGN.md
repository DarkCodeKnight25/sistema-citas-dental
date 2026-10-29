---
name: Dental Qori · demo
description: Agenda de consultorio dental como consola de trabajo oscura; el color solo marca el estado de cada cita.
colors:
  ground: "#141416"
  panel: "#111113"
  raised: "#1c1c20"
  hover: "#222227"
  seam: "#26262b"
  control: "#3b3b42"
  text: "#f2f2f3"
  muted: "#a3a5ab"
  faint: "#8c8e95"
  accent: "#5b9bea"
  primary: "#2f6fca"
  primary-hover: "#3a7bd6"
  pendiente: "#e3ad45"
  pendiente-bg: "#2a2416"
  confirmada: "#4cc38a"
  confirmada-bg: "#15281f"
  atencion: "#6aa7f0"
  atencion-bg: "#16233a"
  atendida: "#a3a5ab"
  atendida-bg: "#1c1c20"
  falto: "#ef6a7f"
  falto-bg: "#2c1a20"
  cancelada: "#8c8e95"
  doctor-rosa: "#E7A6C1"
  doctor-celeste: "#8FCFD8"
  doctor-lima: "#C4D88A"
typography:
  display:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Public Sans', system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Public Sans', system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
  title-card:
    fontFamily: "'Public Sans', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "'Public Sans', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "'Public Sans', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.45
  small:
    fontFamily: "'Public Sans', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.45
  numeric:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "inherit"
    fontWeight: 400
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
rounded:
  hairline: "3px"
  chip: "4px"
  md: "6px"
  float: "8px"
  full: "50%"
spacing:
  gap: "24px"
  pad: "32px"
  pad-mobile: "16px"
  control-h: "34px"
  rail: "56px"
  side: "384px"
components:
  button:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "34px"
  button-hover:
    backgroundColor: "{colors.hover}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "34px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    padding: "0 8px"
    height: "34px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.falto}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "34px"
  button-danger-hover:
    backgroundColor: "{colors.falto-bg}"
  button-small:
    padding: "0 10px"
    height: "28px"
    typography: "{typography.small}"
  input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "38px"
  state-chip:
    rounded: "{rounded.chip}"
    padding: "0 8px"
    height: "22px"
    typography: "{typography.small}"
  agenda-block:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.chip}"
    padding: "6px 8px 6px 11px"
  agenda-block-hover:
    backgroundColor: "{colors.hover}"
  panel-box:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.md}"
    padding: "16px 20px"
  time-slot:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: "44px"
  time-slot-selected:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
  doctor-initial:
    textColor: "#121214"
    rounded: "{rounded.full}"
    size: "24px"
  rail-item:
    textColor: "{colors.faint}"
    rounded: "{rounded.md}"
    size: "40px"
---

# Design System: Dental Qori · demo

## Overview

**Creative North Star: "La consola de recepción"**

La agenda dental se trata como una consola de trabajo, no como una página médica. Paneles fijos de grafito neutro, separados por costuras de 1 px, sin sombras en reposo y sin degradados. Como en el resaltado de sintaxis, el color no decora: solo dice en qué estado está cada cita. Todo lo demás es gris.

El mundo oscuro lo eligió David por encima de la propuesta asignada. Rechaza de forma expresa el SaaS médico blanco con turquesa, los íconos de diente, las tarjetas de KPI con ícono y el calendario tipo Google. La densidad es la de una herramienta que recepción tiene abierta todo el día: filas de 42 a 56 px, controles de 34 px y cifras alineadas en mono.

La reserva pública usa el mismo mundo, con objetivos táctiles más grandes (filas de 60 px, horas de 44 px) porque se hace desde el celular.

**Key Characteristics:**
- Grafito neutro en tres escalones (suelo, panel más oscuro, elevado) y costuras de 1 px.
- Color solo en los estados de la cita; cada estado tiene además su propia marca, no solo su tinta.
- Una tinta pálida fija por doctor, usada solo para identificarlo.
- Cada selección es una línea de acento de 1 px.
- Todas las cifras en JetBrains Mono; el texto en Public Sans.
- Movimiento solo como respuesta a una acción, nunca de entrada.

## Colors

Grafito sin tinte con un único azul de acción; las tintas de estado son la única fuente de color en la pantalla.

### Primary
- **Azul de acción** (primary): relleno del único botón primario de cada vista («Nueva cita», «Reservar») y de la hora elegida. Al pasar el puntero sube a primary-hover.
- **Azul de selección** (accent): la línea de 1 px que marca lo seleccionado, la línea «Ahora» de la agenda, el foco (contorno de 2 px), el cursor de texto, la marca y el código de reserva.

### Secondary: tintas de estado
Cada estado tiene una tinta para el texto y la banda, y un fondo oscuro de su mismo tono para la pastilla.
- **Ámbar por confirmar** (pendiente / pendiente-bg): citas sin confirmar y el contador del riel de recordatorios.
- **Verde confirmada** (confirmada / confirmada-bg): citas confirmadas, el aviso de éxito y el botón de WhatsApp.
- **Azul en atención** (atencion / atencion-bg): el paciente que está en el sillón.
- **Gris atendida** (atendida / atendida-bg): citas ya atendidas.
- **Rojo no asistió** (falto / falto-bg): inasistencias. La misma tinta marca errores, alergias y acciones destructivas.
- **Gris cancelada** (cancelada): solo en la pastilla; las canceladas no se dibujan en la agenda.

### Tertiary: tintas de doctor
- **Rosa** (doctor-rosa), **Celeste** (doctor-celeste), **Lima** (doctor-lima): una por doctor, fija. Viven en los datos del doctor (campo `tinta`), no en el CSS. Se usan en el círculo con la inicial, el punto junto al nombre y el borde izquierdo de 2 px de las citas en la vista semanal.

### Neutral
- **Suelo de grafito** (ground): fondo de la página, del riel y de las hojas laterales.
- **Panel** (panel): un paso más oscuro que el suelo; fondo de agenda, listas, tablas, campos y cajas.
- **Elevado** (raised): fila seleccionada, bloque de cita, aviso flotante, esqueletos de carga.
- **Hover** (hover): fondo al pasar el puntero.
- **Costura** (seam): todas las líneas de 1 px que separan paneles, filas y columnas.
- **Control** (control): borde de botones y campos; también el pulgar de la barra de desplazamiento.
- **Texto** (text), **Apagado** (muted), **Tenue** (faint): tres niveles de texto. Apagado para etiquetas y datos secundarios, tenue para el eje de horas, marcadores de posición y deshabilitados.

### Named Rules
**La regla del resaltado de sintaxis.** El color solo aparece para decir el estado de una cita (o, con el rojo, un error o un peligro). Si un elemento no es un estado, va en grafito.

**La regla de las dos señales.** Ningún estado se distingue solo por su color. Por confirmar lleva borde punteado; confirmada, borde sólido; en atención, contorno en la tinta azul con fondo azul oscuro; atendida, banda y nombre desvanecidos; no asistió, fondo rayado y nombre tachado; cancelada no se muestra en la agenda.

**La regla de la tinta de doctor.** La tinta de un doctor solo identifica a quién pertenece algo. Nunca indica estado y nunca rellena un bloque.

## Typography

**Body Font:** Public Sans (con system-ui, sans-serif)
**Mono Font:** JetBrains Mono (con ui-monospace, monospace)

**Character:** Una sans neutra y legible para el texto y una mono de terminal para todo lo que es un número. La pareja convierte la agenda en una tabla de datos que se lee de un vistazo.

### Hierarchy
- **Display** (JetBrains Mono 500, 32px, interlineado 1, -0.03em): la hora del bloque «Siguiente». En la misma familia, la hora del detalle de cita (30px) y el código de reserva (30px, en acento, +0.02em).
- **Headline** (Public Sans 700, 26px, 1.15, -0.02em): título de cada página del panel, con la fecha en peso 400 y gris. Baja a 22px en el celular. El título de la reserva pública usa 32px (28px en celular) con el mismo peso.
- **Title** (600, 18px): títulos de pasos y de hojas laterales; también el nombre del paciente en «Siguiente».
- **Title card** (600, 15px): título de cada bloque o caja.
- **Body** (400, 14px, 1.45): texto general. Párrafos largos limitados a 56–72ch.
- **Label** (500, 13px, apagado): etiquetas de campo y datos secundarios en filas.
- **Small** (400, 12px): ayudas, subtítulos y pastillas de estado. El eje de horas y los minibloques de la semana usan 11px.

### Named Rules
**La regla de la cifra en mono.** Toda cifra (horas, DNI, celulares, soles, códigos, conteos) va en JetBrains Mono con cifras tabulares. El texto nunca va en mono.

**La regla de la jerarquía por tamaño.** No hay rótulos en mayúsculas ni antetítulos. La jerarquía sale del tamaño, el peso y el gris.

## Layout

**Panel.** Un riel de íconos fijo de 56px a la izquierda y un lienzo flexible. La página tiene 28px arriba y 32px a los lados. En «Hoy», la rejilla es una columna principal flexible y un riel derecho fijo de 384px (pegajoso) con el conteo por estado y la cola de recordatorios; 24px entre ambos.

**Agenda del día.** Un eje de horas de 56px y una columna por doctor. Líneas de 1px por hora y otras más tenues por media hora. Las horas sin atención (incluido el almuerzo de 13:00 a 15:00) van rayadas; en la vista semanal van en un tono plano. Los bloques se colocan por posición absoluta según su hora y duración.

**Reserva pública.** Una columna de pasos y un resumen pegajoso de 360px a la derecha, con 48px entre ambos, centrados hasta 1120px.

**Puntos de quiebre.**
- 1200px: «Hoy» pasa a una columna; el riel derecho se pone arriba en dos columnas.
- 900px: la reserva pasa a una columna y el resumen se fija abajo.
- 760px: el riel de íconos pasa a ser una barra inferior de 60px con etiquetas; el margen lateral baja a 16px; la agenda y la semana se desplazan en horizontal (semana con mínimo de 640px).
- 520px: el formulario y el ticket de la reserva pasan a una columna.

## Elevation & Depth

El sistema es plano. La profundidad se da por escalones de tono (panel más oscuro que el suelo, elevado más claro) y por costuras de 1px. Solo tres cosas flotan sobre la página y solo ellas llevan sombra.

### Shadow Vocabulary
- **Aviso flotante** (`box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45)`; 0.4 en el aviso de servidor dormido): tostadas y el aviso de que el servidor está despertando.
- **Hoja lateral** (`box-shadow: -16px 0 40px rgba(0, 0, 0, 0.45)`): hojas de detalle y de nueva cita, sobre un velo `rgba(6, 6, 8, 0.6)`.
- **Resumen fijo en celular** (`box-shadow: 0 -12px 28px rgba(0, 0, 0, 0.4)`): el resumen de la reserva cuando se fija abajo.

### Named Rules
**La regla de nada flota en reposo.** Ninguna caja, tarjeta ni bloque de agenda lleva sombra. La sombra solo existe en lo que se superpone a la página.

**La regla sin degradados.** No hay degradados en ninguna parte. Los rayados son patrones SVG de línea, no degradados.

## Shapes

Esquinas apenas suavizadas y bordes de 1px en todo.
- **6px** (md): botones, campos, cajas, agenda, listas.
- **4px** (chip): pastillas de estado y bloques de la agenda.
- **3px** (hairline): minibloques de la semana, esqueletos y la etiqueta de «Ahora».
- **8px** (float): tostadas y avisos flotantes.
- **Círculo**: inicial del doctor (24px), punto del doctor (8px) y el punto de 6px de cada pastilla de estado.

Los bordes punteados tienen significado: estado por confirmar, acción destructiva, estado vacío y bloque de error. No se usan como adorno.

## Components

### Buttons
Contenidos y de herramienta: contorno fino, sin relleno salvo en la acción principal.
- **Shape:** esquinas de 6px, alto de 34px (28px en la versión chica, 40px en las acciones de «Siguiente» en celular).
- **Base:** fondo transparente, borde en control, texto en peso 500.
- **Primario:** relleno azul de acción, texto blanco. Uno solo por vista.
- **Texto:** sin borde, texto apagado; se ilumina al pasar el puntero.
- **Peligro:** borde punteado rojo oscuro (#7a3b47) y texto rojo. Va aislado en una «zona de peligro» separada por una costura y aire, y pide confirmación en una caja también punteada.
- **WhatsApp:** borde verde oscuro (#2d5a43) y texto verde claro (#7fd8a7).
- **Hover / Active:** fondo hover y borde #4a4a52 en 120ms; al presionar baja 1px.
- **Deshabilitado:** texto tenue, borde de costura, sin relleno.

### Chips: pastilla de estado
- **Style:** 22px de alto, esquinas de 4px, fondo oscuro del estado, texto en la tinta del estado y un punto de 6px delante.

### Cards / Containers
- **Corner Style:** 6px.
- **Background:** panel, un paso más oscuro que el suelo.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** 1px en costura; las filas internas se separan con costuras, no con espacio.
- **Internal Padding:** 14–20px.

### Inputs / Fields
- **Style:** 38px de alto, fondo panel, borde control, esquinas de 6px; etiqueta de 13px apagada encima.
- **Hover:** borde #4a4a52.
- **Focus:** el borde pasa al acento, sin brillo.
- **Error:** borde rojo y mensaje de 12px en rojo debajo.

### Navigation
- **Riel de íconos (escritorio):** íconos de 40px en tenue; al pasar, texto y fondo hover; el activo lleva una línea de acento de 1px en el borde del riel. El contador de recordatorios es una pastilla ámbar.
- **Barra inferior (celular, ≤760px):** el mismo riel, horizontal, con etiqueta de 10.5px; la línea de acento pasa arriba del ícono.
- **Pestañas:** texto apagado; la activa en texto claro con una línea de acento de 1px debajo, del ancho de su etiqueta.

### Bloque de cita (firma)
El elemento propio del sistema. Un bloque en la columna del doctor, con hora en mono (en la tinta del estado), paciente en 600 y tratamiento en gris. A la izquierda lleva una banda de 3px en la tinta del estado. Cuando la cita cambia de estado, la banda se despliega de arriba abajo (`scaleY` de 0 a 1) en 180ms con la curva de salida. Cada estado suma su marca propia según la regla de las dos señales.

### Línea «Ahora»
Una línea de 1px en el acento que cruza la agenda a la hora actual, con una etiqueta de la hora en el eje. Avanza con una transición de 600ms.

### Selección en listas de opciones
En la reserva y en ajustes, cada opción es una fila separada por costuras. La elegida toma fondo elevado y una línea de acento de 1px a la izquierda. La hora elegida es la excepción: se rellena con el azul de acción porque es el compromiso final del paso.

### Movimiento
Curva única `cubic-bezier(0.16, 1, 0.3, 1)`. Hover en 120ms, bloques y velo en 160ms, banda de estado en 180ms, tostada en 220ms, hoja lateral en 240ms. Con movimiento reducido, todo se anula.

## Do's and Don'ts

### Do:
- **Do** separar paneles y filas con costuras de 1px en seam.
- **Do** marcar cada selección con una línea de 1px en accent (de la altura de la fila o del ancho de la etiqueta).
- **Do** dar a cada estado su tinta y además su marca: punteado, sólido, contorno azul, desvanecido, rayado con tachado, oculto.
- **Do** escribir toda cifra en JetBrains Mono con cifras tabulares.
- **Do** dejar un solo botón primario por vista.
- **Do** poner las acciones destructivas con contorno punteado, aisladas y con confirmación.
- **Do** usar la tinta del doctor solo para identificarlo (inicial, punto, borde de 2px en la semana).

### Don't:
- **Don't** usar color fuera de los estados de la cita, el acento de acción y el rojo de error.
- **Don't** poner sombras en cajas o bloques en reposo; solo la tostada, la hoja lateral y el resumen fijo del celular las llevan.
- **Don't** usar degradados.
- **Don't** animar la entrada de contenido; el movimiento solo responde a una acción.
- **Don't** usar el estilo de SaaS médico blanco con turquesa, íconos de diente, tarjetas de KPI con ícono ni un calendario tipo Google.
- **Don't** distinguir un estado solo por su color.
