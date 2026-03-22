/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary brand — deep petroleum navy
        navy: {
          50:  '#e8edf5',
          100: '#c5d0e3',
          200: '#9fb0cf',
          300: '#7890bb',
          400: '#5b77ac',
          500: '#3e5e9d',
          600: '#365695',
          700: '#2c4b8a',
          800: '#223f7e',
          900: '#0a2342',
          950: '#071830',
        },
        // Accent — fuel orange
        fuel: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea6c0a',
          700: '#c2550a',
          800: '#9a3e00',
          900: '#7c2d00',
        },
        // Rating spectrum
        rating: {
          great:  '#10b981',
          good:   '#22c55e',
          medium: '#f59e0b',
          bad:    '#ef4444',
          none:   '#94a3b8',
        },
        // Surfaces
        surface: '#f1f5f9',
        card:    '#ffffff',
      },
    },
  },
  plugins: [],
}
