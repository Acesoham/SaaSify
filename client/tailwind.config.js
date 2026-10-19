/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // New SaaS light theme — lime + off-white
        brand: {
          lime:    '#C4F13B',
          'lime-hover': '#B3DF30',
          'lime-soft': '#EFF9D4',
        },
        surface: {
          bg:      '#F8F9F5',
          card:    '#FFFFFF',
          secondary: '#F1F3ED',
          sidebar: '#171820',
        },
        text: {
          primary:   '#171820',
          secondary: '#6B7068',
          muted:     '#969A92',
        },
        border: {
          DEFAULT: '#E5E7E0',
          light:   '#F0F2EB',
        },
        state: {
          success: '#287D48',
          warning: '#A96612',
          error:   '#C43D3D',
          info:    '#3478B9',
        },
        // Aliases kept for legacy references (dark mode tokens remapped to new palette)
        dark: {
          50:  '#F8F9F5',
          100: '#F1F3ED',
          200: '#E5E7E0',
          300: '#C8CBBA', // was dark-300 in body text
          400: '#969A92',
          500: '#6B7068',
          600: '#4A4D45',
          700: '#2F3229',
          800: '#1E2118',
          900: '#171820',
          950: '#0F1009',
        },
        primary: {
          50:  '#EFF9D4',
          100: '#DFF4A4',
          200: '#CBEC6A',
          300: '#C4F13B',
          400: '#B3DF30',
          500: '#C4F13B',  // lime (primary CTA color)
          600: '#B3DF30',
          700: '#96BE1A',
          800: '#738F12',
          900: '#50650C',
        },
        accent: {
          green:  '#287D48',
          red:    '#C43D3D',
          orange: '#A96612',
          blue:   '#3478B9',
          yellow: '#D4A017',
          pink:   '#B05C8A',
          cyan:   '#1E8FA0',
          purple: '#C4F13B', // remapped to lime for consistency
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in':       'fadeIn 0.3s ease-out',
        'slide-up':      'slideUp 0.3s ease-out',
        'slide-in-right':'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%':   { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: 0, transform: 'translateX(20px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        card:  '0 1px 3px rgba(23,24,32,0.06), 0 1px 2px rgba(23,24,32,0.04)',
        'card-hover': '0 4px 12px rgba(23,24,32,0.08), 0 2px 4px rgba(23,24,32,0.04)',
        lime:  '0 4px 14px rgba(196,241,59,0.25)',
      },
    },
  },
  plugins: [],
};
