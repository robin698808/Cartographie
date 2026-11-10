import { useEffect, useState } from 'react';

const KEY = 'carto_branding';
const EVT = 'carto-branding';

export const BG_PRESETS = [
  { id: 'none',   name: 'Par défaut', value: '' },
  { id: 'mist',   name: 'Brume',      value: 'linear-gradient(160deg,#F8FAFC 0%,#E2E8F0 100%)' },
  { id: 'sky',    name: 'Ciel',       value: 'linear-gradient(160deg,#F0F9FF 0%,#DBEAFE 100%)' },
  { id: 'sand',   name: 'Sable',      value: 'linear-gradient(160deg,#FFFBEB 0%,#FDE68A55 100%)' },
  { id: 'mint',   name: 'Menthe',     value: 'linear-gradient(160deg,#F0FDF4 0%,#CCFBF1 100%)' },
  { id: 'night',  name: 'Nuit',       value: 'linear-gradient(160deg,#0F172A 0%,#1E293B 100%)' },
];

export function loadBranding() {
  try {
    const b = JSON.parse(localStorage.getItem(KEY) || 'null');
    return { logo: b?.logo || '', bg: b?.bg || { type: 'none', value: '' } };
  } catch {
    return { logo: '', bg: { type: 'none', value: '' } };
  }
}

function pageBackground(bg) {
  if (!bg || bg.type === 'none' || !bg.value) return '';
  if (bg.type === 'image') return `linear-gradient(rgba(255,255,255,0.35),rgba(255,255,255,0.35)), url("${bg.value}") center/cover no-repeat fixed`;
  return bg.value;
}

export function applyBranding(b = loadBranding()) {
  const root = document.documentElement;
  const css = pageBackground(b.bg);
  if (css) root.style.setProperty('--page-bg', css);
  else root.style.removeProperty('--page-bg');
}

export function saveBranding(b) {
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
  } catch {
    return false;
  }
  applyBranding(b);
  window.dispatchEvent(new Event(EVT));
  return true;
}

export function useBranding() {
  const [b, setB] = useState(loadBranding);
  useEffect(() => {
    const h = () => setB(loadBranding());
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);
  return b;
}

// Redimensionne l'image côté navigateur pour rester dans le quota localStorage
export function fileToDataUrl(file, maxSize, mime = 'image/png', quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Fichier image requis'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxSize / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL(mime, quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')); };
    img.src = url;
  });
}
