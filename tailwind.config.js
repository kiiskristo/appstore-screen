/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': '#4a6bff',
        'secondary': '#45caff',
      },
      borderRadius: {
        'custom': '8px',
      },
    },
  },
  plugins: [],
} 