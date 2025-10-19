/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{svelte,js,ts}'],
  theme: {
    extend: {
      fontFamily: {
        chillax: ['Chillax', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Quicksand', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      // Olive garden
      colors: {
        olive: '#606C38',
        darkOlive: '#283618',
        cream: '#FEFAE0',
        ochre: '#DDA15E',
        burntSienna: '#BC6C25'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
