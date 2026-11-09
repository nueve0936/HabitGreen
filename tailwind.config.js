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
