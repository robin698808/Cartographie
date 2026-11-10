import React from 'react';

/* En-tête commun à tous les widgets du dashboard : pastille icône, titre, sous-titre, zone d'actions optionnelle. */
export default function WidgetHeader({ T, color, icon, title, subtitle, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', background: color + '22', color, fontSize: 18, fontWeight: 800, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.fg, letterSpacing: '-0.01em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: T.fgMuted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}
