/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* Alpine Nord accent palette — edit these to tweak the whole site */
        nord: {
          frost1: "#5E81AC",
          frost2: "#81A1C1",
          frost3: "#88C0D0",
          frost4: "#8FBCBB",
          green: "#A3BE8C",
          yellow: "#EBCB8B",
          orange: "#D08770",
          red: "#BF616A",
        },
        /* Light mode surfaces */
        surface: {
          DEFAULT: "#F0F2F5",   /* cool off-white */
          secondary: "#E5E9F0",
          card: "#FFFFFF",
        },
        /* Dark mode surfaces */
        dark: {
          DEFAULT: "#2E3440",
          secondary: "#3B4252",
          card: "#434C5E",
          text: "#ECEFF4",
          muted: "#D8DEE9",
        },
      },
      fontFamily: {
        serif: ['"Computer Modern Serif"', "Libre Baskerville", "Georgia", "serif"],
        sans: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        mono: ['"JetBrains Mono"', "Fira Code", "monospace"],
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": theme("colors.gray.800"),
            "--tw-prose-headings": theme("colors.gray.900"),
            "--tw-prose-links": theme("colors.nord.frost1"),
            "--tw-prose-code": theme("colors.nord.frost1"),
            maxWidth: "68ch",
            fontSize: "1.05rem",
            lineHeight: "1.8",
            h1: { fontFamily: theme("fontFamily.sans").join(", ") },
            h2: { fontFamily: theme("fontFamily.sans").join(", ") },
            h3: { fontFamily: theme("fontFamily.sans").join(", ") },
            h4: { fontFamily: theme("fontFamily.sans").join(", ") },
          },
        },
        nord: {
          css: {
            "--tw-prose-body": theme("colors.dark.muted"),
            "--tw-prose-headings": theme("colors.dark.text"),
            "--tw-prose-links": theme("colors.nord.frost3"),
            "--tw-prose-code": theme("colors.nord.frost3"),
            "--tw-prose-bold": theme("colors.dark.text"),
            "--tw-prose-counters": theme("colors.dark.muted"),
            "--tw-prose-bullets": theme("colors.dark.muted"),
            "--tw-prose-hr": theme("colors.dark.card"),
            "--tw-prose-quotes": theme("colors.dark.muted"),
            "--tw-prose-quote-borders": theme("colors.nord.frost1"),
            "--tw-prose-th-borders": theme("colors.dark.card"),
            "--tw-prose-td-borders": theme("colors.dark.secondary"),
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
