import { defineCollection, z } from 'astro:content';

// Colección de juegos de la saga Donkey Kong.
const games = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    releaseYear: z.number(),
    platforms: z.array(z.string()),
    developer: z.string(),
    publisher: z.string().optional(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
  }),
});

// Colección de personajes del universo Donkey Kong.
const characters = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    // Ej: "protagonista", "antagonista", "aliado"
    role: z.string(),
    // Referencia al juego (por título o slug) donde aparece por primera vez.
    firstAppearance: z.string(),
    description: z.string(),
  }),
});

// Colección de lore / cronología del universo Donkey Kong.
const lore = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    // Orden cronológico para mostrar las entradas de lore.
    order: z.number(),
    summary: z.string(),
  }),
});

export const collections = { games, characters, lore };
