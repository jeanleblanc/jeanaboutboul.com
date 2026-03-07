import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    thumbnail: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    status: z.enum(["active", "completed", "archived"]).default("active"),
  }),
});

const talks = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/talks" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    venue: z.string().optional(),
  }),
});

export const collections = { projects, talks };
