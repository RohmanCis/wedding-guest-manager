/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
          4: "var(--surface-4)",
          overlay: "var(--surface-overlay)"
        },
        accent: {
          gold: "var(--accent-primary)",
          "gold-hover": "var(--accent-primary-hover)",
          "gold-subtle": "var(--accent-primary-subtle)",
          rose: "var(--accent-rose)",
          "rose-subtle": "var(--accent-rose-subtle)",
          cream: "var(--accent-cream)"
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          subtle: "var(--color-danger-subtle)"
        },
        success: {
          DEFAULT: "var(--color-success)",
          subtle: "var(--color-success-subtle)"
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          subtle: "var(--color-warning-subtle)"
        },
        ring: "var(--ring)",
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)"
        }
      },
      // ponytail: dedicated borderColor (not colors.border) so classes are
      // border-subtle/default/strong instead of border-border-*.
      borderColor: {
        subtle: "var(--border-subtle)",
        default: "var(--border-default)",
        strong: "var(--border-strong)"
      },
      textColor: {
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        inverse: "var(--text-inverse)"
      },
      boxShadow: {
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
        3: "var(--shadow-3)",
        modal: "var(--shadow-modal)"
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"]
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        "zoom-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" }
        }
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "zoom-in": "zoom-in 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.6s infinite"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
