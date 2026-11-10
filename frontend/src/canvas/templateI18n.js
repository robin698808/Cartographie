import { EN } from '../i18nDict';

/* Valeurs de référence de l'application (toujours stockées en français) */
export const DOMAIN_OPTS = ['Finance', 'RH', 'IT', 'Commercial', 'Production', 'Logistique', 'Marketing', 'Juridique', 'Direction', 'Autre'];

const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

/* Ramène une valeur saisie en français ou en anglais (ex. « High », « To migrate ») à sa valeur française de référence ; conserve la saisie sinon */
export function canonLabel(value, options) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const n = norm(raw);
  for (const o of options) {
    if (!o) continue;
    if (norm(o) === n || norm(EN[o] ?? '') === n) return o;
  }
  return raw;
}
