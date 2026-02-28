/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'deep-navy': 'rgb(var(--color-deep-navy) / <alpha-value>)',
        'lighter-navy': 'rgb(var(--color-lighter-navy) / <alpha-value>)',
        'accent-surface': 'rgb(var(--color-accent-surface) / <alpha-value>)',
        'tomato': 'rgb(var(--color-tomato) / <alpha-value>)',
        'off-white': 'rgb(var(--color-off-white) / <alpha-value>)',
        'gray-text': 'rgb(var(--color-gray-text) / <alpha-value>)',
        'soft-green': 'rgb(var(--color-soft-green) / <alpha-value>)',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
