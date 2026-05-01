const ECHA_SEARCH_PAGE = "https://www.echa.europa.eu/en/information-on-chemicals";
const GESTIS_SEARCH_PAGE = "https://gestis.dguv.de/search?q=";
const GESTIS_HOME = "https://gestis.dguv.de/";
const PUBCHEM_SEARCH_PAGE = "https://pubchem.ncbi.nlm.nih.gov/#query=";
const ECHEMPORTAL_HOME = "https://www.echemportal.org/echemportal/";

function cleanValue(value) {
  const text = String(value || "").trim();
  return text || "";
}

function encodeQuery(query) {
  return encodeURIComponent(cleanValue(query));
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

export function buildAcgihLookupPayload({ cas = "", name_it = "", name_en = "", fallbackQuery = "" } = {}) {
  const cleanCas = cleanValue(cas);
  const cleanNameEn = cleanValue(name_en);
  const cleanNameIt = cleanValue(name_it);
  const cleanFallback = cleanValue(fallbackQuery);
  const query = cleanCas || cleanNameEn || cleanNameIt || cleanFallback;

  return {
    query,
    cas: cleanCas,
    name_en: cleanNameEn,
    name_it: cleanNameIt
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
  return {
    status: "search",
    url: ECHA_SEARCH_PAGE
  };
}

function buildEchemPortalLink(parts) {
  return {
    status: "search",
    url: ECHEMPORTAL_HOME
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

export function mergeExternalLinks(substance, fallbackQuery = "", echaVerifiedLinks = []) {
  const generatedLinks = buildExternalLinks({
    cas: substance?.cas,
    name_it: substance?.name_it,
    name_en: substance?.name_en,
    fallbackQuery
  });
  const existingLinks = substance?.external_links || {};
  const existingAcgih = existingLinks.acgih || {};

  let echaLink = generatedLinks.echa;
  if (substance?.cas) {
    const verifiedEcha = echaVerifiedLinks.find(link => link.cas === substance.cas && link.verified);
    if (verifiedEcha && verifiedEcha.url) {
      echaLink = {
        status: "verified",
        url: verifiedEcha.url
      };
    }
  }

  return {
    ...generatedLinks,
    echa: echaLink,
    acgih:
      existingAcgih.status === "verified" && cleanValue(existingAcgih.url)
        ? {
            status: "verified",
            url: cleanValue(existingAcgih.url)
          }
        : generatedLinks.acgih
  };
}
