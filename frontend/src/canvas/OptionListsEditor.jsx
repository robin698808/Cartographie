import React, { useState } from 'react';

const TABS = [
  { id: 'statuts', label: 'Statuts', field: 'statut' },
  { id: 'appTypes', label: "Types d'application", field: 'appType' },
];

/* Éditeur (admin) des listes Statut et Type d'application : ajout, renommage, couleur, traduction EN, suppression avec reprise */
export default function OptionListsEditor({ T, I, B, apps, lists, initialTab = 'statuts', onSave, onClose }) {
  const [tab, setTab] = useState(initialTab);
  const [data, setData] = useState(() => ({
    statuts: lists.statuts.map((i) => ({ ...i, orig: i.value })),
    appTypes: lists.appTypes.map((i) => ({ ...i, orig: i.value })),
  }));
  const [removed, setRemoved] = useState({ statuts: [], appTypes: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const cur = TABS.find((t) => t.id === tab);
  const rows = data[tab];

  const usage = (field, value) => apps.filter((a) => (a[field] || '') === value).length;
  const setRows = (fn) => setData((d) => ({ ...d, [tab]: fn(d[tab]) }));
  const patch = (idx, p) => setRows((r) => r.map((x, i) => (i === idx ? { ...x, ...p } : x)));
  const add = () => setRows((r) => [...r, { value: '', en: '', color: '#6366F1', orig: null }]);
  const remove = (idx) => {
    const row = rows[idx];
    if (row.orig) setRemoved((s) => ({ ...s, [tab]: [...s[tab], { orig: row.orig, repl: '' }] }));
    setRows((r) => r.filter((_, i) => i !== idx));
  };
  const setRepl = (orig, repl) => setRemoved((s) => ({ ...s, [tab]: s[tab].map((x) => (x.orig === orig ? { ...x, repl } : x)) }));

  const save = async () => {
    for (const t of TABS) {
      const names = data[t.id].map((r) => r.value.trim().toLowerCase());
      if (names.some((n) => !n)) { setTab(t.id); setError('Chaque élément doit avoir un libellé.'); return; }
      if (new Set(names).size !== names.length) { setTab(t.id); setError('Deux éléments portent le même libellé.'); return; }
    }
    setSaving(true); setError('');
    const out = {};
    const migrations = {};
    for (const t of TABS) {
      out[t.id] = data[t.id].map((r) => ({ value: r.value.trim(), en: (r.en || '').trim(), color: r.color }));
      const m = {};
      data[t.id].forEach((r) => { if (r.orig && r.orig !== r.value.trim()) m[r.orig] = r.value.trim(); });
      removed[t.id].forEach((r) => { m[r.orig] = r.repl; });
      migrations[t.field] = m;
    }
    try { await onSave(out, migrations); onClose(); }
    catch (e) { setError(e?.response?.data?.detail || "Enregistrement impossible (droits administrateur requis)."); setSaving(false); }
  };

  const pending = removed[tab].filter((r) => usage(cur.field, r.orig) > 0);

  return <div style={{ position: 'fixed', inset: 0, background: T.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }} onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: T.bgCard, border: '1px solid ' + T.border, borderRadius: 16, padding: 20, width: 620, maxWidth: '94vw', maxHeight: '86vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,.4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.fg }}>Listes personnalisables</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: T.fgMuted, fontSize: 18, cursor: 'pointer' }}>×</button>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {TABS.map((t) => <button key={t.id} onClick={() => { setTab(t.id); setError(''); }} style={{ ...B, padding: '6px 12px', fontSize: 11, background: tab === t.id ? '#2979FF' : T.bgAlt, color: tab === t.id ? '#fff' : T.fgMuted, border: '1px solid ' + (tab === t.id ? '#2979FF' : T.border) }}>{t.label}</button>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr 1fr 28px', gap: 6, fontSize: 10, color: T.fgMuted, padding: '0 2px 4px' }}>
        <span>Couleur</span><span>Libellé (FR)</span><span>Traduction (EN)</span><span />
      </div>
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 2 }}>
        {rows.map((r, idx) => <div key={idx} style={{ display: 'grid', gridTemplateColumns: '34px 1fr 1fr 28px', gap: 6, alignItems: 'center' }}>
          <input type="color" value={r.color} onChange={(e) => patch(idx, { color: e.target.value })} style={{ width: 30, height: 28, padding: 0, border: '1px solid ' + T.border, borderRadius: 6, background: 'transparent', cursor: 'pointer' }} />
          <input value={r.value} onChange={(e) => patch(idx, { value: e.target.value })} placeholder="Libellé" style={I} />
          <input value={r.en || ''} onChange={(e) => patch(idx, { en: e.target.value })} placeholder="English label" style={I} />
          <button onClick={() => remove(idx)} title="Supprimer" style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 15 }}>🗑</button>
        </div>)}
        <button onClick={add} style={{ ...B, alignSelf: 'flex-start', background: 'transparent', color: '#2979FF', border: '1px dashed #2979FF88', padding: '6px 12px', fontSize: 11 }}>+ Ajouter</button>
      </div>
      {pending.length > 0 && <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: T.bgAlt, border: '1px solid ' + T.border, fontSize: 11, color: T.fg }}>
        <div style={{ marginBottom: 6, color: T.fgMuted }}>Des applications utilisent des valeurs supprimées. Choisissez leur remplacement :</div>
        {pending.map((p) => <div key={p.orig} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ flex: 1 }}>{p.orig} ({usage(cur.field, p.orig)})</span>
          <select value={p.repl} onChange={(e) => setRepl(p.orig, e.target.value)} style={{ ...I, width: 200 }}>
            <option value="">— Non défini —</option>
            {rows.filter((r) => r.value.trim()).map((r, i) => <option key={i} value={r.value.trim()}>{r.value.trim()}</option>)}
          </select>
        </div>)}
      </div>}
      {error && <div style={{ marginTop: 10, color: '#EF4444', fontSize: 11 }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button onClick={onClose} style={{ ...B, background: T.bgAlt, color: T.fgMuted, border: '1px solid ' + T.border }}>Annuler</button>
        <button onClick={save} disabled={saving} style={{ ...B, background: '#2979FF', color: '#fff', opacity: saving ? 0.6 : 1 }}>Enregistrer</button>
      </div>
    </div>
  </div>;
}
