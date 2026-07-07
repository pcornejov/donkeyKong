import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Sitemap simple: no usamos ningún paquete externo, solo listamos a mano las
// páginas estáticas del sitio + las páginas de detalle generadas por cada
// content collection. `site` (definido en astro.config.mjs) ya viene sin el
// `base`, así que las URLs se arman como `${site}${BASE_URL}${path}`.

export const GET: APIRoute = async ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const siteUrl = site ?? new URL('https://pcornejov.github.io/');

  const [games, characters, lore] = await Promise.all([
    getCollection('games'),
    getCollection('characters'),
    getCollection('lore'),
  ]);

  const staticPaths = [`${base}`, `${base}juegos/`, `${base}personajes/`, `${base}lore/`, `${base}buscar/`];

  const collectionPaths = [
    ...games.map((entry) => `${base}juegos/${entry.slug}/`),
    ...characters.map((entry) => `${base}personajes/${entry.slug}/`),
    ...lore.map((entry) => `${base}lore/${entry.slug}/`),
  ];

  const urls = [...staticPaths, ...collectionPaths].map((path) => new URL(path, siteUrl).toString());

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
