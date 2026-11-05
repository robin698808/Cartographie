import { useMemo } from 'react';
import {
  COST_TYPES, COST_COLORS, HOSTING_OPTS, HOSTING_COLORS, APPTYPE_OPTS, APPTYPE_COLORS,
  EOS_BUCKETS, eosBucket, formatEuro, formatDateFr,
} from './itsi';

/* Widgets du dashboard réservés aux projets IT/SI : budget & coûts, patrimoine applicatif */

const surface = (T, h, accent) => ({
  background: T.bgCard, borderRadius: 16, padding: 18, overflow: 'auto',
  boxShadow: `0 8px 24px rgba(30,27,75,.07), 0 0 0 1px ${accent ? accent + '33' : T.border}`,
  height: h ? '100%' : undefined, boxSizing: 'border-box',
});

function Header({ T, color, icon, title, subtitle, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingRight: 82 }}>
      <div style={{ width: 36, height: 36, borderRadius: 12, display: 'grid', placeItems: 'center', background: color + '22', color, fontSize: 16, fontWeight: 800, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.fg }}>{title}</div>
        <div style={{ fontSize: 9, color: T.fgMuted, marginTop: 2 }}>{subtitle}</div>
      </div>
      {right}
    </div>
  );
}

function Kpi({ T, label, value, color, hint }) {
  return (
    <div style={{ minWidth: 0, padding: '9px 10px', borderRadius: 10, background: color + '12', border: `1px solid ${color}30` }}>
      <div style={{ fontSize: 9, color, fontWeight: 800, lineHeight: 1.25 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 850, color: T.fg, marginTop: 5, lineHeight: 1 }}>{value}</div>
      {hint && <div style={{ fontSize: 8, color: T.fgMuted, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Section({ T, title, children }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: T.fgDim, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Empty({ T, children }) {
  return <div style={{ padding: '14px 10px', borderRadius: 10, border: `1px dashed ${T.border}`, fontSize: 10.5, color: T.fgMuted, lineHeight: 1.5 }}>{children}</div>;
}

function BarRow({ T, label, value, text, pct, color, sub }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(70px, 34%) 1fr auto', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 10, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={label}>{label}{sub && <span style={{ color: T.fgMuted }}> · {sub}</span>}</span>
      <span style={{ height: 7, borderRadius: 99, background: T.bgAlt, overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', width: Math.max(2, pct) + '%', background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 99, transition: 'width .4s' }} />
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, color: T.fg, fontVariantNumeric: 'tabular-nums', minWidth: 44, textAlign: 'right' }}>{text ?? value}</span>
    </div>
  );
}

function StackedBar({ T, parts }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (!total) return null;
  return (
    <>
      <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', background: T.bgAlt }}>
        {parts.filter(p => p.value > 0).map(p => (
          <span key={p.label} title={`${p.label} : ${p.text}`} style={{ width: (p.value / total * 100) + '%', background: p.color, transition: 'width .4s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 7 }}>
        {parts.filter(p => p.value > 0).map(p => (
          <span key={p.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9.5, color: T.fgMuted }}>
            <i style={{ width: 7, height: 7, borderRadius: 2, background: p.color }} />{p.label} <b style={{ color: T.fg }}>{p.text}</b>
          </span>
        ))}
      </div>
    </>
  );
}

function Donut({ T, slices, centerValue, centerLabel, size = 112, thick = false }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = thick ? 25 : 38, c = 2 * Math.PI * r, sw = thick ? 50 : 14;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke={T.bgAlt} strokeWidth={sw} />
      {slices.filter(s => s.value > 0).map(s => {
        const len = s.value / total * c;
        const el = (
          <circle key={s.label} cx="50" cy="50" r={r} fill="none" stroke={s.color} strokeWidth={sw}
            strokeDasharray={`${Math.max(0, len - 1.5)} ${c}`} strokeDashoffset={-acc} transform="rotate(-90 50 50)">
            <title>{`${s.label} : ${s.value}`}</title>
          </circle>
        );
        acc += len;
        return el;
      })}
      <text x="50" y="49" textAnchor="middle" fill={T.fg} fontSize="17" fontWeight="800">{centerValue}</text>
      <text x="50" y="62" textAnchor="middle" fill={T.fgMuted} fontSize="6.5" letterSpacing="0.06em">{centerLabel}</text>
    </svg>
  );
}

const ellipsis = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

/* Affiche une série selon le type de graphique choisi : bars | columns | donut | pie */
function Breakdown({ T, items, type = 'bars', centerValue, centerLabel }) {
  const max = Math.max(1, ...items.map(i => i.value));
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  if (type === 'donut' || type === 'pie') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Donut T={T} size={type === 'pie' ? 120 : 112} thick={type === 'pie'}
          slices={items.map(i => ({ label: i.label, value: i.value, color: i.color }))}
          centerValue={type === 'pie' ? '' : centerValue ?? total} centerLabel={type === 'pie' ? '' : centerLabel ?? ''} />
        <div style={{ flex: 1, minWidth: 140, display: 'grid', gap: 5 }}>
          {items.map(i => (
            <span key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, color: T.fgMuted }}>
              <i style={{ width: 8, height: 8, borderRadius: 3, background: i.color, flexShrink: 0 }} />
              <span style={{ ...ellipsis, flex: 1 }} title={i.label}>{i.label}</span>
              <b style={{ color: T.fg }}>{i.text ?? i.value}</b>
              <span style={{ width: 30, textAlign: 'right' }}>{Math.round(i.value / total * 100)}%</span>
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (type === 'columns') {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 150, paddingTop: 16 }}>
        {items.map(i => (
          <div key={i.label} title={`${i.label} : ${i.text ?? i.value}`} style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.fg, marginBottom: 3, whiteSpace: 'nowrap' }}>{i.text ?? i.value}</span>
            <span style={{ width: '70%', maxWidth: 38, height: Math.max(3, i.value / max * 100) + '%', background: `linear-gradient(180deg, ${i.color}, ${i.color}88)`, borderRadius: '6px 6px 0 0', transition: 'height .4s' }} />
            <span style={{ fontSize: 8.5, color: T.fgMuted, marginTop: 5, width: '100%', textAlign: 'center', ...ellipsis }}>{i.label}</span>
          </div>
        ))}
      </div>
    );
  }
  return items.map(i => <BarRow key={i.label} T={T} label={i.label} text={i.text} value={i.value} pct={i.value / max * 100} color={i.color} sub={i.sub} />);
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
    const top = [...withBudget].sort((a, b) => b.budget - a.budget).slice(0, expanded ? 10 : 5);
    return { withBudget, total, licenses, domains, cost, top };
  }, [apps, expanded]);

  const pct = apps.length ? Math.round(d.withBudget.length / apps.length * 100) : 0;
  const accent = '#10B981';

  return (
    <div className="dashboard-widget-surface" style={surface(T, fillHeight, accent)}>
      <Header T={T} color={accent} icon="€" title="Coûts applicatifs (OPEX / CAPEX)" subtitle={`${d.withBudget.length} / ${apps.length} applications avec coût renseigné`} />
      {!d.withBudget.length ? (
        <Empty T={T}>Aucun coût renseigné. Ajoutez les colonnes « Coût annuel (€) » ou « Coût mensuel (€) » et « Type de coût » (OPEX / CAPEX) à votre fichier d'import, ou saisissez-les depuis la fiche d'une application.</Empty>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
            <Kpi T={T} label="Coût annuel total" value={formatEuro(d.total)} color={accent} />
            <Kpi T={T} label="Coût mensuel moyen" value={formatEuro(d.total / 12)} color="#06B6D4" hint="total / 12" />
            <Kpi T={T} label="Coût annuel moyen / app" value={formatEuro(d.total / d.withBudget.length)} color="#6366F1" />
            <Kpi T={T} label="Licences" value={d.licenses.toLocaleString('fr-FR')} color="#0EA5E9" />
            <Kpi T={T} label="Couverture" value={pct + ' %'} color={pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'} hint="apps avec coût" />
          </div>

          <Section T={T} title="Coût annuel par domaine">
            <Breakdown T={T} type={chartType} centerValue={formatEuro(d.total)} centerLabel="TOTAL / AN"
              items={d.domains.slice(0, expanded ? 12 : 6).map(([dom, v]) => ({ label: dom, value: v, text: formatEuro(v), sub: Math.round(v / d.total * 100) + ' %', color: colorOf(dom) }))} />
          </Section>

          <Section T={T} title="Répartition par type de coût">
            {chartType === 'bars' ? (
              <StackedBar T={T} parts={[
                ...COST_TYPES.map(k => ({ label: k, value: d.cost[k], color: COST_COLORS[k], text: formatEuro(d.cost[k]) })),
                { label: 'Non défini', value: d.cost['Non défini'], color: '#64748B', text: formatEuro(d.cost['Non défini']) },
              ]} />
            ) : (
              <Breakdown T={T} type={chartType} centerValue={formatEuro(d.total)} centerLabel="TOTAL / AN"
                items={[...COST_TYPES.map(k => ({ label: k, value: d.cost[k], color: COST_COLORS[k], text: formatEuro(d.cost[k]) })),
                  { label: 'Non défini', value: d.cost['Non défini'], color: '#64748B', text: formatEuro(d.cost['Non défini']) }].filter(i => i.value > 0)} />
            )}
          </Section>

          <Section T={T} title={`Top ${d.top.length} des applications les plus coûteuses`}>
            <Breakdown T={T} type={chartType === 'columns' ? 'columns' : 'bars'}
              items={d.top.map(a => ({ label: a.name, value: a.budget, text: formatEuro(a.budget), color: colorOf(a.domain) }))} />
          </Section>
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
      .slice(0, expanded ? 10 : 5);
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

  return (
    <div className="dashboard-widget-surface" style={surface(T, fillHeight, accent)}>
      <Header T={T} color={accent} icon="◈" title="Patrimoine applicatif" subtitle="Hébergement, typologie et fin de mise en service" />
      {noData ? (
        <Empty T={T}>Aucune donnée de patrimoine. Ajoutez les colonnes « Hébergement », « Type d'application » et « Date de fin de mise en service » à votre fichier d'import (template IT/SI).</Empty>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
            <Kpi T={T} label="Cloud / SaaS" value={cloudPct + ' %'} color="#0EA5E9" hint={`${d.cloud} / ${d.hostKnown} hébergements connus`} />
            <Kpi T={T} label="Échéance < 12 mois" value={d.eos.lt6.length + d.eos.lt12.length} color="#F59E0B" />
            <Kpi T={T} label="Échéance dépassée" value={d.eos.expired.length} color="#EF4444" />
            <Kpi T={T} label="À traiter" value={risky} color="#8B5CF6" hint="expirées + < 12 mois" />
          </div>

          <Section T={T} title="Hébergement">
            {d.hosting.some(s => !s.na) ? (
              <Breakdown T={T} type={chartType} centerValue={apps.length} centerLabel="APPLICATIONS"
                items={d.hosting.map(s => ({ label: s.label, value: s.value, color: s.na ? '#475569' : hostColor(s.label) }))} />
            ) : <Empty T={T}>Hébergement non renseigné.</Empty>}
          </Section>

          <Section T={T} title="Type d'application">
            {d.appType.some(s => !s.na) ? (
              <Breakdown T={T} type={chartType} centerValue={apps.length} centerLabel="APPLICATIONS"
                items={d.appType.map(s => ({ label: s.label, value: s.value, color: s.na ? '#475569' : typeColor(s.label) }))} />
            ) : <Empty T={T}>Type d'application non renseigné.</Empty>}
          </Section>

          <Section T={T} title="Échéances de fin de mise en service">
            {apps.some(a => a.endOfService) ? (
              <>
                {chartType === 'bars'
                  ? <StackedBar T={T} parts={EOS_BUCKETS.map(b => ({ label: b.label, value: d.eos[b.id].length, color: b.color, text: String(d.eos[b.id].length) }))} />
                  : <Breakdown T={T} type={chartType} centerValue={apps.length} centerLabel="APPLICATIONS"
                      items={EOS_BUCKETS.map(b => ({ label: b.label, value: d.eos[b.id].length, color: b.color })).filter(i => i.value > 0)} />}
                <div style={{ marginTop: 10, display: 'grid', gap: 5 }}>
                  {d.upcoming.length === 0 && <div style={{ fontSize: 10, color: T.fgMuted }}>Aucune échéance à moins de 12 mois.</div>}
                  {d.upcoming.map(a => {
                    const b = EOS_BUCKETS.find(x => x.id === eosBucket(a.endOfService));
                    return (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 8, background: T.bgAlt, borderLeft: `3px solid ${b.color}` }}>
                        <span style={{ ...ellipsis, flex: 1, fontSize: 10, fontWeight: 700, color: T.fg }}>{a.name}</span>
                        <span style={{ fontSize: 9, color: T.fgMuted }}>{formatDateFr(a.endOfService)}</span>
                        <span style={{ fontSize: 8.5, fontWeight: 800, color: b.color, background: b.color + '1F', borderRadius: 99, padding: '2px 7px', whiteSpace: 'nowrap' }}>{b.label}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : <Empty T={T}>Date de fin de mise en service non renseignée.</Empty>}
          </Section>
        </>
      )}
    </div>
  );
}
