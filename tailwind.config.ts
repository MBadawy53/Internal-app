import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./messages/**/*.json",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Logo-accurate Contact Financial palette
        brand: {
          DEFAULT: "#2E2C8A",
          50: "#EFEEFB",
          100: "#D9D7F4",
          200: "#B3AFE8",
          300: "#8C87DC",
          400: "#665FCF",
          500: "#3F37C0",
          600: "#2E2C8A", // primary
          700: "#252470",
          800: "#1B1B56",
          900: "#12123C",
        },
        accent: {
          DEFAULT: "#F39200",
          50: "#FFF5E5",
          100: "#FFE6BF",
          200: "#FFCD80",
          300: "#FFB340",
          400: "#FF9D14",
          500: "#F39200",
          600: "#C77600",
          700: "#9B5C00",
          800: "#6F4200",
          900: "#432800",
        },
        sun: {
          DEFAULT: "#FFD400",
          400: "#FFE34D",
          500: "#FFD400",
          600: "#D6B100",
        },
        // Semantic UI tokens (CSS vars from globals.css)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        arabic: ["var(--font-plex-arabic)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(90deg, #FFD400 0%, #F39200 100%)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 24, 40, 0.04), 0 2px 6px rgba(16, 24, 40, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
