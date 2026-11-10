import WidgetHeader from './WidgetHeader';
import React, { useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer, BarChart, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Treemap,
} from 'recharts';
import { EOS_BUCKETS, eosBucket } from './itsi';
import { usePalette, paletteColor } from '../utils/chartPalettes';

const CRITS = [
  { k: 'Haute', color: '#DC2626' },
  { k: 'Moyenne', color: '#F59E0B' },
  { k: 'Basse', color: '#10B981' },
  { k: 'Non renseignée', color: '#94A3B8' },
];
const critOf = a => (['Haute', 'Moyenne', 'Basse'].includes(a.criticality) ? a.criticality : 'Non renseignée');

const TABS = [
  { k: 'stack', label: 'Criticité par domaine' },
  { k: 'radar', label: 'Complétude' },
  { k: 'tree', label: 'Treemap' },
  { k: 'eos', label: 'Fin de service' },
  { k: 'statut', label: 'Statuts' },
];

export function healthScore(apps) {
  if (!apps.length) return { score: 0, parts: [] };
  const pct = n => Math.round((n / apps.length) * 100);
  const parts = [
    { label: 'Criticité renseignée', v: pct(apps.filter(a => critOf(a) !== 'Non renseignée').length) },
    { label: 'Responsable renseigné', v: pct(apps.filter(a => a.owner && a.owner.trim()).length) },
    { label: 'Hébergement connu', v: pct(apps.filter(a => a.hosting && a.hosting !== 'Inconnu').length) },
    { label: 'Fin de service non échue', v: pct(apps.filter(a => eosBucket(a.endOfService) !== 'expired').length) },
  ];
  return { score: Math.round(parts.reduce((s, p) => s + p.v, 0) / parts.length), parts };
}

export default function DashboardInsights({ apps, T, DC, statutColors, isDeal, height = 340 }) {
  const [tab, setTab] = useState('stack');
  const [fDomain, setFDomain] = useState('');
  const [fCrit, setFCrit] = useState('');
  const palette = usePalette();
  const [labels, setLabels] = useState(true);
  const [metric, setMetric] = useState('apps');
  const ref = useRef(null);

  const domColor = (d, i, n = 9) => paletteColor(palette, i, n) || (DC[d] || DC.Autre).ac;
  const critColor = (c, i) => paletteColor(palette, i, CRITS.length) || c.color;
  const filtered = useMemo(
    () => apps.filter(a => (!fDomain || a.domain === fDomain) && (!fCrit || critOf(a) === fCrit)),
    [apps, fDomain, fCrit],
  );
  const domains = useMemo(() => [...new Set(apps.map(a => a.domain || 'Autre'))].sort(), [apps]);

  const stackData = useMemo(() => domains.map(d => {
    const row = { domain: d };
    CRITS.forEach(c => { row[c.k] = filtered.filter(a => (a.domain || 'Autre') === d && critOf(a) === c.k).length; });
    row.total = CRITS.reduce((s, c) => s + row[c.k], 0);
    return row;
  }).filter(r => r.total > 0).sort((a, b) => b.total - a.total), [filtered, domains]);

  const radarData = useMemo(() => domains.map(d => {
    const da = filtered.filter(a => (a.domain || 'Autre') === d);
    if (!da.length) return null;
    const p = f => Math.round((da.filter(f).length / da.length) * 100);
    return {
      domain: d,
      Criticité: p(a => critOf(a) !== 'Non renseignée'),
      Responsable: p(a => a.owner && a.owner.trim()),
      Hébergement: p(a => a.hosting && a.hosting !== 'Inconnu'),
      'Fin de service': p(a => !!a.endOfService),
    };
  }).filter(Boolean), [filtered, domains]);

  const hasBudget = apps.some(a => typeof a.budget === 'number' && a.budget > 0);
  const treeData = useMemo(() => domains.map((d, i) => {
    const da = filtered.filter(a => (a.domain || 'Autre') === d);
    const size = metric === 'budget' ? da.reduce((s, a) => s + (a.budget || 0), 0) : da.length;
    return { name: d, size, color: domColor(d, i, domains.length) };
  }).filter(r => r.size > 0).sort((a, b) => b.size - a.size), [filtered, domains, metric, palette]); // eslint-disable-line

  const eosData = useMemo(() => EOS_BUCKETS.map(b => ({
    name: b.label, value: filtered.filter(a => eosBucket(a.endOfService) === b.id).length, color: b.color,
  })), [filtered]);

  const statutData = useMemo(() => {
    const m = {};
    filtered.forEach(a => { const s = a.statut || 'Non renseigné'; m[s] = (m[s] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value, color: statutColors[name] || '#94A3B8' }))
      .sort((a, b) => b.value - a.value);
  }, [filtered, statutColors]);

  const axis = { fill: T.fgMuted, fontSize: 11 };
  const tip = (
    <Tooltip
      cursor={{ fill: 'rgba(99,102,241,.08)' }}
      contentStyle={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12, color: T.fg, boxShadow: T.shadow }}
      labelStyle={{ color: T.fg, fontWeight: 700 }}
      itemStyle={{ color: T.fg }}
    />
  );

  const exportPng = () => {
    const svg = ref.current && ref.current.querySelector('svg.recharts-surface');
    if (!svg) return;
    const { width, height: h } = svg.getBoundingClientRect();
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', width);
    clone.setAttribute('height', h);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = width * 2; c.height = h * 2;
      const ctx = c.getContext('2d');
      ctx.fillStyle = T.bgCard; ctx.fillRect(0, 0, c.width, c.height);
      ctx.scale(2, 2); ctx.drawImage(img, 0, 0, width, h);
      const l = document.createElement('a');
      l.download = `dashboard-${tab}.png`; l.href = c.toDataURL('image/png'); l.click();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  };

  const chip = (active, onClick, text, color = '#6366F1') => (
    <button key={text} onClick={onClick} style={{
      border: `1px solid ${active ? color : T.border}`, background: active ? color + '22' : T.bgAlt, color: active ? color : T.fgMuted,
      borderRadius: 16, padding: '4px 11px', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
    }}>{text}</button>
  );
  const sel = { background: T.bgAlt, color: T.fg, border: `1px solid ${T.border}`, borderRadius: 8, height: 26, fontSize: 11, padding: '0 8px' };

  const TreeCell = props => {
    const { x, y, width, height: h, name, size, color, depth } = props;
    if (depth !== 1) return null;
    return (
      <g style={{ cursor: 'pointer' }} onClick={() => setFDomain(name)}>
        <rect x={x} y={y} width={width} height={h} fill={color} stroke={T.bgCard} strokeWidth={2} rx={6} opacity={0.92} />
        {width > 60 && h > 34 && (
          <>
            <text x={x + 8} y={y + 18} fill="#fff" fontSize={12} fontWeight={700}>{String(name).slice(0, Math.floor(width / 7))}</text>
            <text x={x + 8} y={y + 34} fill="#ffffffcc" fontSize={11}>{metric === 'budget' ? Math.round(size).toLocaleString('fr-FR') + ' €' : size}</text>
          </>
        )}
      </g>
    );
  };

  const chart = () => {
    if (!filtered.length) {
      return <div style={{ height, display: 'grid', placeItems: 'center', color: T.fgMuted, fontSize: 12 }}>Aucune application pour ces filtres.</div>;
    }
    const m = { top: 16, right: 12, left: -8, bottom: 4 };
    if (tab === 'stack') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={stackData} margin={{ ...m, top: 24 }}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="domain" tick={axis} interval={0} angle={-25} textAnchor="end" height={56} tickLine={false} axisLine={{ stroke: T.border }} />
            <YAxis tick={axis} allowDecimals={false} tickLine={false} axisLine={false} />
            {tip}
            <Legend wrapperStyle={{ fontSize: 11, color: T.fgMuted }} />
            {CRITS.map((c, i) => (
              <Bar key={c.k} dataKey={c.k} stackId="s" fill={critColor(c, i)} radius={i === CRITS.length - 1 ? [4, 4, 0, 0] : 0}
                onClick={d => setFDomain(d.domain)} cursor="pointer" animationDuration={500}>
                {labels && <LabelList dataKey={c.k} fill="#fff" fontSize={10} formatter={v => (v ? v : '')} />}
              </Bar>
            ))}
            <Line dataKey="total" name="Total" stroke="none" dot={false} activeDot={false} legendType="none" isAnimationActive={false}>
              <LabelList dataKey="total" position="top" fill={T.fg} fontSize={12} fontWeight={800} />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
    if (tab === 'radar') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={['Criticité', 'Responsable', 'Hébergement', 'Fin de service'].map(k => {
            const row = { axis: k };
            radarData.forEach(r => { row[r.domain] = r[k]; });
            return row;
          })}>
            <PolarGrid stroke={T.border} />
            <PolarAngleAxis dataKey="axis" tick={axis} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ ...axis, fontSize: 9 }} stroke={T.border} />
            {radarData.slice(0, 6).map((r, i) => (
              <Radar key={r.domain} name={r.domain} dataKey={r.domain} stroke={domColor(r.domain, i, 6)} fill={domColor(r.domain, i, 6)} fillOpacity={0.14} strokeWidth={2} />
            ))}
            {tip}
            <Legend wrapperStyle={{ fontSize: 11, color: T.fgMuted }} />
          </RadarChart>
        </ResponsiveContainer>
      );
    }
    if (tab === 'tree') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <Treemap data={treeData} dataKey="size" content={<TreeCell />} isAnimationActive={false} aspectRatio={1.6} />
        </ResponsiveContainer>
      );
    }
    const data = tab === 'eos' ? eosData : statutData;
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={m}>
          <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={axis} interval={0} tickLine={false} axisLine={{ stroke: T.border }} />
          <YAxis tick={axis} allowDecimals={false} tickLine={false} axisLine={false} />
          {tip}
          <Bar dataKey="value" name="Applications" radius={[6, 6, 0, 0]} animationDuration={500}>
            {data.map((d, i) => <Cell key={d.name} fill={paletteColor(palette, i, data.length) || d.color} />)}
            {labels && <LabelList dataKey="value" position="top" fill={T.fg} fontSize={11} fontWeight={700} />}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const visibleTabs = TABS.filter(t => !(t.k === 'statut' && isDeal));
  const filterActive = fDomain || fCrit;

  return (
    <div style={{ background: T.bgCard, borderRadius: 16, padding: 20, boxShadow: `0 8px 24px rgba(30,27,75,.07), 0 0 0 1px ${T.border}` }}>
      <WidgetHeader T={T} color="#2563EB" icon="◈" title="Analyse du portefeuille" subtitle="Criticité, complétude, échéances et statuts du parc applicatif" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        {visibleTabs.map(t => chip(tab === t.k, () => setTab(t.k), t.label))}
        <div style={{ flex: 1 }} />
        {tab === 'tree' && hasBudget && (
          <select value={metric} onChange={e => setMetric(e.target.value)} style={sel}>
            <option value="apps">Nb d'applications</option>
            <option value="budget">Budget</option>
          </select>
        )}
        <button onClick={() => setLabels(v => !v)} style={{ ...sel, cursor: 'pointer' }} title="Valeurs sur les graphiques">{labels ? 'Valeurs : oui' : 'Valeurs : non'}</button>
        <button onClick={exportPng} style={{ ...sel, cursor: 'pointer' }} title="Exporter en PNG">Export PNG</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: T.fgMuted, fontWeight: 600 }}>Filtre :</span>
        <select value={fDomain} onChange={e => setFDomain(e.target.value)} style={sel}>
          <option value="">Tous les domaines</option>
          {domains.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {CRITS.map(c => chip(fCrit === c.k, () => setFCrit(fCrit === c.k ? '' : c.k), c.k, c.color))}
        {filterActive && <button onClick={() => { setFDomain(''); setFCrit(''); }} style={{ background: 'transparent', border: 'none', color: '#6366F1', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Tout effacer</button>}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: T.fgMuted }}>{filtered.length} / {apps.length} applications</span>
      </div>
      <div ref={ref}>{chart()}</div>
    </div>
  );
}
