/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#12263A", 700: "#2A445D", 500: "#5B7184", 300: "#9AAAB8" },
        mist: "#EEF2F4",
        line: "#D8E0E5",
        harbor: { DEFAULT: "#0E7C86", dark: "#0A5F67", tint: "#DDF0F2" },
        gain: { DEFAULT: "#23845A", tint: "#E1F3EA" },
        loss: { DEFAULT: "#BF4036", tint: "#FBE7E4" },
        amber: { DEFAULT: "#B97A0C", tint: "#FBF0D9" },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Figtree", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
