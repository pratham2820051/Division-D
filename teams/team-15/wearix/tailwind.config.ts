import type { Config } from "tailwindcss";

/**
 * Wearix Tailwind CSS v4 configuration.
 *
 * NOTE: In Tailwind v4, primary design-token configuration lives inside
 * globals.css inside the @theme block. This file provides additional
 * IDE/editor auto-complete support and extends the default theme with
 * Wearix-specific values.
 */
const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      colors: {
        wearix: {
          bg:         "#FFFFFF",
          "bg-secondary": "#F9F9F9",
          text:       "#1A1A1A",
          "text-muted": "#666666",
          accent:     "#000000",
          border:     "#E5E5E5",
          white:      "#FFFFFF",
        },
      },
      maxWidth: {
        container: "1200px",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      keyframes: {
        fadeInUp: {
          from: {
            opacity: "0",
            transform: "translateY(24px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        slideInRight: {
          from: {
            opacity: "0",
            transform: "translateX(32px)",
          },
          to: {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        scaleIn: {
          from: {
            opacity: "0",
            transform: "scale(0.95)",
          },
          to: {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        slideDown: {
          from: {
            opacity: "0",
            transform: "translateY(-8px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease forwards",
        "slide-in-right": "slideInRight 0.4s ease forwards",
        shimmer: "shimmer 1.5s infinite linear",
        "scale-in": "scaleIn 0.2s ease forwards",
        "slide-down": "slideDown 0.25s ease forwards",
      },
      transitionTimingFunction: {
        wearix: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      boxShadow: {
        "product-hover": "0 12px 40px rgba(0,0,0,0.12)",
        "card":          "0 2px 16px rgba(0,0,0,0.06)",
        "navbar":        "0 1px 0 #E5E5E5",
        "dropdown":      "0 8px 32px rgba(0,0,0,0.12)",
      },
      aspectRatio: {
        "product": "4 / 5",
      },
    },
  },
  plugins: [],
};

export default config;
