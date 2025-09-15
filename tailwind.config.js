/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./extensions/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Можно добавить кастомные цвета, шрифты и т.д.
      colors: {
        shopify: {
          primary: "#008060",
          secondary: "#004C3F",
        },
      },
      fontWeight: {
        medium: "500",
      },
    },
  },
  plugins: [],
  // Важно: отключаем preflight для совместимости с Polaris
  corePlugins: {
    preflight: false,
  },
};
