#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const METADATA_FILE = path.join(__dirname, "..", "src", "data", "italy", "dlgs81_metadata.json");
const MAX_AGE_DAYS = 90;

async function main() {
  const contents = await fs.readFile(METADATA_FILE, "utf8");
  const metadata = JSON.parse(contents);
  const lastChecked = new Date(metadata.last_checked);

  if (Number.isNaN(lastChecked.getTime())) {
    console.error("Dataset staleness check failed: last_checked non valido.");
    process.exit(1);
  }

  const now = new Date();
  const diffMs = now.getTime() - lastChecked.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > MAX_AGE_DAYS) {
    console.warn(
      `Warning: dataset last_checked is ${diffDays} days old. Review src/data/italy/dlgs81_metadata.json and the legal sources.`
    );
    return;
  }

  console.log(`Dataset staleness check passed: last_checked is ${diffDays} days old.`);
}

main().catch((error) => {
  console.error("Unexpected error during dataset staleness check.", error);
  process.exit(1);
});
