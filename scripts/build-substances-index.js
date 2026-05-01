#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT_DIR = path.join(__dirname, "..");
const ITALY_DIR = path.join(ROOT_DIR, "src", "data", "italy");
const OUTPUT_FILE = path.join(ROOT_DIR, "src", "data", "substances.json");

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function valueOrVerify(value) {
  return value === null ? "da verificare" : String(value);
}

function makeAnnexRecord(row, metadata) {
  return {
    present: true,
    annex: row.annex,
    vlep_8h: {
      mg_m3: valueOrVerify(row.limit_8h.mg_m3),
      ppm: valueOrVerify(row.limit_8h.ppm)
    },
    vlep_breve_termine: {
      mg_m3: valueOrVerify(row.limit_short_term.mg_m3),
      ppm: valueOrVerify(row.limit_short_term.ppm)
    },
    notations: row.notations || [],
    notes: row.notes || [],
    source_label: `${row.source}, Allegato ${row.annex}`,
    source_version: row.source_version,
    dataset_last_checked: metadata.last_checked,
    legal_version_note: metadata.legal_version_note,
    verified: row.verified
  };
}

function createBaseSubstance(row, metadata) {
  return {
    id: slugify(row.name_en || row.name_it || row.cas),
    cas: row.cas,
    ec_number: row.ec_number || "",
    name_it: row.name_it,
    name_en: row.name_en,
    synonyms: row.synonyms || [],
    seed_notice: `${metadata.dataset_name}: ${metadata.data_status}.`,
    dlgs81: {
      metadata: {
        dataset_name: metadata.dataset_name,
        legal_source: metadata.legal_source,
        primary_annexes: metadata.primary_annexes,
        last_checked: metadata.last_checked,
        legal_version_note: metadata.legal_version_note,
        official_sources: metadata.official_sources,
        data_status: metadata.data_status
      },
      allegato_xxxviii: {
        present: false,
        notes: []
      },
      allegato_xliii: {
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
        url: ""
      },
      gestis: {
        status: "search",
        url: ""
      },
      pubchem: {
        status: "search",
        url: ""
      },
      echemportal: {
        status: "search",
        url: ""
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
  const substancesByCas = new Map();

  const ingest = (row) => {
    const existing = substancesByCas.get(row.cas) || createBaseSubstance(row, metadata);
    existing.id = existing.id || slugify(row.name_en || row.name_it || row.cas);
    existing.ec_number = existing.ec_number || row.ec_number || "";
    existing.name_it = existing.name_it || row.name_it;
    existing.name_en = existing.name_en || row.name_en;
    existing.synonyms = Array.from(new Set([...(existing.synonyms || []), ...(row.synonyms || [])]));

    if (row.annex === "XXXVIII") {
      existing.dlgs81.allegato_xxxviii = makeAnnexRecord(row, metadata);
    }

    if (row.annex === "XLIII") {
      existing.dlgs81.allegato_xliii = makeAnnexRecord(row, metadata);
    }

    substancesByCas.set(row.cas, existing);
  };

  allegatoXXXVIII.forEach(ingest);
  allegatoXLIII.forEach(ingest);

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
