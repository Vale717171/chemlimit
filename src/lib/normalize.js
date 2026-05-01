export function normalizeText(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function normalizeCas(value) {
  return String(value || "").replace(/\s+/g, "");
}

export function isCas(value) {
  return /^\d{2,7}-\d{2}-\d$/.test(normalizeCas(value));
}
