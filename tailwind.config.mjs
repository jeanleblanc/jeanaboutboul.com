/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "rgb(var(--color-paper) / <alpha-value>)",
          raised: "rgb(var(--color-paper-raised) / <alpha-value>)",
          subtle: "rgb(var(--color-paper-subtle) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          soft: "rgb(var(--color-ink-soft) / <alpha-value>)",
          faint: "rgb(var(--color-ink-faint) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--color-line) / <alpha-value>)",
          strong: "rgb(var(--color-line-strong) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          soft: "rgb(var(--color-accent-soft) / <alpha-value>)",
          deep: "rgb(var(--color-accent-deep) / <alpha-value>)",
        },
        success: "rgb(var(--color-success) / <alpha-value>)",
      },
      fontFamily: {
        serif: [
          '"Computer Modern Serif"',
          '"Iowan Old Style"',
          '"Palatino Linotype"',
          '"Book Antiqua"',
          "serif",
        ],
        sans: ['"Helvetica Neue"', '"Avenir Next"', '"Segoe UI"', "sans-serif"],
        card: [
          '"Garamond Classico"',
          '"Adobe Garamond Pro"',
          '"EB Garamond"',
          '"Garamond"',
          "serif",
        ],
        mono: ['"JetBrains Mono"', '"SFMono-Regular"', '"Menlo"', "monospace"],
      },
      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-body": "rgb(var(--color-ink-soft))",
            "--tw-prose-headings": "rgb(var(--color-ink))",
            "--tw-prose-lead": "rgb(var(--color-ink-soft))",
            "--tw-prose-links": "rgb(var(--color-accent-deep))",
            "--tw-prose-bold": "rgb(var(--color-ink))",
            "--tw-prose-counters": "rgb(var(--color-ink-faint))",
            "--tw-prose-bullets": "rgb(var(--color-line-strong))",
            "--tw-prose-hr": "rgb(var(--color-line))",
            "--tw-prose-quotes": "rgb(var(--color-ink))",
            "--tw-prose-quote-borders": "rgb(var(--color-accent))",
            "--tw-prose-captions": "rgb(var(--color-ink-faint))",
            "--tw-prose-code": "rgb(var(--color-ink))",
            "--tw-prose-pre-bg": "#141414",
            "--tw-prose-pre-code": "#f7f7f5",
            "--tw-prose-th-borders": "rgb(var(--color-line-strong))",
            "--tw-prose-td-borders": "rgb(var(--color-line))",
            maxWidth: "72ch",
            fontSize: "1.05rem",
            lineHeight: "1.85",
            h1: {
              fontFamily: 'Computer Modern Serif, Iowan Old Style, Palatino Linotype, Book Antiqua, serif',
              fontWeight: "700",
              letterSpacing: "-0.02em",
              lineHeight: "1.08",
            },
            h2: {
              fontFamily: 'Computer Modern Serif, Iowan Old Style, Palatino Linotype, Book Antiqua, serif',
              fontWeight: "700",
              letterSpacing: "-0.018em",
              marginTop: "2.3em",
              marginBottom: "0.8em",
            },
            h3: {
              fontFamily: '"Helvetica Neue", "Avenir Next", "Segoe UI", sans-serif',
              fontWeight: "600",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontSize: "0.82em",
              marginTop: "2.1em",
              marginBottom: "0.9em",
            },
            "h2 + h3": {
              marginTop: "1.45em",
            },
            a: {
              textDecoration: "underline",
              textDecorationThickness: "0.08em",
              textUnderlineOffset: "0.18em",
            },
            code: {
              fontWeight: "500",
              borderRadius: "0.1rem",
              padding: "0.1rem 0.35rem",
            },
            blockquote: {
              fontStyle: "normal",
              borderLeftWidth: "2px",
              paddingLeft: "1.15rem",
            },
            figure: {
              marginTop: "2rem",
              marginBottom: "2rem",
            },
            figcaption: {
              fontFamily: '"Helvetica Neue", "Avenir Next", "Segoe UI", sans-serif',
              fontSize: "0.74rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
