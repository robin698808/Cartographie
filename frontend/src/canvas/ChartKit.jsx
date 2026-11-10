import React from 'react';
import { usePalette, paletteColor } from '../utils/chartPalettes';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, Cell,
  PieChart, Pie, AreaChart, Area,
} from 'recharts';

/* Rendu Recharts commun à tous les widgets du dashboard.
   items : [{ label, value, color, text? }]  —  type : bars | columns | donut | pie | area */

const short = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));

export default function ItemsChart({
  T, items: rawItems, type = 'bars', height = 240, unit = '', centerValue, centerLabel, formatValue,
  onItemClick, activeLabel, showValues = true,
}) {
  const palette = usePalette();
  const items = palette === 'default' ? rawItems
    : rawItems.map((it, i) => ({ ...it, color: paletteColor(palette, i, rawItems.length) || it.color }));
  const fmt = formatValue || (v => v);
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const axis = { fill: T.fgMuted, fontSize: 11 };
  const tip = (
    <Tooltip
      cursor={{ fill: 'rgba(99,102,241,.08)' }}
      formatter={(v, _n, p) => [`${fmt(v)}${unit} (${Math.round((v / total) * 100)}%)`, p && p.payload ? p.payload.label : '']}
      contentStyle={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12, color: T.fg, boxShadow: T.shadow }}
      labelStyle={{ color: T.fg, fontWeight: 700 }}
      itemStyle={{ color: T.fg }}
    />
  );
  const dim = i => (activeLabel && activeLabel !== i.label ? 0.3 : 1);
  const click = i => onItemClick && onItemClick(i.label);
  const cell = i => <Cell key={i.label} fill={i.color} fillOpacity={dim(i)} cursor={onItemClick ? 'pointer' : 'default'} onClick={() => click(i)} />;

  if (!items.length) {
    return <div style={{ height, display: 'grid', placeItems: 'center', color: T.fgMuted, fontSize: 12 }}>Aucune donnée.</div>;
  }

  if (type === 'donut' || type === 'pie') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160, height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={items} dataKey="value" nameKey="label" innerRadius={type === 'donut' ? '58%' : 0} outerRadius="88%"
                paddingAngle={items.length > 1 ? 2 : 0} stroke={T.bgCard} strokeWidth={2} animationDuration={500}>
                {items.map(cell)}
              </Pie>
              {tip}
            </PieChart>
          </ResponsiveContainer>
          {type === 'donut' && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.fg, lineHeight: 1 }}>{centerValue ?? total}</div>
                {centerLabel && <div style={{ fontSize: 9.5, color: T.fgMuted, letterSpacing: '.06em', marginTop: 4 }}>{centerLabel}</div>}
              </div>
            </div>
          )}
        </div>
        <div style={{ flex: '1 1 150px', minWidth: 0, maxHeight: height, overflowY: 'auto', display: 'grid', gap: 7 }}>
          {items.map(i => (
            <span key={i.label} onClick={() => click(i)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: onItemClick ? 'pointer' : 'default', opacity: dim(i) }}>
              <i style={{ width: 10, height: 10, borderRadius: 3, background: i.color, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, color: T.fg, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={i.label}>{i.label}</span>
              <b style={{ color: T.fg }}>{i.text ?? fmt(i.value)}</b>
              <span style={{ width: 34, textAlign: 'right', fontSize: 11, color: T.fgMuted }}>{Math.round((i.value / total) * 100)}%</span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={items} margin={{ top: 18, right: 12, left: -8, bottom: 4 }}>
          <defs>
            <linearGradient id="ck-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={axis} tickFormatter={v => short(v, 10)} interval={0} tickLine={false} axisLine={{ stroke: T.border }} />
          <YAxis tick={axis} tickFormatter={fmt} allowDecimals={false} tickLine={false} axisLine={false} />
          {tip}
          <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2.5} fill="url(#ck-area)" dot={{ r: 4, fill: '#6366F1', stroke: T.bgCard, strokeWidth: 2 }} animationDuration={500}>
            {showValues && <LabelList dataKey="value" position="top" fill={T.fg} fontSize={11} fontWeight={700} formatter={fmt} />}
          </Area>
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'columns') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={items} margin={{ top: 18, right: 12, left: -8, bottom: 4 }}>
          <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={axis} tickFormatter={v => short(v, 12)} interval={0} angle={items.length > 5 ? -25 : 0} textAnchor={items.length > 5 ? 'end' : 'middle'} height={items.length > 5 ? 56 : 30} tickLine={false} axisLine={{ stroke: T.border }} />
          <YAxis tick={axis} tickFormatter={fmt} allowDecimals={false} tickLine={false} axisLine={false} />
          {tip}
          <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={500}>
            {items.map(cell)}
            {showValues && <LabelList dataKey="value" position="top" fill={T.fg} fontSize={11} fontWeight={700} formatter={fmt} />}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  const h = Math.max(height, items.length * 32 + 20);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={items} layout="vertical" margin={{ top: 4, right: 48, left: 4, bottom: 4 }}>
        <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={axis} tickFormatter={fmt} allowDecimals={false} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="label" width={110} tick={axis} tickFormatter={v => short(v, 16)} tickLine={false} axisLine={false} />
        {tip}
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18} animationDuration={500}>
          {items.map(cell)}
          {showValues && <LabelList dataKey="value" position="right" fill={T.fg} fontSize={11} fontWeight={700} formatter={fmt} />}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* Flux sortants / entrants par domaine (barres empil?es) */
export function FlowBalanceChart({ T, data, height = 300, onDomainClick }) {
  const axis = { fill: T.fgMuted, fontSize: 11 };
  const h = Math.max(height, data.length * 36 + 60);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
        <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={axis} allowDecimals={false} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="domain" width={110} tick={axis} tickFormatter={v => short(v, 16)} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'rgba(99,102,241,.08)' }}
          contentStyle={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12, color: T.fg, boxShadow: T.shadow }}
          labelStyle={{ color: T.fg, fontWeight: 700 }} itemStyle={{ color: T.fg }} />
        <Legend wrapperStyle={{ fontSize: 11, color: T.fgMuted }} />
        <Bar dataKey="outgoing" name="Sortants" stackId="f" fill="#06B6D4" barSize={18} cursor="pointer" onClick={d => onDomainClick && onDomainClick(d.domain)} animationDuration={500}>
          <LabelList dataKey="outgoing" fill="#fff" fontSize={10} formatter={v => (v ? v : '')} />
        </Bar>
        <Bar dataKey="incoming" name="Entrants" stackId="f" fill="#6366F1" radius={[0, 6, 6, 0]} barSize={18} cursor="pointer" onClick={d => onDomainClick && onDomainClick(d.domain)} animationDuration={500}>
          <LabelList dataKey="incoming" fill="#fff" fontSize={10} formatter={v => (v ? v : '')} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
