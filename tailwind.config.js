/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./work.html",
    "./components/**/*.html",
    "./works/**/*.html",
    "./services/**/*.html",
    "./legal/**/*.html",
    "./assets/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        ink: '#151210',
        cream: '#F5F1EB',
        brand: '#C93708',
        brandDisplay: '#E8400A',
        brandLight: '#E8400A',
      },
      fontFamily: {
        inter: ['Inter', 'Inter Fallback', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'Inter Fallback', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Archivo Expanded"', 'Archivo', 'Archivo Fallback', 'sans-serif'],
        heading: ['"Archivo Expanded"', 'Archivo', 'Archivo Fallback', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
