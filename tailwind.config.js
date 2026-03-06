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
      },
      boxShadow: {
        card: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      },
      minHeight: {
        topbar: '56px',
      },
    },
  },
  plugins: [],
}
