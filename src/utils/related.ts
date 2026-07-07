// Heurística simple de "enlaces relacionados": dado el texto de una entrada
// (su `description`/`summary`) y una lista de candidatos de otras content
// collections, devuelve los candidatos cuyo `label` (título/nombre) aparece
// mencionado como subcadena dentro de ese texto.
//
// Deliberadamente simple (substring, sin NLP): compara en minúsculas y sin
// acentos para que coincidencias como "Diddy Kong" en una descripción se
// detecten igual con o sin tildes. Puede haber falsos positivos cuando un
// título es a la vez sustring de otro (p. ej. "Donkey Kong" dentro de
// "Donkey Kong Country"); se acepta como parte de la heurística porque en
// la práctica esas coincidencias también son temáticamente relevantes.

export interface RelatedCandidate {
  label: string;
  type: string;
  href: string;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function findMentions<T extends RelatedCandidate>(
  text: string,
  candidates: T[],
  limit = 6
): T[] {
  const haystack = normalize(text);
  return candidates.filter((candidate) => haystack.includes(normalize(candidate.label))).slice(0, limit);
}
