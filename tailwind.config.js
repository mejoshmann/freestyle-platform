/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'freestyle-red': '#ED4137',
        'freestyle-dark': '#1a1a2e',
      },
    },
  },
  plugins: [],
}
