/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'alencar-dark': '#060A13',
        'alencar-green': '#245247',
        'alencar-green-light': '#6B958C',
        'alencar-bg': '#E6F3EE',
        'alencar-sidebar': '#051D1D',
        'alencar-hover': '#3A6F63',
      },
      fontFamily: {
        heading: ['Abel', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        button: '8px',
        tag: '6px',
      },
      boxShadow: {
        card: '0 4px 12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        modal: '0 16px 48px rgba(0, 0, 0, 0.16)',
        glow: '0 0 20px rgba(36, 82, 71, 0.15)',
      },
      spacing: {
        section: '2rem',
        'card-padding': '1.5rem',
        'form-gap': '1.5rem',
      },
    },
  },
  plugins: [],
};
