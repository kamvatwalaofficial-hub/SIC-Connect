/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Samsung One UI–inspired brand ramp, anchored on Samsung Blue (#1428A0).
        brand: {
          50: '#eef3ff',
          100: '#dae6ff',
          200: '#b8ccff',
          300: '#8aabf7',
          400: '#5480ee',
          500: '#2b55d6',
          600: '#1428a0', // Samsung Blue
          700: '#102184',
          800: '#0e1b66',
          900: '#0d1852',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        // Soft, low-contrast elevation for a calm, premium surface.
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
        'card-hover': '0 10px 28px -8px rgba(20, 40, 160, 0.16)',
        header: '0 1px 0 rgba(16, 24, 40, 0.05)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.28s ease-out both',
        'scale-in': 'scale-in 0.2s ease-out both',
      },
    },
  },
  plugins: [],
};
