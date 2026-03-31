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
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: '#818CF8',
          pale: '#EEF2FF',
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        accent: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
          pale: '#EDE9FE',
        },
        text: {
          primary: '#1E293B',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
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
        card: '0 1px 3px 0 rgb(0 0 0 / 0.03), 0 1px 2px -1px rgb(0 0 0 / 0.03)',
        'card-hover': '0 10px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
        soft: '0 2px 8px -2px rgb(0 0 0 / 0.06)',
        glow: '0 0 24px -4px rgb(99 102 241 / 0.25)',
        'glow-sm': '0 0 12px -2px rgb(99 102 241 / 0.15)',
        'inner-glow': 'inset 0 1px 0 0 rgb(255 255 255 / 0.1)',
        'elevated': '0 4px 16px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'float': '0 20px 40px -12px rgb(0 0 0 / 0.12)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-primary': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        'gradient-warm': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #667eea 0%, #06B6D4 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
        'gradient-mint': 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      },
    },
  },
  plugins: [],
}
