const STORAGE_KEY = "chemlimitAcgihLookup";
const BANNER_ID = "chemlimit-acgih-banner";
const HIGHLIGHT_CLASS = "chemlimit-acgih-highlight";

function normalizeCas(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "");
}

function normalizeWords(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function stripQualifier(value) {
  return String(value || "")
    .replace(/\s*\((bei|nic)\)\s*$/i, "")
    .trim();
}

function getRows() {
  return Array.from(document.querySelectorAll("tr"))
    .map((row) => {
      const cells = row.querySelectorAll("td");

      if (cells.length < 2) {
        return null;
      }

      const link = cells[0].querySelector("a[href]");

      if (!link) {
        return null;
      }

      return {
        element: row,
        link,
        name: cells[0].textContent.trim(),
        baseName: stripQualifier(cells[0].textContent.trim()),
        casText: cells[1].textContent.trim()
      };
    })
    .filter(Boolean);
}

function hasCasMatch(row, casQuery) {
  if (!casQuery) {
    return false;
  }

  return row.casText
    .split(";")
    .map((part) => normalizeCas(part))
    .some((part) => part === casQuery);
}

function scoreNameMatch(row, nameQuery) {
  if (!nameQuery) {
    return -1;
  }

  const queryWords = normalizeWords(nameQuery);
  const fullWords = normalizeWords(row.name);
  const baseWords = normalizeWords(row.baseName);

  if (!queryWords || (!fullWords && !baseWords)) {
    return -1;
  }

  let score = -1;

  if (baseWords === queryWords) {
    score = 900;
  } else if (fullWords === queryWords) {
    score = 880;
  } else if (baseWords.split(" ").includes(queryWords)) {
    score = 760;
  } else if (baseWords.includes(queryWords)) {
    score = 720;
  } else if (fullWords.includes(queryWords)) {
    score = 700;
  }

  if (score >= 0 && /\b(bei|nic)\b/i.test(fullWords)) {
    score -= 10;
  }

  return score;
}

function findBestMatch(rows, lookup) {
  const casQuery = normalizeCas(lookup?.cas || "");
  const nameQuery = lookup?.name_en || lookup?.name_it || lookup?.query || "";
  let bestMatch = null;
  let bestScore = -1;

  rows.forEach((row) => {
    let score = -1;

    if (hasCasMatch(row, casQuery)) {
      score = 1000;
    } else {
      score = scoreNameMatch(row, nameQuery);
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = row;
    }
  });

  return bestScore >= 0 ? bestMatch : null;
}

function clearHighlight() {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((row) => {
    row.classList.remove(HIGHLIGHT_CLASS);
    row.style.outline = "";
    row.style.outlineOffset = "";
    row.style.backgroundColor = "";
  });
}

function highlightMatch(match) {
  clearHighlight();

  if (!match?.element) {
    return;
  }

  match.element.classList.add(HIGHLIGHT_CLASS);
  match.element.style.outline = "3px solid #0f6b63";
  match.element.style.outlineOffset = "-1px";
  match.element.style.backgroundColor = "#e9f5f2";
  match.element.scrollIntoView({ behavior: "smooth", block: "center" });
}

function removeBanner() {
  document.getElementById(BANNER_ID)?.remove();
}

function createButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.style.border = "0";
  button.style.borderRadius = "6px";
  button.style.padding = "8px 10px";
  button.style.background = "#0f6b63";
  button.style.color = "#fff";
  button.style.cursor = "pointer";
  button.style.font = "600 13px/1.2 system-ui, sans-serif";
  button.addEventListener("click", onClick);
  return button;
}

function showBanner(message, match) {
  removeBanner();

  const banner = document.createElement("div");
  banner.id = BANNER_ID;
  banner.style.position = "sticky";
  banner.style.top = "0";
  banner.style.zIndex = "99999";
  banner.style.display = "flex";
  banner.style.alignItems = "center";
  banner.style.justifyContent = "space-between";
  banner.style.gap = "12px";
  banner.style.padding = "10px 14px";
  banner.style.background = "#e9f5f2";
  banner.style.borderBottom = "1px solid #b8d8d2";
  banner.style.color = "#172027";
  banner.style.font = "13px/1.4 system-ui, sans-serif";

  const text = document.createElement("div");
  text.textContent = message;
  banner.appendChild(text);

  if (match?.link?.href) {
    banner.appendChild(
      createButton("Apri scheda ACGIH", () => {
        window.open(match.link.href, "_blank", "noopener,noreferrer");
      })
    );
  }

  document.body.prepend(banner);
}

function runLookup(lookup) {
  if (!lookup?.query) {
    return;
  }

  const rows = getRows();

  if (!rows.length) {
    showBanner(
      `ChemLimit: nessuna corrispondenza automatica trovata. Usa Ctrl+F/Cmd+F sulla pagina ACGIH.`,
      null
    );
    return;
  }

  const match = findBestMatch(rows, lookup);

  if (match) {
    highlightMatch(match);
    showBanner(`ChemLimit: trovato possibile link ACGIH per ${lookup.query}`, match);
    return;
  }

  clearHighlight();
  showBanner(
    "ChemLimit: nessuna corrispondenza automatica trovata. Usa Ctrl+F/Cmd+F sulla pagina ACGIH.",
    null
  );
}

async function loadLookup() {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    runLookup(stored[STORAGE_KEY]);
  } catch (error) {
    console.error("ChemLimit: errore nel lookup ACGIH sul Data Hub.", error);
  }
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[STORAGE_KEY]?.newValue) {
    return;
  }

  runLookup(changes[STORAGE_KEY].newValue);
});

loadLookup();
