import { eosBucket } from './itsi.js';

const CRIT_PTS = { Critique: 40, Haute: 32, Moyenne: 18, Basse: 6 };
export const EOS_PTS = { expired: 20, lt6: 15, lt12: 8 };
export const RISK_STATUTS = ['Legacy', 'En décommissionnement', 'À migrer', 'À refondre', 'À remplacer', 'À décommissionner'];

export function buildPriorityItems(apps, flows) {
  const inc = {}, out = {};
  flows.forEach(f => { out[f.from] = (out[f.from] || 0) + 1; inc[f.to] = (inc[f.to] || 0) + 1; });
  return apps.map(app => {
    const incoming = inc[app.id] || 0, outgoing = out[app.id] || 0, degree = incoming + outgoing;
    const eos = eosBucket(app.endOfService);
    const parts = [
      { k: 'Criticité', v: CRIT_PTS[app.criticality] || 0, c: '#EF4444' },
      { k: 'Connectivité', v: Math.round(Math.min(degree / 8, 1) * 25), c: '#06B6D4' },
      { k: 'Fin de service', v: EOS_PTS[eos] || 0, c: '#F59E0B' },
      { k: 'Statut à risque', v: RISK_STATUTS.includes(app.statut) ? 10 : 0, c: '#8B5CF6' },
      { k: 'Sans responsable', v: app.owner && app.owner.trim() ? 0 : 5, c: '#64748B' },
    ];
    return { app, incoming, outgoing, degree, eos, parts, score: parts.reduce((s, p) => s + p.v, 0) };
  });
}
