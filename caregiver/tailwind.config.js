/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F3F6F6",
        surface: "#FFFFFF",
        ink: "#1E2A2E",
        inkmuted: "#5B6B70",
        primary: {
          DEFAULT: "#2D6E8E",
          dark: "#1F4F68",
          light: "#DCEAF0",
        },
        sage: {
          DEFAULT: "#5C8A72",
          light: "#E1EEE6",
        },
        amber: {
          DEFAULT: "#E8A23D",
          dark: "#C77F1F",
          light: "#FBEBD1",
        },
        emergency: {
          DEFAULT: "#D96459",
          light: "#FBE4E1",
        },
      },
      fontFamily: {
        sans: ["Atkinson Hyperlegible", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "28px",
      },
      boxShadow: {
        card: "0 4px 14px rgba(30, 42, 46, 0.08)",
        cardHover: "0 8px 24px rgba(30, 42, 46, 0.14)",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
        },
        ringPulse: {
          "0%": { boxShadow: "0 0 0 0 rgba(45,110,142,0.45)" },
          "100%": { boxShadow: "0 0 0 22px rgba(45,110,142,0)" },
        },
        popIn: {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        breathe: "breathe 2.6s ease-in-out infinite",
        ringPulse: "ringPulse 1.1s ease-out",
        popIn: "popIn 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
