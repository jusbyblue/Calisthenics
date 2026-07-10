import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:         "#0A0A0F",
        surface1:   "#111118",
        surface2:   "#16161F",
        arctic:     "#4A9EFF",
        arcticdim:  "#1E3A5F",
        primary:    "#F0F0F5",
        secondary:  "#8A8A9A",
        success:    "#4AFF8A",
        danger:     "#FF4A4A",
        warning:    "#FFB84A",
        border:     "#2A2A3A",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl:  "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      animation: {
        "fade-in":    "fadeIn 0.2s ease-out",
        "slide-up":   "slideUp 0.3s ease-out",
        "shake":      "shake 0.4s ease-in-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%":      { transform: "translateX(-8px)" },
          "40%":      { transform: "translateX(8px)" },
          "60%":      { transform: "translateX(-8px)" },
          "80%":      { transform: "translateX(4px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
