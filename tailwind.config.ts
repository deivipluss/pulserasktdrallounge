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
        // Paleta vibrante para "modo fiesta"
        fiesta: {
          pink: "#FF4D8D",
          purple: "#9B4DFF",
          blue: "#4D9EFF",
          teal: "#4DFFB8",
          yellow: "#FFD54D",
          orange: "#FF8D4D",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Tamaños responsivos
        "fluid-xs": "clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)",
        "fluid-sm": "clamp(0.875rem, 0.8rem + 0.375vw, 1rem)",
        "fluid-base": "clamp(1rem, 0.9rem + 0.5vw, 1.125rem)",
        "fluid-lg": "clamp(1.125rem, 1rem + 0.625vw, 1.25rem)",
        "fluid-xl": "clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)",
        "fluid-2xl": "clamp(1.5rem, 1.25rem + 1.25vw, 2rem)",
        "fluid-3xl": "clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem)",
        "fluid-4xl": "clamp(2.25rem, 1.75rem + 2.5vw, 3.25rem)",
      },
      // Sistema de tokens de diseño
      spacing: {
        xs: "var(--space-xs)",
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
        xl: "var(--space-xl)",
        "2xl": "var(--space-2xl)",
      },
      borderRadius: {
        token: "var(--radius-default)",
        "token-lg": "var(--radius-large)",
        "token-full": "var(--radius-full)",
      },
      boxShadow: {
        "party-sm": "0 4px 16px rgba(255, 77, 141, 0.2)",
        "party-md": "0 8px 24px rgba(155, 77, 255, 0.3)",
        "party-lg": "0 12px 32px rgba(77, 158, 255, 0.4)",
        "party-xl": "0 20px 48px rgba(77, 255, 184, 0.5)",
      },
      backdropBlur: {
        party: "10px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2.5s infinite",
        "spin-slow": "spin 3s linear infinite",
        shimmer: "shimmer 2s linear infinite",
        disco: "disco 5s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-500px 0" },
          "100%": { backgroundPosition: "500px 0" },
        },
        disco: {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "100% 100%" },
        },
      },
      backgroundImage: {
        "gradient-party":
          "linear-gradient(45deg, var(--tw-gradient-stops))",
        "shimmer-gradient":
          "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
