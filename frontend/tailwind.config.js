/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core app colors per spec
        app: '#0B1120',
        surface: '#111827',
        card: '#1E293B',

        // Brand blue scale
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },

        // Semantic colors
        success: {
          DEFAULT: '#22C55E',
          50:  '#f0fdf4',
          100: '#dcfce7',
          400: '#4ade80',
          500: '#22C55E',
          600: '#16a34a',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50:  '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#F59E0B',
          600: '#d97706',
        },
        danger: {
          DEFAULT: '#EF4444',
          50:  '#fef2f2',
          100: '#fee2e2',
          400: '#f87171',
          500: '#EF4444',
          600: '#dc2626',
        },

        // Text colors
        'text-primary': '#F8FAFC',
        'text-muted':   '#94A3B8',
        'text-subtle':  '#64748B',

        // Slate extended (for borders etc)
        slate: {
          850: '#172033',
          925: '#0d1526',
          950: '#0B1120',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },

      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },

      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },

      boxShadow: {
        'glow-blue':    '0 0 20px rgba(37,99,235,0.25)',
        'glow-green':   '0 0 20px rgba(34,197,94,0.25)',
        'card':         '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)',
        'card-hover':   '0 4px 24px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)',
        'modal':        '0 25px 80px rgba(0,0,0,0.7)',
        'sidebar':      '4px 0 24px rgba(0,0,0,0.4)',
        'topbar':       '0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.3)',
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':   'radial-gradient(ellipse at 20% 50%, rgba(37,99,235,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.12) 0%, transparent 60%)',
      },

      backdropBlur: {
        xs: '2px',
      },

      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-in':   'slideIn 0.3s cubic-bezier(0.4,0,0.2,1)',
        'slide-up':   'slideUp 0.4s cubic-bezier(0.4,0,0.2,1)',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.4,0,0.2,1)',
        'pulse-slow': 'pulseSlow 8s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
        'float':      'float 6s ease-in-out infinite',
        'bar-grow':   'barGrow 0.8s cubic-bezier(0.4,0,0.2,1) forwards',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.15', transform: 'scale(1)' },
          '50%':      { opacity: '0.3',  transform: 'scale(1.08)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        barGrow: {
          '0%':   { height: '0%' },
          '100%': { height: 'var(--bar-height)' },
        },
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '68': '17rem',
        '72': '18rem',
        '76': '19rem',
        '80': '20rem',
      },
    },
  },
  plugins: [],
}
