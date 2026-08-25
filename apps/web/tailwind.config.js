/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'vert-marche': '#158F73',
        'ambre-pagne': '#E2A33B',
        'corail-alerte': '#E2572B',
        'sable-chaud': '#F7F1E4',
        'encre-nuit': '#14231D',
        'brume': '#9BA79C',
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
