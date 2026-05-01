const ECHA_SEARCH_PAGE = "https://www.echa.europa.eu/en/information-on-chemicals";
const GESTIS_SEARCH_PAGE = "https://gestis.dguv.de/search?q=";
const GESTIS_HOME = "https://gestis.dguv.de/";
const PUBCHEM_SEARCH_PAGE = "https://pubchem.ncbi.nlm.nih.gov/#query=";
const ECHEMPORTAL_HOME = "https://www.echemportal.org/echemportal/";
const DUCKDUCKGO_SEARCH = "https://duckduckgo.com/?q=";

function cleanValue(value) {
  const text = String(value || "").trim();
  return text || "";
}

function encodeQuery(query) {
  return encodeURIComponent(cleanValue(query));
}

function buildSiteSearch(domain, query, extraTerms = "") {
  const terms = [cleanValue(query), cleanValue(extraTerms)].filter(Boolean).join(" ");

  if (!terms) {
    return "";
  }

  return `${DUCKDUCKGO_SEARCH}${encodeURIComponent(`site:${domain} ${terms}`)}`;
}

function pickQueryParts({ cas = "", name_it = "", name_en = "", fallbackQuery = "" } = {}) {
  const cleanCas = cleanValue(cas);
  const cleanNameEn = cleanValue(name_en);
  const cleanNameIt = cleanValue(name_it);
  const cleanFallback = cleanValue(fallbackQuery);

  return {
    cas: cleanCas,
    preferred: cleanCas || cleanNameEn || cleanNameIt || cleanFallback,
    fallback: cleanNameEn || cleanNameIt || cleanFallback || cleanCas
  };
}

function buildPubChemLink(parts) {
  if (!parts.preferred) {
    return { status: "missing", url: "" };
  }

  return {
    status: "search",
    url: `${PUBCHEM_SEARCH_PAGE}${encodeQuery(parts.preferred)}`
  };
}

function buildGestisLink(parts) {
  if (parts.preferred) {
    return {
      status: "search",
      url: `${GESTIS_SEARCH_PAGE}${encodeQuery(parts.preferred)}`
    };
  }

  return {
    status: "search",
    url: GESTIS_HOME
  };
}

function buildEchaLink(parts) {
  const query = parts.cas || parts.fallback;

  if (!query) {
    return {
      status: "search",
      url: ECHA_SEARCH_PAGE
    };
  }

  return {
    status: "search",
    url: buildSiteSearch("echa.europa.eu", query, "ECHA chemical")
  };
}

function buildEchemPortalLink(parts) {
  const query = parts.cas || parts.fallback;

  if (!query) {
    return {
      status: "search",
      url: ECHEMPORTAL_HOME
    };
  }

  return {
    status: "search",
    url: buildSiteSearch("echemportal.org/echemportal", query, "eChemPortal")
  };
}

export function buildExternalLinks({ cas = "", name_it = "", name_en = "", fallbackQuery = "" } = {}) {
  const parts = pickQueryParts({ cas, name_it, name_en, fallbackQuery });

  return {
    acgih: {
      status: "unverified",
      url: ""
    },
    echa: buildEchaLink(parts),
    gestis: buildGestisLink(parts),
    pubchem: buildPubChemLink(parts),
    echemportal: buildEchemPortalLink(parts)
  };
}

export function buildSearchLinks(query) {
  return buildExternalLinks({ fallbackQuery: query });
}

export function mergeExternalLinks(substance, fallbackQuery = "") {
  const generatedLinks = buildExternalLinks({
    cas: substance?.cas,
    name_it: substance?.name_it,
    name_en: substance?.name_en,
    fallbackQuery
  });
  const existingLinks = substance?.external_links || {};
  const existingAcgih = existingLinks.acgih || {};

  return {
    ...generatedLinks,
    acgih:
      existingAcgih.status === "verified" && cleanValue(existingAcgih.url)
        ? {
            status: "verified",
            url: cleanValue(existingAcgih.url)
          }
        : generatedLinks.acgih
  };
}
