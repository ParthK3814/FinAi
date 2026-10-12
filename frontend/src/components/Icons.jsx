// Small inline icons so the project needs no icon library.
const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const IconDashboard = (p) => (
  <svg {...base} {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
);
export const IconTransactions = (p) => (
  <svg {...base} {...p}><path d="M7 4v14M3 14l4 4 4-4" /><path d="M17 20V6M13 10l4-4 4 4" /></svg>
);
export const IconPortfolio = (p) => (
  <svg {...base} {...p}><path d="M3 20h18" /><path d="M6 20v-7M12 20V6M18 20v-10" /></svg>
);
export const IconScore = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconPlus = (p) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconEdit = (p) => (
  <svg {...base} {...p}><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></svg>
);
export const IconTrash = (p) => (
  <svg {...base} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
);
export const IconClose = (p) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconAlert = (p) => (
  <svg {...base} {...p}><path d="M12 3l10 18H2L12 3z" /><path d="M12 10v5M12 18h.01" /></svg>
);
