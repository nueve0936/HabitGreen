# Guía de UX/UI

Sistema visual basado en la regla 60-30-10. Paleta cálida, natural y cercana.

## 1. Paleta de colores

| Rol | Proporción | Color | HEX | Uso principal |
| --- | --- | --- | --- | --- |
| Dominante | 60% | Verde oliva claro | #C4D18B | Fondos de pantalla y lienzos generales |
| Secundario | 30% | Terracota | #C98B58 | Tarjetas, barras laterales, navegación, texto secundario |
| Acento | 10% | Coral | #D1665A | Botones CTA, iconos destacados, alertas |
| Texto | n/a | Marrón oscuro | #2C1E18 | Títulos, párrafos, iconos neutros |

### Tokens recomendados

- `--color-bg: #C4D18B`
- `--color-surface: #C98B58`
- `--color-accent: #D1665A`
- `--color-text: #2C1E18`

### Tonos derivados (para estados y profundidad)

| Token | HEX | Uso |
| --- | --- | --- |
| bg-claro | #D6E0A9 | Zonas elevadas sobre el fondo, hover suave |
| bg-oscuro | #A9B870 | Divisores, bordes sobre el fondo |
| surface-claro | #DBA67D | Hover de tarjetas |
| surface-oscuro | #A86F42 | Bordes de tarjetas, estado pressed |
| accent-oscuro | #B8493D | Hover y pressed del botón CTA |
| accent-claro | #F0C3BC | Fondos de mensajes de alerta |
| texto-secundario | #5A4034 | Texto de apoyo sobre fondo oliva |

## 2. Accesibilidad y contraste (WCAG 2.1)

Ratios calculados con el texto #2C1E18:

| Combinación | Ratio | Resultado |
| --- | --- | --- |
| Texto sobre #C4D18B | 9.8:1 | Cumple AAA |
| Texto sobre #C98B58 | 5.6:1 | Cumple AA |
| Texto sobre #D1665A | 4.4:1 | Casi AA: solo para texto grande o en negrita (18 px+) |
| Blanco sobre #D1665A | 3.7:1 | No usar para texto normal |
| #D1665A sobre #C4D18B | 2.2:1 | No alcanza 3:1 como componente de interfaz |
| #C98B58 sobre #C4D18B | 1.8:1 | Las tarjetas necesitan borde o sombra |

### Reglas derivadas

1. Todo texto va en #2C1E18. Nunca usar blanco sobre estos colores.
2. Los botones CTA llevan texto #2C1E18 en peso 600–700 y tamaño mínimo 16 px (idealmente 18 px).
3. Un botón coral sobre fondo oliva debe tener un borde de 2 px en #2C1E18 o #B8493D para ser identificable.
4. Las tarjetas terracota sobre fondo oliva llevan borde de 1 px en #A86F42 y sombra suave.
5. Nunca comunicar un estado solo por color: acompañar con icono y texto.
6. Anillo de foco visible: 3 px en #2C1E18 con 2 px de separación.

## 3. Tipografía

| Nivel | Tamaño | Peso | Interlineado |
| --- | --- | --- | --- |
| H1 | 32 px | 700 | 1.2 |
| H2 | 24 px | 700 | 1.25 |
| H3 | 20 px | 600 | 1.3 |
| Cuerpo | 16 px | 400 | 1.5 |
| Texto pequeño | 14 px | 400 | 1.4 |
| Botón | 16–18 px | 600 | 1 |

- Familia sugerida: una sans-serif humanista (por ejemplo Nunito, Poppins o DM Sans) para reforzar la calidez de la paleta.
- Máximo 65–75 caracteres por línea.
- Pila de respaldo: `system-ui, -apple-system, 'Segoe UI', sans-serif`.

## 4. Espaciado, rejilla y formas

- Unidad base de 8 px. Escala: 4, 8, 16, 24, 32, 48, 64.
- Rejilla de 12 columnas en escritorio, 8 en tableta y 4 en móvil, con márgenes de 16 px en móvil y 24 px en escritorio.
- Radios: 8 px en campos y botones, 16 px en tarjetas, 999 px en chips.
- Sombra base: `0 2px 8px rgba(44, 30, 24, 0.18)`.

## 5. Componentes

### Botones

| Tipo | Fondo | Texto | Borde | Uso |
| --- | --- | --- | --- | --- |
| Primario (CTA) | #D1665A | #2C1E18 | 2 px #2C1E18 | Una acción principal por pantalla |
| Secundario | transparente | #2C1E18 | 2 px #2C1E18 | Acciones alternas |
| Terciario | transparente | #2C1E18 subrayado | ninguno | Enlaces y acciones menores |
| Deshabilitado | #A9B870 | #5A4034 | ninguno | Acción no disponible |

Estados del primario: hover #B8493D, pressed #A63C31, foco con anillo de 3 px. Altura mínima: 48 px. Área táctil mínima: 44 × 44 px.

### Tarjetas

- Fondo #C98B58, texto #2C1E18, borde 1 px #A86F42, radio 16 px, relleno 16–24 px.
- Hover: fondo #DBA67D y elevación ligera.
- Máximo un CTA coral por tarjeta.

### Campos de formulario

- Fondo #D6E0A9, borde 2 px #2C1E18, radio 8 px, altura 48 px.
- Etiqueta siempre visible sobre el campo, nunca solo como placeholder.
- Error: borde #B8493D, fondo #F0C3BC, icono y mensaje de texto debajo.

### Navegación

- Barra lateral o inferior en terracota #C98B58 con texto #2C1E18.
- Elemento activo: fondo #A86F42 con indicador de 4 px en #D1665A y texto en negrita.
- Máximo 5 elementos en la barra inferior móvil.

### Alertas y retroalimentación

| Tipo | Fondo | Borde | Icono |
| --- | --- | --- | --- |
| Error | #F0C3BC | #B8493D | Círculo con exclamación |
| Advertencia | #F4D9A8 | #A86F42 | Triángulo |
| Éxito | #D6E0A9 | #5E6B2B | Marca de verificación |
| Informativo | #E8DCC8 | #5A4034 | Letra i |

### Iconografía

- Estilo de línea, trazo de 2 px, cuadrícula de 24 px.
- Iconos neutros en #2C1E18. Solo los iconos destacados usan coral.

## 6. Distribución 60-30-10 en pantalla

1. 60%: fondo de pantalla y áreas amplias en oliva #C4D18B.
2. 30%: tarjetas, navegación, encabezados de sección en terracota #C98B58.
3. 10%: CTA, indicador de elemento activo, badges y alertas en coral #D1665A.

Si el coral aparece en más de un 10–12% de la pantalla, pierde su capacidad de guiar la mirada.

## 7. Principios de UX

- Una acción principal por pantalla: un solo botón coral visible.
- Jerarquía clara: título, contenido, acción, en ese orden de lectura.
- Retroalimentación inmediata: toda acción responde en menos de 100 ms con un cambio visual.
- Consistencia: mismos componentes, mismos colores para los mismos significados.
- Prevención de errores: confirmar acciones destructivas y validar en línea.
- Diseño móvil primero y áreas táctiles amplias.
- Movimiento sobrio: transiciones de 150–250 ms con curva ease-out, respetando `prefers-reduced-motion`.

## 8. Lista de verificación antes de entregar

- Todo el texto cumple al menos 4.5:1 (o 3:1 si es texto grande).
- Cada pantalla tiene un único CTA coral.
- Ningún estado depende solo del color.
- Foco de teclado visible en todos los elementos interactivos.
- Áreas táctiles de 44 px o más.
- Se respeta la proporción 60-30-10.
- Probado con simulación de daltonismo (deuteranopía y protanopía), donde oliva y coral pueden acercarse.

## 9. Siguientes pasos sugeridos

1. Definir los flujos principales y las pantallas clave.
2. Construir wireframes de baja fidelidad.
3. Maquetar la biblioteca de componentes con los tokens de esta guía.
4. Probar con usuarios reales y ajustar los tonos derivados si hace falta.
