# jeanaboutboul.com

Personal website built with [Astro](https://astro.build/), MDX, and Tailwind CSS.

## Stack

- Astro 5
- MDX content collections
- Tailwind CSS
- KaTeX for math rendering
- GitHub Pages deployment via GitHub Actions

## Project structure

```text
src/
  components/     Reusable Astro components
  content/        MDX content and local images
  layouts/        Shared page layout
  pages/          Route files
  styles/         Global styles and component classes
  utils/          Shared content and TOC helpers
public/           Static assets
.github/          Deployment workflow
```

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
npm run preview
```

## Content

- Projects live in `src/content/projects`
- Talks and notes live in `src/content/talks`
- Shared media lives in `src/content/images`

## Deployment

The site is deployed to GitHub Pages through [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).
