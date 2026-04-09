/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'volcanic-ash': '#2D2A26',
        'deep-rust': '#8B3A2B',
        'molten-core': '#E85D04',
        'ember-glow': '#FFB703',
        'ash-white': '#F5F2EB',
        'bloodstone': '#A41623',
        'sulfur-green': '#6A994E',
        'cinder-grey': '#3E3B37',
        'amber-shard': '#F48C06',
        'crimson-vein': '#BA181B',
        'weathered-bronze': '#9C7A4D',
        'forged-gold': '#D4AF37',
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        body: ['"Rajdhani"', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 8px rgba(232,93,4,0.4)' },
          '50%': { boxShadow: '0 0 24px rgba(232,93,4,0.8)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
}
