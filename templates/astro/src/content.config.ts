import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      author: z.string().optional(),
      image: z.string().optional(),
      imageAlt: z.string().optional(),
      draft: z.boolean().default(false),
      tags: z.array(z.string()).default([]),
    })
    .refine((data) => !data.image || Boolean(data.imageAlt), {
      message: "imageAlt is required when image is set.",
      path: ["imageAlt"],
    }),
});

export const collections = { blog };
