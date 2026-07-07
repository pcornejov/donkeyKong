import { defineConfig } from 'astro/config';

// Sitio de proyecto en GitHub Pages: https://pcornejov.github.io/donkeyKong/
export default defineConfig({
  site: 'https://pcornejov.github.io',
  base: '/donkeyKong',
  // Sin esto, `import.meta.env.BASE_URL` no termina en "/" y las rutas
  // construidas como `${base}juegos/` (en Nav.astro, index.astro, etc.)
  // quedan mal concatenadas (p. ej. "/donkeyKongjuegos/").
  trailingSlash: 'always',
});
