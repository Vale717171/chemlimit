const SEARCH_ENDPOINTS = {
  echa: "https://echa.europa.eu/search-for-chemicals?p_p_id=disssimplesearch_WAR_disssearchportlet&p_p_lifecycle=0&_disssimplesearch_WAR_disssearchportlet_searchOccurred=true&_disssimplesearch_WAR_disssearchportlet_sessionCriteriaId=dissSimpleSearchSessionParam101401551565659&_disssimplesearch_WAR_disssearchportlet_searchValue=",
  gestis: "https://gestis.dguv.de/search?q=",
  pubchem: "https://pubchem.ncbi.nlm.nih.gov/#query=",
  echemportal: "https://www.echemportal.org/echemportal/substance-search?query="
};

export function buildSearchLinks(query) {
  const encoded = encodeURIComponent(String(query || "").trim());

  return {
    echa: {
      status: "search",
      url: `${SEARCH_ENDPOINTS.echa}${encoded}`
    },
    gestis: {
      status: "search",
      url: `${SEARCH_ENDPOINTS.gestis}${encoded}`
    },
    pubchem: {
      status: "search",
      url: `${SEARCH_ENDPOINTS.pubchem}${encoded}`
    },
    echemportal: {
      status: "search",
      url: `${SEARCH_ENDPOINTS.echemportal}${encoded}`
    }
  };
}

export function mergeExternalLinks(substance, fallbackQuery) {
  const query = substance?.cas || substance?.name_it || fallbackQuery;
  const generated = buildSearchLinks(query);
  const existing = substance?.external_links || {};

  return {
    acgih: existing.acgih || { status: "missing", url: "" },
    echa: existing.echa?.url ? existing.echa : generated.echa,
    gestis: existing.gestis?.url ? existing.gestis : generated.gestis,
    pubchem: existing.pubchem?.url ? existing.pubchem : generated.pubchem,
    echemportal: existing.echemportal?.url ? existing.echemportal : generated.echemportal
  };
}
