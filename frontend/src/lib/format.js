// Money, percent and date formatting. The currency comes from the backend
// (/api/meta) so it is configured in exactly one place: CURRENCY in .env.
let currency = "USD";

export function setCurrency(code) {
  currency = code || "USD";
}

export function formatMoney(value, { decimals = 0, compact = false } = {}) {
  const number = Number(value ?? 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: compact ? "compact" : "standard",
      minimumFractionDigits: compact ? 0 : decimals,
      maximumFractionDigits: compact ? 1 : decimals,
    }).format(number);
  } catch {
    return `${number.toFixed(decimals)} ${currency}`;
  }
}

export function formatPercent(fraction, digits = 1) {
  if (fraction === null || fraction === undefined) return "-";
  return `${(Number(fraction) * 100).toFixed(digits)}%`;
}

// For values that are already percentages (e.g. gain_pct = 26.3).
export function formatPercentPoints(value, digits = 1) {
  const number = Number(value ?? 0);
  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(digits)}%`;
}

export function formatDate(iso) {
  if (!iso) return "-";
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// Colours shared by the charts and tables.
export const ASSET_COLORS = {
  stock: "#0E7C86",
  etf: "#3D6FB6",
  mutual_fund: "#7B5EA7",
  bond: "#8A9BA8",
  gold: "#C98A12",
  crypto: "#D1693B",
  real_estate: "#5F8D4E",
  cash: "#2FB8C4",
  other: "#B0BCC6",
};
