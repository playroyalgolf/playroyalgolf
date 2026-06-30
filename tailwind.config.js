/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fairway: '#1F3D2B',
        fairwayDark: '#142A1D',
        cream: '#F6F2E7',
        paper: '#FFFDF8',
        flag: '#C84B31',
        tan: '#E4D6B6',
        ink: '#23281F',
        inkSoft: '#5C6356',
        gold: '#B98F33',
        line: '#DCD2B6',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
