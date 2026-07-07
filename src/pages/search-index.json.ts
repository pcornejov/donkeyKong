import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Endpoint estático (se genera en build) que expone un índice plano de las
// tres content collections para la búsqueda client-side de src/pages/buscar.astro.
// No requiere `prerender = true` explícito: con `output: 'static'` (el modo
// por defecto de este proyecto, ver astro.config.mjs) todos los endpoints se
// prerenderizan a un archivo estático automáticamente.

export type SearchEntryType = 'juego' | 'personaje' | 'lore';

export interface SearchIndexEntry {
  title: string;
  type: SearchEntryType;
  text: string;
  href: string;
}

export const GET: APIRoute = async () => {
  const base = import.meta.env.BASE_URL;

  const [games, characters, lore] = await Promise.all([
    getCollection('games'),
    getCollection('characters'),
    getCollection('lore'),
  ]);

  const index: SearchIndexEntry[] = [
    ...games.map((entry) => ({
      title: entry.data.title,
      type: 'juego' as const,
      text: entry.data.description,
      href: `${base}juegos/${entry.slug}/`,
    })),
    ...characters.map((entry) => ({
      title: entry.data.name,
      type: 'personaje' as const,
      text: entry.data.description,
      href: `${base}personajes/${entry.slug}/`,
    })),
    ...lore.map((entry) => ({
      title: entry.data.title,
      type: 'lore' as const,
      text: entry.data.summary,
      href: `${base}lore/${entry.slug}/`,
    })),
  ];

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
