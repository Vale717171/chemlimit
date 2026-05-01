import { loadSubstances, searchSubstances } from "./lib/search.js";

const form = document.querySelector("#searchForm");
const input = document.querySelector("#searchInput");
const status = document.querySelector("#status");
const results = document.querySelector("#results");

let substances = [];

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

function valueOrDash(value) {
  return value || "-";
}

function renderRegulatory(substance) {
  const xxxviii = substance.dlgs81?.allegato_xxxviii || {};
  const xliii = substance.dlgs81?.allegato_xliii || {};
  const notes = [...(xxxviii.notes || []), ...(xliii.notes || [])];
  const regulatoryNotes = notes.length
    ? `<ul>${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`
    : "<p class=\"link-note\">Nessuna nota normativa nel seed corrente.</p>";

  return `
    <section class="section">
      <h2>Italy - D.Lgs. 81/08</h2>
      <dl class="definition-list">
        <dt>Allegato XXXVIII</dt>
        <dd>${xxxviii.present ? "Presente" : "Non indicato nel seed"}</dd>
        <dt>Allegato XLIII</dt>
        <dd>${xliii.present ? "Presente nel seed" : "Non presente nel seed"}</dd>
        <dt>VLEP 8h</dt>
        <dd>${escapeHtml(valueOrDash(xxxviii.vlep_8h?.ppm))} ppm / ${escapeHtml(valueOrDash(xxxviii.vlep_8h?.mg_m3))} mg/m3</dd>
        <dt>VLEP breve termine</dt>
        <dd>${escapeHtml(valueOrDash(xxxviii.vlep_breve_termine?.ppm))} ppm / ${escapeHtml(valueOrDash(xxxviii.vlep_breve_termine?.mg_m3))} mg/m3</dd>
      </dl>
      <h2>Note normative</h2>
      ${regulatoryNotes}
    </section>
  `;
}

function renderLinks(links) {
  const acgih = links.acgih || { status: "missing", url: "" };
  const acgihHtml =
    acgih.status === "verified" && acgih.url
      ? `<button class="link-button" data-url="${escapeHtml(acgih.url)}">Apri ACGIH</button>`
      : `<p class="link-note">Link ACGIH non ancora verificato.</p>`;

  const linkButtons = [
    ["echa", "Apri ECHA"],
    ["gestis", "Apri GESTIS"],
    ["pubchem", "Apri PubChem"],
    ["echemportal", "Apri eChemPortal"]
  ]
    .map(([key, label]) => {
      const link = links[key];
      return link?.url ? `<button class="link-button" data-url="${escapeHtml(link.url)}">${label}</button>` : "";
    })
    .join("");

  return `
    <section class="section">
      <h2>International sources</h2>
      <div class="links">
        ${acgihHtml}
        ${linkButtons}
      </div>
    </section>
  `;
}

function renderFound(result) {
  const substance = result.substance;

  results.innerHTML = `
    <section class="section">
      <h2>Identificazione sostanza</h2>
      <dl class="definition-list">
        <dt>CAS</dt>
        <dd>${escapeHtml(substance.cas)}</dd>
        <dt>Nome IT</dt>
        <dd>${escapeHtml(substance.name_it)}</dd>
        <dt>Nome EN</dt>
        <dd>${escapeHtml(substance.name_en)}</dd>
        <dt>Sinonimi</dt>
        <dd>${escapeHtml((substance.synonyms || []).join(", ") || "-")}</dd>
      </dl>
    </section>
    ${renderRegulatory(substance)}
    ${renderLinks(substance.external_links)}
    <section class="section">
      <h2>Note</h2>
      <div class="notice">${escapeHtml(substance.seed_notice || "Seed iniziale da verificare.")}</div>
    </section>
  `;
}

function renderNotFound(result) {
  results.innerHTML = `
    <section class="empty">
      Nessun risultato locale per "${escapeHtml(result.query)}". Puoi consultare le fonti internazionali con link di ricerca generici.
    </section>
    ${renderLinks(result.external_links)}
  `;
}

function bindExternalButtons() {
  results.querySelectorAll("[data-url]").forEach((button) => {
    button.addEventListener("click", () => openExternal(button.dataset.url));
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
    const result = searchSubstances(substances, cleanQuery);
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
  await consumePendingSearch();
} catch (error) {
  console.error(error);
  setStatus("Errore nel caricamento del database locale.", "error");
}
