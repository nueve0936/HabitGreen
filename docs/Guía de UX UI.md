# Guía de UX/UI

Sistema visual de Habit Green, dirección **«Jardín alegre»**: fondo casi blanco, un solo verde como color principal, un tinte suave por área y un dorado reservado a las monedas, aplicado a React Native y a las guías de diseño de Android (Material).

## 0. Cómo se usa esta guía

- **Se consulta antes de diseñar o implementar cualquier pantalla o componente**, y su lista de verificación (sección 10) se revisa antes de dar una entrega por terminada.
- **Reglas visuales aquí; pantallas en el SDD.** Colores, contraste, tipografía, tamaños, componentes y reglas de Android viven en esta guía. Qué lleva cada pantalla está en el SDD 9.
- **Figma manda en el acomodo; esta guía, en los colores y los acabados.** Los mockups definen la composición de cada pantalla. Por decisión del usuario, la app ya no usa sus colores, y las pantallas de Figma no se modifican (solo se leen). Si un mockup rompe una regla de accesibilidad, se ajusta lo mínimo y se anota en el SDD 9.
- **Colores solo por tokens.** Los valores viven en `src/theme/tokens.js`; nunca se escriben códigos hex sueltos en los componentes.
- **Impeccable es la revisión, no la regla.** Las pantallas pasan por la skill Impeccable (`shape` antes de crearlas; `critique`, `audit` y `polish` antes de entregarlas), con el contexto de `PRODUCT.md` y `DESIGN.md`. Si sugiere algo contrario a esta guía, a un mockup o a una decisión del usuario, gana lo ya decidido y la diferencia se le presenta al usuario. Si esta guía cambia, se actualiza `DESIGN.md`.

## 1. Paleta de colores

| Rol | Token | HEX | Uso principal |
| --- | --- | --- | --- |
| Fondo | `bg` | #FBFBF6 | Fondo liso de pantalla |
| Superficie | `campo` | #FFFFFF | Tarjetas, campos, barra inferior, menús y diálogos |
| Principal | `accent` | #2E7D4F | Botón principal, selección, casilla marcada, barra de avance, pestaña activa y texto de acento |
| Texto | `ink` | #1E2A22 | Títulos, párrafos e iconos neutros |

### Derivados

| Token | HEX | Uso |
| --- | --- | --- |
| `accent-oscuro` | #24663F | Botón principal presionado |
| `accent-claro` | #DFF2E4 | Estado presionado, opción elegida, píldora de la pestaña activa, etiquetas, ⋮ con el menú abierto |
| `ink-soft` | #566459 | Texto de apoyo |
| `borde` | #859488 | Bordes de controles: campos, casillas y opciones sin elegir |
| `divisor` | #D6E8DB | Líneas decorativas, pista de las barras de avance, botón deshabilitado |
| `error` | #B8493D | Borde, icono y texto de error |
| `error-claro` | #FBE3DF | Fondo de los avisos de error |
| `peligro` | #C62828 | «Quitar» y «Eliminar», y el botón de los diálogos de borrar |
| `confirmar` | #2E7D4F | «Agregar», ✓ verde del plan, y el botón de los diálogos de agregar |
| `blanco` | #FFFFFF | Texto e iconos sobre `accent`, `peligro` y `confirmar` |
| `placeholder` | #46484E al 80% | Texto de ejemplo dentro de los campos |

### Monedas

| Token | HEX | Uso |
| --- | --- | --- |
| `moneda` y `moneda-claro` | #B7791F y #E9B44C | Icono de la moneda rellena |
| `moneda-fondo` | #FFF0CC | Píldora del saldo |
| `moneda-texto` | #7A4F0E | Cantidad de monedas |

### Tintes por área (`tintes` en `tokens.js`)

| Área | HEX |
| --- | --- |
| Salud física | #FDE8E2 |
| Trabajo / Estudio | #DFEDF9 |
| Salud mental | #E9E6FB |
| Finanzas | #E3F3DF |
| Social | #FCEBD3 |

Se usan en las tarjetas del Jardín y en los iconos de categoría. Identifican el área, pero siempre van acompañados de su nombre.

### Alertas

| Tipo | Fondo | Borde | Icono |
| --- | --- | --- | --- |
| Error | `error-claro` | `error` | Círculo con exclamación |
| Advertencia | #F4D9A8 | #A86F42 | Triángulo |
| Éxito | #DFF2E4 | #2E7D4F | Marca de verificación |
| Informativo | #E8ECE6 | `ink-soft` | Letra i |

## 2. Accesibilidad y contraste (WCAG 2.1 y Android)

Mínimos según las guías de accesibilidad de Android y WCAG 2.1 AA:

- **Texto:** al menos **4.5:1**.
- **Texto grande:** desde 18.66 px en negritas o 24 px normal, al menos **3:1**.
- **Elementos no textuales** (iconos, bordes de controles, casillas): al menos **3:1**.

### Combinaciones medidas

| Combinación | Ratio | Uso |
| --- | --- | --- |
| `ink` sobre `bg` / `campo` | 14.3 / 14.9 | Texto normal sin restricciones |
| `ink-soft` sobre `bg` / `campo` | 6.0 / 6.2 | Texto de apoyo |
| `ink` y `ink-soft` sobre los tintes | 12.2 o más / 5.1 o más | Texto en tarjetas del Jardín |
| Blanco sobre `accent` / `accent-oscuro` | 5.0 / 6.9 | Botones, casilla marcada y selección |
| `accent` sobre `bg` / `campo` | 4.9 / 5.0 | Texto de acento y enlaces |
| `accent` sobre `accent-claro` | 4.3 | Icono de la pestaña activa (3:1 cumple) |
| `accent` sobre `divisor` | 3.9 | Barra de avance (3:1 cumple) |
| `borde` sobre `bg` / `campo` | 3.1 / 3.2 | Bordes de controles (3:1 cumple) |
| `ink-soft` sobre `divisor` | 4.9 | Texto de un botón deshabilitado |
| `error` sobre `campo` / `error-claro` | 5.2 / 4.2 | Texto de error sobre `campo`; icono y borde sobre `error-claro` |
| `ink` sobre `error-claro` | 12.2 | Texto de los avisos de error |
| `moneda-texto` sobre `moneda-fondo` | 6.3 | Saldo |
| `moneda` sobre `moneda-fondo` | 3.2 | Icono de la moneda (3:1 cumple) |
| `placeholder` sobre `campo` | 5.2 | Texto de ejemplo |
| `peligro` / `confirmar` sobre `campo` | 5.6 / 5.0 | Enlaces de texto rojos y verdes |

### Combinaciones prohibidas

| Combinación | Ratio | Motivo |
| --- | --- | --- |
| Texto `accent` sobre `accent-claro` | 4.3 | Por debajo de 4.5: el texto va en `ink` |
| `moneda` como texto | 3.5 | Por debajo de 4.5: usar `moneda-texto` |
| `divisor` como borde de control | 1.3 | Por debajo de 3: los controles llevan `borde` |
| Texto `error` sobre `error-claro` | 4.2 | Por debajo de 4.5: el texto del aviso va en `ink` |

Las tarjetas `campo` sobre el fondo se distinguen por su sombra, que es lo que Material acepta. No se usan como única señal de un estado.

### Reglas derivadas

1. Todo el texto va en `ink`, `ink-soft`, `accent`, `moneda-texto` o `error`. El blanco solo se usa sobre rellenos `accent`, `peligro` y `confirmar`.
2. El botón principal lleva texto blanco de 19 px en negritas, sin borde.
3. Nunca se comunica un estado solo con color. Siempre va acompañado de un icono, texto, tachado o negritas. Por ejemplo: la opción elegida lleva ✓ y negritas, el hábito hecho se tacha, el pausado muestra ⏸ y el error muestra una X con su mensaje.
4. Todo elemento interactivo tiene `accessibilityRole`, `accessibilityLabel` y, cuando aplica, `accessibilityState`. Las imágenes decorativas se ocultan al lector de pantalla.
5. Anillo de foco visible para teclado externo: 3 px en `ink`.

## 3. Tipografía

Lexend Deca (`@expo-google-fonts/lexend-deca`), con la del sistema como respaldo. Tamaños en sp: respetan el tamaño de letra del sistema.

| Nivel | Tamaño | Peso |
| --- | --- | --- |
| H1 | 32 | 700 |
| H2 | 24 | 700 |
| H3 | 20 | 600 |
| Cuerpo | 16 | 400 |
| Pequeño | 14 | 400 |
| Botón | 19 | 700 |
| Etiqueta de pestaña | 12 | 400, o 700 si está activa |

- Nada por debajo de 12 sp.
- **Escalado del sistema hasta 2×** (Android llega a 200%). Solo las etiquetas de la barra de pestañas se limitan a 1.3×.
- Nunca alturas fijas para el texto: los contenedores crecen con él.
- **Negritas al elegir:** cuando un texto pasa a negritas al seleccionarse, se usa `StableBoldText`, que reserva el ancho para que nada se mueva.
- **Tachado:** en Android el tachado del sistema casi no se ve con Lexend. Para un renglón se dibuja una línea de 2 px en `ink-soft`.

## 4. Espaciado, rejilla y formas

- **Espaciado:** unidad base de 8 (4, 8, 16, 24, 32, 48, 64).
- **Márgenes laterales de pantalla:** 32 dp, como en los mockups. Material sugiere 16 dp en teléfonos; si una pantalla necesita más ancho, se baja a 16.
- **Radios:** 12 en campos y botones de diálogo; 16 en el botón cuadrado de acción; 20 en tarjetas y diálogos; 999 en casillas, botones píldora, chips y barras.
- **Sombra de tarjeta:** color `ink`, opacidad 0.10, radio 8, desplazamiento vertical de 2; en Android, `elevation` 2. No se usan bordes oscuros para separar superficies.

## 5. Componentes (`src/components/ui` y `src/features/*/components`)

| Componente | Especificación |
| --- | --- |
| `Button` primario | Píldora `accent`, texto blanco de 19 px en negritas, 48 dp de alto. Presionado: `accent-oscuro`. Deshabilitado: `divisor` con texto `ink-soft`. **Uno por pantalla.** |
| `Button` secundario y terciario | Secundario: transparente con borde `borde`. Terciario: texto subrayado, al menos 48 dp de alto. |
| `ActionSquare` | Botón cuadrado `accent` de 48 dp con icono blanco, para la acción principal del encabezado de una pestaña («+», bolsa de la Tienda). |
| `Field` | Fondo `campo`, borde 2 px `borde`, 48 dp de alto, o más con `multiline`. Etiqueta siempre visible arriba, nunca solo el placeholder. **Enfocado:** borde `accent`. **Error:** borde `error` y X dentro; el mensaje va debajo o en un solo aviso bajo los campos (login y registro). **Válido:** ✓ dentro. |
| `OptionChip` | Opción grande con icono opcional y sombra. Sin elegir: `campo` con borde 2 px `divisor` y círculo con borde `borde`. Elegida: relleno `accent-claro`, borde 2 px `accent`, círculo `accent` con ✓ blanca y texto en negritas. |
| `ChoicePill` | Píldora de elección. Elegida: relleno `accent` con texto blanco en negritas. Sin elegir: borde `borde`. |
| `DaySquares` | Cuadros L M M J V S D. Elegido: relleno `accent`, texto blanco en negritas. Sin elegir: borde `borde`. La zona táctil se amplía con `hitSlop`. |
| `SettingsRow` | Fila «Etiqueta — valor >» de al menos 48 dp. Sin acción, se muestra sin flecha. Con letra grande, la etiqueta baja de línea. |
| `WheelColumn` | Rueda de 3 opciones de 48 dp; la elegida va en negritas entre dos líneas `accent`. Tocar otra opción la elige. Con `escribible` (números), tocar la del centro abre un campo numérico que se ajusta al rango. Con TalkBack se ajusta deslizando arriba o abajo. La usan la fecha, la duración del hábito y el tiempo diario de Perfil (las dos últimas con `DurationWheels` y `DialogActions`). |
| `ProgressSteps` | Barra «1/3» dentro de una píldora: pista `divisor`, relleno `accent` y texto blanco. |
| `Dialog` / `ConfirmDialog` | Tarjeta `campo` sobre fondo `ink` al 40%. Botones de 48 dp: «Cancelar» con borde `borde` y la acción en `accent`, `peligro` o `confirmar`. Se cierra con el botón «atrás». |
| Globo de menú (`HabitMenu`) | `campo` con sombra, anclado al ⋮. Se abre hacia arriba si no cabe abajo y crece con la letra del sistema. Filas de 48 dp con icono, texto y `>`; «Eliminar» va en `peligro`. |
| Tarjeta de hábito (`HabitCheckCard`) | `campo` con sombra y casilla redonda de 28 dp, con zona táctil de 48. **Hecho:** casilla `accent` con ✓ blanca y título tachado en `ink-soft`. **En pausa:** ⏸ en lugar de la casilla y título tachado. **No toca hoy:** casilla punteada, sin relleno, con el texto «No toca hoy». |
| Saldo (`CoinBalance`) | Píldora `moneda-fondo` con la moneda rellena (`CoinIcon`) y la cantidad en `moneda-texto`. |
| Tarjeta de planta (`PlantPanel`) | Fondo con el tinte de su área, sin sombra. La planta y el nombre del área. |
| Tarjeta de objeto (`AccessoryCard`) | `campo` con sombra: imagen, nombre y precio en una píldora `moneda-fondo`. Sin saldo: «Te faltan N monedas». Propio: ✓ y «Es tuyo». |
| Hoja de compra (`PurchaseSheet`) | Hoja inferior `campo`, con el objeto en un círculo `accent-claro`, tabla sobre `bg` y hasta dos botones. Se cierra tocando fuera o con «atrás». |
| Carrusel de fases (`PhaseCarousel`) | Páginas horizontales y puntos de 48 dp de zona táctil; el actual es más grande y `accent`. Fase bloqueada: silueta `divisor`, candado y texto. |
| Cuadrícula de objetos (`ObjectGrid`) | 3 columnas de celdas con borde `divisor`. Puesto: relleno `accent-claro`, borde `accent` y ✓. Pestañas de tipo fijas abajo, con `ChoicePill`. |
| Icono de categoría | Icono `ink` sobre un cuadro de 36 dp con el tinte del área, junto al nombre. |
| Tarjeta de reprogramación (`RescheduleCard`) | `campo` con sombra, arriba de la lista de Hoy y dentro de lo que se desplaza. Icono de calendario `accent` sobre un círculo `accent-claro`, mensaje en `ink` y «1 de N» en `ink-soft`. «Elegir otro día» y «Está bien» con borde (no compiten con marcar hábitos) y lado a lado; con letra grande se apilan. «Dejarlo» es un enlace. Sin día libre: solo el mensaje y «Entendido». «Elegir otro día» abre un `Dialog` con los días en `ChoicePill`. |
| `Alert` | Fondo y borde de su tipo (sección 1), siempre con icono y texto. |
| `Snackbar` | Un `Alert` flotante y temporal (5 s) sobre la parte baja de la pantalla, para avisos de una acción en una lista. No mueve el contenido y deja pasar los toques a lo que tiene debajo. |
| `TabBar` | 5 destinos como máximo, sobre `campo`. Se cambia tocando o deslizando entre pantallas; el toque siempre funciona, para no depender solo del gesto. Activo: píldora `accent-claro` detrás del icono `accent` y etiqueta `ink` en negritas. |

**Iconografía:** iconos de línea (lucide), trazo de 2 px y cuadrícula de 24. Los neutros van en `ink`; la moneda es el único icono relleno.

## 6. Reglas de Android (Material)

Fuentes: [Layout basics](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-basics?hl=es-419), [Accesibilidad](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility) y [Edge-to-edge](https://developer.android.com/design/ui/mobile/guides/layout-and-content/edge-to-edge).

| Regla | Cómo se cumple |
| --- | --- |
| **Zona táctil de 48 × 48 dp** | Todo lo tocable mide al menos 48 dp (`h-12`, `min-h-12`). Si el elemento visible es más chico, se amplía con `hitSlop`. |
| **Edge-to-edge y áreas seguras** | Las pantallas usan `Screen`, con `SafeAreaView`. La barra de pestañas y las hojas inferiores respetan el inset inferior. Los modales anclados a un punto de la pantalla usan `statusBarTranslucent`. Nada tocable va bajo las barras del sistema. |
| **Teclado** | El campo activo nunca queda tapado: `Screen` usa `KeyboardAvoidingView` (`height` en Android) y las pantallas con campos van dentro de un scroll. |
| **Botón «atrás» del sistema** | En flujos de varios pasos, como el asistente de hábito, regresa un paso (`BackHandler`). Los diálogos y menús se cierran con él (`onRequestClose`). |
| **Navegación principal** | Abajo y al alcance del pulgar, con 5 destinos como máximo. Deslizar entre pestañas es un atajo: todo se puede hacer también tocando. No se ponen elementos que se deslicen en horizontal dentro de una pestaña, porque el gesto chocaría con el cambio de pantalla. |
| **Pocas acciones por pantalla** | Una acción principal. El contenido relacionado se agrupa en tarjetas. |
| **Encabezado fijo en pantallas con lista** | Título, regresar y monedero o acción quedan fijos; solo se desplaza la lista. Los avisos de una acción usan `Snackbar`, para que no queden fuera de la vista. |
| **Tamaño de letra** | Respetar el del sistema hasta 2× y comprobar que nada se corte. |
| **Orientación** | Solo vertical en la demo. Los diseños para tabletas y pantallas grandes quedan para antes de publicar (Android 16 ignora el bloqueo de orientación en ellas). |

## 7. Distribución del color en pantalla

1. **Lo más amplio:** fondo `bg` y tarjetas `campo`, casi blancos.
2. **Área y recompensa:** tintes por área y dorado de las monedas, donde el contenido lo pide.
3. **Lo menos:** `accent`, reservado a acciones y estados.

Si el verde intenso cubre mucha pantalla, pierde su capacidad de guiar la mirada.

## 8. Principios de UX

- **Una acción principal por pantalla:** un solo botón principal visible.
- **Jerarquía clara:** título, contenido y acción, en ese orden de lectura.
- **Respuesta inmediata:** toda acción responde con un cambio visual en menos de 100 ms. Lo que se guarda sin conexión se ve al instante.
- **Consistencia:** los mismos componentes y colores para los mismos significados.
- **Prevenir errores:** confirmar las acciones destructivas con un diálogo y validar al avanzar de paso.
- **Tono cercano y sin culpa:** tuteo y mensajes que no regañan («Hoy ya ganaste todas tus monedas», «La dejamos para la próxima»).
- **Movimiento sobrio:** de 150 a 250 ms con ease-out. Con «reducir movimiento» se sustituye por un cambio sin animación.

## 9. Mockups y desviaciones registradas

Decisión del usuario: la app reemplaza los colores de Figma por los de esta guía, sin cambiar el acomodo. Además:

- Placeholder al 50%: pasa al 80%.
- Botón de 18 px: pasa a 19 px.
- Zonas táctiles de 44 px: pasan a 48 dp.
- Jardín, tarjetas con borde gris y radio 25: pasan al tinte de su área y radio 20.
- Jardín, márgenes de 10 px: pasan a 16 dp.

También por decisión del usuario:

- Jardín muestra el saldo junto a la bolsa.
- Hoy dice «Tu planta crece con cada paso» en lugar de «Tu árbol crece con cada micro-paso».
- La pestaña «Estadísticas» se llama «Progreso», porque la palabra no cabía en la barra.
- Detalles → Hábitos usa la tarjeta con casilla y menú ⋮, en lugar de la tarjeta simple del mockup.
- La hoja de compra muestra la imagen del objeto, en lugar del icono de marcador del mockup.

## 10. Lista de verificación antes de entregar

- [ ] Todo el texto cumple 4.5:1 (o 3:1 si es grande) y los bordes de controles e iconos, 3:1. Se calcula con los tokens; no basta con verlo a ojo.
- [ ] Todo lo tocable mide 48 dp o más.
- [ ] Ningún estado depende solo del color.
- [ ] Un solo botón principal por pantalla, y el verde intenso reservado a acciones y estados.
- [ ] Probado con la letra del sistema al 200%: nada se corta ni se encima.
- [ ] Probado con TalkBack: todo se anuncia con nombre, rol y estado; los títulos son encabezados.
- [ ] El teclado no tapa el campo activo.
- [ ] El botón «atrás» del sistema hace lo esperado: regresa un paso o cierra el diálogo.
- [ ] Estados de carga, vacío y error en cada pantalla.
- [ ] Sin códigos hex sueltos en los componentes: todo sale de los tokens.
- [ ] Probado con simulación de daltonismo (deuteranopía y protanopía), donde el verde y el rojo de error pueden acercarse.
