/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        espresso: "#3B2923",
        "dark-brown": "#533A2D",
        cream: "#F8F3EA",
        sand: "#E9DDCC",
        forest: "#315C4B",
        "forest-hover": "#26483B",
        sage: "#9CAF96",
        "sage-dark": "#7A8F74",
        terracotta: "#B76E54",
        "terracotta-dark": "#9C573F",
        gold: "#C39A55",
        charcoal: "#292522",
        "border-soft": "#D7C9B8",
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
