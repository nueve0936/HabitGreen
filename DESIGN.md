---
name: Habit Green
description: App de hábitos para Android con un jardín que crece a tu ritmo, alegre y sin culpa.
colors:
  bg: "#FBFBF6"
  campo: "#FFFFFF"
  ink: "#1E2A22"
  ink-soft: "#566459"
  borde: "#859488"
  divisor: "#D6E8DB"
  accent: "#2E7D4F"
  accent-oscuro: "#24663F"
  accent-claro: "#DFF2E4"
  error: "#B8493D"
  error-claro: "#FBE3DF"
  moneda: "#B7791F"
  moneda-claro: "#E9B44C"
  moneda-fondo: "#FFF0CC"
  moneda-texto: "#7A4F0E"
  peligro: "#C62828"
  confirmar: "#2E7D4F"
  blanco: "#FFFFFF"
  placeholder: "rgba(70, 72, 78, 0.8)"
  tinte-salud-fisica: "#FDE8E2"
  tinte-trabajo: "#DFEDF9"
  tinte-salud-mental: "#E9E6FB"
  tinte-finanzas: "#E3F3DF"
  tinte-social: "#FCEBD3"
typography:
  h1:
    fontFamily: "Lexend Deca"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "40px"
  h2:
    fontFamily: "Lexend Deca"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
  h3:
    fontFamily: "Lexend Deca"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"
  body:
    fontFamily: "Lexend Deca"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  small:
    fontFamily: "Lexend Deca"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  button:
    fontFamily: "Lexend Deca"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: "24px"
rounded:
  field: "12px"
  accion: "16px"
  card: "20px"
  chip: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  xxxl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.blanco}"
    typography: "{typography.button}"
    rounded: "{rounded.chip}"
    height: "48px"
  button-primary-pressed:
    backgroundColor: "{colors.accent-oscuro}"
    textColor: "{colors.blanco}"
  button-secondary:
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.chip}"
    height: "48px"
  action-square:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.accion}"
    size: "48px"
  card-habit:
    backgroundColor: "{colors.campo}"
    rounded: "{rounded.card}"
  field:
    backgroundColor: "{colors.campo}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    height: "48px"
  chip-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.chip}"
  coin-balance:
    backgroundColor: "{colors.moneda-fondo}"
    textColor: "{colors.moneda-texto}"
    rounded: "{rounded.chip}"
---

# Design System: Habit Green

> Este archivo resume el sistema visual para Impeccable. **La fuente de verdad es `docs/Guía de UX UI.md`**, con los valores de `src/theme/tokens.js`. Si difieren, gana la guía, y este archivo se actualiza cada vez que cambien. Los colores de Figma ya no aplican a la app; su acomodo sí. Figma solo se lee.

## Overview

**Creative North Star: "El jardín paciente"**

Habit Green se siente como un jardín bien cuidado en una mañana clara: abierto, ordenado y alegre, sin apuro ni regaños. Las listas de todos los días son limpias, como en Todoist o TickTick. La calidez aparece en lo que recompensa, como en Finch: el color de cada área en el Jardín, la moneda dorada y la celebración de una nueva fase. Son referencias de acabado; no se copia ninguna app.

Es una herramienta de momentos cortos: marcar un hábito toma segundos, así que la jerarquía es directa y las pantallas de uso diario son tranquilas. Una persona que ya abandonó otros intentos debe sentir que aquí puede volver sin explicaciones.

Los controles son cálidos y táctiles: formas redondeadas y una respuesta clara al tocar.

**Key Characteristics:**

- Fondo casi blanco y liso, siempre claro.
- Un solo verde para acciones y estados, y una acción principal por pantalla.
- Un tinte suave por área y un dorado reservado a las monedas.
- Lexend Deca en toda la app, con tamaños que respetan la letra del sistema.
- El progreso se ve en la planta, nunca en números de nivel o XP.

## Colors

Neutros con un leve matiz verde, un verde que marca lo que se puede hacer, y color cálido solo para lo que recompensa.

### Primary

- **Verde brote** (accent): botón principal, selección, casilla marcada, barra de avance, pestaña activa y texto de acento. Al presionar pasa a **Verde profundo** (accent-oscuro).
- **Verde rocío** (accent-claro): estado presionado, píldora de la pestaña activa y etiquetas.

### Secondary

- **Dorado de moneda** (moneda, moneda-claro, moneda-texto, moneda-fondo): el saldo y la moneda. No se usa para nada más.

### Tertiary

- **Tintes de área** (tinte-salud-fisica, tinte-trabajo, tinte-salud-mental, tinte-finanzas, tinte-social): tarjetas del Jardín e iconos de categoría.

### Neutral

- **Mañana clara** (bg): fondo de pantalla.
- **Pétalo blanco** (campo): tarjetas, campos, barra inferior, menús y diálogos.
- **Tierra verde** (ink): títulos, párrafos e iconos neutros.
- **Tallo gris** (ink-soft): texto de apoyo.
- **Contorno** (borde): bordes de controles sin elegir.
- **Hoja pálida** (divisor): líneas decorativas, pistas de barras y botón deshabilitado.
- **Placeholder** (placeholder): texto de ejemplo dentro de los campos.
- **Rojo de error** (error, error-claro): errores. Se separa del verde para no confundirse con una acción.
- **Rojo de aviso** (peligro) y **Verde de aviso** (confirmar): acciones de quitar o agregar en diálogos. Con el verde principal, son los rellenos que llevan texto **blanco** (blanco).

### Named Rules

**The One Sprout Rule.** Un solo botón principal por pantalla, y el verde intenso reservado a acciones y estados. Las tarjetas de área usan tintes, nunca verde intenso.

**The Gold Is Earned Rule.** El dorado significa monedas. Ningún otro elemento lo usa.

**The No-Color-Alone Rule.** Ningún estado depende solo del color: una opción elegida lleva ✓ y negritas, un hábito hecho se tacha, y un tinte de área siempre va con su nombre.

## Typography

**Display Font:** Lexend Deca (respaldo: fuente del sistema)
**Body Font:** Lexend Deca (respaldo: fuente del sistema)

**Character:** Una sola familia redondeada y muy legible. Es amable sin ser infantil, y la jerarquía sale del tamaño y del peso.

### Hierarchy

- **H1:** título de cada pestaña.
- **H2:** títulos de pantallas secundarias y de estados vacíos.
- **H3:** secciones dentro de una pantalla, como las categorías.
- **Body:** texto corriente, títulos de opciones y nombres de plantas.
- **Small:** datos de apoyo, como «08:00 · 30 min». Nada baja de 12 sp.
- **Button:** texto de los botones de píldora.

### Named Rules

**The Stable Bold Rule.** Cuando un texto pasa a negritas al elegirse, nada se mueve alrededor (`StableBoldText`).

**The Scale With Me Rule.** El texto respeta la letra del sistema hasta 2×; los contenedores crecen con él. Solo las etiquetas de la barra inferior se limitan a 1.3×.

## Layout

Una sola columna vertical, pensada para usarse con el pulgar. El margen lateral es de 32 dp, como en los mockups, y baja a 16 dp cuando la pantalla necesita ancho, como la cuadrícula de 2 columnas del Jardín. El ritmo usa múltiplos de 8. Solo orientación vertical. El acomodo de cada pantalla sigue los mockups de Figma.

La barra inferior tiene 5 destinos y permite cambiar tocando o deslizando. Hoy fija su parte superior; Hábitos, Jardín y Tienda, su encabezado; con letra de 1.5× o más o en una pantalla baja, Hoy se desplaza completa.

## Elevation & Depth

Superficies blancas que se separan del fondo con una sombra suave y única, sin bordes oscuros. Las tarjetas de área no llevan sombra: las separa su tinte. La sombra nunca es la única señal de un estado.

### Shadow Vocabulary

- **Sombra de tarjeta** (`color ink, opacidad 0.10, radio 8, desplazamiento vertical 2; elevation 2 en Android`): tarjetas de hábito, menús y botón de acción.

## Shapes

Formas redondeadas y amables: campos con 12 dp, botón cuadrado de acción con 16 dp, tarjetas y diálogos con 20 dp; casillas, botones de texto, chips y barras en píldora completa.

## Components

Cálidos y táctiles: cada toque recibe respuesta en menos de 100 ms, con cambio de color al presionar.

### Buttons

- **Shape:** píldora completa y 48 dp de alto.
- **Primary:** verde brote con texto blanco en negritas, sin borde. Presionado: verde profundo.
- **Secondary:** transparente con borde de contorno. Presionado: verde rocío.
- **Tertiary:** enlace de texto subrayado, con al menos 48 dp de alto.
- **Cuadrado de acción:** verde brote con icono blanco y 48 dp, para «+» y la bolsa de la Tienda.

### Chips

- **Style:** píldora con borde de contorno.
- **State:** elegida, con relleno verde brote y texto blanco en negritas.

### Cards / Containers

- **Corner Style:** 20 dp.
- **Background:** pétalo blanco, o el tinte del área en el Jardín.
- **Shadow Strategy:** sombra de tarjeta; ninguna en las tarjetas de área.
- **Border:** ninguno.

### Inputs / Fields

- **Style:** pétalo blanco, borde de 2 px de contorno, radio de 12 dp y etiqueta siempre visible arriba.
- **Focus:** borde verde brote.
- **Error:** borde rojo de error y X dentro, con el mensaje debajo.

### Navigation

- **Barra inferior:** 5 destinos sobre pétalo blanco. Activo: píldora verde rocío detrás del icono verde brote, y etiqueta en negritas.
- **Regresar:** botón circular de 48 dp con flecha.

### Tarjeta de hábito

Casilla redonda con zona táctil de 48 dp, título y «hora · duración». Hecho: casilla verde con ✓ blanca y título tachado con una línea de 2 px. En pausa: ⏸ en lugar de la casilla. No toca hoy: casilla punteada con el texto «No toca hoy».

### Saldo

Píldora dorada clara con la moneda rellena, el único icono relleno de la app.

### Tarjeta de objeto y hoja de compra

Tarjeta blanca con imagen, nombre y precio en píldora dorada. Al tocarla, una hoja inferior permite comprar o, si ya es tuyo, equipar.

### Carrusel de fases

Las 3 fases de la planta en páginas horizontales, con puntos debajo. Las no alcanzadas son una silueta con candado.

### Cuadrícula de objetos

Celdas en 3 columnas, con pestañas de tipo fijas abajo. El objeto puesto lleva relleno verde rocío, borde verde brote y ✓.

### Aviso flotante

Un aviso temporal sobre la parte baja de la pantalla, para lo que ocurre al marcar un hábito. No mueve las tarjetas y deja pasar los toques a lo que tiene debajo.

### Planta

La planta y sus accesorios se apilan sobre un lienzo cuadrado transparente. Nunca muestra XP ni niveles.

## Do's and Don'ts

### Do:

- **Do** usar solo tokens: ningún código hex suelto en los componentes.
- **Do** garantizar 48 dp en todo lo tocable, ampliando con `hitSlop` si el elemento es más chico.
- **Do** usar movimiento sobrio, de 150 a 250 ms con ease-out, y sustituirlo por un cambio directo con «reducir movimiento».
- **Do** confirmar las acciones destructivas con un diálogo y escribir de tú, sin culpa.
- **Do** seguir el acomodo de los mockups de Figma, con el ajuste mínimo cuando rompa una regla de accesibilidad.

### Don't:

- **Don't** modificar las pantallas de Figma: solo se leen.
- **Don't** agregar modo oscuro, Material You ni Roboto: la identidad es fija.
- **Don't** mostrar XP, niveles ni fases numéricas.
- **Don't** poner más de un botón principal en una pantalla.
- **Don't** volver a los degradados de fondo ni a los bordes oscuros de 2 px.
- **Don't** usar el dorado para algo que no sean monedas.
- **Don't** poner elementos con desplazamiento horizontal dentro de una pestaña: el gesto chocaría con el cambio de pantalla.
