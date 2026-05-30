/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forge: {
          950: "#04080F",
          900: "#080E1A",
          850: "#0C1525",
          800: "#111E32",
          700: "#162540",
          600: "#1E3358",
          500: "#254070",
        },
        molten: {
          50:  "#FFF8F0",
          100: "#FFECD0",
          200: "#FFD49A",
          300: "#FFB84D",
          400: "#FF9B1A",
          500: "#F07E00",
          600: "#C46200",
          700: "#9A4C00",
          800: "#6B3400",
          900: "#3D1E00",
        },
        steel: {
          50:  "#F4F7FF",
          100: "#E8EEFF",
          200: "#C7D4F5",
          300: "#99B0EA",
          400: "#6B8CDE",
          500: "#4A6FD4",
          600: "#3258C0",
          700: "#2344A0",
          800: "#183080",
          900: "#0F1F5C",
        },
        ember: {
          400: "#FF6B35",
          500: "#E8500A",
          600: "#C43A00",
        },
        success: "#22C55E",
        warning: "#EAB308",
        danger:  "#EF4444",
        info:    "#38BDF8",
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "forge-grid": "linear-gradient(rgba(255,155,26,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,155,26,0.03) 1px, transparent 1px)",
        "glow-molten": "radial-gradient(ellipse at top, rgba(240,126,0,0.15) 0%, transparent 60%)",
        "glow-steel":  "radial-gradient(ellipse at bottom right, rgba(74,111,212,0.12) 0%, transparent 60%)",
      },
      backgroundSize: {
        "grid-40": "40px 40px",
      },
      boxShadow: {
        "molten":     "0 0 30px rgba(240,126,0,0.25), 0 0 60px rgba(240,126,0,0.10)",
        "molten-sm":  "0 0 12px rgba(240,126,0,0.30)",
        "steel":      "0 0 30px rgba(74,111,212,0.20)",
        "card":       "0 4px 24px rgba(0,0,0,0.40)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.60), 0 0 20px rgba(240,126,0,0.08)",
      },
      animation: {
        "pulse-slow":   "pulse 3s ease-in-out infinite",
        "shimmer":      "shimmer 2s linear infinite",
        "glow-pulse":   "glowPulse 2s ease-in-out infinite",
        "slide-in-left":"slideInLeft 0.4s ease-out",
        "slide-in-up":  "slideInUp 0.4s ease-out",
        "fade-in":      "fadeIn 0.3s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0"  },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1"   },
        },
        slideInLeft: {
          "0%":   { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)",     opacity: "1" },
        },
        slideInUp: {
          "0%":   { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};