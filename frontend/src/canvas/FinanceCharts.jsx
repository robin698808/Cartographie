import React from 'react';
import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, Legend, LabelList,
} from 'recharts';
import { formatEuro } from './itsi';

/* Graphiques de lecture financière : cascade, Pareto 80/20, OPEX/CAPEX empilés. */

const short = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
const compact = v => (v >= 1e6 ? (v / 1e6).toFixed(1).replace('.0', '') + ' M€' : v >= 1e3 ? Math.round(v / 1e3) + ' k€' : Math.round(v) + ' €');

const useStyle = T => ({
  axis: { fill: T.fgMuted, fontSize: 11 },
  tip: {
    contentStyle: { background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12, color: T.fg, boxShadow: T.shadow },
    labelStyle: { color: T.fg, fontWeight: 700 },
    itemStyle: { color: T.fg },
  },
});

/* Cascade : chaque domaine ajoute sa part au total annuel. items : [{ label, value, color }] */
export function WaterfallChart({ T, items, height = 260 }) {
  const s = useStyle(T);
  let run = 0;
  const data = items.map(i => { const row = { label: i.label, base: run, value: i.value, color: i.color, end: run + i.value }; run += i.value; return row; });
  data.push({ label: 'Total', base: 0, value: run, color: '#10B981', end: run, total: true });
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 22, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={s.axis} tickLine={false} axisLine={{ stroke: T.border }} interval={0} tickFormatter={v => short(v, 9)} />
        <YAxis tick={s.axis} tickLine={false} axisLine={false} tickFormatter={compact} width={52} />
        <Tooltip {...s.tip} cursor={{ fill: 'rgba(99,102,241,.08)' }}
          formatter={(v, n, p) => (n === 'base' ? null : [`${formatEuro(v)}${p.payload.total ? '' : ' · cumul ' + formatEuro(p.payload.end)}`, p.payload.label])} />
        <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} legendType="none" />
        <Bar dataKey="value" stackId="w" radius={[4, 4, 0, 0]} animationDuration={500}>
          {data.map(d => <Cell key={d.label} fill={d.color} />)}
          <LabelList dataKey="value" position="top" formatter={compact} style={{ fill: T.fg, fontSize: 10.5, fontWeight: 700 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* Pareto : barres décroissantes + courbe du cumul en %, repère à 80 %. items triés : [{ label, value, color }] */
export function ParetoChart({ T, items, height = 260 }) {
  const s = useStyle(T);
  const total = items.reduce((a, i) => a + i.value, 0) || 1;
  let run = 0;
  const data = items.map(i => { run += i.value; return { label: i.label, value: i.value, color: i.color, cum: Math.round(run / total * 100) }; });
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 12, right: 6, left: 0, bottom: 4 }}>
        <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={s.axis} tickLine={false} axisLine={{ stroke: T.border }} interval={0} tickFormatter={v => short(v, 8)} />
        <YAxis yAxisId="l" tick={s.axis} tickLine={false} axisLine={false} tickFormatter={compact} width={52} />
        <YAxis yAxisId="r" orientation="right" domain={[0, 100]} ticks={[0, 25, 50, 80, 100]} tick={s.axis} tickLine={false} axisLine={false} tickFormatter={v => v + '%'} width={38} />
        <Tooltip {...s.tip} cursor={{ fill: 'rgba(99,102,241,.08)' }}
          formatter={(v, n) => (n === 'cum' ? [v + ' % du total', 'Cumul'] : [formatEuro(v), 'Coût annuel'])} />
        <ReferenceLine yAxisId="r" y={80} stroke="#EF4444" strokeDasharray="5 4" label={{ value: '80 %', position: 'insideTopRight', fill: '#EF4444', fontSize: 10 }} />
        <Bar yAxisId="l" dataKey="value" radius={[4, 4, 0, 0]} animationDuration={500}>
          {data.map(d => <Cell key={d.label} fill={d.color} />)}
        </Bar>
        <Line yAxisId="r" dataKey="cum" type="monotone" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3, fill: '#F59E0B' }} animationDuration={600} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* OPEX / CAPEX par domaine, empilés. rows : [{ label, OPEX, CAPEX, 'Non défini' }] */
export function CostMixChart({ T, rows, colors, height = 260 }) {
  const s = useStyle(T);
  const keys = ['OPEX', 'CAPEX', 'Non défini'].filter(k => rows.some(r => r[k] > 0));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={s.axis} tickLine={false} axisLine={{ stroke: T.border }} interval={0} tickFormatter={v => short(v, 9)} />
        <YAxis tick={s.axis} tickLine={false} axisLine={false} tickFormatter={compact} width={52} />
        <Tooltip {...s.tip} cursor={{ fill: 'rgba(99,102,241,.08)' }} formatter={(v, n) => [formatEuro(v), n]} />
        <Legend wrapperStyle={{ fontSize: 11, color: T.fgMuted }} />
        {keys.map((k, n) => <Bar key={k} dataKey={k} stackId="c" fill={colors[k] || '#64748B'} radius={n === keys.length - 1 ? [4, 4, 0, 0] : 0} animationDuration={500} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}
