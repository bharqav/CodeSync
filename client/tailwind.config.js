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
        // CodeSync Brand - Creamy + Black
        cream: {
          50: '#FEFDFB',
          100: '#F8F6F3',
          200: '#F2EFE9',
          300: '#E8E4DD',
        },
        black: {
          primary: '#1A1A1A',
          hover: '#2D2D2D',
          light: '#F5F5F5',
          dark: '#000000',
        },
        accent: {
          warm: '#D4C5B0',
          light: '#E8E0D5',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#5A5A5A',
          tertiary: '#8A8A8A',
          muted: '#B0B0B0',
        },
        border: {
          light: '#F0EDE6',
          DEFAULT: '#E8E4DD',
          dark: '#D4CFC5',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'sm': '0px 1px 2px rgba(0, 0, 0, 0.04)',
        'md': '0px 2px 4px rgba(0, 0, 0, 0.06), 0px 1px 2px rgba(0, 0, 0, 0.04)',
        'lg': '0px 4px 8px rgba(0, 0, 0, 0.08), 0px 2px 4px rgba(0, 0, 0, 0.06)',
        'xl': '0px 8px 16px rgba(0, 0, 0, 0.10), 0px 4px 8px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
