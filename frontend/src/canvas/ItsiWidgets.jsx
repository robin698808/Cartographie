import { useMemo } from 'react';
import ItemsChart from './ChartKit';
import WidgetHeader from './WidgetHeader';
import { WaterfallChart, ParetoChart, CostMixChart } from './FinanceCharts';
import {
  COST_TYPES, COST_COLORS, HOSTING_OPTS, HOSTING_COLORS, APPTYPE_OPTS, APPTYPE_COLORS,
  EOS_BUCKETS, eosBucket, formatEuro, formatDateFr,
} from './itsi';

/* Widgets du dashboard réservés aux projets IT/SI : budget & coûts, patrimoine applicatif.
   La mise en page s'adapte à la largeur du widget : les panneaux passent de 1 à 3 colonnes (CSS grid auto-fit). */

const ellipsis = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

const surface = (T, h, accent) => ({
  background: T.bgCard, borderRadius: 16, padding: 20, overflow: 'auto',
  boxShadow: `0 8px 24px rgba(30,27,75,.07), 0 0 0 1px ${accent ? accent + '33' : T.border}`,
  height: h ? '100%' : undefined, boxSizing: 'border-box',
});

const Header = WidgetHeader;

function Kpi({ T, label, value, color, hint }) {
  return (
    <div style={{ minWidth: 0, padding: '12px 14px', borderRadius: 12, background: color + '12', border: `1px solid ${color}30`, borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 11, color: T.fgMuted, fontWeight: 700, lineHeight: 1.25 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 850, color: T.fg, marginTop: 6, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: T.fgMuted, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function Panel({ T, title, hint, color, children }) {
  return (
    <div style={{ minWidth: 0, padding: 16, borderRadius: 14, background: T.bgAlt, border: `1px solid ${T.border}`, borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.fg }}>{title}</div>
        {hint && <div style={{ fontSize: 11, color: T.fgMuted, whiteSpace: 'nowrap' }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

const Grid = ({ min = 110, gap = 12, children, style }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap, ...style }}>{children}</div>
);

function Empty({ T, children }) {
  return <div style={{ padding: '16px 14px', borderRadius: 10, border: `1px dashed ${T.border}`, fontSize: 12.5, color: T.fgMuted, lineHeight: 1.55 }}>{children}</div>;
}

function BarRow({ T, label, text, pct, color, share }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ ...ellipsis, flex: 1, fontSize: 12.5, color: T.fg, fontWeight: 600 }} title={label}>{label}</span>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: T.fg, fontVariantNumeric: 'tabular-nums' }}>{text}</span>
        {share != null && <span style={{ fontSize: 11, color: T.fgMuted, width: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{share}%</span>}
      </div>
      <div style={{ height: 8, borderRadius: 99, background: T.border + '88', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: Math.max(2, pct) + '%', background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: 99, transition: 'width .4s' }} />
      </div>
    </div>
  );
}

function StackedBar({ T, parts }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (!total) return null;
  const shown = parts.filter(p => p.value > 0);
  return (
    <>
      <div style={{ display: 'flex', height: 16, borderRadius: 99, overflow: 'hidden', background: T.bgAlt, gap: 2 }}>
        {shown.map(p => <span key={p.label} title={`${p.label} : ${p.text}`} style={{ width: (p.value / total * 100) + '%', background: p.color, transition: 'width .4s' }} />)}
      </div>
      <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
        {shown.map(p => (
          <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
            <i style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
            <span style={{ ...ellipsis, flex: 1, color: T.fg, fontWeight: 600 }}>{p.label}</span>
            <b style={{ color: T.fg }}>{p.text}</b>
            <span style={{ color: T.fgMuted, width: 36, textAlign: 'right', fontSize: 11 }}>{Math.round(p.value / total * 100)}%</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* S?rie affich?e selon le type choisi : bars | columns | donut | pie | area (rendu Recharts) */
function Breakdown({ T, items, type = 'bars', centerValue, centerLabel }) {
  const money = items.some(i => i.text != null && i.text !== String(i.value));
  return (
    <ItemsChart T={T} items={items} type={type} height={type === 'bars' ? 200 : 220}
      centerValue={centerValue} centerLabel={centerLabel} formatValue={money ? formatEuro : undefined} />
  );
}

/* ─────────────────────────  Budget & coûts  ───────────────────────── */
export function ItsiBudgetWidget({ apps, T, expanded, fillHeight, colorOf, chartType = 'bars' }) {
  const d = useMemo(() => {
    const withBudget = apps.filter(a => typeof a.budget === 'number' && a.budget > 0);
    const total = withBudget.reduce((s, a) => s + a.budget, 0);
    const licenses = apps.reduce((s, a) => s + (a.licenses || 0), 0);
    const byDomain = {};
    withBudget.forEach(a => { byDomain[a.domain || 'Autre'] = (byDomain[a.domain || 'Autre'] || 0) + a.budget; });
    const domains = Object.entries(byDomain).sort((a, b) => b[1] - a[1]);
    const cost = { CAPEX: 0, OPEX: 0, 'Non défini': 0 };
    withBudget.forEach(a => { const k = COST_TYPES.includes(a.costType) ? a.costType : 'Non défini'; cost[k] += a.budget; });
    const top = [...withBudget].sort((a, b) => b.budget - a.budget).slice(0, expanded ? 10 : 6);
    const mix = {};
    withBudget.forEach(a => { const dom = a.domain || 'Autre'; const k = COST_TYPES.includes(a.costType) ? a.costType : 'Non d\u00e9fini'; mix[dom] = mix[dom] || { label: dom }; mix[dom][k] = (mix[dom][k] || 0) + a.budget; });
    const mixRows = domains.slice(0, 8).map(([dom]) => mix[dom]);
    const ranked = [...withBudget].sort((x, y) => y.budget - x.budget);
    let acc = 0, n80 = 0;
    ranked.forEach(a => { if (acc < total * 0.8) { acc += a.budget; n80++; } });
    return { withBudget, total, licenses, domains, cost, top, mix, mixRows, ranked, n80 };
  }, [apps, expanded]);

  const pct = apps.length ? Math.round(d.withBudget.length / apps.length * 100) : 0;
  const accent = '#10B981';
  const costItems = [...COST_TYPES.map(k => ({ label: k, value: d.cost[k], color: COST_COLORS[k], text: formatEuro(d.cost[k]) })),
    { label: 'Non défini', value: d.cost['Non défini'], color: '#64748B', text: formatEuro(d.cost['Non défini']) }].filter(i => i.value > 0);
  const domItems = d.domains.slice(0, expanded ? 12 : 7).map(([dom, v]) => ({ label: dom, value: v, text: formatEuro(v), color: colorOf(dom) }));

  return (
    <div className="dashboard-widget-surface" style={surface(T, fillHeight, accent)}>
      <Header T={T} color={accent} icon="€" title="Coûts applicatifs (OPEX / CAPEX)" subtitle={`${d.withBudget.length} / ${apps.length} applications avec coût renseigné`} />
      {!d.withBudget.length ? (
        <Empty T={T}>Aucun coût renseigné. Ajoutez les colonnes « Coût annuel (€) » ou « Coût mensuel (€) » et « Type de coût » (OPEX / CAPEX) à votre fichier d'import, ou saisissez-les depuis la fiche d'une application.</Empty>
      ) : (
        <>
          <Grid min={125}>
            <Kpi T={T} label="Coût annuel total" value={formatEuro(d.total)} color={accent} />
            <Kpi T={T} label="Coût mensuel moyen" value={formatEuro(d.total / 12)} color="#06B6D4" hint="total / 12" />
            <Kpi T={T} label="Coût moyen / application" value={formatEuro(d.total / d.withBudget.length)} color="#6366F1" hint="par an" />
            <Kpi T={T} label="Licences" value={d.licenses.toLocaleString('fr-FR')} color="#0EA5E9" />
            <Kpi T={T} label="Couverture" value={pct + ' %'} color={pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'} hint="apps avec coût" />
          </Grid>

          {chartType === 'finance' ? (
            <Grid min={340} gap={14} style={{ marginTop: 16 }}>
              <Panel T={T} color="#10B981" title="Du coût par domaine au total annuel" hint="cascade">
                <WaterfallChart T={T} items={domItems} />
              </Panel>
              <Panel T={T} color="#F59E0B" title="Concentration des coûts (Pareto)" hint={`${d.n80} app${d.n80 > 1 ? 's' : ''} = 80 % du budget`}>
                <ParetoChart T={T} items={d.ranked.slice(0, 10).map(a => ({ label: a.name, value: a.budget, color: colorOf(a.domain) }))} />
              </Panel>
              <Panel T={T} color="#6366F1" title="OPEX / CAPEX par domaine">
                <CostMixChart T={T} rows={d.mixRows} colors={{ ...COST_COLORS, 'Non défini': '#64748B' }} />
              </Panel>
            </Grid>
          ) : (
          <Grid min={300} gap={14} style={{ marginTop: 16 }}>
            <Panel T={T} color="#10B981" title="Coût annuel par domaine" hint={`${d.domains.length} domaine${d.domains.length > 1 ? 's' : ''}`}>
              <Breakdown T={T} type={chartType} centerValue={formatEuro(d.total)} centerLabel="TOTAL / AN" items={domItems} />
            </Panel>
            <Panel T={T} color="#6366F1" title="Répartition OPEX / CAPEX">
              {chartType === 'bars'
                ? <StackedBar T={T} parts={costItems} />
                : <Breakdown T={T} type={chartType} centerValue={formatEuro(d.total)} centerLabel="TOTAL / AN" items={costItems} />}
            </Panel>
            <Panel T={T} color="#F59E0B" title={`Top ${d.top.length} applications les plus coûteuses`}>
              <Breakdown T={T} type={chartType === 'columns' ? 'columns' : 'bars'} showShare={false}
                items={d.top.map(a => ({ label: a.name, value: a.budget, text: formatEuro(a.budget), color: colorOf(a.domain) }))} />
            </Panel>
          </Grid>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────────  Patrimoine applicatif  ───────────────────── */
export function ItsiPatrimoineWidget({ apps, T, expanded, fillHeight, chartType = 'bars' }) {
  const d = useMemo(() => {
    const count = (key, opts) => {
      const m = {};
      apps.forEach(a => { const v = (a[key] || '').trim(); const k = v || 'Non renseigné'; m[k] = (m[k] || 0) + 1; });
      const known = opts.filter(o => m[o]).map(o => ({ label: o, value: m[o] }));
      const others = Object.keys(m).filter(k => !opts.includes(k) && k !== 'Non renseigné').map(k => ({ label: k, value: m[k], other: true }));
      const na = m['Non renseigné'] ? [{ label: 'Non renseigné', value: m['Non renseigné'], na: true }] : [];
      return known.concat(others, na);
    };
    const hosting = count('hosting', HOSTING_OPTS);
    const appType = count('appType', APPTYPE_OPTS);
    const eos = {};
    EOS_BUCKETS.forEach(b => { eos[b.id] = []; });
    apps.forEach(a => { eos[eosBucket(a.endOfService)].push(a); });
    const upcoming = apps
      .filter(a => a.endOfService && eosBucket(a.endOfService) !== 'gt12')
      .sort((a, b) => a.endOfService.localeCompare(b.endOfService))
      .slice(0, expanded ? 10 : 6);
    const hostKnown = apps.filter(a => a.hosting && a.hosting !== 'Inconnu').length;
    const cloud = apps.filter(a => ['Cloud privé', 'Cloud public (IaaS/PaaS)', 'SaaS'].includes(a.hosting)).length;
    return { hosting, appType, eos, upcoming, hostKnown, cloud };
  }, [apps, expanded]);

  const accent = '#6366F1';
  const hostColor = (l) => HOSTING_COLORS[l] || '#A855F7';
  const typeColor = (l) => APPTYPE_COLORS[l] || '#A855F7';
  const noData = apps.every(a => !a.hosting && !a.appType && !a.endOfService);
  const cloudPct = d.hostKnown ? Math.round(d.cloud / d.hostKnown * 100) : 0;
  const risky = d.eos.expired.length + d.eos.lt6.length + d.eos.lt12.length;
  const hostItems = d.hosting.map(s => ({ label: s.label, value: s.value, color: s.na ? '#475569' : hostColor(s.label) }));
  const typeItems = d.appType.map(s => ({ label: s.label, value: s.value, color: s.na ? '#475569' : typeColor(s.label) }));
  const eosItems = EOS_BUCKETS.map(b => ({ label: b.label, value: d.eos[b.id].length, color: b.color, text: String(d.eos[b.id].length) }));

  return (
    <div className="dashboard-widget-surface" style={surface(T, fillHeight, accent)}>
      <Header T={T} color={accent} icon="◈" title="Patrimoine applicatif" subtitle="Hébergement, typologie et fin de mise en service" />
      {noData ? (
        <Empty T={T}>Aucune donnée de patrimoine. Ajoutez les colonnes « Hébergement », « Type d'application » et « Date de fin de mise en service » à votre fichier d'import (template IT/SI).</Empty>
      ) : (
        <>
          <Grid min={125}>
            <Kpi T={T} label="Cloud / SaaS" value={cloudPct + ' %'} color="#0EA5E9" hint={`${d.cloud} / ${d.hostKnown} hébergements connus`} />
            <Kpi T={T} label="Échéance < 12 mois" value={d.eos.lt6.length + d.eos.lt12.length} color="#F59E0B" />
            <Kpi T={T} label="Échéance dépassée" value={d.eos.expired.length} color="#EF4444" />
            <Kpi T={T} label="À traiter" value={risky} color="#8B5CF6" hint="expirées + < 12 mois" />
          </Grid>

          <Grid min={300} gap={14} style={{ marginTop: 16 }}>
            <Panel T={T} color="#0EA5E9" title="Hébergement">
              {d.hosting.some(s => !s.na)
                ? <Breakdown T={T} type={chartType} centerValue={apps.length} centerLabel="APPLICATIONS" items={hostItems} />
                : <Empty T={T}>Hébergement non renseigné.</Empty>}
            </Panel>
            <Panel T={T} color="#8B5CF6" title="Type d'application">
              {d.appType.some(s => !s.na)
                ? <Breakdown T={T} type={chartType} centerValue={apps.length} centerLabel="APPLICATIONS" items={typeItems} />
                : <Empty T={T}>Type d'application non renseigné.</Empty>}
            </Panel>
            <Panel T={T} color="#F59E0B" title="Fin de mise en service">
              {apps.some(a => a.endOfService) ? (
                <>
                  {chartType === 'bars'
                    ? <StackedBar T={T} parts={eosItems} />
                    : <Breakdown T={T} type={chartType} centerValue={apps.length} centerLabel="APPLICATIONS" items={eosItems.filter(i => i.value > 0)} />}
                  <div style={{ marginTop: 14, display: 'grid', gap: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: T.fgMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Prochaines échéances</div>
                    {d.upcoming.length === 0 && <div style={{ fontSize: 12, color: T.fgMuted }}>Aucune échéance à moins de 12 mois.</div>}
                    {d.upcoming.map(a => {
                      const b = EOS_BUCKETS.find(x => x.id === eosBucket(a.endOfService));
                      return (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 9, background: T.bgCard, border: `1px solid ${T.border}`, borderLeft: `4px solid ${b.color}` }}>
                          <span style={{ ...ellipsis, flex: 1, fontSize: 12.5, fontWeight: 700, color: T.fg }}>{a.name}</span>
                          <span style={{ fontSize: 11, color: T.fgMuted }}>{formatDateFr(a.endOfService)}</span>
                          <span style={{ fontSize: 10.5, fontWeight: 800, color: b.color, background: b.color + '1F', borderRadius: 99, padding: '2px 8px', whiteSpace: 'nowrap' }}>{b.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : <Empty T={T}>Date de fin de mise en service non renseignée.</Empty>}
            </Panel>
          </Grid>
        </>
      )}
    </div>
  );
}
