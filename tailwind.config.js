/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Background layers
        bg: {
          base:    '#0d0d14',   // deepest background
          surface: '#13131f',   // sidebar, cards
          card:    '#1a1a2e',   // content cards
          hover:   '#1f1f35',   // hover state
          border:  '#2a2a42',   // borders/dividers
        },
        // Golden accent — matches the screenshots exactly
        gold: {
          DEFAULT: '#d4a017',
          light:   '#e8b82a',
          dark:    '#b8880f',
          muted:   'rgba(212,160,23,0.15)',
        },
        // Text
        text: {
          primary:   '#f0f0f8',
          secondary: '#9090b0',
          muted:     '#5a5a7a',
        },
        // Status badges
        status: {
          member:      { bg: '#1a2e3d', text: '#4a9eca' },
          worker:      { bg: '#2d1f3d', text: '#9b6fd4' },
          leader:      { bg: '#3d2a1a', text: '#d4844a' },
          newconvert:  { bg: '#1a2d1a', text: '#4aaa4a' },
          pending:     { bg: '#2d2d1a', text: '#aaaa4a' },
          contacted:   { bg: '#1a2d2d', text: '#4aaaaa' },
          converted:   { bg: '#1a2d1a', text: '#4aaa6a' },
        },
      },
      fontFamily: {
        sans:    ['"DM Sans"', 'sans-serif'],
        display: ['"Syne"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        card:  '0 2px 20px rgba(0,0,0,0.4)',
        glow:  '0 0 20px rgba(212,160,23,0.2)',
        modal: '0 25px 80px rgba(0,0,0,0.7)',
      },
      animation: {
        'fade-in':      'fadeIn 0.2s ease-out',
        'slide-in':     'slideIn 0.25s ease-out',
        'slide-up':     'slideUp 0.3s ease-out',
        'pulse-gold':   'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn:   { from: { opacity: '0', transform: 'translateX(-10px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGold: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
};
