import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLang, translateString } from './i18n.js';

let language = 'fr';
globalThis.localStorage = { getItem: () => language };

test('French interface labels remain in French', () => {
  language = 'fr';
  assert.equal(getLang(), 'fr');
  for (const text of ['Réinitialiser', 'Correspondance', 'Libellé anglais', 'Couleurs par direction']) {
    assert.equal(translateString(text), text);
  }
});

test('recent interface labels and accessibility attributes are translated to English', () => {
  language = 'en';
  const examples = [
    ['Couleurs par direction', 'Colors by direction'],
    ['Couleur flux entrants', 'Incoming flow color'],
    ['Réinitialiser flux sortants', 'Reset outgoing flows'],
    ['Fond mode jour', 'Light mode background'],
    ['Optimisation en cours', 'Optimizing'],
    ['Recentrer toute la cartographie sans déplacer les applications', 'Fit the entire map without moving applications'],
    ['Aucune application pour ces filtres.', 'No applications match these filters.'],
    ['Exporter en PNG', 'Export as PNG'],
    ['Retour aux projets', 'Back to projects'],
    ['Libellé anglais', 'English label'],
    ['Correspondance', 'Mapping'],
    ['Tableau de bord', 'Dashboard'],
    ['Partagées par l’équipe (', 'Shared by the team ('],
    [' lignes · Vérifiez ou ajustez la correspondance', ' rows · Check or adjust the mapping'],
  ];
  for (const [fr, en] of examples) assert.equal(translateString(fr), en, fr);
});

test('dynamic end-of-service warnings are translated without changing the duration', () => {
  language = 'en';
  assert.equal(translateString('Fin de service dans moins de 6 mois'), 'End of service in less than 6 months');
  assert.equal(translateString('Fin de service dans moins de 12 mois'), 'End of service in less than 12 months');
  assert.equal(translateString('Format non pris en charge (test.pdf)'), 'Unsupported format (test.pdf)');
});

test('dynamic labels, confirmations and API errors are translated as complete messages', () => {
  language = 'en';
  const examples = [
    ['il y a 2 sem.', '2 weeks ago'],
    ['3 apps = 80 % du budget', '3 apps = 80% of the budget'],
    ['Top 5 applications les plus coûteuses', 'Top 5 most expensive applications'],
    ['2 / 4 hébergements connus', '2 / 4 applications with known hosting'],
    ['CRM · 2 entrants, 1 sortant', 'CRM · 2 incoming, 1 outgoing'],
    ['Rôle de Alice mis à jour', 'Role updated for Alice'],
    ['Retirer Alice du projet ?', 'Remove Alice from the project?'],
    ['Transférer la propriété du projet à Alice ?', 'Transfer project ownership to Alice?'],
    ['Supprimer "Projet" ? Cette action est irréversible.', 'Delete "Projet"? This action cannot be undone.'],
    ['Supprimer la vue « Ma vue » ?', 'Delete view "Ma vue"?'],
    ['Le propriétaire actuel n\'est pas membre du projet', 'The current owner is not a project member'],
    ['Email ou mot de passe incorrect', 'Incorrect email or password'],
    ['Vue introuvable', 'View not found'],
  ];
  for (const [fr, en] of examples) assert.equal(translateString(fr), en, fr);
});
