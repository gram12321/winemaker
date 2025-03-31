/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          DEFAULT: "#722F37",
          dark: "#4A1E23",
          light: "#A3454F",
        },
        vineyard: {
          DEFAULT: "#6B8E23",
          dark: "#556B2F",
          light: "#9ACD32",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
} 