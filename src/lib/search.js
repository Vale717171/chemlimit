import { isCas, normalizeCas, normalizeText } from "./normalize.js";
import { buildSearchLinks, mergeExternalLinks } from "./links.js";

export async function loadSubstances() {
  const response = await fetch(chrome.runtime.getURL("src/data/substances.json"));

  if (!response.ok) {
    throw new Error("Database locale non disponibile.");
  }

  return response.json();
}

function getSearchableNames(substance) {
  return [
    substance.name_it,
    substance.name_en,
    ...(substance.synonyms || [])
  ].filter(Boolean);
}

export function findSubstance(substances, query) {
  const rawQuery = String(query || "").trim();

  if (!rawQuery) {
    return null;
  }

  if (isCas(rawQuery)) {
    const cas = normalizeCas(rawQuery);
    return substances.find((substance) => normalizeCas(substance.cas) === cas) || null;
  }

  const normalizedQuery = normalizeText(rawQuery);

  return (
    substances.find((substance) => {
      const names = getSearchableNames(substance);

      return names.some((name) => normalizeText(name) === normalizedQuery);
    }) || null
  );
}

function getWordOverlapScore(query, candidate) {
  const queryWords = new Set(normalizeText(query).split(" ").filter(Boolean));
  const candidateWords = new Set(normalizeText(candidate).split(" ").filter(Boolean));

  if (!queryWords.size || !candidateWords.size) {
    return 0;
  }

  let overlap = 0;

  queryWords.forEach((word) => {
    if (candidateWords.has(word)) {
      overlap += 1;
    }
  });

  return overlap;
}

export function findSuggestions(substances, query, limit = 2) {
  const rawQuery = String(query || "").trim();
  const normalizedQuery = normalizeText(rawQuery);

  if (!normalizedQuery) {
    return [];
  }

  return substances
    .map((substance) => {
      const names = getSearchableNames(substance);
      let bestScore = 0;

      names.forEach((name) => {
        const normalizedName = normalizeText(name);

        if (!normalizedName || normalizedName === normalizedQuery) {
          return;
        }

        if (normalizedName.startsWith(normalizedQuery)) {
          bestScore = Math.max(bestScore, 220 - (normalizedName.length - normalizedQuery.length));
          return;
        }

        if (normalizedName.includes(normalizedQuery)) {
          bestScore = Math.max(bestScore, 160 - (normalizedName.length - normalizedQuery.length));
          return;
        }

        const overlapScore = getWordOverlapScore(rawQuery, name);

        if (overlapScore > 0) {
          bestScore = Math.max(bestScore, overlapScore * 10);
        }
      });

      return bestScore > 0
        ? {
            id: substance.id,
            cas: substance.cas,
            name_it: substance.name_it,
            name_en: substance.name_en,
            score: bestScore
          }
        : null;
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.name_it.localeCompare(right.name_it))
    .slice(0, limit);
}

export function searchSubstances(substances, query, echaVerifiedLinks = []) {
  const rawQuery = String(query || "").trim();
  const substance = findSubstance(substances, rawQuery);

  if (substance) {
    return {
      found: true,
      query: rawQuery,
      substance: {
        ...substance,
        external_links: mergeExternalLinks(substance, rawQuery, echaVerifiedLinks)
      }
    };
  }

  const suggestions = findSuggestions(substances, rawQuery);

  return {
    found: false,
    query: rawQuery,
    suggestions,
    external_links: {
      acgih: { status: "missing", url: "" },
      ...buildSearchLinks(rawQuery)
    }
  };
}
