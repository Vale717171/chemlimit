#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT_DIR = path.join(__dirname, "..");
const ITALY_DIR = path.join(ROOT_DIR, "src", "data", "italy");
const OUTPUT_FILE = path.join(ROOT_DIR, "src", "data", "substances.json");
const ECHA_BASE = "https://echa.europa.eu/search-for-chemicals?p_p_id=disssimplesearch_WAR_disssearchportlet&p_p_lifecycle=0&_disssimplesearch_WAR_disssearchportlet_searchOccurred=true&_disssimplesearch_WAR_disssearchportlet_searchValue=";
const GESTIS_BASE = "https://gestis.dguv.de/search?q=";
const PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/#query=";
const ECHEMPORTAL_BASE = "https://www.echemportal.org/echemportal/substance-search?query=";

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function encodeQuery(value) {
  return encodeURIComponent(String(value || "").trim());
}

function buildSearchUrl(base, value) {
  return value ? `${base}${encodeQuery(value)}` : "";
}

function createLimitRecord(limitObject) {
  return {
    mg_m3: limitObject?.mg_m3 ?? null,
    ppm: limitObject?.ppm ?? null,
    fibers_ml: limitObject?.fibers_ml ?? null
  };
}

function createAnnexRecord(row) {
  return {
    present: true,
    annex: row.annex,
    annex_title: row.annex_title,
    source_label: `${row.source}, Allegato ${row.annex}`,
    source_version: row.source_version,
    source_url: row.source_url,
    verified: row.verified,
    notations: row.notations || [],
    notes: row.notes || [],
    transitional_measures: row.transitional_measures || [],
    vlep_8h: createLimitRecord(row.limit_8h),
    vlep_breve_termine: createLimitRecord(row.limit_short_term)
  };
}

function createBaseSubstance(row, metadata) {
  const queryValue = row.cas || row.name_en || row.name_it;

  return {
    id: slugify(row.name_en || row.name_it || row.cas),
    cas: row.cas,
    ec_number: row.ec_number || "",
    name_it: row.name_it,
    name_en: row.name_en,
    synonyms: row.synonyms || [],
    seed_notice: "Dato importato nella pipeline, da verificare prima dell'uso professionale.",
    dlgs81: {
      metadata: {
        dataset_name: metadata.dataset_name,
        dataset_scope: metadata.dataset_scope,
        legal_source: metadata.legal_source,
        primary_annexes: metadata.primary_annexes,
        current_legal_update: metadata.current_legal_update,
        current_legal_update_publication: metadata.current_legal_update_publication,
        current_legal_update_effective_date: metadata.current_legal_update_effective_date,
        last_checked: metadata.last_checked,
        data_status: metadata.data_status,
        official_sources: metadata.official_sources
      },
      allegato_xxxviii: {
        present: false,
        notes: []
      },
      allegato_xliii: {
        present: false,
        notes: []
      },
      allegato_xliii_bis: {
        present: false,
        notes: []
      }
    },
    external_links: {
      acgih: {
        status: "unverified",
        url: ""
      },
      echa: {
        status: "search",
        url: buildSearchUrl(ECHA_BASE, queryValue)
      },
      gestis: {
        status: "search",
        url: buildSearchUrl(GESTIS_BASE, queryValue)
      },
      pubchem: {
        status: "search",
        url: buildSearchUrl(PUBCHEM_BASE, queryValue)
      },
      echemportal: {
        status: "search",
        url: buildSearchUrl(ECHEMPORTAL_BASE, queryValue)
      }
    }
  };
}

async function loadJson(fileName) {
  const filePath = path.join(ITALY_DIR, fileName);
  const contents = await fs.readFile(filePath, "utf8");
  return JSON.parse(contents);
}

async function main() {
  const metadata = await loadJson("dlgs81_metadata.json");
  const allegatoXXXVIII = await loadJson("dlgs81_allegato_xxxviii.json");
  const allegatoXLIII = await loadJson("dlgs81_allegato_xliii.json");
  const allegatoXLIIIBis = await loadJson("dlgs81_allegato_xliii_bis.json");
  const substancesByCas = new Map();

  const ingest = (row) => {
    if (!row.cas) {
      return;
    }

    const existing = substancesByCas.get(row.cas) || createBaseSubstance(row, metadata);
    existing.id = existing.id || slugify(row.name_en || row.name_it || row.cas);
    existing.ec_number = existing.ec_number || row.ec_number || "";
    existing.name_it = existing.name_it || row.name_it;
    existing.name_en = existing.name_en || row.name_en;
    existing.synonyms = Array.from(new Set([...(existing.synonyms || []), ...(row.synonyms || [])]));

    if (row.annex === "XXXVIII") {
      existing.dlgs81.allegato_xxxviii = createAnnexRecord(row);
    }

    if (row.annex === "XLIII") {
      existing.dlgs81.allegato_xliii = createAnnexRecord(row);
    }

    substancesByCas.set(row.cas, existing);
  };

  allegatoXXXVIII.forEach(ingest);
  allegatoXLIII.forEach(ingest);

  if (Array.isArray(allegatoXLIIIBis) && allegatoXLIIIBis.length > 0) {
    substancesByCas.forEach((substance) => {
      substance.dlgs81.allegato_xliii_bis = {
        present: false,
        notes: ["Struttura dataset predisposta per futuri valori limite biologici obbligatori."]
      };
    });
  }

  const output = Array.from(substancesByCas.values()).sort((left, right) =>
    left.name_it.localeCompare(right.name_it, "it")
  );

  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Built ${output.length} substances into src/data/substances.json`);
}

main().catch((error) => {
  console.error("Unexpected error while building substances index.", error);
  process.exit(1);
});
