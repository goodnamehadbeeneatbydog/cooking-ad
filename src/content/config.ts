import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    category: z.string().default('uncategorized'),
    tags: z.array(z.string()).default([]),
    lang: z.enum(['en', 'zh']).default('en'),
    draft: z.boolean().default(false),
    adSlots: z.number().default(2),
    i18nSlug: z.string().optional(),
    // Recipe-specific fields
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
    prepTime: z.string().optional(),
    cookTime: z.string().optional(),
    servings: z.number().optional(),
    cuisine: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};
