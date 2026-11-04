# Guía de UX/UI

Sistema visual de Habit Green: paleta cálida y natural con la regla 60-30-10, aplicada a React Native y a las guías de diseño de Android (Material).

## 0. Cómo se usa esta guía

- **Se consulta antes de diseñar o implementar cualquier pantalla o componente**, y su lista de verificación (sección 10) se revisa antes de dar una entrega por terminada.
- **Reglas visuales aquí; pantallas en el SDD.** Colores, contraste, tipografía, tamaños, componentes y reglas de Android viven en esta guía. Qué lleva cada pantalla está en el SDD 9.
- **Mockups contra accesibilidad.** Los mockups de Figma mandan en composición y estilo. Si un mockup rompe una regla de accesibilidad de esta guía, se ajusta lo mínimo y se anota en el SDD 9. Ya pasó con el texto blanco sobre naranja y con el borde de selección `#C98B58`.
- **Colores solo por tokens.** Los valores viven en `src/theme/tokens.js`; nunca se escriben códigos hex sueltos en los componentes.

## 1. Paleta de colores

| Rol | Proporción | Token | HEX | Uso principal |
| --- | --- | --- | --- | --- |
| Dominante | 60% | `bg` | #C4D18B | Fondo de pantalla (degradado desde `crema`) |
| Secundario | 30% | `surface` | #C98B58 | Rellenos de selección, casilla marcada, barras de progreso, píldoras elegidas |
| Acento | 10% | `accent` | #D1665A | CTA, botón «+», indicador de pestaña activa |
| Texto | n/a | `ink` | #2C1E18 | Títulos, párrafos e iconos neutros |

### Derivados

| Token | HEX | Uso |
| --- | --- | --- |
| `crema` | #F2F4E6 | Parte superior del degradado de fondo |
| `campo` | #F8F9F2 | Tarjetas claras, campos, opciones y diálogos |
| `bg-claro` | #D6E0A9 | Estado presionado sobre `campo`, panel de plantas, ⋮ con el menú abierto |
| `bg-oscuro` | #A9B870 | Divisores, botón deshabilitado, borde del globo de menú |
| `surface-claro` | #DBA67D | Etiqueta de categoría |
| `surface-oscuro` | #A86F42 | **Bordes** de selección, de la casilla marcada y de la tarjeta hecha o en pausa (no se usa como texto) |
| `accent-oscuro` | #B8493D | CTA presionado, borde de error, icono de la moneda |
| `accent-claro` | #F0C3BC | Fondo de los avisos de error |
| `ink-soft` | #5A4034 | Texto de apoyo, bordes de campos, casillas y días sin elegir |
| `texto-naranja` | #724B2D | Texto naranja: saldo, «N de M hechos», «Editar», fila destacada, títulos naranjas de los mockups |
| `placeholder` | #46484E al 80% | Texto de ejemplo dentro de los campos |
| `peligro` | #C62828 | «Quitar» y «Eliminar», y el botón de los diálogos de borrar |
| `confirmar` | #2E7D32 | «Agregar», ✓ verde del plan, y el botón de los diálogos de agregar |
| `blanco` | #FFFFFF | Solo como texto sobre `peligro` y `confirmar` |

### Alertas

| Tipo | Fondo | Borde | Icono |
| --- | --- | --- | --- |
| Error | `accent-claro` | `accent-oscuro` | Círculo con exclamación |
| Advertencia | #F4D9A8 | `surface-oscuro` | Triángulo |
| Éxito | `bg-claro` | #5E6B2B | Marca de verificación |
| Informativo | #E8DCC8 | `ink-soft` | Letra i |

## 2. Accesibilidad y contraste (WCAG 2.1 y Android)

Mínimos según las guías de accesibilidad de Android y WCAG 2.1 AA:

- **Texto:** al menos **4.5:1**.
- **Texto grande:** desde 18.66 px en negritas o 24 px normal, al menos **3:1**.
- **Elementos no textuales** (iconos, bordes de controles, casillas): al menos **3:1**.

### Combinaciones medidas

| Combinación | Ratio | Uso |
| --- | --- | --- |
| `ink` sobre `bg` / `crema` / `campo` | 9.8 / 14.4 / 15.2 | Texto normal sin restricciones |
| `ink` sobre `surface` | 5.6 | Texto normal y la ✓ de la casilla marcada |
| `ink` sobre `accent` | 4.4 | Solo texto grande en negritas: botón de 19 px |
| `ink-soft` sobre `bg` / `campo` | 5.8 / 8.9 | Texto de apoyo y bordes de controles |
| `texto-naranja` sobre `bg` / `crema` / `campo` | 4.7 / 6.8 / 7.2 | Texto naranja |
| `placeholder` sobre `campo` | 5.0 | Texto de ejemplo |
| `peligro` / `confirmar` sobre `campo` | 5.3 / 4.8 | Enlaces de texto rojos y verdes |
| Blanco sobre `peligro` / `confirmar` | 5.6 / 5.1 | Botones de los diálogos |
| `accent-oscuro` sobre `crema` | 4.6 | Icono de la moneda |
| `surface-oscuro` sobre `campo` | 4.0 | Bordes de selección (3:1 cumple) |

### Combinaciones prohibidas

| Combinación | Ratio | Motivo |
| --- | --- | --- |
| `surface-oscuro` como texto sobre `bg` | 2.6 | Por debajo de 4.5: usar `texto-naranja` |
| Blanco sobre `accent` | 3.6 | Texto normal ilegible: el CTA lleva texto `ink` |
| `#46484E` al 50% como placeholder | 2.5 | Por debajo de 4.5: usar el token `placeholder` (80%) |
| `surface` como borde sobre `campo` | 2.7 | Por debajo de 3: los bordes de selección van en `surface-oscuro` |
| `bg-oscuro` como borde de control sobre `campo` | 2.0 | Por debajo de 3: las casillas y los días sin elegir van con borde `ink-soft` |
| `accent` sobre `bg` | 2.2 | El botón coral necesita borde `ink` de 2 px |

Las tarjetas `campo` sobre el fondo claro (1.5:1) se distinguen por su sombra, que es lo que Material acepta. No se usan como única señal de un estado.

### Reglas derivadas

1. Todo el texto va en `ink`, `ink-soft` o `texto-naranja`. El blanco solo se usa sobre `peligro` y `confirmar`.
2. El botón CTA lleva texto `ink` de 19 px en negritas y borde de 2 px en `ink`.
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
- **Radios:** 8 en campos, casillas y botones cuadrados; 16 en tarjetas y diálogos; 999 en botones píldora, chips y barras.
- **Sombra de tarjeta:** color `ink`, opacidad 0.18, radio 8, desplazamiento vertical de 2; en Android, `elevation` 3.

## 5. Componentes (`src/components/ui` y `src/features/*/components`)

| Componente | Especificación |
| --- | --- |
| `Button` primario | Píldora `accent`, borde 2 px `ink`, texto `ink` de 19 px en negritas, 48 dp de alto. Presionado: `accent-oscuro`. **Uno por pantalla.** |
| `Button` secundario y terciario | Secundario: transparente con borde `ink`. Terciario: texto subrayado, al menos 48 dp de alto. |
| `Field` | Fondo `campo`, borde 2 px `ink-soft`, 48 dp de alto, o más con `multiline`. Etiqueta siempre visible arriba, nunca solo el placeholder. **Enfocado:** borde `surface`. **Error:** borde `accent-oscuro` y X dentro; el mensaje va debajo o en un solo aviso bajo los campos (login y registro). **Válido:** ✓ dentro. |
| `OptionChip` | Opción grande de `campo` con icono opcional. Elegida: borde 2 px `surface-oscuro`, círculo `surface` con ✓ y texto en negritas. |
| `ChoicePill` | Píldora de elección. Elegida: relleno `surface` con texto `ink` en negritas. Sin elegir: borde `surface-oscuro`. |
| `DaySquares` | Cuadros L M M J V S D. Elegido: relleno `surface`, borde `surface-oscuro` y negritas. Sin elegir: borde `ink-soft`. La zona táctil se amplía con `hitSlop`. |
| `SettingsRow` | Fila «Etiqueta — valor >» de al menos 48 dp. Sin acción, se muestra sin flecha. |
| `ProgressSteps` | Barra «1/3» dentro de una píldora. |
| `Dialog` / `ConfirmDialog` | Tarjeta `campo` con borde coral sobre fondo `ink` al 40%. Botones de 48 dp: «Cancelar» con borde y la acción en `peligro` o `confirmar`. Se cierra con el botón «atrás». |
| Globo de menú (`HabitMenu`) | `bg` con borde `bg-oscuro`, anclado al ⋮. Se abre hacia arriba si no cabe abajo. Filas de 48 dp con icono, texto y `>`; «Eliminar» va en `peligro`. |
| Tarjeta de hábito (`HabitCheckCard`) | `campo` con sombra y casilla de 48 dp. **Hecho:** casilla `surface` con ✓ `ink`, borde `surface-oscuro` y título tachado en `ink-soft`. **En pausa:** ⏸ en lugar de la casilla, título tachado y borde naranja. **No toca hoy:** casilla apagada con el texto «No toca hoy». |
| `Alert` | Fondo y borde de su tipo (sección 1), siempre con icono y texto. |
| `TabBar` | 5 destinos como máximo, sobre `bg`. Activo: indicador `accent` de 4 px, icono `accent-oscuro` y negritas. |

**Iconografía:** iconos de línea (lucide), trazo de 2 px y cuadrícula de 24. Los neutros van en `ink`; solo los destacados usan coral.

## 6. Reglas de Android (Material)

Fuentes: [Layout basics](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-basics?hl=es-419), [Accesibilidad](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility) y [Edge-to-edge](https://developer.android.com/design/ui/mobile/guides/layout-and-content/edge-to-edge).

| Regla | Cómo se cumple |
| --- | --- |
| **Zona táctil de 48 × 48 dp** | Todo lo tocable mide al menos 48 dp (`h-12`, `min-h-12`). Si el elemento visible es más chico, se amplía con `hitSlop`. |
| **Edge-to-edge y áreas seguras** | Las pantallas usan `Screen`, con `SafeAreaView`. La barra de pestañas y las hojas inferiores respetan el inset inferior. Los modales anclados a un punto de la pantalla usan `statusBarTranslucent`. Nada tocable va bajo las barras del sistema. |
| **Teclado** | El campo activo nunca queda tapado: `Screen` usa `KeyboardAvoidingView` (`height` en Android) y las pantallas con campos van dentro de un scroll. |
| **Botón «atrás» del sistema** | En flujos de varios pasos, como el asistente de hábito, regresa un paso (`BackHandler`). Los diálogos y menús se cierran con él (`onRequestClose`). |
| **Navegación principal** | Abajo y al alcance del pulgar, con 5 destinos como máximo. |
| **Pocas acciones por pantalla** | Una acción principal (CTA coral). El contenido relacionado se agrupa en tarjetas. |
| **Tamaño de letra** | Respetar el del sistema hasta 2× y comprobar que nada se corte. |
| **Orientación** | Solo vertical en la demo. Los diseños para tabletas y pantallas grandes quedan para antes de publicar (Android 16 ignora el bloqueo de orientación en ellas). |

## 7. Distribución 60-30-10 en pantalla

1. **60%:** fondo (degradado de `crema` a `bg`) y áreas amplias.
2. **30%:** tarjetas, rellenos de selección y barras en `surface`.
3. **10%:** CTA, botón «+», indicador activo y alertas en `accent`.

Si el coral aparece en más del 10–12% de la pantalla, pierde su capacidad de guiar la mirada.

## 8. Principios de UX

- **Una acción principal por pantalla:** un solo botón coral visible.
- **Jerarquía clara:** título, contenido y acción, en ese orden de lectura.
- **Respuesta inmediata:** toda acción responde con un cambio visual en menos de 100 ms. Lo que se guarda sin conexión se ve al instante.
- **Consistencia:** los mismos componentes y colores para los mismos significados.
- **Prevenir errores:** confirmar las acciones destructivas con un diálogo y validar al avanzar de paso.
- **Tono cercano y sin culpa:** tuteo y mensajes que no regañan («Hoy ya ganaste todas tus monedas», «La dejamos para la próxima»).
- **Movimiento sobrio:** de 150 a 250 ms con ease-out. Con «reducir movimiento» se sustituye por un cambio sin animación.

## 9. Mockups y desviaciones registradas

Cuando un mockup no cumple una regla, se aplica el ajuste mínimo y se anota en el SDD 9:

- Texto blanco del mockup sobre naranja o coral: pasa a `ink`.
- Borde de selección `#C98B58`: pasa a `surface-oscuro`.
- Placeholder al 50%: pasa al 80%.
- Botón de 18 px: pasa a 19 px.
- Zonas táctiles de 44 px: pasan a 48 dp.

## 10. Lista de verificación antes de entregar

- [ ] Todo el texto cumple 4.5:1 (o 3:1 si es grande) y los bordes de controles e iconos, 3:1. Se calcula con los tokens; no basta con verlo a ojo.
- [ ] Todo lo tocable mide 48 dp o más.
- [ ] Ningún estado depende solo del color.
- [ ] Un solo CTA coral por pantalla y la proporción 60-30-10.
- [ ] Probado con la letra del sistema al 200%: nada se corta ni se encima.
- [ ] Probado con TalkBack: todo se anuncia con nombre, rol y estado; los títulos son encabezados.
- [ ] El teclado no tapa el campo activo.
- [ ] El botón «atrás» del sistema hace lo esperado: regresa un paso o cierra el diálogo.
- [ ] Estados de carga, vacío y error en cada pantalla.
- [ ] Sin códigos hex sueltos en los componentes: todo sale de los tokens.
- [ ] Probado con simulación de daltonismo (deuteranopía y protanopía), donde oliva y coral pueden acercarse.
