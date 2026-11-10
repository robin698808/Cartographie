import { EN } from '../i18nDict';
import { addTranslations } from '../i18n';
import { APPTYPE_OPTS, APPTYPE_COLORS } from './itsi';

/* Référentiels éditables par les administrateurs. Les tableaux/objets sont mutés en place pour rester
   visibles de tous les modules qui les importent ; les valeurs sont stockées en français. */
export const STATUT_OPTS = ["", "Actif", "Actif dégradé", "Legacy", "En décommissionnement", "Décommissionné", "En maintenance", "Suspendu", "Inconnu", "Cible", "À refondre", "À migrer", "À consolider", "À décommissionner", "À remplacer", "À créer", "En étude"];
export const STATUT_COLORS = { "Actif": "#10B981", "Actif dégradé": "#F59E0B", "Legacy": "#8B5CF6", "En décommissionnement": "#EF4444", "Décommissionné": "#6B7280", "En maintenance": "#3B82F6", "Suspendu": "#F97316", "Inconnu": "#9CA3AF", "Cible": "#06B6D4", "À refondre": "#EC4899", "À migrer": "#14B8A6", "À consolider": "#A78BFA", "À décommissionner": "#F87171", "À remplacer": "#FB923C", "À créer": "#34D399", "En étude": "#60A5FA" };

const FALLBACK = '#94A3B8';

/* Liste courante (valeurs, couleur, traduction anglaise) au format de l'API */
export function currentLists() {
  const mk = (opts, colors) => opts.filter(Boolean).map((v) => ({ value: v, en: EN[v] || '', color: colors[v] || FALLBACK }));
  return { statuts: mk(STATUT_OPTS, STATUT_COLORS), appTypes: mk(APPTYPE_OPTS, APPTYPE_COLORS) };
}

function swap(arr, values, withEmpty) {
  arr.length = 0;
  if (withEmpty) arr.push('');
  values.forEach((v) => arr.push(v));
}

function swapColors(obj, items) {
  Object.keys(obj).forEach((k) => delete obj[k]);
  items.forEach((i) => { obj[i.value] = i.color || FALLBACK; });
}

export function applyOptionLists(lists) {
  if (!lists) return;
  if (Array.isArray(lists.statuts)) {
    swap(STATUT_OPTS, lists.statuts.map((i) => i.value), true);
    swapColors(STATUT_COLORS, lists.statuts);
  }
  if (Array.isArray(lists.appTypes)) {
    swap(APPTYPE_OPTS, lists.appTypes.map((i) => i.value), false);
    swapColors(APPTYPE_COLORS, lists.appTypes);
  }
  const tr = {};
  [...(lists.statuts || []), ...(lists.appTypes || [])].forEach((i) => { if (i.en) tr[i.value] = i.en; });
  addTranslations(tr);
}
