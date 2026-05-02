import { loadFamilies, loadSubstances, searchSubstances } from "./lib/search.js";
import { buildAcgihLookupPayload } from "./lib/links.js";

const form = document.querySelector("#searchForm");
const input = document.querySelector("#searchInput");
const status = document.querySelector("#status");
const results = document.querySelector("#results");

let substances = [];
let families = {};
let echaVerifiedLinks = [];
let lastHandledQuery = "";
let lastHandledAt = 0;

const ACGIH_DATA_HUB_URL = "https://www.acgih.org/data-hub/";
const ACGIH_LOOKUP_STORAGE_KEY = "chemlimitAcgihLookup";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(message, type = "info") {
  status.textContent = message;
  status.className = type === "error" ? "status error" : "status";
}

function openExternal(url) {
  if (!url) {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

function shouldSkipSearch(query, queryAt = 0) {
  return Boolean(query && queryAt && query === lastHandledQuery && queryAt === lastHandledAt);
}

function markHandledSearch(query, queryAt = 0) {
  lastHandledQuery = String(query || "").trim();
  lastHandledAt = Number(queryAt || 0);
}

async function startAcgihLookup(payload) {
  const query = String(payload?.query || "").trim();

  if (!query) {
    setStatus("Nessuna query disponibile per la ricerca ACGIH.", "error");
    return;
  }

  const lookupPayload = {
    query,
    cas: String(payload?.cas || "").trim(),
    name_en: String(payload?.name_en || "").trim(),
    name_it: String(payload?.name_it || "").trim(),
    created_at: Date.now()
  };

  try {
    await chrome.storage.local.set({
      [ACGIH_LOOKUP_STORAGE_KEY]: lookupPayload
    });

    if (chrome.tabs?.create) {
      await chrome.tabs.create({ url: ACGIH_DATA_HUB_URL });
    } else {
      window.open(ACGIH_DATA_HUB_URL, "_blank", "noopener,noreferrer");
    }
  } catch (error) {
    console.error("ChemLimit: errore durante l'apertura del lookup ACGIH.", error);

    try {
      window.open(ACGIH_DATA_HUB_URL, "_blank", "noopener,noreferrer");
    } catch (fallbackError) {
      console.error("ChemLimit: errore nel fallback di apertura ACGIH.", fallbackError);
      setStatus("Impossibile aprire ACGIH Data Hub.", "error");
    }
  }
}

function valueOrDash(value) {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value).replace(".", ",");
}

function formatLimit(limit) {
  const ppm = limit?.ppm;
  const mgM3 = limit?.mg_m3;
  const fibersMl = limit?.fibers_ml;
  const parts = [];

  if (ppm !== null && ppm !== undefined) {
    parts.push(`${formatNumber(ppm)} ppm`);
  }

  if (mgM3 !== null && mgM3 !== undefined) {
    parts.push(`${formatNumber(mgM3)} mg/m³`);
  }

  if (fibersMl !== null && fibersMl !== undefined) {
    parts.push(`${formatNumber(fibersMl)} f/ml`);
  }

  return parts.join(" / ") || "Non indicato";
}

function getAnnexSubtitle(annex) {
  if (annex === "XXXVIII") {
    return "Valori limite di esposizione professionale - agenti chimici";
  }

  if (annex === "XLIII") {
    return "Valori limite per agenti cancerogeni, mutageni o tossici per la riproduzione";
  }

  if (annex === "XLIII-bis") {
    return "Valori limite biologici obbligatori e sorveglianza sanitaria";
  }

  return "";
}

function getAnnexLimit(annexRecord, fieldName) {
  return annexRecord?.[fieldName] || null;
}

function hasFiberLimit(annexRecord) {
  const limits = [
    annexRecord?.limit_8h,
    annexRecord?.limit_short_term,
    ...(annexRecord?.limits || [])
  ];

  return limits.some((limit) => limit?.fibers_ml !== null && limit?.fibers_ml !== undefined);
}

function renderBadges(items) {
  const badges = Array.from(new Set((items || []).filter(Boolean)));

  if (!badges.length) {
    return "";
  }

  return `
    <div class="badge-row">
      ${badges.map((item) => `<span class="badge">${escapeHtml(item)}</span>`).join("")}
    </div>
  `;
}

function collectRegulatoryBadges(substance) {
  const badges = [];
  const xxxviii = substance.dlgs81?.allegato_xxxviii || {};
  const xliii = substance.dlgs81?.allegato_xliii || {};
  const xliiiBis = substance.dlgs81?.allegato_xliii_bis || {};

  if (xxxviii.present) {
    badges.push(...(xxxviii.notations || []));
    if (hasFiberLimit(xxxviii)) {
      badges.push("f/ml");
    }
  }

  if (xliii.present) {
    badges.push("Allegato XLIII", "Agente CMR / Titolo IX Capo II", ...(xliii.notations || []));
    if (hasFiberLimit(xliii)) {
      badges.push("f/ml");
    }
  }

  if (xliiiBis.present) {
    badges.push("Allegato XLIII-bis", "Valore biologico");
  }

  return badges;
}

function renderSpecificLimits(limits) {
  if (!Array.isArray(limits) || limits.length === 0) {
    return "";
  }

  return `
    <h2>Limiti specifici</h2>
    <ul>
      ${limits
        .map((limit) => {
          const limitLabel = [limit.label, limit.period].filter(Boolean).join(" - ");
          const value = formatLimit(limit);
          const noteText = Array.isArray(limit.notes) && limit.notes.length
            ? ` (${limit.notes.map((note) => escapeHtml(note)).join("; ")})`
            : "";
          return `<li><strong>${escapeHtml(limitLabel || "Limite")}</strong>: ${escapeHtml(value)}${noteText}</li>`;
        })
        .join("")}
    </ul>
  `;
}

function renderAnnexBlock(annexRecord) {
  if (!annexRecord?.present) {
    return "";
  }

  const notes = annexRecord.notes || [];
  const notations = annexRecord.notations || [];
  const noteHtml = notes.length
    ? `<ul>${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`
    : "<p class=\"link-note\">Nessuna nota normativa.</p>";

  return `
    <section class="section">
      <h2>Allegato ${escapeHtml(annexRecord.annex || "")}</h2>
      <p class="section-copy">${escapeHtml(getAnnexSubtitle(annexRecord.annex || ""))}</p>
      <dl class="definition-list">
        <dt>Allegato ${escapeHtml(annexRecord.annex || "")}</dt>
        <dd>Presente</dd>
        <dt>Fonte</dt>
        <dd>${escapeHtml(annexRecord.source_label || "D.Lgs. 81/08")}</dd>
        <dt>Versione fonte</dt>
        <dd>${escapeHtml(annexRecord.source_version || "da verificare")}</dd>
        <dt>VLEP 8h</dt>
        <dd>${escapeHtml(formatLimit(getAnnexLimit(annexRecord, "limit_8h") || getAnnexLimit(annexRecord, "vlep_8h")))}</dd>
        <dt>VLEP breve termine</dt>
        <dd>${escapeHtml(formatLimit(getAnnexLimit(annexRecord, "limit_short_term") || getAnnexLimit(annexRecord, "vlep_breve_termine")))}</dd>
        <dt>Notazioni</dt>
        <dd>${escapeHtml(notations.join(", ") || "Non indicato")}</dd>
      </dl>
      ${renderSpecificLimits(annexRecord.limits)}
      <h2>Note normative</h2>
      ${noteHtml}
    </section>
  `;
}

function renderBiologicalAnnexBlock(annexRecord) {
  if (!annexRecord?.present) {
    return "";
  }

  const biological = annexRecord.biological_limit_value || {};
  const notes = annexRecord.notes || [];
  const noteHtml = notes.length
    ? `<ul>${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`
    : "<p class=\"link-note\">Nessuna nota normativa.</p>";

  return `
    <section class="section">
      <h2>Allegato ${escapeHtml(annexRecord.annex || "")}</h2>
      <p class="section-copy">${escapeHtml(getAnnexSubtitle(annexRecord.annex || ""))}</p>
      <dl class="definition-list">
        <dt>Allegato ${escapeHtml(annexRecord.annex || "")}</dt>
        <dd>Presente</dd>
        <dt>Fonte</dt>
        <dd>${escapeHtml(annexRecord.source_label || "D.Lgs. 81/08")}</dd>
        <dt>Versione fonte</dt>
        <dd>${escapeHtml(annexRecord.source_version || "da verificare")}</dd>
        <dt>Parametro biologico</dt>
        <dd>${escapeHtml(valueOrDash(biological.parameter))}</dd>
        <dt>Valore limite biologico</dt>
        <dd>${escapeHtml(
          [biological.value, biological.unit].filter((item) => item !== null && item !== undefined && item !== "").join(" ") ||
            "Non indicato"
        )}</dd>
        <dt>Matrice</dt>
        <dd>${escapeHtml(valueOrDash(biological.matrix))}</dd>
        <dt>Campionamento</dt>
        <dd>${escapeHtml(valueOrDash(biological.sampling_time))}</dd>
      </dl>
      <h2>Note normative</h2>
      ${noteHtml}
    </section>
  `;
}

function renderRegulatory(substance) {
  const xxxviii = substance.dlgs81?.allegato_xxxviii || {};
  const xliii = substance.dlgs81?.allegato_xliii || {};
  const xliiiBis = substance.dlgs81?.allegato_xliii_bis || {};
  const metadata = substance.dlgs81?.metadata || {};
  const exposureAnnexes = [xxxviii, xliii].filter((annex) => annex.present);
  const annexSummary = [xxxviii, xliii, xliiiBis]
    .filter((annex) => annex.present)
    .map((annex) => annex.annex)
    .join(" | ") || "-";
  const officialSources = Array.isArray(metadata.official_sources) ? metadata.official_sources : [];

  return `
    <section class="section">
      <h2>Italy - D.Lgs. 81/08</h2>
      <p class="section-copy">Dataset normativo: D.Lgs. 81/08, aggiornato da ${escapeHtml(metadata.current_legal_update || "da verificare")}</p>
      <p class="section-copy">Ultimo controllo dataset: ${escapeHtml(metadata.last_checked || "da verificare")}</p>
      <dl class="definition-list">
        <dt>Allegato</dt>
        <dd>${escapeHtml(annexSummary)}</dd>
        <dt>Fonte</dt>
        <dd>${escapeHtml(metadata.legal_source || "D.Lgs. 81/08")}</dd>
      </dl>
      ${
        officialSources.length
          ? `
      <div class="links compact-links">
        ${officialSources
          .map((source) =>
            source?.url
              ? `<button class="link-button secondary-button" data-url="${escapeHtml(source.url)}">${escapeHtml(source.label || "Fonte ufficiale")}</button>`
              : ""
          )
          .join("")}
      </div>`
          : ""
      }
    </section>
    ${exposureAnnexes.map((annex) => renderAnnexBlock(annex)).join("")}
    ${renderBiologicalAnnexBlock(xliiiBis)}
  `;
}

function renderLinks(links, acgihPayload) {
  const acgih = links.acgih || { status: "missing", url: "" };
  const acgihButtons = [
    `<div class="source-item">
      <p class="source-title">ACGIH Data Hub</p>
      <p class="source-description">Fonte esterna per individuare la scheda ACGIH ufficiale.</p>
      ${
        acgihPayload?.query
          ? `<button
          class="link-button"
          data-acgih-lookup="true"
          data-acgih-query="${escapeHtml(acgihPayload.query)}"
          data-acgih-cas="${escapeHtml(acgihPayload.cas || "")}"
          data-acgih-name-en="${escapeHtml(acgihPayload.name_en || "")}"
          data-acgih-name-it="${escapeHtml(acgihPayload.name_it || "")}"
        >Cerca su ACGIH Data Hub</button>`
          : `<p class="link-note">Query ACGIH non disponibile.</p>`
      }
      ${acgih.status === "verified" && acgih.url
        ? `<button class="link-button secondary-button" data-url="${escapeHtml(acgih.url)}">Apri scheda ACGIH</button>`
        : ""}
    </div>`
  ].join("");

  const linkButtons = [
    [
      "echa",
      {
        title: "ECHA - identificazione e dati regolatori",
        description: "Fonte esterna per identificazione, classificazione e dati regolatori; non sostituisce i VLEP italiani.",
        verified: "Apri ECHA",
        search: "Apri ECHA"
      }
    ],
    [
      "pubchem",
      {
        title: "PubChem",
        description: "Fonte esterna per identificazione chimica generale.",
        verified: "Apri PubChem",
        search: "Apri PubChem"
      }
    ]
  ]
    .map(([key, source]) => {
      const link = links[key];
      const unavailableLabel = {
        echa: "Ricerca ECHA non disponibile.",
        pubchem: "Ricerca PubChem non disponibile."
      };

      const buttonLabel = link?.status === "verified" ? source.verified : source.search;

      return `
        <div class="source-item">
          <p class="source-title">${escapeHtml(source.title)}</p>
          <p class="source-description">${escapeHtml(source.description)}</p>
          ${
            link?.url
              ? `<button class="link-button" data-url="${escapeHtml(link.url)}">${buttonLabel}</button>`
              : `<p class="link-note">${unavailableLabel[key]}</p>`
          }
        </div>
      `;
    })
    .join("");

  return `
    <section class="section">
      <h2>International sources</h2>
      <div class="links">
        ${acgihButtons}
        ${linkButtons}
      </div>
    </section>
  `;
}

function renderFound(result) {
  const substance = result.substance;
  const acgihPayload = buildAcgihLookupPayload({
    cas: substance.cas,
    name_en: substance.name_en,
    name_it: substance.name_it
  });
  const regulatoryBadges = collectRegulatoryBadges(substance);

  results.innerHTML = `
    <section class="section">
      <h2>Identificazione sostanza</h2>
      ${renderBadges(regulatoryBadges)}
      <dl class="definition-list">
        <dt>CAS</dt>
        <dd>${escapeHtml(valueOrDash(substance.cas))}</dd>
        <dt>Nome IT</dt>
        <dd>${escapeHtml(substance.name_it)}</dd>
        <dt>Nome EN</dt>
        <dd>${escapeHtml(substance.name_en)}</dd>
        <dt>Sinonimi</dt>
        <dd>${escapeHtml((substance.synonyms || []).join(", ") || "-")}</dd>
      </dl>
    </section>
    ${renderRegulatory(substance)}
    <section class="section">
      <p class="section-copy">Verificare sempre i dati sulle fonti normative applicabili prima dell’uso professionale.</p>
    </section>
    ${renderLinks(substance.external_links, acgihPayload)}
  `;
}

function renderNotFound(result) {
  const acgihPayload = buildAcgihLookupPayload({
    fallbackQuery: result.query
  });

  results.innerHTML = `
    <section class="empty">
      Nessun risultato locale per "${escapeHtml(result.query)}". Puoi consultare le fonti internazionali con link di ricerca generici.
    </section>
    ${
      Array.isArray(result.suggestions) && result.suggestions.length
        ? `
    <section class="section">
      <h2>Possibili alternative</h2>
      <p class="section-copy">Nessuna corrispondenza esatta. Possibili alternative:</p>
      <div class="links">
        ${result.suggestions
          .map((suggestion) => {
            const searchValue = suggestion.cas || suggestion.name_it || suggestion.name_en;
            const label = suggestion.cas
              ? `${suggestion.name_it} (${suggestion.cas})`
              : suggestion.name_it;
            return `<button class="link-button" data-suggestion-query="${escapeHtml(searchValue || "")}">${escapeHtml(label)}</button>`;
          })
          .join("")}
      </div>
    </section>`
        : ""
    }
    ${
      !result.suggestions?.length && result.familyHint
        ? `
    <section class="section">
      <h2>Categoria normativa</h2>
      <p class="section-copy">Nessuna corrispondenza esatta.</p>
      <p class="section-copy">La sostanza potrebbe rientrare nella categoria normativa:</p>
      <p><strong>${escapeHtml(result.familyHint.label)}</strong> (${escapeHtml(`Allegato ${result.familyHint.annex}`)})</p>
      <p class="section-copy">Verificare la classificazione.</p>
    </section>`
        : ""
    }
    ${renderLinks(result.external_links, acgihPayload)}
  `;
}

function bindExternalButtons() {
  results.querySelectorAll("[data-url]").forEach((button) => {
    button.addEventListener("click", () => openExternal(button.dataset.url));
  });

  results.querySelectorAll("[data-acgih-lookup]").forEach((button) => {
    button.addEventListener("click", async () => {
      const acgihPayload = buildAcgihLookupPayload({
        cas: button.dataset.acgihCas,
        name_en: button.dataset.acgihNameEn,
        name_it: button.dataset.acgihNameIt,
        fallbackQuery: button.dataset.acgihQuery
      });
      await startAcgihLookup(acgihPayload);
    });
  });

  results.querySelectorAll("[data-suggestion-query]").forEach((button) => {
    button.addEventListener("click", () => {
      runSearch(button.dataset.suggestionQuery);
    });
  });
}

function runSearch(query, options = {}) {
  try {
    const cleanQuery = String(query || "").trim();
    const queryAt = Number(options.queryAt || 0);

    if (!cleanQuery) {
      results.innerHTML = "";
      setStatus("Inserisci CAS, nome o sinonimo da cercare.");
      return;
    }

    if (shouldSkipSearch(cleanQuery, queryAt)) {
      return;
    }

    input.value = cleanQuery;
    const result = searchSubstances(substances, cleanQuery, echaVerifiedLinks, families);
    setStatus(result.found ? "Risultato locale trovato." : "Nessun risultato locale.");
    markHandledSearch(cleanQuery, queryAt);

    if (result.found) {
      renderFound(result);
    } else {
      renderNotFound(result);
    }

    bindExternalButtons();
  } catch (error) {
    console.error(error);
    results.innerHTML = "";
    setStatus("Errore durante la ricerca. Riprova o ricarica l'estensione.", "error");
  }
}

async function consumePendingSearch() {
  const { chemlimitLastQuery, chemlimitLastQueryAt } = await chrome.storage.local.get([
    "chemlimitLastQuery",
    "chemlimitLastQueryAt"
  ]);

  if (chemlimitLastQuery) {
    runSearch(chemlimitLastQuery, { queryAt: chemlimitLastQueryAt });
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch(input.value);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  const nextSearch = changes.chemlimitLastQuery?.newValue;
  const nextSearchAt = changes.chemlimitLastQueryAt?.newValue
    ?? changes.chemlimitLastQueryAt?.oldValue
    ?? 0;

  if (nextSearch) {
    runSearch(nextSearch, { queryAt: nextSearchAt });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "CHEMLIMIT_SEARCH" && message.query) {
    runSearch(message.query, { queryAt: message.queryAt });
  }
});

try {
  substances = await loadSubstances();
  families = await loadFamilies();
  const echaResponse = await fetch(chrome.runtime.getURL("src/data/external/echa_verified_links.json"));
  if (echaResponse.ok) {
    echaVerifiedLinks = await echaResponse.json();
  }
  await consumePendingSearch();
} catch (error) {
  console.error(error);
  setStatus("Errore nel caricamento del database locale.", "error");
}
