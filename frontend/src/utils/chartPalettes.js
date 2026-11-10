import { createContext, useContext, useState, useCallback } from 'react';

/* Nuanciers disponibles pour les graphiques du dashboard.
   'default' conserve les couleurs d'origine (domaines, criticité, statuts…). */
export const PALETTES = [
  { id: 'default', label: 'Par défaut', stops: null },
  { id: 'indigo', label: 'Dégradé indigo', stops: ['#312E81', '#6366F1', '#C7D2FE'] },
  { id: 'ocean', label: 'Dégradé océan', stops: ['#0C4A6E', '#0891B2', '#A5F3FC'] },
  { id: 'forest', label: 'Dégradé forêt', stops: ['#14532D', '#16A34A', '#BBF7D0'] },
  { id: 'sunset', label: 'Dégradé coucher de soleil', stops: ['#7F1D1D', '#F97316', '#FDE68A'] },
  { id: 'berry', label: 'Dégradé baies', stops: ['#581C87', '#C026D3', '#FBCFE8'] },
  { id: 'slate', label: 'Dégradé gris', stops: ['#0F172A', '#64748B', '#E2E8F0'] },
  { id: 'pastel', label: 'Pastel', colors: ['#93C5FD', '#FDBA74', '#86EFAC', '#C4B5FD', '#FCA5A5', '#67E8F9', '#FDE047', '#F9A8D4'] },
];

const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const toHex = v => '#' + v.map(n => Math.round(n).toString(16).padStart(2, '0')).join('');

function sample(stops, t) {
  const x = Math.min(0.999999, Math.max(0, t)) * (stops.length - 1);
  const k = Math.floor(x), f = x - k;
  const a = hex(stops[k]), b = hex(stops[k + 1]);
  return toHex(a.map((v, n) => v + (b[n] - v) * f));
}

/* Couleur du i-ème élément sur n, ou null pour garder la couleur d'origine. */
export const CUSTOM_DEFAULT = ['#1E3A8A', '#38BDF8'];
export const isCustom = id => typeof id === 'string' && id.startsWith('custom:');
export const customId = stops => 'custom:' + stops.join(',');
/* Résout un id (prédéfini ou « custom:#a,#b ») en palette. */
export function resolvePalette(id) {
  if (isCustom(id)) {
    const stops = id.slice(7).split(',').filter(c => /^#[0-9a-fA-F]{6}$/.test(c));
    return { id, label: 'Personnalisé', stops: stops.length >= 2 ? stops : CUSTOM_DEFAULT };
  }
  return PALETTES.find(x => x.id === id) || PALETTES[0];
}

export function paletteColor(id, i, n) {
  const p = resolvePalette(id);
  if (!p || p.id === 'default') return null;
  if (p.colors) return p.colors[i % p.colors.length];
  return sample(p.stops, n <= 1 ? 0.15 : (i / (n - 1)) * 0.92);
}

export const PaletteContext = createContext('default');
export const usePalette = () => useContext(PaletteContext);

const KEY = 'carto_widget_palettes';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };

export function useWidgetPalettes() {
  const [map, setMap] = useState(read);
  const setPalette = useCallback((widgetId, paletteId) => {
    setMap(prev => {
      const next = { ...prev, [widgetId]: paletteId };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  }, []);
  return [map, setPalette];
}
