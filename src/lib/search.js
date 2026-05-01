import { isCas, normalizeCas, normalizeText } from "./normalize.js";
import { buildSearchLinks, mergeExternalLinks } from "./links.js";

export async function loadSubstances() {
  const response = await fetch(chrome.runtime.getURL("src/data/substances.json"));

  if (!response.ok) {
    throw new Error("Database locale non disponibile.");
  }

  return response.json();
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
      const names = [
        substance.name_it,
        substance.name_en,
        ...(substance.synonyms || [])
      ];

      return names.some((name) => normalizeText(name) === normalizedQuery);
    }) || null
  );
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

  return {
    found: false,
    query: rawQuery,
    external_links: {
      acgih: { status: "missing", url: "" },
      ...buildSearchLinks(rawQuery)
    }
  };
}
