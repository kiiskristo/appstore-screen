/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
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