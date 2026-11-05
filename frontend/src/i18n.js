import { EN } from './i18nDict';

const STORAGE_KEY = 'carto:lang';
const EVENT = 'carto:lang-change';
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'NOSCRIPT']);
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

const norm = (s) => s.replace(/[\u2019\u2018]/g, "'").replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

const DICT = new Map();
Object.keys(EN).forEach((k) => DICT.set(norm(k), EN[k]));
const DICT_LC = new Map();
DICT.forEach((v, k) => DICT_LC.set(k.toLowerCase(), v));

// Mots isolés, utilisés en dernier recours sur les textes composés (compteurs, libellés dynamiques)
const WORDS = {
  flux: 'flows', domaine: 'domain', domaines: 'domains', critique: 'critical', critiques: 'critical',
  criticité: 'criticality', criticités: 'criticalities', entrants: 'incoming', entrant: 'incoming',
  sortants: 'outgoing', sortant: 'outgoing', 'sortant(s)': 'outgoing', connectées: 'connected', connectée: 'connected',
  applicatif: 'application', applicatifs: 'application', applicative: 'application',
  responsable: 'owner', responsables: 'owners', coût: 'cost', coûts: 'costs', mois: 'months', an: 'year', ans: 'years',
  et: 'and', ou: 'or', avec: 'with', sans: 'without', dans: 'in', par: 'per', pour: 'for', vers: 'to', depuis: 'from',
  total: 'total', aucun: 'no', aucune: 'no', tous: 'all', toutes: 'all', tout: 'all', plus: 'more', moins: 'less',
  jours: 'days', jour: 'day', semaine: 'week', semaines: 'weeks', années: 'years', année: 'year',
  renseigné: 'provided', renseignée: 'provided', renseignés: 'provided', définis: 'defined', définie: 'defined',
  affichés: 'shown', affichées: 'shown', trouvé: 'found', trouvés: 'found', protocoles: 'protocols', protocole: 'protocol',
  utilisateurs: 'users', licences: 'licenses', échéance: 'deadline', échéances: 'deadlines', équipe: 'team',
  projet: 'project', projets: 'projects', membres: 'members', membre: 'member', résultat: 'result', résultats: 'results',
  sélectionné: 'selected', sélectionnés: 'selected', sélectionnée: 'selected', sélectionnées: 'selected',
  charge: 'load', chargé: 'loaded', chargée: 'loaded', hébergement: 'hosting', patrimoine: 'assets', fiche: 'sheet',
  police: 'font', catégories: 'categories', catégorie: 'category', bordure: 'border', espacement: 'spacing', taille: 'size', vues: 'views', vue: 'view', nom: 'name', couleur: 'color',
  hier: 'yesterday', aujourd: 'today', maintenant: 'now', actuellement: 'currently',
};
const MONTHS = {
  'janv.': 'Jan', 'févr.': 'Feb', mars: 'Mar', 'avr.': 'Apr', mai: 'May', juin: 'Jun',
  'juil.': 'Jul', août: 'Aug', 'sept.': 'Sep', 'oct.': 'Oct', 'nov.': 'Nov', 'déc.': 'Dec',
};
const WORD_RE = /[\p{L}][\p{L}()']*/gu;
// Locutions numériques valables dans n'importe quel texte (compteurs, infobulles)
const INLINE = [
  [/(\d+) flux\b/g, '$1 flows'],
  [/(\d+) domaines?\b/g, (m, n) => `${n} domain${n === '1' ? '' : 's'}`],
  [/(\d+) mois\b/g, '$1 months'],
  [/(\d+) ans?\b/g, (m, n) => `${n} year${n === '1' ? '' : 's'}`],
  [/(\d+) jours?\b/g, (m, n) => `${n} day${n === '1' ? '' : 's'}`],
  [/(\d+) connexions?\b/g, (m, n) => `${n} connection${n === '1' ? '' : 's'}`],
  [/(\d+) applications? critiques?\b/g, (m, n) => `${n} critical application${n === '1' ? '' : 's'}`],
];
const NUM_RE = /\d+(?:[.,]\d+)*/g;
const IDENT = new Set(['applications', 'application', 'apps', 'app', 'widgets', 'widget', 'top', 'dashboard', 'hub', 'saas', 'api', 'sla', 'ia', 'it']);

const RULES = [
  [/^Bonjour, (.*)$/i, (m) => `Good morning, ${m[1]}`],
  [/^Bonsoir, (.*)$/i, (m) => `Good evening, ${m[1]}`],
  [/^Supprimer (.+)$/, (m) => `Delete ${m[1]}`],
  [/^Modifier (.+)$/, (m) => `Edit ${m[1]}`],
  [/^(\d{1,2}) (janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.) (\d{4})$/i, (m) => `${MONTHS[m[2].toLowerCase()]} ${parseInt(m[1], 10)}, ${m[3]}`],
  [/^Application à criticité (haute|critique) : continuité de service à sécuriser\.$/i, (m) => `Application with ${m[1].toLowerCase() === 'haute' ? 'high' : 'critical'} criticality: service continuity to be secured.`],
  [/^Statut « (.+) » : trajectoire à planifier\.$/i, (m) => `Status "${m[1]}": roadmap to be planned.`],
  [/^il y a (\d+) min$/i, (m) => `${m[1]} min ago`],
  [/^il y a (\d+) h$/i, (m) => `${m[1]} h ago`],
  [/^il y a (\d+) j$/i, (m) => `${m[1]} d ago`],
  [/^(\d+) mois$/i, (m) => `${m[1]} months`],
  [/^(\d+) ans?$/i, (m) => `${m[1]} year${m[1] === '1' ? '' : 's'}`],
  [/^(\d+) jours?$/i, (m) => `${m[1]} day${m[1] === '1' ? '' : 's'}`],
  [/^Supprimer la vue « ?(.*?) ? » \?$/i, (m) => `Delete view "${m[1]}"?`],
  [/^Remplacer la vue « ?(.*?) ? » par la disposition actuelle \?$/i, (m) => `Replace view "${m[1]}" with the current layout?`],
];

const matchCase = (src, out) => (src[0] && src[0] !== src[0].toLowerCase() && out ? out[0].toUpperCase() + out.slice(1) : out);

function translateCore(text) {
  const key = norm(text);
  if (!key) return null;
  const hit = DICT.get(key) ?? DICT_LC.get(key.toLowerCase());
  if (hit != null) return hit;
  const nums = key.match(NUM_RE);
  if (nums) {
    const tpl = DICT.get(key.replace(NUM_RE, '#'));
    if (tpl != null) {
      let i = 0;
      return tpl.replace(/#/g, () => nums[i++] ?? '#');
    }
  }
  for (const [re, fn] of RULES) {
    const m = key.match(re);
    if (m) return fn(m);
  }
  let inl = key;
  for (const [re, rep] of INLINE) inl = inl.replace(re, rep);
  if (inl !== key) return inl;
  if (key.split(' ').length > 6) return null;
  let ok = true;
  const out = key.replace(WORD_RE, (w) => {
    const r = WORDS[w.toLowerCase()];
    if (r != null) return matchCase(w, r);
    if (!/[a-zà-ÿ]/.test(w) || IDENT.has(w.toLowerCase())) return w;
    ok = false;
    return w;
  });
  return ok && out !== key ? out : null;
}

export function translateString(text) {
  if (getLang() !== 'en' || typeof text !== 'string') return text;
  const lead = text.match(/^\s*/)[0];
  const trail = text.match(/\s*$/)[0];
  const out = translateCore(text);
  return out == null ? text : lead + out + trail;
}

export function getLang() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}

const textState = new WeakMap(); // Text -> { orig, out }
const attrState = new WeakMap(); // Element -> { [attr]: { orig, out } }
let observer = null;

function translateTextNode(node) {
  const cur = node.nodeValue;
  const st = textState.get(node);
  if (st && cur === st.out) return;
  const out = cur && cur.trim() ? translateString(cur) : cur;
  if (out !== cur) {
    textState.set(node, { orig: cur, out });
    node.nodeValue = out;
  } else if (st) textState.delete(node);
}

function translateAttrs(el) {
  for (const a of ATTRS) {
    const cur = el.getAttribute(a);
    if (cur == null) continue;
    const map = attrState.get(el) || {};
    const st = map[a];
    if (st && cur === st.out) continue;
    const out = translateString(cur);
    if (out !== cur) {
      map[a] = { orig: cur, out };
      attrState.set(el, map);
      el.setAttribute(a, out);
    } else if (st) {
      delete map[a];
    }
  }
}

function skip(el) {
  return !el || SKIP_TAGS.has(el.tagName) || el.isContentEditable || el.closest?.('[data-notranslate]');
}

function walk(root) {
  if (root.nodeType === 3) {
    if (!skip(root.parentElement)) translateTextNode(root);
    return;
  }
  if (root.nodeType !== 1 || skip(root)) return;
  translateAttrs(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeType === 1 && skip(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  let n = w.nextNode();
  while (n) {
    if (n.nodeType === 3) translateTextNode(n);
    else translateAttrs(n);
    n = w.nextNode();
  }
}

function restore(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n = w.nextNode();
  while (n) {
    if (n.nodeType === 3) {
      const st = textState.get(n);
      if (st && n.nodeValue === st.out) n.nodeValue = st.orig;
      textState.delete(n);
    } else {
      const map = attrState.get(n);
      if (map) {
        for (const a of Object.keys(map)) if (n.getAttribute(a) === map[a].out) n.setAttribute(a, map[a].orig);
        attrState.delete(n);
      }
    }
    n = w.nextNode();
  }
}

function onMutations(records) {
  if (getLang() !== 'en') return;
  for (const r of records) {
    if (r.type === 'childList') r.addedNodes.forEach((n) => walk(n));
    else if (r.type === 'characterData') walk(r.target);
    else if (r.type === 'attributes' && !skip(r.target)) translateAttrs(r.target);
  }
}

function apply() {
  const en = getLang() === 'en';
  document.documentElement.lang = en ? 'en' : 'fr';
  if (observer) observer.disconnect();
  if (en) {
    walk(document.body);
    document.title = translateString(document.title);
    observer.observe(document.body, {
      childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS,
    });
  } else {
    restore(document.body);
    if (document.documentElement.dataset.titleFr) document.title = document.documentElement.dataset.titleFr;
  }
}

export function setLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang === 'en' ? 'en' : 'fr');
  } catch { /* stockage indisponible */ }
  apply();
  window.dispatchEvent(new CustomEvent(EVENT, { detail: getLang() }));
}

export function initI18n() {
  document.documentElement.dataset.titleFr = document.title;
  observer = new MutationObserver(onMutations);
  // Les boîtes de dialogue natives passent aussi par le traducteur
  ['alert', 'confirm', 'prompt'].forEach((fn) => {
    const orig = window[fn].bind(window);
    window[fn] = (msg, ...rest) => orig(translateString(String(msg ?? '')), ...rest);
  });
  if (document.body) apply();
  else document.addEventListener('DOMContentLoaded', apply);
}
