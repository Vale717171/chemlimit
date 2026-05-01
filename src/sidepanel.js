import { loadSubstances, searchSubstances } from "./lib/search.js";
import { buildAcgihLookupPayload } from "./lib/links.js";

const form = document.querySelector("#searchForm");
const input = document.querySelector("#searchInput");
const status = document.querySelector("#status");
const results = document.querySelector("#results");

let substances = [];
let echaVerifiedLinks = [];

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

function getAnnexLimit(annexRecord, fieldName) {
  return annexRecord?.[fieldName] || null;
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
      <dl class="definition-list">
        <dt>Allegato ${escapeHtml(annexRecord.annex || "")}</dt>
        <dd>Presente</dd>
        <dt>Fonte</dt>
        <dd>${escapeHtml(annexRecord.source_label || "D.Lgs. 81/08")}</dd>
        <dt>Versione fonte</dt>
        <dd>${escapeHtml(annexRecord.source_version || "da verificare")}</dd>
        <dt>Stato dato</dt>
        <dd>${annexRecord.verified ? "Verificato" : "Da verificare"}</dd>
        <dt>VLEP 8h</dt>
        <dd>${escapeHtml(formatLimit(getAnnexLimit(annexRecord, "limit_8h") || getAnnexLimit(annexRecord, "vlep_8h")))}</dd>
        <dt>VLEP breve termine</dt>
        <dd>${escapeHtml(formatLimit(getAnnexLimit(annexRecord, "limit_short_term") || getAnnexLimit(annexRecord, "vlep_breve_termine")))}</dd>
        <dt>Notazioni</dt>
        <dd>${escapeHtml(notations.join(", ") || "Non indicato")}</dd>
      </dl>
      ${renderSpecificLimits(annexRecord.limits)}
      ${annexRecord.verified ? "" : "<div class=\"notice\">Dato importato nella pipeline, da verificare prima dell'uso professionale.</div>"}
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
      <dl class="definition-list">
        <dt>Allegato ${escapeHtml(annexRecord.annex || "")}</dt>
        <dd>Presente</dd>
        <dt>Fonte</dt>
        <dd>${escapeHtml(annexRecord.source_label || "D.Lgs. 81/08")}</dd>
        <dt>Versione fonte</dt>
        <dd>${escapeHtml(annexRecord.source_version || "da verificare")}</dd>
        <dt>Stato dato</dt>
        <dd>${annexRecord.verified ? "Verificato" : "Da verificare"}</dd>
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
      ${annexRecord.verified ? "" : "<div class=\"notice\">Dato importato nella pipeline, da verificare prima dell'uso professionale.</div>"}
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

  return `
    <section class="section">
      <h2>Italy - D.Lgs. 81/08</h2>
      <dl class="definition-list">
        <dt>Allegato</dt>
        <dd>${escapeHtml(annexSummary)}</dd>
        <dt>Fonte</dt>
        <dd>${escapeHtml(metadata.legal_source || "D.Lgs. 81/08")}</dd>
        <dt>Ultimo controllo</dt>
        <dd>${escapeHtml(metadata.last_checked || "da verificare")}</dd>
      </dl>
    </section>
    ${exposureAnnexes.map((annex) => renderAnnexBlock(annex)).join("")}
    ${renderBiologicalAnnexBlock(xliiiBis)}
  `;
}

function renderLinks(links, acgihPayload) {
  const acgih = links.acgih || { status: "missing", url: "" };
  const acgihButtons = [
    acgihPayload?.query
      ? `<button
          class="link-button"
          data-acgih-lookup="true"
          data-acgih-query="${escapeHtml(acgihPayload.query)}"
          data-acgih-cas="${escapeHtml(acgihPayload.cas || "")}"
          data-acgih-name-en="${escapeHtml(acgihPayload.name_en || "")}"
          data-acgih-name-it="${escapeHtml(acgihPayload.name_it || "")}"
        >Cerca su ACGIH Data Hub</button>`
      : `<p class="link-note">Query ACGIH non disponibile.</p>`,
    acgih.status === "verified" && acgih.url
      ? `<button class="link-button" data-url="${escapeHtml(acgih.url)}">Apri scheda ACGIH</button>`
      : `<p class="link-note">Link diretto ACGIH non verificato.</p>`
  ].join("");

  const linkButtons = [
    ["echa", { verified: "Open ECHA substance page", search: "Open ECHA search" }],
    ["pubchem", { verified: "Apri PubChem", search: "Apri PubChem" }]
  ]
    .map(([key, labels]) => {
      const link = links[key];
      const unavailableLabel = {
        echa: "Ricerca ECHA non disponibile.",
        pubchem: "Ricerca PubChem non disponibile."
      };

      const buttonLabel = link?.status === "verified" ? labels.verified : labels.search;

      return link?.url
        ? `<button class="link-button" data-url="${escapeHtml(link.url)}">${buttonLabel}</button>`
        : `<p class="link-note">${unavailableLabel[key]}</p>`;
    })
    .join("<br>");

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

  results.innerHTML = `
    <section class="section">
      <h2>Identificazione sostanza</h2>
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
    ${renderLinks(substance.external_links, acgihPayload)}
    <section class="section">
      <h2>Note</h2>
      <div class="notice">${escapeHtml(substance.seed_notice || "Seed iniziale da verificare.")}</div>
    </section>
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
}

function runSearch(query) {
  try {
    const cleanQuery = String(query || "").trim();

    if (!cleanQuery) {
      results.innerHTML = "";
      setStatus("Inserisci CAS, nome o sinonimo da cercare.");
      return;
    }

    input.value = cleanQuery;
    const result = searchSubstances(substances, cleanQuery, echaVerifiedLinks);
    setStatus(result.found ? "Risultato locale trovato." : "Nessun risultato locale.");

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
  const { chemlimitLastQuery } = await chrome.storage.local.get("chemlimitLastQuery");

  if (chemlimitLastQuery) {
    runSearch(chemlimitLastQuery);
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

  if (nextSearch) {
    runSearch(nextSearch);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "CHEMLIMIT_SEARCH" && message.query) {
    runSearch(message.query);
  }
});

try {
  substances = await loadSubstances();
  const echaResponse = await fetch(chrome.runtime.getURL("src/data/external/echa_verified_links.json"));
  if (echaResponse.ok) {
    echaVerifiedLinks = await echaResponse.json();
  }
  await consumePendingSearch();
} catch (error) {
  console.error(error);
  setStatus("Errore nel caricamento del database locale.", "error");
}
