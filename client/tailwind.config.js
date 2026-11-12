/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        // BlueSPACE design tokens (see docs/DESIGN_SYSTEM.md)
        bluespace: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#c2c2ff',
          300: '#9999ff',
          400: '#6666ff',
          500: '#0000ff',
          600: '#0000ff',
          700: '#0000cc',
          800: '#000099',
          900: '#000066',
          950: '#000033',
        },
        deep: {
          DEFAULT: '#0000ff',
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#c2c2ff',
          300: '#9999ff',
          400: '#6666ff',
          500: '#0000ff',
          600: '#0000ff',
          700: '#0000cc',
          800: '#000099',
          900: '#000066',
        },
        brand: {
          DEFAULT: '#0000ff',
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#c2c2ff',
          300: '#9999ff',
          400: '#6666ff',
          500: '#0000ff',
          600: '#0000ff',
          700: '#0000cc',
          800: '#000099',
          900: '#000066',
        },
        // Domain colors (educational extensions)
        domain: {
          faas: '#0000ff',      // BlueSPACE blue
          fincore: '#10b981',   // emerald-500
          finops: '#f59e0b',    // amber-500
          fininfra: '#64748b',  // slate-500
        },
        // Semantic theme colors mapped to CSS variables in index.css
        background: {
          DEFAULT: 'hsl(var(--background))',
          200: 'var(--ds-background-200)',
        },
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        // Book component tokens
        'gray-alpha': {
          400: 'var(--ds-gray-alpha-400)',
        },
      },
      boxShadow: {
        book: 'var(--ds-shadow-book)',
        'book-border': 'var(--ds-shadow-book-border)',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'ease-in-out-expo': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'ease-drawer': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
    keyframes: {
      'sheet-up': {
        '0%': { transform: 'translateY(100%)' },
        '100%': { transform: 'translateY(0)' },
      },
      'fade-in': {
        '0%': { opacity: '0', transform: 'translateY(6px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      'scale-in': {
        '0%': { opacity: '0', transform: 'scale(0.95)' },
        '100%': { opacity: '1', transform: 'scale(1)' },
      },
    },
    animation: {
      'sheet-up': 'sheet-up 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
      'fade-in': 'fade-in 200ms cubic-bezier(0.23, 1, 0.32, 1) forwards',
      'scale-in': 'scale-in 200ms cubic-bezier(0.23, 1, 0.32, 1) forwards',
    },
  },
  plugins: [],
}
