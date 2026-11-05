// Mode jour / nuit global : stocké dans localStorage et appliqué via [data-mode] sur <html>.
const KEY = 'carto_mode';

export function getMode() {
  try {
    const m = localStorage.getItem(KEY);
    if (m === 'dark' || m === 'light') return m;
    // Ancienne clé : chaîne simple "dark" / "light"
    const legacy = localStorage.getItem('carto_theme');
    if (legacy === 'dark' || legacy === 'light') return legacy;
  } catch {}
  return 'light';
}

export function setMode(mode) {
  if (mode !== 'dark' && mode !== 'light') return;
  const changed = document.documentElement.dataset.mode !== mode;
  try { localStorage.setItem(KEY, mode); } catch {}
  document.documentElement.dataset.mode = mode;
  document.documentElement.style.colorScheme = mode;
  if (changed) window.dispatchEvent(new CustomEvent('carto:mode-change', { detail: mode }));
}

export function toggleMode() {
  setMode(getMode() === 'dark' ? 'light' : 'dark');
}

export function initMode() {
  const m = getMode();
  document.documentElement.dataset.mode = m;
  document.documentElement.style.colorScheme = m;
}
