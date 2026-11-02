// Fuente única de los tokens de diseño (SDD 9.2). La usan tailwind.config.js (clases de
// NativeWind) y el código TypeScript que necesita valores sueltos (degradados, iconos, sombras).
// Está en JavaScript porque tailwind.config.js no puede importar TypeScript.

const colors = {
  bg: '#C4D18B',
  'bg-claro': '#D6E0A9',
  'bg-oscuro': '#A9B870',
  // Parte superior del degradado de fondo de los mockups.
  crema: '#F2F4E6',
  // Fondo de campos y opciones de los mockups (casi blanco).
  campo: '#F8F9F2',
  surface: '#C98B58',
  'surface-claro': '#DBA67D',
  'surface-oscuro': '#A86F42',
  accent: '#D1665A',
  'accent-oscuro': '#B8493D',
  'accent-claro': '#F0C3BC',
  ink: '#2C1E18',
  'ink-soft': '#5A4034',
  'alerta-advertencia': '#F4D9A8',
  'alerta-advertencia-borde': '#A86F42',
  'alerta-exito': '#D6E0A9',
  'alerta-exito-borde': '#5E6B2B',
  'alerta-info': '#E8DCC8',
  'alerta-info-borde': '#5A4034',
};

// Lexend Deca, según los mockups de Figma. Cada peso es una familia distinta en React Native.
const fonts = {
  regular: 'LexendDeca_400Regular',
  medium: 'LexendDeca_500Medium',
  semibold: 'LexendDeca_600SemiBold',
  bold: 'LexendDeca_700Bold',
};

module.exports = { colors, fonts };
