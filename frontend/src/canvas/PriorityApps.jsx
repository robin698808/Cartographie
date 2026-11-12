import React, { useMemo, useState } from 'react';
import WidgetHeader from './WidgetHeader';
import { EOS_BUCKETS, formatEuro, formatDateFr } from './itsi';
import { buildPriorityItems, EOS_PTS, RISK_STATUTS } from './priority-score';

const CRIT_W = { Critique: 4, Haute: 3, Moyenne: 2, Basse: 1 };
const CRIT_COLOR = { Critique: '#B91C1C', Haute: '#EF4444', Moyenne: '#F59E0B', Basse: '#10B981' };
const SORTS = [
  { k: 'score', label: 'Priorité' },
  { k: 'degree', label: 'Nombre de flux' },
  { k: 'eos', label: 'Fin de service' },
  { k: 'budget', label: 'Coût annuel' },
  { k: 'name', label: 'Nom' },
];

const colorOf = i => CRIT_COLOR[i.app.criticality] || '#94A3B8';

export default function PriorityApps({ apps, flows, T, DC, statutColors, onOpen, expanded }) {
  const [crit, setCrit] = useState('');
  const [domain, setDomain] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('score');
  const [limit, setLimit] = useState(10);
  const [selId, setSelId] = useState(null);
  const [view, setView] = useState('list');

  const all = useMemo(() => buildPriorityItems(apps, flows), [apps, flows]);
  const domains = useMemo(() => [...new Set(apps.map(a => a.domain || 'Autre'))].sort(), [apps]);
  const dcol = d => (DC[d] || DC.Autre).ac;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = all.filter(i =>
      (!crit || (crit === 'Autre' ? !CRIT_W[i.app.criticality] : i.app.criticality === crit)) &&
      (!domain || (i.app.domain || 'Autre') === domain) &&
      (!q || String(i.app.name || '').toLowerCase().includes(q)));
    const cmp = {
      score: (a, b) => b.score - a.score || b.degree - a.degree,
      degree: (a, b) => b.degree - a.degree,
      eos: (a, b) => (a.app.endOfService || '9999').localeCompare(b.app.endOfService || '9999'),
      budget: (a, b) => (b.app.budget || 0) - (a.app.budget || 0),
      name: (a, b) => String(a.app.name || '').localeCompare(String(b.app.name || '')),
    }[sort];
    return list.sort(cmp);
  }, [all, crit, domain, search, sort]);

  const maxDegree = Math.max(1, ...all.map(i => i.degree));
  const shown = limit ? filtered.slice(0, limit) : filtered;
  const selected = filtered.find(i => i.app.id === selId) || shown[0];

  const kpis = [
    { l: 'Urgentes (criticité, flux, échéance)', v: all.filter(i => i.score >= 50).length, c: '#EF4444' },
    { l: 'Critiques / hautes', v: all.filter(i => CRIT_W[i.app.criticality] >= 3).length, c: '#F97316' },
    { l: 'Fin de service < 12 mois', v: all.filter(i => EOS_PTS[i.eos]).length, c: '#F59E0B' },
    { l: 'Sans responsable', v: all.filter(i => !(i.app.owner && i.app.owner.trim())).length, c: '#64748B' },
  ];

  const scatter = useMemo(() => filtered.map((i, n) => ({
    id: i.app.id, name: i.app.name, x: i.degree, y: (CRIT_W[i.app.criticality] || 0) + ((n % 5) - 2) * 0.07,
    z: Math.max(i.app.budget || 0, 20000), col: colorOf(i), crit: i.app.criticality || 'Non renseignée',
  })), [filtered]);

  const chip = (active, onClick, text, color = '#EF4444') => (
    <button key={text} onClick={onClick} style={{
      border: `1px solid ${active ? color : T.border}`, background: active ? color + '22' : T.bgAlt, color: active ? color : T.fgMuted,
      borderRadius: 16, padding: '4px 11px', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
    }}>{text}</button>
  );
  const sel = { background: T.bgAlt, color: T.fg, border: `1px solid ${T.border}`, borderRadius: 8, height: 28, fontSize: 11, padding: '0 8px' };
  const badge = (text, color) => (
    <span style={{ fontSize: 10.5, fontWeight: 700, color, background: color + '1F', borderRadius: 99, padding: '2px 8px', whiteSpace: 'nowrap' }}>{text}</span>
  );

  const GRID = '30px minmax(150px,1.5fr) 82px 84px minmax(104px,0.9fr) 74px minmax(110px,0.9fr)';
  const monthsTo = d => {
    const t = new Date(d);
    return Number.isNaN(t.getTime()) ? null : Math.round((t.getTime() - Date.now()) / (30.44 * 864e5));
  };
  const head = (label, key) => (
    <button key={label} onClick={() => key && setSort(key)} style={{ background: 'transparent', border: 'none', padding: 0, textAlign: 'left', cursor: key ? 'pointer' : 'default', fontSize: 10.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: sort === key ? '#6366F1' : T.fgMuted }}>
      {label}{sort === key && ' ↓'}
    </button>
  );
  const maxBudget = Math.max(1, ...all.map(i => i.app.budget || 0));

  const list = (
    <div style={{ display: 'grid', gap: 5, maxHeight: expanded ? undefined : 600, overflowY: 'auto', paddingRight: 2 }}>
      <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, padding: '0 12px 4px', position: 'sticky', top: 0, background: T.bgCard, zIndex: 1 }}>
        <span />
        {head('Application', 'name')}
        {head('Criticité', null)}
        {head('Flux', 'degree')}
        {head('Échéance', 'eos')}
        {head('Coût / an', 'budget')}
        {head('Statut', null)}
      </div>
      {shown.map((i, idx) => {
        const on = selected && selected.app.id === i.app.id;
        const col = colorOf(i);
        const eb = EOS_BUCKETS.find(b => b.id === i.eos);
        const m = i.app.endOfService ? monthsTo(i.app.endOfService) : null;
        const urgent = i.score >= 50;
        return (
          <button key={i.app.id} aria-pressed={on} onClick={() => setSelId(i.app.id)} className="prio-row"
            style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, alignItems: 'center', textAlign: 'left', padding: '10px 12px', borderRadius: 12, cursor: 'pointer', color: T.fg,
              border: `1px solid ${on ? col + '99' : T.border}`, borderLeft: `4px solid ${col}`, background: on ? col + '12' : T.bgAlt, transition: 'all .15s',
              boxShadow: on ? `0 4px 14px ${col}22` : 'none' }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', background: urgent ? col : T.bgCard, color: urgent ? '#fff' : T.fgMuted, fontSize: 12, fontWeight: 800 }}>{idx + 1}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.app.name || 'Application sans nom'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, fontSize: 11.5, color: T.fgMuted, minWidth: 0 }}>
                <i style={{ width: 8, height: 8, borderRadius: 3, background: dcol(i.app.domain), flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.app.domain || 'Domaine non renseigné'}{i.app.owner ? ` · ${i.app.owner}` : ''}</span>
              </span>
            </span>
            <span>{CRIT_W[i.app.criticality] ? badge(i.app.criticality, CRIT_COLOR[i.app.criticality]) : <span style={{ fontSize: 11, color: T.fgMuted }}>—</span>}</span>
            <span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <b style={{ fontSize: 15 }}>{i.degree}</b>
                <span style={{ fontSize: 10.5, color: T.fgMuted }}>↓{i.incoming} ↑{i.outgoing}</span>
              </span>
              <span style={{ display: 'block', height: 5, borderRadius: 99, overflow: 'hidden', marginTop: 4, background: T.border + '66' }}>
                <span style={{ display: 'block', height: '100%', width: Math.round(i.degree / maxDegree * 100) + '%', background: `linear-gradient(90deg, #06B6D488, #06B6D4)` }} />
              </span>
            </span>
            <span style={{ fontSize: 12 }}>
              {i.app.endOfService && m !== null ? (
                <>
                  <span style={{ display: 'block', fontWeight: 700, color: EOS_PTS[i.eos] ? eb.color : T.fg }}>
                    {m < 0 ? <><span>Dépassée</span> <b>{-m}</b> <span>mois</span></> : m === 0 ? <span>Ce mois-ci</span> : <><span>Dans</span> <b>{m}</b> <span>mois</span></>}
                  </span>
                  <span style={{ fontSize: 10.5, color: T.fgMuted }}>{formatDateFr(i.app.endOfService)}</span>
                </>
              ) : <span style={{ color: T.fgMuted }}>—</span>}
            </span>
            <span>
              {i.app.budget > 0 ? (
                <>
                  <b style={{ fontSize: 12.5 }}>{formatEuro(i.app.budget)}</b>
                  <span style={{ display: 'block', height: 4, borderRadius: 99, overflow: 'hidden', marginTop: 4, background: T.border + '66' }}>
                    <span style={{ display: 'block', height: '100%', width: Math.max(4, Math.round(i.app.budget / maxBudget * 100)) + '%', background: '#10B981' }} />
                  </span>
                </>
              ) : <span style={{ fontSize: 11, color: T.fgMuted }}>—</span>}
            </span>
            <span>
              {i.app.statut
                ? badge(i.app.statut, RISK_STATUTS.includes(i.app.statut) ? (statutColors[i.app.statut] || '#8B5CF6') : (statutColors[i.app.statut] || '#64748B'))
                : <span style={{ fontSize: 11, color: T.fgMuted }}>—</span>}
            </span>
          </button>
        );
      })}
      {!shown.length && <div style={{ padding: 30, textAlign: 'center', color: T.fgMuted, fontSize: 13 }}>Aucune application ne correspond aux filtres.</div>}
    </div>
  );

  const COLS = [
    { l: 'Faible volume', h: '0-1 flux', test: d => d <= 1 },
    { l: 'Volume moyen', h: '2-3 flux', test: d => d >= 2 && d <= 3 },
    { l: 'Fort volume', h: '4-6 flux', test: d => d >= 4 && d <= 6 },
    { l: 'Très fort volume', h: '7 flux et +', test: d => d >= 7 },
  ];
  const ROWS = ['Critique', 'Haute', 'Moyenne', 'Basse', ''];
  const STOPS = [[254, 249, 195], [253, 224, 71], [251, 146, 60], [220, 38, 38]];
  const gradient = t => {
    const x = Math.min(0.999, Math.max(0, t)) * (STOPS.length - 1);
    const k = Math.floor(x), f = x - k;
    const c = STOPS[k].map((v, n) => Math.round(v + (STOPS[k + 1][n] - v) * f));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  };
  const riskOf = (ri, ci) => (0.6 * Math.max(0, 4 - ri) / 4 + 0.4 * ci / 3);
  const matrix = (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '74px repeat(4,minmax(0,1fr))', gap: 4 }}>
        <div />
        <div style={{ gridColumn: '2 / -1', textAlign: 'center', fontSize: 10.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: T.fgMuted }}>
          <span>Volume de flux connectés</span> <span>(entrants + sortants)</span> →
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: T.fgMuted, alignSelf: 'end' }}>Criticité ↓</div>
        {COLS.map(c => (
          <div key={c.l} style={{ textAlign: 'center', padding: '2px 0 6px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: T.fg }}>{c.h}</div>
            <div style={{ fontSize: 10, color: T.fgMuted }}>{c.l}</div>
          </div>
        ))}
        {ROWS.map((r, ri) => (
          <React.Fragment key={r || 'na'}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 11.5, fontWeight: 800, color: CRIT_COLOR[r] || T.fgMuted }}>{r || 'Non renseignée'}</div>
            {COLS.map((c, ci) => {
              const rc = gradient(riskOf(ri, ci));
              const cell = filtered.filter(i => (CRIT_W[i.app.criticality] ? i.app.criticality === r : !r) && c.test(i.degree));
              return (
                <div key={c.l} style={{ minHeight: expanded ? 96 : 78, alignItems: 'flex-start', borderRadius: 4, padding: 6, background: rc, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: 4, transition: 'all .15s' }}>
                  {cell.map(i => {
                    const on = selected && selected.app.id === i.app.id;
                    return (
                      <button key={i.app.id} onClick={() => setSelId(i.app.id)} title={`${i.app.name} · ${i.incoming} entrant${i.incoming > 1 ? 's' : ''}, ${i.outgoing} sortant${i.outgoing > 1 ? 's' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 4, maxWidth: '100%', border: `1px solid ${on ? '#fff' : 'transparent'}`, background: '#1F2937', color: '#fff', borderRadius: 99, padding: '2px 6px 2px 6px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', boxShadow: on ? '0 0 0 2px #fff' : '0 2px 4px rgba(0,0,0,.25)' }}>
                        <i style={{ width: 7, height: 7, borderRadius: 99, background: dcol(i.app.domain), flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.app.name}</span>
                        <span style={{ fontSize: 9.5, color: '#FDE68A', fontWeight: 800 }}>{i.degree}</span>
                      </button>
                    );
                  })}
                                    {!cell.length && <span style={{ margin: 'auto', fontSize: 11, color: T.fgMuted, opacity: 0.5 }}>—</span>}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, fontSize: 10.5, color: T.fgMuted }}>
        <span>Risque faible</span>
        <span style={{ flex: 1, maxWidth: 260, height: 8, borderRadius: 99, background: `linear-gradient(90deg, ${gradient(0)}, ${gradient(0.35)}, ${gradient(0.65)}, ${gradient(1)})` }} />
        <span>Risque très élevé</span>
      </div>
    </div>
  );

  const detail = selected && (() => {
    const col = colorOf(selected);
    const a = selected.app;
    const peers = [];
    const seen = {};
    flows.forEach(f => {
      if (f.from !== a.id && f.to !== a.id) return;
      const pid = f.from === a.id ? f.to : f.from;
      if (seen[pid]) return;
      seen[pid] = 1;
      peers.push({ flow: f, out: f.from === a.id, peer: apps.find(x => x.id === pid) });
    });
    const alerts = [];
    if (selected.eos === 'expired') alerts.push(['Fin de service déjà dépassée', '#DC2626']);
    else if (EOS_PTS[selected.eos]) alerts.push(['Fin de service dans moins de ' + (selected.eos === 'lt6' ? '6' : '12') + ' mois', '#F59E0B']);
    if (RISK_STATUTS.includes(a.statut)) alerts.push(['Statut à risque : ' + a.statut, '#8B5CF6']);
    if (!(a.owner && a.owner.trim())) alerts.push(['Aucun responsable identifié', '#64748B']);
    const m = a.endOfService ? monthsTo(a.endOfService) : null;
    const dc = dcol(a.domain);
    const initials = String(a.name || '?').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const tot = Math.max(1, selected.degree);
    const stat = (label, value, sub, color) => (
      <div style={{ minWidth: 0, padding: '9px 10px', borderRadius: 11, background: T.bgCard, border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: T.fgMuted }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 850, color: color || T.fg, marginTop: 3, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
        {sub && <div style={{ fontSize: 10.5, color: T.fgMuted, marginTop: 2 }}>{sub}</div>}
      </div>
    );
    return (
      <div key={a.id} style={{ minWidth: 0, borderRadius: 16, overflow: 'hidden', background: T.bgAlt, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 16px 14px', background: T.bgCard, borderBottom: `1px solid ${col}33`, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center', background: dc, color: '#fff', fontSize: 16, fontWeight: 850, flexShrink: 0 }}>{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 850, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{a.name}</div>
            <div style={{ fontSize: 12, color: T.fgMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.domain || 'Domaine non renseigné'}{a.owner ? ` · ${a.owner}` : ''}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
              {CRIT_W[a.criticality] && badge(a.criticality, CRIT_COLOR[a.criticality])}
              {a.statut && badge(a.statut, statutColors[a.statut] || '#64748B')}
              {a.hosting && badge(a.hosting, '#0EA5E9')}
              {a.appType && badge(a.appType, '#6366F1')}
            </div>
          </div>
        </div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
            {stat('Flux', selected.degree, `↓${selected.incoming} entrants · ↑${selected.outgoing} sortants`, '#06B6D4')}
            {stat('Coût / an', a.budget > 0 ? formatEuro(a.budget) : '—', a.costType || null, '#10B981')}
            {stat('Échéance', m === null ? '—' : m < 0 ? `${-m} mois` : `${m} mois`, m === null ? null : m < 0 ? 'dépassée' : formatDateFr(a.endOfService), m !== null && EOS_PTS[selected.eos] ? '#F59E0B' : undefined)}
          </div>
          {selected.degree > 0 && (
            <div>
              <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', background: T.border + '66' }}>
                <span style={{ width: selected.incoming / tot * 100 + '%', background: '#8B5CF6', transition: 'width .4s' }} />
                <span style={{ width: selected.outgoing / tot * 100 + '%', background: '#06B6D4', transition: 'width .4s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: T.fgMuted, marginTop: 4 }}>
                <span style={{ color: '#8B5CF6', fontWeight: 700 }}>← {selected.incoming} reçus</span>
                <span style={{ color: '#06B6D4', fontWeight: 700 }}>{selected.outgoing} émis →</span>
              </div>
            </div>
          )}
          {alerts.length > 0 && (
            <div style={{ display: 'grid', gap: 5 }}>
              {alerts.map(([t, c]) => (
                <div key={t} style={{ fontSize: 12, fontWeight: 600, color: T.fg, padding: '7px 10px', borderRadius: 9, background: c + '14', borderLeft: `3px solid ${c}` }}>{t}</div>
              ))}
            </div>
          )}
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: T.fgMuted, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}><span>Liaisons directes</span> <span>({peers.length})</span></div>
            <div style={{ display: 'grid', gap: 5, maxHeight: 200, overflowY: 'auto' }}>
              {peers.slice(0, 14).map((p, n) => {
                const c = p.out ? '#06B6D4' : '#8B5CF6';
                return (
                  <div key={n} onClick={() => p.peer && setSelId(p.peer.id)} style={{ display: 'grid', gridTemplateColumns: '24px minmax(0,1fr) auto', gap: 8, alignItems: 'center', padding: '6px 9px', borderRadius: 9, background: T.bgCard, border: `1px solid ${T.border}`, cursor: p.peer ? 'pointer' : 'default' }}>
                    <span title={p.out ? 'Sortant' : 'Entrant'} style={{ width: 22, height: 22, borderRadius: 7, display: 'grid', placeItems: 'center', background: c + '22', color: c, fontSize: 13, fontWeight: 800 }}>{p.out ? '→' : '←'}</span>
                    <span style={{ fontSize: 12.5, color: T.fg, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.peer ? p.peer.name : 'Application inconnue'}</span>
                    {(p.flow.protocol || p.flow.frequency) && <span style={{ fontSize: 10.5, color: T.fgMuted, background: T.bgAlt, borderRadius: 99, padding: '1px 7px' }}>{p.flow.protocol || p.flow.frequency}</span>}
                  </div>
                );
              })}
              {!peers.length && <div style={{ fontSize: 12, color: T.fgMuted }}>Aucune liaison directe enregistrée.</div>}
            </div>
          </div>
          <button onClick={() => onOpen(a.id)} style={{ background: col, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 750, cursor: 'pointer' }}>Ouvrir la fiche →</button>
        </div>
      </div>
    );
  })();

  return (
    <div className="dashboard-widget-surface" style={{ background: T.bgCard, borderRadius: 16, padding: 20, boxShadow: `0 8px 24px rgba(30,27,75,.07), 0 0 0 1px ${T.border}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <WidgetHeader T={T} color="#EF4444" icon="⚠" title="Applications à traiter en priorité" subtitle="Croisement criticité × volume de flux, avec échéances et statuts à risque" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
        {kpis.map(k => (
          <div key={k.l} style={{ padding: '10px 14px', borderRadius: 12, background: k.c + '12', border: `1px solid ${k.c}30`, borderLeft: `4px solid ${k.c}` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.fg, lineHeight: 1 }}>{k.v}</div>
            <div style={{ fontSize: 11, color: T.fgMuted, marginTop: 5 }}>{k.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{ ...sel, width: 130 }} />
        <select value={domain} onChange={e => setDomain(e.target.value)} style={sel}>
          <option value="">Tous les domaines</option>
          {domains.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {['Critique', 'Haute', 'Moyenne', 'Basse', 'Autre'].map(c => chip(crit === c, () => setCrit(crit === c ? '' : c), c === 'Autre' ? 'Non renseignée' : c, CRIT_COLOR[c] || '#94A3B8'))}
        {(crit || domain || search) && <button onClick={() => { setCrit(''); setDomain(''); setSearch(''); }} style={{ background: 'transparent', border: 'none', color: '#6366F1', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Tout effacer</button>}
        <div style={{ flex: 1 }} />
        <select value={sort} onChange={e => setSort(e.target.value)} style={sel} title="Trier par">
          {SORTS.map(s => <option key={s.k} value={s.k}>{s.label}</option>)}
        </select>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))} style={sel} title="Nombre d'applications">
          <option value={10}>Top 10</option><option value={20}>Top 20</option><option value={0}>Toutes</option>
        </select>
        <div style={{ display: 'flex', gap: 4 }}>
          {chip(view === 'list', () => setView('list'), 'Liste', '#6366F1')}
          {chip(view === 'matrix', () => setView('matrix'), 'Matrice de risque', '#6366F1')}
        </div>
      </div>

      {!all.length ? (
        <div style={{ padding: 30, textAlign: 'center', color: T.fgMuted, fontSize: 13 }}>Aucune application à afficher.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: view === 'list' ? 'minmax(0,2.4fr) minmax(280px,1fr)' : 'repeat(auto-fit,minmax(340px,1fr))', gap: 18, alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>{view === 'list' ? list : matrix}</div>
          {detail}
        </div>
      )}
      <div style={{ fontSize: 11, color: T.fgMuted }}><span>{filtered.length}</span> <span>{filtered.length > 1 ? 'applications' : 'application'}</span> · <span>{view === 'matrix' ? 'chaque pastille est une application (chiffre = flux connectés), cliquez pour le détail' : 'cliquez un en-tête pour trier, une ligne pour le détail'}</span></div>
    </div>
  );
}
