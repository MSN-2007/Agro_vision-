/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f9f5',
          100: '#e1f2e8',
          200: '#c5e4d2',
          300: '#99ceb3',
          400: '#66b28d',
          500: '#3e956d',
          600: '#2d7856',
          700: '#256046',
          800: '#204d39',
          900: '#1c4030',
          950: '#0e231b',
        },
        earth: {
          50: '#fbf7ee',
          100: '#f5ecd6',
          200: '#edd8ac',
          300: '#e2be79',
          400: '#d7a149',
          500: '#ca842b',
          600: '#b16721',
          700: '#8e4d1d',
          800: '#753f1d',
          900: '#61361c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
