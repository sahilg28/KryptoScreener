/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        'heading-1': ['2.5rem', { lineHeight: '3rem', fontWeight: '600' }],
        'heading-2': ['2rem', { lineHeight: '2.5rem', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
};