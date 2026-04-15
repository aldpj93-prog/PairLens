import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        root: '#080808',
        surface1: '#111111',
        surface2: '#181818',
        border: '#252525',
        'border-em': '#333333',
        primary: '#e2e2e2',
        secondary: '#7a7a7a',
        tertiary: '#4a4a4a',
        accent: '#c8a96e',
        positive: '#4a7c59',
        negative: '#8c3f3f',
        neutral: '#5a5a6a',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '3px',
        lg: '3px',
        xl: '3px',
        '2xl': '3px',
        full: '3px',
      },
    },
  },
  plugins: [],
}
export default config
