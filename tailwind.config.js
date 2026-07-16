/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.08)',
        pop: '0 20px 45px -15px rgb(15 23 42 / 0.25)',
        glow: '0 8px 24px -10px rgb(37 99 235 / 0.35)',
      },
      colors: {
        // Superfícies (navy espacial — do fundo da página aos cartões)
        surface: {
          950: '#060a14',
          900: '#0a1120', // fundo da página
          850: '#0e1730',
          800: '#121d38', // cartões / painéis
          750: '#16223f',
          700: '#1e2b49', // bordas / hover
          600: '#293a5c',
        },
        // Azul da marca LISAT (do logo: #3a76d9)
        brand: {
          50: '#eef4fc',
          100: '#d9e6f9',
          200: '#b9d0f3',
          300: '#8fb2ea',
          400: '#6193e1',
          500: '#3a76d9',
          600: '#2c62c4',
          700: '#264fa0',
          800: '#234584',
          900: '#21396b',
        },
        // Realce ciano para detalhes "tech"
        glow: {
          400: '#38bdf8',
          500: '#0ea5e9',
        },
      },
    },
  },
  plugins: [],
}
