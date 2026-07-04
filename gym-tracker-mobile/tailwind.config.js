/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#080810',
          secondary: '#0f0f1a',
          card: 'rgba(255,255,255,0.04)',
          border: 'rgba(255,255,255,0.08)',
        },
        brand: {
          primary: '#7c3aed',
          secondary: '#06b6d4',
        },
        status: {
          success: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
          info: '#3b82f6',
        },
        text: {
          primary: '#f8fafc',
          secondary: 'rgba(248,250,252,0.55)',
          muted: 'rgba(248,250,252,0.3)',
        },
        muscle: {
          low: 'rgb(147,197,253)',
          medium: 'rgb(251,191,36)',
          high: 'rgb(249,115,22)',
          max: 'rgb(239,68,68)',
        },
        rank: {
          bronze: '#B45309',
          silver: '#6B7280',
          gold: '#D97706',
          platinum: '#0891B2',
          diamond: '#7C3AED',
          legend: '#DC2626',
        },
        hud: {
          app: '#050B16',
          surface: '#0A1424',
          'surface-elev': '#0A1E3A',
          'surface-deep': '#020810',
          cyan: '#1DC4FF',
          'cyan-bright': '#5DD8FF',
        },
        accent: {
          volt: '#C8FF1D',
          ember: '#FF7A1A',
          pulse: '#FF3D6E',
          regen: '#2BE8A0',
          warn: '#FFB020',
        },
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        mono: ['JetBrainsMono', 'Courier'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
