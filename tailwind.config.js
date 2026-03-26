/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whapigen: {
          empty: '#050505',
          cyan: '#00F0FF',
          green: '#00FF00',
          red: '#FF3131',
          panel: '#111111',
          border: '#222222'
        }
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        jetbrains: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'digital-grid': 'radial-gradient(circle, #00F0FF 1px, transparent 1px)',
        'scanlines': 'linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.5) 50%)',
      },
      boxShadow: {
        'neon-cyan': '0 0 10px #00F0FF, 0 0 20px #00F0FF',
        'neon-green': '0 0 10px #00FF00, 0 0 20px #00FF00',
        'neon-red': '0 0 10px #FF3131, 0 0 20px #FF3131',
      }
    },
  },
  plugins: [],
}
