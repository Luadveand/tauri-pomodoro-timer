/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'deep-navy': '#1a1a2e',
        'lighter-navy': '#16213e',
        'accent-surface': '#0f3460',
        'tomato': '#e94560',
        'off-white': '#f5f5f5',
        'gray-text': '#8892a4',
        'soft-green': '#4ecca3',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

