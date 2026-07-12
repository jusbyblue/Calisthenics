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
        bg:         "var(--bg)",
        surface1:   "var(--surface-1)",
        surface2:   "var(--surface-2)",
        surface3:   "var(--surface-3)",
        arctic:     "var(--accent)",
        arcticdim:  "var(--accent-dim)",
        primary:    "var(--text-primary)",
        secondary:  "var(--text-secondary)",
        muted:      "var(--text-muted)",
        success:    "var(--success)",
        danger:     "var(--danger)",
        warning:    "var(--warning)",
        border:     "var(--border)",
        borderfocus:"var(--border-focus)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      animation: {
        "fade-in": "fadeIn 0.15s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
