const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern color palette with soft gradients
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5befa',
          400: '#839df5',
          500: '#6279ed',
          600: '#4c5be0',
          700: '#3e48c5',
          800: '#353d9f',
          900: '#2e357d',
        },
        secondary: {
          50: '#fdf2f8',
          100: '#fce8f3',
          200: '#fad0e7',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#e855a3',
          600: '#d53f8c',
          700: '#bd2a73',
          800: '#9d195c',
          900: '#831a4d',
        },
        neutral: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#868e96',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Keep lavender as an accent color
        lavender: {
          50: '#f3f1f9',
          100: '#e8e4f3',
          200: '#d1cae7',
          300: '#b9afdb',
          400: '#a294cf',
          500: '#8b79c3',
          600: '#7461b7',
          700: '#5d4d9b',
          800: '#4a3d7d',
          900: '#372c5e',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['Lexend', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        // Neumorphic shadows
        'neu-flat': '3px 3px 6px 0 rgba(0, 0, 0, 0.05), -3px -3px 6px 0 rgba(255, 255, 255, 0.8)',
        'neu-pressed': 'inset 2px 2px 5px 0 rgba(0, 0, 0, 0.05), inset -3px -3px 7px 0 rgba(255, 255, 255, 0.8)',
        'neu-convex': '3px 3px 6px 0 rgba(0, 0, 0, 0.1), -3px -3px 6px 0 rgba(255, 255, 255, 0.8), inset 1px 1px 1px 0 rgba(255, 255, 255, 0.2)',
        'neu-concave': 'inset 1px 1px 1px 0 rgba(0, 0, 0, 0.05), inset -1px -1px 1px 0 rgba(255, 255, 255, 0.8), 2px 2px 4px 0 rgba(255, 255, 255, 0.5), -2px -2px 4px 0 rgba(0, 0, 0, 0.05)',
        // Modern soft shadows
        'soft-xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'soft-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'soft-md': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'soft-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
        'soft-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
        'soft-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)'
      },
      borderRadius: {
        'xs': '0.125rem',
        'sm': '0.25rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
        'blob-1': '60% 40% 40% 60% / 60% 30% 70% 40%',
        'blob-2': '40% 60% 60% 40% / 70% 30% 70% 30%',
      },
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '1rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        // Extended spacing scale
        '72': '18rem',
        '80': '20rem',
        '96': '24rem',
        '112': '28rem',
        '128': '32rem',
        '144': '36rem',
      },
      opacity: {
        '5': '0.05',
        '10': '0.1',
        '15': '0.15',
        '85': '0.85',
        '95': '0.95',
        '98': '0.98',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      transitionProperty: {
        'height': 'height',
        'max-height': 'max-height',
        'spacing': 'margin, padding',
      },
      // Specific for neumorphic designs
      backgroundImage: {
        'neu-gradient-1': 'linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(240,240,240,0.1) 100%)',
        'neu-gradient-2': 'linear-gradient(to bottom right, rgba(255,255,255,0.8), rgba(240,240,240,0.2))',
        'neu-gradient-3': 'linear-gradient(to bottom right, rgba(255,255,255,0.2), rgba(240,240,240,0.8))',
        'soft-white': 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
        'soft-primary': 'linear-gradient(145deg, #6279ed 0%, #4c5be0 100%)',
        'soft-secondary': 'linear-gradient(145deg, #e855a3 0%, #d53f8c 100%)',
      },
      // For responsive design
      screens: {
        'xs': '480px',
        ...defaultTheme.screens,
      },
      gridTemplateColumns: {
        'auto-fill-xs': 'repeat(auto-fill, minmax(120px, 1fr))',
        'auto-fill-sm': 'repeat(auto-fill, minmax(180px, 1fr))',
        'auto-fill-md': 'repeat(auto-fill, minmax(240px, 1fr))',
        'auto-fill-lg': 'repeat(auto-fill, minmax(280px, 1fr))',
        'auto-fill-xl': 'repeat(auto-fill, minmax(320px, 1fr))',
      },
      aspectRatio: {
        'square': '1 / 1',
        'video': '16 / 9',
        'portrait': '3 / 4',
        'landscape': '4 / 3',
      },
      zIndex: {
        '-10': '-10',
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    // Custom plugin for neumorphic components
    function({ addComponents, theme }) {
      const neumorphicComponents = {
        '.btn-neu': {
          padding: '0.75rem 1.5rem',
          borderRadius: theme('borderRadius.xl'),
          backgroundColor: '#f0f0f0',
          color: theme('colors.neutral.700'),
          boxShadow: theme('boxShadow.neu-flat'),
          transition: 'all 0.2s ease',
          fontWeight: '500',
          border: 'none',
          outline: 'none',
          '&:hover': {
            boxShadow: '2px 2px 4px 0 rgba(0, 0, 0, 0.1), -2px -2px 4px 0 rgba(255, 255, 255, 0.9)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            boxShadow: theme('boxShadow.neu-pressed'),
            transform: 'translateY(0)',
          },
        },
        '.card-neu': {
          borderRadius: theme('borderRadius.2xl'),
          backgroundColor: '#f0f0f0',
          boxShadow: theme('boxShadow.neu-flat'),
          padding: '1.5rem',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '4px 4px 8px 0 rgba(0, 0, 0, 0.1), -4px -4px 8px 0 rgba(255, 255, 255, 0.9)',
            transform: 'translateY(-5px)',
          },
        },
        '.input-neu': {
          borderRadius: theme('borderRadius.lg'),
          backgroundColor: '#f0f0f0',
          boxShadow: 'inset 2px 2px 5px 0 rgba(0, 0, 0, 0.05), inset -3px -3px 7px 0 rgba(255, 255, 255, 0.6)',
          border: 'none',
          padding: '0.75rem 1rem',
          transition: 'all 0.2s ease',
          '&:focus': {
            boxShadow: 'inset 3px 3px 6px 0 rgba(0, 0, 0, 0.1), inset -3px -3px 6px 0 rgba(255, 255, 255, 0.7)',
            outline: 'none',
          },
        },
        '.switch-neu': {
          position: 'relative',
          width: '60px',
          height: '30px',
          borderRadius: '30px',
          backgroundColor: '#f0f0f0',
          boxShadow: 'inset 2px 2px 5px 0 rgba(0, 0, 0, 0.05), inset -3px -3px 7px 0 rgba(255, 255, 255, 0.8)',
          transition: 'all 0.3s ease',
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'white',
            boxShadow: '2px 2px 5px 0 rgba(0, 0, 0, 0.1)',
            left: '3px',
            top: '3px',
            transition: 'all 0.3s ease',
          },
          '&.active': {
            backgroundColor: theme('colors.primary.500'),
            '&::after': {
              left: '33px',
            },
          },
        },
      };
      
      addComponents(neumorphicComponents);
    },
  ],
  // Add neumorphic-friendly variants
  variants: {
    extend: {
      boxShadow: ['hover', 'focus', 'active'],
      transform: ['hover', 'focus', 'active'],
      translate: ['hover', 'focus', 'active'],
      opacity: ['disabled'],
      cursor: ['disabled'],
      backgroundColor: ['active', 'disabled'],
    },
  },
}