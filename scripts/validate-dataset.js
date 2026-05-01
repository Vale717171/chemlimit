#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "..", "src", "data", "italy");
const DATASET_FILES = {
  "dlgs81_allegato_xxxviii.json": {
    kind: "exposure",
    requiredFields: [
      "country",
      "jurisdiction",
      "source",
      "annex",
      "annex_title",
      "cas",
      "ec_number",
      "name_it",
      "name_en",
      "synonyms",
      "limit_8h",
      "limit_short_term",
      "notations",
      "notes",
      "transitional_measures",
      "source_version",
      "source_url",
      "verified"
    ]
  },
  "dlgs81_allegato_xliii.json": {
    kind: "exposure",
    requiredFields: [
      "country",
      "jurisdiction",
      "source",
      "annex",
      "annex_title",
      "cas",
      "ec_number",
      "name_it",
      "name_en",
      "synonyms",
      "limit_8h",
      "limit_short_term",
      "notations",
      "notes",
      "transitional_measures",
      "source_version",
      "source_url",
      "verified"
    ]
  },
  "dlgs81_allegato_xliii_bis.json": {
    kind: "biological",
    requiredFields: [
      "country",
      "jurisdiction",
      "source",
      "annex",
      "annex_title",
      "cas",
      "ec_number",
      "name_it",
      "name_en",
      "biological_limit_value",
      "notes",
      "source_version",
      "source_url",
      "verified"
    ]
  }
};
const METADATA_FILE = "dlgs81_metadata.json";
const CAS_PATTERN = /^\d{2,7}-\d{2}-\d$/;

function isNumberOrNull(value) {
  return value === null || typeof value === "number";
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function isValidCasChecksum(cas) {
  const digits = cas.replace(/-/g, "");
  const checkDigit = Number(digits.at(-1));
  const body = digits.slice(0, -1).split("").reverse();
  const sum = body.reduce((total, digit, index) => total + Number(digit) * (index + 1), 0);
  return sum % 10 === checkDigit;
}

function validateExposureLimit(limitObject, fieldName, errors, context) {
  if (!limitObject || typeof limitObject !== "object") {
    errors.push(`${context}: campo ${fieldName} mancante o non valido.`);
    return;
  }

  for (const key of ["mg_m3", "ppm", "fibers_ml"]) {
    if (!hasOwn(limitObject, key)) {
      errors.push(`${context}: campo ${fieldName}.${key} mancante.`);
      continue;
    }

    if (!isNumberOrNull(limitObject[key])) {
      errors.push(`${context}: campo ${fieldName}.${key} deve essere numerico o null.`);
    }
  }
}

function validateBiologicalLimit(limitObject, errors, context) {
  if (!limitObject || typeof limitObject !== "object") {
    errors.push(`${context}: biological_limit_value mancante o non valido.`);
    return;
  }

  for (const key of ["parameter", "value", "unit", "matrix", "sampling_time"]) {
    if (!hasOwn(limitObject, key)) {
      errors.push(`${context}: campo biological_limit_value.${key} mancante.`);
    }
  }

  if (!isNumberOrNull(limitObject.value)) {
    errors.push(`${context}: biological_limit_value.value deve essere numerico o null.`);
  }
}

async function loadJson(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  const contents = await fs.readFile(filePath, "utf8");
  return JSON.parse(contents);
}

async function validateMetadata(errors) {
  const metadata = await loadJson(METADATA_FILE);

  for (const field of [
    "dataset_name",
    "dataset_scope",
    "legal_source",
    "primary_annexes",
    "current_legal_update",
    "current_legal_update_publication",
    "current_legal_update_effective_date",
    "last_checked",
    "data_status",
    "official_sources"
  ]) {
    if (!hasOwn(metadata, field)) {
      errors.push(`${METADATA_FILE}: campo obbligatorio mancante ${field}.`);
    }
  }

  if (!Array.isArray(metadata.primary_annexes)) {
    errors.push(`${METADATA_FILE}: primary_annexes deve essere un array.`);
  }

  if (!Array.isArray(metadata.official_sources)) {
    errors.push(`${METADATA_FILE}: official_sources deve essere un array.`);
  }

  return metadata;
}

async function main() {
  const errors = [];
  const warnings = [];

  await validateMetadata(errors);

  for (const [fileName, config] of Object.entries(DATASET_FILES)) {
    let rows;

    try {
      rows = await loadJson(fileName);
    } catch (error) {
      errors.push(`${fileName}: JSON non valido o file non leggibile (${error.message}).`);
      continue;
    }

    if (!Array.isArray(rows)) {
      errors.push(`${fileName}: il contenuto deve essere un array.`);
      continue;
    }

    const casSeen = new Set();

    rows.forEach((row, index) => {
      const context = `${fileName}[${index}]`;

      for (const field of config.requiredFields) {
        if (!hasOwn(row, field)) {
          errors.push(`${context}: campo obbligatorio mancante ${field}.`);
        }
      }

      if (!row.annex) {
        errors.push(`${context}: annex mancante o vuoto.`);
      }

      if (!hasOwn(row, "name_it")) {
        errors.push(`${context}: name_it mancante.`);
      }

      if (config.kind === "exposure") {
        if (typeof row.cas !== "string" || !CAS_PATTERN.test(row.cas)) {
          errors.push(`${context}: CAS non valido (${row.cas}).`);
        } else {
          if (!isValidCasChecksum(row.cas)) {
            errors.push(`${context}: checksum CAS non valido (${row.cas}).`);
          }

          if (casSeen.has(row.cas)) {
            errors.push(`${context}: duplicato CAS nello stesso allegato (${row.cas}).`);
          } else {
            casSeen.add(row.cas);
          }
        }

        if (!Array.isArray(row.synonyms)) {
          errors.push(`${context}: synonyms deve essere un array.`);
        }

        if (!Array.isArray(row.notations)) {
          errors.push(`${context}: notations deve essere un array.`);
        }

        if (!Array.isArray(row.transitional_measures)) {
          errors.push(`${context}: transitional_measures deve essere un array.`);
        }

        validateExposureLimit(row.limit_8h, "limit_8h", errors, context);
        validateExposureLimit(row.limit_short_term, "limit_short_term", errors, context);
      }

      if (config.kind === "biological") {
        if (!(row.cas === null || (typeof row.cas === "string" && CAS_PATTERN.test(row.cas) && isValidCasChecksum(row.cas)))) {
          errors.push(`${context}: CAS deve essere null oppure un CAS valido.`);
        }

        validateBiologicalLimit(row.biological_limit_value, errors, context);
      }

      if (!Array.isArray(row.notes)) {
        errors.push(`${context}: notes deve essere un array.`);
      }

      if (!row.source_version) {
        errors.push(`${context}: source_version mancante o vuoto.`);
      }

      if (!hasOwn(row, "verified") || typeof row.verified !== "boolean") {
        errors.push(`${context}: verified deve essere presente e boolean.`);
      } else if (row.verified === false) {
        warnings.push(`${context}: verified=false, dato da verificare.`);
      }
    });
  }

  warnings.forEach((warning) => console.warn(`Warning: ${warning}`));

  if (errors.length > 0) {
    console.error("Dataset validation failed:");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log("Dataset validation passed.");
}

main().catch((error) => {
  console.error("Unexpected error during dataset validation.", error);
  process.exit(1);
});
