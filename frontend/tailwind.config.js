/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--bg-background) / <alpha-value>)',
        panel: 'rgb(var(--bg-panel) / <alpha-value>)',
        secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
        primary: 'rgb(var(--border-primary) / <alpha-value>)', // using this for border
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        slate: {
          850: '#111827',
          900: '#0f172a',
          950: '#020617',
        }
      },
      textColor: {
        primary: 'rgb(var(--text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
        muted: 'rgb(var(--text-muted) / <alpha-value>)',
      },
      borderColor: {
        primary: 'rgb(var(--border-primary) / <alpha-value>)',
        secondary: 'rgb(var(--border-secondary) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
