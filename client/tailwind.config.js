/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f0f0f5',
          100: '#d1d1e0',
          200: '#a3a3c2',
          300: '#7575a3',
          400: '#474785',
          500: '#2d2d5e',
          600: '#1e1e3f',
          700: '#171730',
          800: '#111124',
          900: '#0b0b18',
          950: '#07070f',
        },
        primary: {
          50: '#f0edff',
          100: '#d9d1ff',
          200: '#b3a3ff',
          300: '#8c75ff',
          400: '#7c6cf0',
          500: '#6C5CE7',
          600: '#5a49cc',
          700: '#4837a6',
          800: '#362680',
          900: '#241559',
        },
        accent: {
          green: '#00B894',
          red: '#FF6B6B',
          orange: '#E17055',
          blue: '#74B9FF',
          yellow: '#FDCB6E',
          pink: '#FD79A8',
          cyan: '#00CEC9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: 0, transform: 'translateX(20px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
