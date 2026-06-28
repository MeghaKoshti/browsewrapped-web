/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#12121a",
        border: "rgba(255,255,255,0.08)",
      },
    },
  },
  plugins: [],
}

