/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E85913',
          hover: '#C44A0E',
          light: '#FFF0E6',
        },
        secondary: {
          DEFAULT: '#F5A623',
          light: '#FFF8E7',
        },
        surface: {
          DEFAULT: '#FFFBF7',
          dark: '#1A1210',
        },
        text: {
          primary: '#2D2420',
          secondary: '#6B5B54',
          muted: '#9B8B84',
        },
        accent: {
          green: '#4CAF50',
          red: '#E53935',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
