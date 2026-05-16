/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eefcff",
          100: "#d8f6ff",
          200: "#b7ecff",
          300: "#86e0fb",
          400: "#50d0f5",
          500: "#29c0f1",
          600: "#1690bf",
          700: "#0a6e93",
          800: "#095d7b",
          900: "#094e67",
        },
      },
      minHeight: {
        11: "44px",
      },
    },
  },
  plugins: [],
};
