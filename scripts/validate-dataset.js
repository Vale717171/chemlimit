#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "..", "src", "data", "italy");
const FILES = [
  "dlgs81_allegato_xxxviii.json",
  "dlgs81_allegato_xliii.json"
];
const CAS_PATTERN = /^\d{2,7}-\d{2}-\d$/;
const NUMERIC_OR_NULL_PATTERN = /^\d+(\.\d+)?$/;
const REQUIRED_FIELDS = [
  "country",
  "source",
  "annex",
  "cas",
  "name_it",
  "name_en",
  "synonyms",
  "limit_8h",
  "limit_short_term",
  "notations",
  "notes",
  "source_version",
  "verified"
];

function isNumericOrNull(value) {
  return value === null || (typeof value === "string" && NUMERIC_OR_NULL_PATTERN.test(value));
}

function validateLimitObject(limitObject, fieldName, errors, context) {
  if (!limitObject || typeof limitObject !== "object") {
    errors.push(`${context}: campo ${fieldName} mancante o non valido.`);
    return;
  }

  for (const key of ["mg_m3", "ppm"]) {
    if (!Object.prototype.hasOwnProperty.call(limitObject, key)) {
      errors.push(`${context}: campo ${fieldName}.${key} mancante.`);
      continue;
    }

    if (!isNumericOrNull(limitObject[key])) {
      errors.push(`${context}: campo ${fieldName}.${key} deve essere stringa numerica o null.`);
    }
  }
}

async function loadJson(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  const contents = await fs.readFile(filePath, "utf8");
  return JSON.parse(contents);
}

async function main() {
  const errors = [];

  for (const fileName of FILES) {
    const rows = await loadJson(fileName);

    if (!Array.isArray(rows)) {
      errors.push(`${fileName}: il contenuto deve essere un array.`);
      continue;
    }

    const casSeen = new Set();

    rows.forEach((row, index) => {
      const context = `${fileName}[${index}]`;

      for (const field of REQUIRED_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(row, field)) {
          errors.push(`${context}: campo obbligatorio mancante ${field}.`);
        }
      }

      if (!CAS_PATTERN.test(String(row.cas || ""))) {
        errors.push(`${context}: CAS non valido (${row.cas}).`);
      } else if (casSeen.has(row.cas)) {
        errors.push(`${context}: duplicato CAS nello stesso allegato (${row.cas}).`);
      } else {
        casSeen.add(row.cas);
      }

      if (!Array.isArray(row.synonyms)) {
        errors.push(`${context}: synonyms deve essere un array.`);
      }

      if (!Array.isArray(row.notations)) {
        errors.push(`${context}: notations deve essere un array.`);
      }

      if (!Array.isArray(row.notes)) {
        errors.push(`${context}: notes deve essere un array.`);
      }

      if (!row.source_version) {
        errors.push(`${context}: source_version mancante o vuoto.`);
      }

      if (typeof row.verified !== "boolean") {
        errors.push(`${context}: verified deve essere boolean.`);
      }

      validateLimitObject(row.limit_8h, "limit_8h", errors, context);
      validateLimitObject(row.limit_short_term, "limit_short_term", errors, context);
    });
  }

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
