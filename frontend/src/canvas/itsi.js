/* Données patrimoine & coûts propres aux projets IT/SI : référentiels, lecture tolérante des valeurs importées, formatage */

export const COST_TYPES = ["OPEX", "CAPEX"];
export const COST_COLORS = { CAPEX: "#6366F1", OPEX: "#06B6D4" };

export const HOSTING_OPTS = ["On-premise", "Cloud privé", "Cloud public (IaaS/PaaS)", "SaaS", "Hybride", "Inconnu"];
export const HOSTING_COLORS = {
  "On-premise": "#64748B", "Cloud privé": "#8B5CF6", "Cloud public (IaaS/PaaS)": "#0EA5E9",
  "SaaS": "#10B981", "Hybride": "#F59E0B", "Inconnu": "#94A3B8",
};

export const APPTYPE_OPTS = ["Progiciel (COTS)", "Développement spécifique", "Open source", "Socle / Middleware", "Poste de travail / Bureautique", "Autre"];
export const APPTYPE_COLORS = {
  "Progiciel (COTS)": "#6366F1", "Développement spécifique": "#EC4899", "Open source": "#10B981",
  "Socle / Middleware": "#0EA5E9", "Poste de travail / Bureautique": "#F59E0B", "Autre": "#94A3B8",
};

export const EOS_BUCKETS = [
  { id: "expired", label: "Expirée",        color: "#EF4444" },
  { id: "lt6",     label: "< 6 mois",       color: "#F97316" },
  { id: "lt12",    label: "6 – 12 mois",    color: "#F59E0B" },
  { id: "gt12",    label: "> 12 mois",      color: "#10B981" },
  { id: "none",    label: "Non renseignée", color: "#64748B" },
];

/* Les motifs sont comparés à l'en-tête de colonne sans accents ni majuscules */
export const ITSI_FIELDS = [
  { key: "budget",       label: "Coût annuel (€)",                patterns: ["cout annuel", "annual cost", "budget", "cout total"] },
  { key: "monthlyCost",  label: "Coût mensuel (€)",               patterns: ["cout mensuel", "monthly", "mensuel"] },
  { key: "costType",     label: "Type de coût",                   patterns: ["type de cout", "type cout", "nature du cout", "capex", "opex"] },
  { key: "licenses",     label: "Nb licences",                    patterns: ["licence", "license"] },
  { key: "hosting",      label: "Hébergement",                    patterns: ["hebergement", "hosting"] },
  { key: "appType",      label: "Type d'application",             patterns: ["type d'app", "type d’app", "type app", "typologie"] },
  { key: "endOfService", label: "Date de fin de mise en service", patterns: ["fin de mise en service", "fin de service", "end of service", "fin de vie", "fin de support", "eol"] },
];

export const DEAL_ONLY_PATTERNS = {
  statusD1: ["day 1", "day1", "statut day 1"],
  statusD2: ["day 2", "day2", "statut day 2"],
};

export const normText = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

export function parseAmount(v) {
  if (v === null || v === undefined || v === "") return null;
  let s = normText(v).replace(/[€\s ]/g, "").replace(/euros?$|eur$/, "");
  let mult = 1;
  if (/k$/.test(s)) { mult = 1e3; s = s.slice(0, -1); }
  else if (/m$/.test(s)) { mult = 1e6; s = s.slice(0, -1); }
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * mult * 100) / 100 : null;
}

const pad2 = (n) => String(n).padStart(2, "0");
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const iso = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`;

/* Retourne AAAA-MM-JJ, ou "" si la valeur n'est pas une date reconnue */
export function parseDate(v) {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  if (!s) return "";
  if (/^\d{5}(\.\d+)?$/.test(s) && +s > 20000 && +s < 80000) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(+s) * 86400000);
    return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return iso(+m[3], +m[2], +m[1]);
  m = s.match(/^(\d{1,2})[/.-](\d{4})$/);
  if (m) return iso(+m[2], +m[1], lastDay(+m[2], +m[1]));
  m = s.match(/^(\d{4})[-/](\d{1,2})$/);
  if (m) return iso(+m[1], +m[2], lastDay(+m[1], +m[2]));
  m = s.match(/^(\d{4})$/);
  if (m) return iso(+m[1], 12, 31);
  return "";
}

const OPTION_SYNONYMS = {
  "on-premise": ["onprem", "on prem", "on-prem", "sur site", "datacenter", "data center", "interne"],
  "cloud prive": ["private cloud", "cloud prive"],
  "cloud public (iaas/paas)": ["cloud", "iaas", "paas", "aws", "azure", "gcp", "public cloud"],
  "saas": ["saas", "software as a service"],
  "hybride": ["hybrid", "hybride"],
  "inconnu": ["inconnu", "n/a"],
  "progiciel (cots)": ["cots", "progiciel", "package", "editeur"],
  "developpement specifique": ["specifique", "custom", "sur mesure", "in-house"],
  "open source": ["open source", "opensource", "oss"],
  "socle / middleware": ["middleware", "socle", "infra", "infrastructure"],
  "poste de travail / bureautique": ["bureautique", "poste de travail", "office"],
};

/* Rapproche une valeur saisie librement d'une valeur du référentiel ; conserve la saisie si rien ne correspond */
export function canonOption(value, options) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const n = normText(raw);
  const exact = options.find((o) => normText(o) === n);
  if (exact) return exact;
  for (const o of options) {
    const syn = OPTION_SYNONYMS[normText(o)] || [];
    if (syn.includes(n)) return o;
  }
  let best = null;
  for (const o of options) {
    for (const x of OPTION_SYNONYMS[normText(o)] || []) {
      if (x.length > 3 && n.includes(x) && (!best || x.length > best.len)) best = { o, len: x.length };
    }
  }
  return best ? best.o : raw;
}

export function eosBucket(isoDate, now = new Date()) {
  if (!isoDate) return "none";
  const d = new Date(isoDate + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return "none";
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  if (d < today) return "expired";
  const plus = (months) => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + months, today.getUTCDate()));
  if (d <= plus(6)) return "lt6";
  if (d <= plus(12)) return "lt12";
  return "gt12";
}

export const formatEuro = (n) => {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  const f = (x, d) => x.toFixed(d).replace(".", ",").replace(/,0$/, "");
  if (abs >= 1e6) return f(n / 1e6, 1) + " M€";
  if (abs >= 1e3) return f(n / 1e3, abs >= 1e5 ? 0 : 1) + " k€";
  return Math.round(n) + " €";
};

export const formatDateFr = (isoDate) => {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
};
