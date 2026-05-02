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
const MANUAL_ALIASES = {
  "67-64-1": {
    name_en: "Acetone",
    synonyms: ["propanone", "dimetilchetone", "dimethyl ketone"]
  },
  "71-43-2": {
    name_en: "Benzene",
    synonyms: ["benzolo"]
  },
  "79-01-6": {
    name_en: "Trichloroethylene",
    synonyms: ["tricloroetene", "trichloroethene", "TCE", "trilene"]
  },
  "50-00-0": {
    name_en: "Formaldehyde",
    synonyms: ["metanale", "methanal", "aldeide formica"]
  },
  "108-88-3": {
    name_en: "Toluene",
    synonyms: ["toluolo"]
  },
  "1330-20-7": {
    name_en: "Xylene, mixed isomers",
    synonyms: ["xilene", "xylene"]
  }
};

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeKeyPart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCAS(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function normalizeAscii(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function createStructuredLimits(limits) {
  if (!Array.isArray(limits) || limits.length === 0) {
    return undefined;
  }

  return limits.map((limit) => ({
    label: limit?.label || "",
    period: limit?.period || "",
    ...createLimitRecord(limit),
    notes: Array.isArray(limit?.notes) ? limit.notes : []
  }));
}

function createAnnexRecord(row) {
  const limit8h = createLimitRecord(row.limit_8h);
  const limitShortTerm = createLimitRecord(row.limit_short_term);
  const structuredLimits = createStructuredLimits(row.limits);

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
    limit_8h: limit8h,
    limit_short_term: limitShortTerm,
    vlep_8h: limit8h,
    vlep_breve_termine: limitShortTerm,
    ...(structuredLimits ? { limits: structuredLimits } : {})
  };
}

function createBaseSubstance(row, metadata) {
  const queryValue = row.cas || row.name_en || row.name_it;
  const manualAliases = row.cas ? MANUAL_ALIASES[row.cas] || {} : {};
  const nameIt = row.name_it;
  const nameEn = row.name_en || manualAliases.name_en || row.name_it;

  return {
    id: slugify(row.name_en || row.name_it || row.cas),
    cas: row.cas || "",
    cas_normalized: normalizeCAS(row.cas || ""),
    ec_number: row.ec_number || "",
    name_it: nameIt,
    name_en: nameEn,
    name_ascii: normalizeAscii(nameEn || nameIt),
    synonyms: Array.from(new Set([...(row.synonyms || []), ...(manualAliases.synonyms || [])])),
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

function getComparableLimitSignature(annexRecord) {
  if (!annexRecord?.present) {
    return "";
  }

  return JSON.stringify({
    limit_8h: annexRecord.limit_8h || null,
    limit_short_term: annexRecord.limit_short_term || null,
    limits: annexRecord.limits || null,
    biological_limit_value: annexRecord.biological_limit_value || null
  });
}

function warnOnMergedCasDifferences(existing, row) {
  if (!existing?.cas || !row?.cas || existing.cas !== row.cas) {
    return;
  }

  const existingNames = [existing.name_it, existing.name_en].filter(Boolean).map(normalizeAscii);
  const incomingNames = [row.name_it, row.name_en].filter(Boolean).map(normalizeAscii);
  const namesDiffer =
    existingNames.length &&
    incomingNames.length &&
    incomingNames.every((incomingName) => !existingNames.includes(incomingName));

  if (namesDiffer) {
    console.warn(
      `Warning: CAS ${row.cas} has differing names across annexes: ` +
        `"${existing.name_it || existing.name_en}" vs "${row.name_it || row.name_en}".`
    );
  }

  if (row.annex === "XXXVIII" && existing.dlgs81?.allegato_xliii?.present) {
    const currentAnnex = createAnnexRecord(row);
    if (getComparableLimitSignature(existing.dlgs81.allegato_xliii) !== getComparableLimitSignature(currentAnnex)) {
      console.warn(`Warning: CAS ${row.cas} has differing limit structures between Allegato XLIII and XXXVIII.`);
    }
  }

  if (row.annex === "XLIII" && existing.dlgs81?.allegato_xxxviii?.present) {
    const currentAnnex = createAnnexRecord(row);
    if (getComparableLimitSignature(existing.dlgs81.allegato_xxxviii) !== getComparableLimitSignature(currentAnnex)) {
      console.warn(`Warning: CAS ${row.cas} has differing limit structures between Allegato XXXVIII and XLIII.`);
    }
  }
}

function getRowKey(row) {
  if (row.cas) {
    return `cas:${row.cas}`;
  }

  const ecPart = normalizeKeyPart(row.ec_number);
  const namePart = normalizeKeyPart(row.name_it || row.name_en);
  return `name:${ecPart}:${namePart}`;
}

function createBiologicalAnnexRecord(row) {
  return {
    present: true,
    annex: row.annex,
    annex_title: row.annex_title,
    source_label: `${row.source}, Allegato ${row.annex}`,
    source_version: row.source_version,
    source_url: row.source_url,
    verified: row.verified,
    notes: row.notes || [],
    biological_limit_value: row.biological_limit_value || null
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
  const substancesByKey = new Map();

  const ingest = (row) => {
    const key = getRowKey(row);
    const existing = substancesByKey.get(key) || createBaseSubstance(row, metadata);
    warnOnMergedCasDifferences(existing, row);
    existing.id = existing.id || slugify(row.name_en || row.name_it || row.cas);
    existing.ec_number = existing.ec_number || row.ec_number || "";
    existing.name_it = existing.name_it || row.name_it;
    existing.name_en = existing.name_en || row.name_en || row.name_it;
    existing.cas = existing.cas || row.cas || "";
    existing.cas_normalized = existing.cas_normalized || normalizeCAS(existing.cas || row.cas || "");
    existing.name_ascii = existing.name_ascii || normalizeAscii(existing.name_en || existing.name_it || row.name_en || row.name_it);
    existing.synonyms = Array.from(
      new Set([
        ...(existing.synonyms || []),
        ...(row.synonyms || []),
        ...((row.cas && MANUAL_ALIASES[row.cas]?.synonyms) || [])
      ])
    );

    if (row.annex === "XXXVIII") {
      existing.dlgs81.allegato_xxxviii = createAnnexRecord(row);
    }

    if (row.annex === "XLIII") {
      existing.dlgs81.allegato_xliii = createAnnexRecord(row);
    }

    substancesByKey.set(key, existing);
  };

  allegatoXXXVIII.forEach(ingest);
  allegatoXLIII.forEach(ingest);

  if (Array.isArray(allegatoXLIIIBis) && allegatoXLIIIBis.length > 0) {
    allegatoXLIIIBis.forEach((row) => {
      const hasBiologicalData =
        row.name_it ||
        row.name_en ||
        row.biological_limit_value?.parameter ||
        (row.biological_limit_value?.value !== null && row.biological_limit_value?.value !== undefined);

      if (!hasBiologicalData) {
        return;
      }

      const biologicalKey = getRowKey({
        ...row,
        name_it:
          row.name_it ||
          (normalizeKeyPart(row.biological_limit_value?.parameter).includes("piombo")
            ? "Piombo inorganico e i suoi composti"
            : row.name_it)
      });
      const existing = substancesByKey.get(biologicalKey) ||
        createBaseSubstance(
          {
            ...row,
            name_it: row.name_it || row.name_en || row.biological_limit_value?.parameter || "Valore biologico",
            name_en: row.name_en || row.name_it || row.biological_limit_value?.parameter || "Biological value",
            synonyms: []
          },
          metadata
        );
      existing.dlgs81.allegato_xliii_bis = createBiologicalAnnexRecord(row);
      existing.cas_normalized = existing.cas_normalized || normalizeCAS(existing.cas || row.cas || "");
      existing.name_ascii =
        existing.name_ascii ||
        normalizeAscii(existing.name_en || existing.name_it || row.name_en || row.name_it || row.biological_limit_value?.parameter);
      substancesByKey.set(biologicalKey, existing);
    });
  }

  const output = Array.from(substancesByKey.values()).sort((left, right) =>
    left.name_it.localeCompare(right.name_it, "it")
  );

  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Built ${output.length} substances into src/data/substances.json`);
}

main().catch((error) => {
  console.error("Unexpected error while building substances index.", error);
  process.exit(1);
});
