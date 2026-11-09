// Fuente única de los tokens de diseño (guía de UX/UI, sección 1). La usan tailwind.config.js (clases
// de NativeWind) y el código TypeScript que necesita valores sueltos (iconos, sombras). Está en
// JavaScript porque tailwind.config.js no puede importar TypeScript.

const colors = {
  // Fondo de pantalla y tarjetas.
  bg: '#FBFBF6',
  campo: '#FFFFFF',
  // Texto.
  ink: '#1E2A22',
  'ink-soft': '#566459',
  // Bordes de controles (3:1 sobre fondo y tarjeta) y líneas decorativas o pistas de progreso.
  borde: '#859488',
  divisor: '#D6E8DB',
  // Color principal: botones, selección, casilla marcada, barra de avance, pestaña activa y texto
  // de acento. Lleva texto blanco (5:1).
  accent: '#2E7D4F',
  'accent-oscuro': '#24663F',
  // Fondos suaves: estado presionado, píldora de la pestaña activa y etiquetas. No lleva texto en
  // `accent` (4.3:1), sino en `ink`.
  'accent-claro': '#DFF2E4',
  // Errores: se separan del color principal para que nunca se confundan con una acción.
  error: '#B8493D',
  'error-claro': '#FBE3DF',
  // Monedas: la recompensa tiene su propio color.
  moneda: '#B7791F',
  'moneda-claro': '#E9B44C',
  'moneda-fondo': '#FFF0CC',
  'moneda-texto': '#7A4F0E',
  'alerta-advertencia': '#F4D9A8',
  'alerta-advertencia-borde': '#A86F42',
  'alerta-exito': '#DFF2E4',
  'alerta-exito-borde': '#2E7D4F',
  'alerta-info': '#E8ECE6',
  'alerta-info-borde': '#566459',
  // Acciones de borrar y de agregar en diálogos y enlaces. Llevan texto blanco (más de 5:1).
  peligro: '#C62828',
  confirmar: '#2E7D4F',
  blanco: '#FFFFFF',
  // Texto de ejemplo dentro de los campos: #46484E al 80 %.
  placeholder: 'rgba(70, 72, 78, 0.8)',
};

// Un tinte suave por área, para tarjetas e iconos. Sobre ellos el texto va en `ink` o `ink-soft`.
const tintes = {
  salud_fisica: '#FDE8E2',
  trabajo: '#DFEDF9',
  salud_mental: '#E9E6FB',
  finanzas: '#E3F3DF',
  social: '#FCEBD3',
};

// Lexend Deca, según los mockups de Figma. Cada peso es una familia distinta en React Native.
const fonts = {
  regular: 'LexendDeca_400Regular',
  medium: 'LexendDeca_500Medium',
  semibold: 'LexendDeca_600SemiBold',
  bold: 'LexendDeca_700Bold',
};

module.exports = { colors, tintes, fonts };
