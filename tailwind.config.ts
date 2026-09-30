import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        cairo: ["var(--font-cairo)", "Cairo", "Tajawal", "sans-serif"],
        tajawal: ["var(--font-tajawal)", "Tajawal", "Cairo", "sans-serif"],
      },
      colors: {
        base: {
          950: "#05070d",
          900: "#0a0e18",
          850: "#0e1320",
          800: "#131a2b",
          700: "#1b2438",
        },
        accent: {
          DEFAULT: "#7c5cff",
          soft: "#9b82ff",
          glow: "#5eead4",
        },
        status: {
          hot: "#ff6b6b",
          gold: "#facc15",
          new: "#60a5fa",
          won: "#4ade80",
          lost: "#94a3b8",
        },
      },
      backgroundImage: {
        "glass-gradient":
          "linear-gradient(135deg, rgba(124,92,255,0.12) 0%, rgba(94,234,212,0.06) 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0,0,0,0.45)",
        "glass-inset": "inset 0 1px 0 0 rgba(255,255,255,0.06)",
      },
      backdropBlur: {
        glass: "20px",
      },
      borderRadius: {
        glass: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
