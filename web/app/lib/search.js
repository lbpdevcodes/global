export const fold = (text) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// Rank: name starts with the query, then an alternate name does, then the
// query appears anywhere. Ties keep index order.
function rank(entity, query) {
  const name = fold(entity.name);
  if (name.startsWith(query)) return 0;
  const aliases = entity.aliases.map(fold);
  if (aliases.some((alias) => alias.startsWith(query))) return 1;
  if (name.includes(query) || aliases.some((alias) => alias.includes(query))) return 2;
  return null;
}

export function searchEntities(entities, rawQuery, limit = 8) {
  const query = fold(rawQuery.trim());
  if (!query) return [];
  return entities
    .map((entity) => ({ entity, rank: rank(entity, query) }))
    .filter((match) => match.rank !== null)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map((match) => match.entity);
}

// The alternate name that matched, when the entity's own name did not.
export function matchedAlias(entity, rawQuery) {
  const query = fold(rawQuery.trim());
  if (!query || fold(entity.name).includes(query)) return null;
  return entity.aliases.find((alias) => fold(alias).includes(query)) ?? null;
}
