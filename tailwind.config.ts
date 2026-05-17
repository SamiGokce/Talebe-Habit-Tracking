import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFBF7",
          100: "#FAF6F1",
          200: "#F4EDE3",
          300: "#EBE0D0",
          400: "#DFD0B8",
        },
        mocha: {
          100: "#E8D9C3",
          200: "#D4BC97",
          300: "#B89968",
          400: "#9C7A4D",
          500: "#7E5E3A",
          600: "#5D4732",
          700: "#3F2E1F",
          800: "#2A1F15",
        },
        accent: {
          sage: "#8B9B6E",
          gold: "#C9A878",
          rose: "#C28A7A",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
      },
      backdropBlur: {
        xs: "4px",
      },
      boxShadow: {
        glass:
          "0 8px 32px 0 rgba(93, 71, 50, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)",
        "glass-lg":
          "0 16px 48px 0 rgba(93, 71, 50, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.7)",
        soft: "0 2px 12px 0 rgba(93, 71, 50, 0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        pop: "pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
