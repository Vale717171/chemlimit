# ChemLimit agent instructions

ChemLimit is a Chrome extension for chemical occupational exposure limits.

Core rules:
- Do not scrape ACGIH.
- Do not copy ACGIH TLV values into the extension.
- Do not generate ACGIH URLs automatically.
- Do not alter Italian D.Lgs. 81/08 values unless explicitly asked.
- Preserve the D.Lgs. 81/08 dataset structure and metadata unless the task explicitly requires data-model changes.
- Do not use generic search engines for technical source links.
- Prefer official source pages or official source search pages.
- ECHA direct URLs must be manually verified or stored in a verified mapping file.
- If an external direct URL is not verified, open the official source search page instead.
- Keep Chrome permissions minimal.
- Do not add generic host permissions.
- Do not add analytics or tracking.
- Keep all user searches local.
- Always run dataset validation after data model changes.
- After dataset-source edits, run `node scripts/validate-dataset.js` and `node scripts/build-substances-index.js`.
- Prefer small, reviewable PRs and narrowly scoped changes.
