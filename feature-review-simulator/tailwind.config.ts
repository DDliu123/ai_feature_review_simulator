import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a2e4a',
          dark: '#0f1f35',
          light: '#2a4a6a',
        },
        secondary: {
          DEFAULT: '#1a5fa8',
          dark: '#0f3d6d',
          light: '#2a7fc8',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} satisfies Config