import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Nepal Football Identity
        nepal: {
          red: '#C8102E',
          'red-dark': '#A00824',
          'red-darker': '#8B061D',
          blue: '#003893',
          'blue-dark': '#001F4D',
        },
        // Neutral Palette
        dark: {
          base: '#0F172A',
          secondary: '#1A2332',
          tertiary: '#2D3E52',
          hover: '#3A4B63',
          border: '#334155',
        },
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        // Semantic Colors
        semantic: {
          win: '#C8102E',
          loss: '#EF4444',
          draw: '#FCD34D',
          good: '#10B981',
          info: '#003893',
          warning: '#F97316',
        },
      },
      backgroundColor: {
        'dark-primary': '#0F172A',
        'dark-secondary': '#1A2332',
        'dark-tertiary': '#2D3E52',
      },
      borderColor: {
        'dark-border': '#334155',
      },
      textColor: {
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px', letterSpacing: '0.25px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['14px', { lineHeight: '20px' }],
        'lg': ['16px', { lineHeight: '24px' }],
        'xl': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        '2xl': ['28px', { lineHeight: '36px', fontWeight: '700', letterSpacing: '-0.5px' }],
        'stat': ['24px', { lineHeight: '32px', fontWeight: '700', letterSpacing: '-0.5px' }],
      },
      boxShadow: {
        'none': 'none',
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
