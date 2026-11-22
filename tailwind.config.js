const { colors, fonts } = require('./src/theme/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    // Se reemplaza la paleta de Tailwind para que solo existan los tokens del SDD.
    colors: {
      transparent: 'transparent',
      ...colors,
    },
    fontFamily: {
      sans: [fonts.regular],
      medium: [fonts.medium],
      semibold: [fonts.semibold],
      bold: [fonts.bold],
    },
    extend: {
      // Zona táctil de 48 dp (guía de UX/UI, sección 6). NativeWind convierte `rem` con 14 px en
      // nativo, así que `h-12` medía 42 dp; con este valor `h-12`, `min-h-12` y `w-12` miden 48 dp.
      spacing: {
        12: '48px',
      },
      // Escala tipográfica de la guía de UX/UI, sección 3.
      fontSize: {
        h1: ['32px', '40px'],
        h2: ['24px', '32px'],
        h3: ['20px', '28px'],
        body: ['16px', '24px'],
        small: ['14px', '20px'],
        button: ['19px', '24px'],
      },
      borderRadius: {
        field: '12px',
        accion: '16px',
        card: '20px',
        chip: '999px',
      },
    },
  },
  plugins: [],
};
