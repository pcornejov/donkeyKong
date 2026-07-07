# Investigación de APIs públicas para verificar metadata de juegos (dk-api-scout)

> Nota para dk-researcher: este documento es solo para **cruzar referencias**. No modifica
> `src/content/games/*.md`; los datos de esta tabla deben ser revisados y trasladados a mano
> (o vía script aparte) a los archivos de contenido.

## Resumen ejecutivo

- **API elegida: Wikidata Query Service (SPARQL)** — `https://query.wikidata.org/sparql`
- **No requiere API key.** Es de lectura pública, con CORS abierto
  (`access-control-allow-origin: *`), verificado con `curl -D -`.
- Al ser un sitio 100% estático desplegado en GitHub Pages, la recomendación es **consultar
  esta API en tiempo de build** (script Node/Python que genera un JSON committeado o un
  `getStaticPaths`/loader de Astro que se ejecuta en build), **no en el navegador del
  visitante**. Motivos: evitar pegarle al endpoint compartido de Wikidata con tráfico de
  cada visita, respetar su política de uso (rate limiting no documentado con número fijo,
  pero recomiendan uso "responsable" y agregan un `User-Agent` identificable), y mantener el
  sitio funcionando offline/rápido sin depender de un tercero en runtime.
- Ninguna de las consultas usadas requirió credenciales secretas de ningún tipo — apto para
  un flujo 100% estático.

## Cómo se probó (reproducible)

Dos queries SPARQL vía `curl -X POST` con `Accept: application/sparql-results+json` y un
`User-Agent` identificable (Wikidata pide identificarse, aunque no es obligatorio):

**Query 1 — juegos "part of the series" (P179) de la franquicia Donkey Kong (Q662004):**

```sparql
SELECT ?item ?itemLabel ?releaseDate (GROUP_CONCAT(DISTINCT ?platformLabel; separator=", ") AS ?platforms) WHERE {
  ?item wdt:P179 wd:Q662004 .
  OPTIONAL { ?item wdt:P577 ?releaseDate. }
  OPTIONAL { ?item wdt:P400 ?platform. ?platform rdfs:label ?platformLabel. FILTER(LANG(?platformLabel)="en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?item ?itemLabel ?releaseDate
ORDER BY ?releaseDate
LIMIT 300
```

Resultado: HTTP 200, ~0.6s, 50 filas. **Problema detectado:** el juego original *Donkey Kong
(1981)* y *Donkey Kong Jr. (1982)* NO aparecen con este método, porque en el modelado de
Wikidata el juego que "origina" la serie no siempre tiene la propiedad "part of the series"
(P179) apuntando a sí mismo/al ítem de franquicia — esa propiedad se usa más para las
secuelas. Ojo con este sesgo si se automatiza.

**Query 2 — más amplia, por `instance of: video game` (Q7889) + label que contiene "Donkey Kong":**

```sparql
SELECT ?item ?itemLabel ?releaseDate (GROUP_CONCAT(DISTINCT ?platformLabel; separator=", ") AS ?platforms) WHERE {
  ?item wdt:P31 wd:Q7889 .
  ?item rdfs:label ?lbl .
  FILTER(LANG(?lbl) = "en" && CONTAINS(?lbl, "Donkey Kong"))
  OPTIONAL { ?item wdt:P577 ?releaseDate. }
  OPTIONAL { ?item wdt:P400 ?platform. ?platform rdfs:label ?platformLabel. FILTER(LANG(?platformLabel)="en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?item ?itemLabel ?releaseDate
ORDER BY ?releaseDate
LIMIT 300
```

Resultado: HTTP 200, ~15s (más pesada), 92 filas — esta sí trae el juego original de 1981,
Donkey Kong Jr., Donkey Kong 3, Mario vs. Donkey Kong, Donkey Kong Bananza (2025, próximo
lanzamiento), etc. **Recomendación: usar esta segunda forma de query (o combinar ambas) si
se automatiza la obtención de datos.**

Nota: cada juego aparece con **varias fechas de lanzamiento** (una por región/plataforma —
Wikidata modela P577 con múltiples statements calificados). Hay que tomar la fecha más
antigua como "lanzamiento original" y no asumir que la lista de plataformas del
GROUP_CONCAT corresponde 1:1 con cada fecha individual (el query las agrega a nivel de ítem,
no de statement con qualifiers).

Identificadores útiles encontrados:
- `Q662004` = "Donkey Kong" (Video game series) — franquicia/serie.
- `Q12384` = "Donkey Kong" (1981 video game, el arcade original).
- `Q7889` = "video game" (clase usada para el filtro `P31`).

## Datos verificados con alta confianza (Wikidata)

| Juego | Año verificado | Plataformas verificadas | Fuente |
|---|---|---|---|
| Donkey Kong (arcade original) | **1981** (fecha exacta: 9 de julio de 1981, Japón — arcade) | Arcade (original); ports verificados en Wikidata: NES/Famicom (Famicom Disk System 1983-07-15, NES ~1986-06/1986-10-15), Atari 2600, Atari 7800, Atari 8-bit, ColecoVision, Coleco (consola dedicada), Intellivision, Commodore 64, Commodore Amiga, Commodore VIC-20, ZX Spectrum, Amstrad CPC, MSX, DOS, IBM PC, Apple II, TI-99/4A, Game Boy Advance (e-Reader / Classic NES Series), Game & Watch | Wikidata Q12384, `wbgetentities` sobre Q12384 |
| Donkey Kong Jr. | 1982 (fecha exacta no siempre presente; ports en 1983, 1986, 1987 según región) | Game & Watch, NES/Famicom Disk System, Atari 2600, Atari 7800, ColecoVision, Commodore 64, Wii U (Virtual Console) | Wikidata (query 2) |
| Donkey Kong 3 | 1984 (arcade), ports 1986-1987 | Arcade, NES, Game & Watch | Wikidata (query 2) |
| Donkey Kong Country | 1994-11-18 (lanzamiento original SNES, Norteamérica) | SNES, Game Boy Color, Game Boy Advance, Wii (Virtual Console), Wii U, New Nintendo 3DS, Super NES Classic Edition | Wikidata (query 1/2) |
| Donkey Kong Land | 1995-06-26 | Game Boy | Wikidata |
| Donkey Kong Country 2: Diddy's Kong Quest | 1995-11-20 | SNES, Game Boy Advance, Wii U (Virtual Console) | Wikidata |
| Donkey Kong Land 2 | 1996-09-01 | Game Boy | Wikidata |
| Donkey Kong Country 3: Dixie Kong's Double Trouble! | 1996-11-18 | SNES, Game Boy Color/Advance, Wii U | Wikidata |
| Donkey Kong Land III | 1997-10-01 | Game Boy | Wikidata |
| Diddy Kong Racing | 1997-11-21 | Nintendo 64, Nintendo DS (remake) | Wikidata |
| Donkey Kong 64 | 1999-11-22 | Nintendo 64 | Wikidata |
| Donkey Konga | 2003-12-12 | Nintendo GameCube | Wikidata |
| Mario vs. Donkey Kong | 2004-05-24 | Game Boy Advance | Wikidata |
| Donkey Kong Jungle Beat | 2004-12-16 | Nintendo GameCube, Wii (re-release) | Wikidata |
| Mario vs. Donkey Kong 2: March of the Minis | 2006-09-25 | Nintendo DS, Wii U (Virtual Console) | Wikidata |
| Donkey Kong Barrel Blast | 2007-06-28 | Wii | Wikidata |
| Donkey Kong Country Returns | 2010-11-21 | Wii | Wikidata |
| Mario vs. Donkey Kong: Mini-Land Mayhem! | 2010-11-14 | Nintendo DS, Wii U | Wikidata |
| Mario and Donkey Kong: Minis on the Move | 2013-05-09 | Nintendo 3DS | Wikidata |
| Donkey Kong Country Returns 3D | 2013-05-24 | Nintendo 3DS | Wikidata |
| Donkey Kong Country: Tropical Freeze | 2014-02-13 | Wii U (original); Nintendo Switch (2018-05-04) | Wikidata |
| Mario vs. Donkey Kong: Tipping Stars | 2015-03-05 | Wii U, Nintendo 3DS | Wikidata |
| Mario vs. Donkey Kong (remake) | 2024-02-16 | Nintendo Switch | Wikidata (fecha reciente, verificar aparte) |
| Donkey Kong Country Returns HD | 2025-01-16 | Nintendo Switch | Wikidata |
| Donkey Kong Bananza | 2025-07-17 | Nintendo Switch 2 (según cobertura pública; no listado aún en Wikidata al momento de la consulta) | Wikidata (próximo lanzamiento) |

**Desarrollador/publisher verificados para Donkey Kong (1981):**
- Desarrollador (P178): **Nintendo Research & Development 1 (Nintendo R&D1)** e **Ikegami
  Tsushinki** (co-desarrollador de hardware/software, contratado por Nintendo — este dato es
  menos citado en fuentes genéricas/wiki de fans, pero está bien documentado
  históricamente por la disputa legal Nintendo vs. Ikegami de los 80).
- Publisher (P123): **Nintendo**.

### Discrepancia a revisar por dk-researcher

El archivo placeholder actual `src/content/games/donkey-kong-1981.md` tiene
`developer/publisher` como texto de ejemplo ("EJEMPLO - Nintendo (placeholder...)"). Con
Wikidata confirmamos que el publisher es efectivamente Nintendo, pero el **desarrollador
"oficial" a citar depende del nivel de detalle deseado**: la mayoría de fuentes generalistas
dicen simplemente "Nintendo" (diseño de Shigeru Miyamoto, equipo R&D1), mientras que
Wikidata además lista a Ikegami Tsushinki como co-desarrollador. Recomiendo que
dk-researcher decida el nivel de detalle (mencionar o no a Ikegami Tsushinki) y cite ambas
fuentes si lo hace, dado que es un dato con matices legales/históricos.

También ojo: la fecha de lanzamiento "canónica" que suele citarse en medios generalistas es
**9 de julio de 1981** para arcades en Japón — coincide exactamente con Wikidata
(`+1981-07-09`). Buen dato para reemplazar el placeholder `releaseYear: 1981` con
confianza (ya es correcto), y opcionalmente agregar la fecha exacta en la descripción.

## Alternativas evaluadas (documentadas, NO usadas sin credenciales)

| API | ¿Requiere API key? | Notas |
|---|---|---|
| **RAWG.io** (`api.rawg.io/api`) | **Sí** — requiere `api_key` como query param. Sin ella, las respuestas son limitadas/erróneas. No se intentó sin key. | Buena cobertura de metadata de juegos y capturas, pero no es apta para un sitio 100% estático sin exponer la key en el bundle del cliente (violaría la regla de no exponer claves en producción). Si se quisiera usar, tendría que ser en build-time con la key como secret de CI (GitHub Actions secret), nunca en el navegador. |
| **IGDB** (Twitch/IGDB API) | **Sí** — requiere OAuth2 (Client ID + Client Secret de una app de Twitch Developer) para obtener un token Bearer. Flujo de credenciales, no apto para llamadas directas desde el navegador. No se intentó. | Muy buena cobertura y datos estructurados, pero el requisito de OAuth2 lo descarta para llamadas cliente. Solo viable en build-time con secrets en CI. |
| **MobyGames API** | **Sí** — requiere API key (plan gratuito limitado a bajo volumen de requests/día). No se intentó sin key. | Tiene fichas históricas muy completas (createros, empresas, fechas por región) que podrían ser buena referencia cruzada manual (consulta web, no API) para el investigador. |
| **Giant Bomb API** | **Sí** — requiere API key gratuita tras registro. No se intentó sin key. | Cobertura buena en wikis de juegos pero requiere key igual que las anteriores. |
| **Wikidata SPARQL** (elegida) | **No.** Público, sin autenticación, CORS abierto. | Ver detalle arriba. Verificado funcionando con `curl` sin ninguna clave. |

**Conclusión sobre APIs con key:** ninguna de RAWG/IGDB/MobyGames/GiantBomb es apta para
llamadas directas desde el cliente en este sitio estático sin arriesgar exponer secretos en
el bundle público de GitHub Pages. Si en el futuro se quiere más profundidad de datos (ej.
carátulas de alta calidad, reviews agregadas), la única forma segura sería consumirlas
**en build-time desde GitHub Actions**, guardando la key como *repository secret* y nunca
comprometiéndola al historial de git ni al bundle final. Por ahora, Wikidata cubre
suficientemente bien: título, año, plataformas, desarrollador y publisher.

## Limitaciones encontradas con Wikidata SPARQL

- **Sin API key** — punto a favor, encaja perfecto con el requisito de sitio estático.
- **CORS abierto** (`access-control-allow-origin: *`), confirmado con `curl -D -`, así que
  técnicamente SÍ se podría llamar desde el navegador del visitante. Aun así, **se
  recomienda no hacerlo en producción**: es un servicio público compartido por todo el
  ecosistema Wikidata/Wikipedia, no pensado para ser el backend de fetch de cada visita de
  un sitio de fans. Mejor: fetch en build/CI y commitear el JSON resultante (o cachearlo).
- **Sin rate-limit numérico documentado en la respuesta** (no vi headers
  `x-ratelimit-*` ni `retry-after` en las pruebas), pero la política de uso de Wikimedia
  pide *user-agent identificable* (lo usé: `dk-api-scout/1.0 (research script...)`) y
  advierte que pueden cortar clientes que abusen del servicio (hay un límite de tiempo de
  ejecución de query de 60s en el servidor, y límites de concurrencia por IP no publicados
  con un número exacto).
- **Modelado de datos inconsistente para el "juego fundador" de una serie**: el ítem
  "Donkey Kong (1981)" no está marcado como "part of the series" de sí mismo/la franquicia,
  así que una consulta ingenua solo por P179 se pierde el juego original y otros clásicos
  (Donkey Kong Jr., Donkey Kong 3). Hay que usar la query 2 (por `instance of: video game` +
  filtro de label) o combinar ambas.
- **Múltiples fechas de lanzamiento por ítem** (una por región) sin qualifiers fáciles de
  extraer en una consulta simple agregada — para un dato "canónico" por juego, conviene
  tomar `MIN(?releaseDate)` explícitamente en vez de listar todas, o hacer una query por
  juego individual pidiendo qualifiers de país si se necesita precisión por región.
- **Latencia variable**: la query 1 (más acotada) tardó ~0.6s; la query 2 (broad, con
  `CONTAINS` sobre labels) tardó ~15s. Para uso en CI está bien, pero confirma que no es
  apta para un fetch síncrono en el navegador de cada visitante.
- **Cobertura de "Donkey Kong Bananza" (2025)**: apareció en Wikidata con fecha
  2025-07-17 pero sin plataforma listada en el momento de la consulta (dato aún
  incompleto en Wikidata, editado colaborativamente — normal para lanzamientos muy
  recientes/futuros). Si el investigador cubre este juego, cross-check con fuente oficial
  de Nintendo antes de publicar como "verificado".
