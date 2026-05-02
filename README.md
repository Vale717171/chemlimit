# ChemLimit

**ChemLimit** is a Chrome extension for quick lookup of Italian VLEP/OEL values from D.Lgs. 81/08, with links to selected external chemical sources.

## Status

MVP / early public preview.

ChemLimit is currently focused on an Italy-first regulatory workflow, with the D.Lgs. 81/08 dataset as its primary local source.

The dataset is currently under progressive verification.

## What it does

- Looks up chemical substances by CAS, Italian name, English name, or simple synonyms.
- English names are currently limited.
- Uses exact-first search and shows up to two simple suggestions when there is no exact match.
- Adds a small informational family hint for some regulatory category entries when there is no exact match and no suggestion.
- Shows local Italian occupational exposure limit data from:
  - `D.Lgs. 81/08 - Allegato XXXVIII`
  - `D.Lgs. 81/08 - Allegato XLIII`
  - `D.Lgs. 81/08 - Allegato XLIII-bis` where applicable
- Opens selected external sources from the extension UI:
  - `ECHA`
  - `PubChem`
  - `ACGIH Data Hub`
- Supports a user-triggered ACGIH Data Hub helper flow that opens the official page and helps the user find a likely matching substance entry directly on that page.

## What it does not do

- It does **not** scrape ACGIH.
- It does **not** copy or reproduce ACGIH TLV values.
- It does **not** store a local ACGIH substance database.
- It does **not** send searches to ChemLimit-owned servers.
- It does **not** replace verification on official legal or technical sources.

## Local installation in Chrome

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the local `chemlimit` folder.

## Basic usage

1. Select a CAS number or substance name on a web page.
2. Right-click and choose `Cerca con ChemLimit`.
3. Review the side panel result.
4. Use `ECHA`, `PubChem`, or `Cerca su ACGIH Data Hub` when needed.

You can also search manually from the popup or directly inside the side panel.

## Dataset: D.Lgs. 81/08

The extension reads its local regulatory dataset from `src/data/substances.json`, which is generated from source files under `src/data/italy/`.

Current source structure:

- `src/data/italy/dlgs81_allegato_xxxviii.json`
- `src/data/italy/dlgs81_allegato_xliii.json`
- `src/data/italy/dlgs81_allegato_xliii_bis.json`
- `src/data/italy/dlgs81_metadata.json`

Current dataset workflow:

1. Update or review the source JSON files in `src/data/italy/`.
2. Run `node scripts/validate-dataset.js`.
3. Run `node scripts/build-substances-index.js`.
4. Run `node scripts/check-dataset-staleness.js`.
5. Reload the extension in Chrome and test searches.

## ACGIH policy

- No ACGIH TLV values are copied into ChemLimit.
- No ACGIH database is stored locally in the repo or extension dataset.
- ACGIH support is limited to a **user-triggered Data Hub lookup**.
- The extension opens the official `https://www.acgih.org/data-hub/` page and helps the user locate a likely matching entry there.
- Any ACGIH result should always be checked on the official ACGIH page.

## Privacy

- No user accounts
- No analytics
- No ChemLimit-owned backend
- Searches are processed locally in the extension
- External-source browsing is subject to the privacy policies of those external sites

See [PRIVACY.md](./PRIVACY.md) for the current privacy note.

## Regulatory caution

- ChemLimit is a quick consultation tool.
- Italian limit data comes from the local D.Lgs. 81/08 dataset.
- Before professional use, always verify the applicable official legal source.
- ECHA, PubChem, and ACGIH are external sources.
- ChemLimit does not copy or redistribute ACGIH TLV values.

## Roadmap

- Review and refine the D.Lgs. 81/08 dataset
- Improve synonym quality and normalization
- Expand support for regulatory edge cases such as multiple limits per entry
- Improve verified-link workflows for selected external sources
- Add GESTIS and eChemPortal back into the public UI when the UX is solid enough
- Consider bilingual Italian/English UI
- Evaluate Firefox support

## Feedback requested

Looking for feedback on:

- UX clarity
- data model for regulatory limits
- Chrome extension architecture
- legal/compliance risks around external sources
- high-value features for a niche professional tool

Not looking for:

- unnecessary feature creep
- scraping protected databases
- reproducing ACGIH TLV values

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening data or behavior changes.

## Security

Please read [SECURITY.md](./SECURITY.md) for vulnerability reporting guidance.
