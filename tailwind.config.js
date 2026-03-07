/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E40AF',
          hover: '#1D4ED8',
          light: '#3B82F6',
          pale: '#DBEAFE',
        },
        accent: {
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
          pale: '#EDE9FE',
        },
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
      },
      borderRadius: {
        input: '12px',
        button: '12px',
      },
      minHeight: {
        button: '44px',
        topbar: '56px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
        soft: '0 2px 8px -2px rgb(0 0 0 / 0.08)',
        glow: '0 0 20px -5px rgb(30 64 175 / 0.15)',
      },
    },
  },
  plugins: [],
}
