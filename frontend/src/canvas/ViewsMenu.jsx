import React, { useState, useEffect, useCallback } from 'react';
import { Eye } from 'lucide-react';
import { getViews, createView, updateView, deleteView } from '../api/client';

const ico = { background: 'transparent', border: 'none', cursor: 'pointer', padding: '3px 5px', borderRadius: 6, fontSize: 12, lineHeight: 1 };

export default function ViewsMenu({ projectId, T, B, open, onToggle, toolbarSurface, getViewState, applyViewState, readOnly = false }) {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [shared, setShared] = useState(false);
  const [msg, setMsg] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [activeId, setActiveId] = useState(null);

  const errText = (e) => (e && e.response && e.response.data && e.response.data.detail) || 'Action impossible';
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 2500); };

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try { const r = await getViews(projectId); setViews(r.data || []); }
    catch (e) { flash(errText(e)); }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { if (open) load(); }, [open, load]);
  useEffect(() => { if (readOnly) setShared(false); }, [readOnly]);

  const save = async () => {
    const n = name.trim();
    if (!n) { flash('Donnez un nom à la vue'); return; }
    try {
      const r = await createView(projectId, { name: n, shared, data: getViewState() });
      setName(''); setActiveId(r.data.id); flash('Vue enregistrée'); load();
    } catch (e) { flash(errText(e)); }
  };
  const overwrite = async (v) => {
    if (!window.confirm('Remplacer la vue « ' + v.name + ' » par la disposition actuelle ?')) return;
    try { await updateView(projectId, v.id, { data: getViewState() }); flash('Vue mise à jour'); load(); }
    catch (e) { flash(errText(e)); }
  };
  const toggleShare = async (v) => {
    try { await updateView(projectId, v.id, { shared: !v.shared }); load(); }
    catch (e) { flash(errText(e)); }
  };
  const rename = async (v) => {
    const n = editName.trim();
    setEditId(null);
    if (!n || n === v.name) return;
    try { await updateView(projectId, v.id, { name: n }); load(); }
    catch (e) { flash(errText(e)); }
  };
  const remove = async (v) => {
    if (!window.confirm('Supprimer la vue « ' + v.name + ' » ?')) return;
    try { await deleteView(projectId, v.id); if (activeId === v.id) setActiveId(null); load(); }
    catch (e) { flash(errText(e)); }
  };
  const apply = (v) => { applyViewState(v.data || {}); setActiveId(v.id); flash('Vue « ' + v.name + ' » appliquée'); };
  const duplicate = async (v) => {
    try {
      await createView(projectId, { name: v.name + ' (copie)', shared: false, data: v.data });
      flash('Copie personnelle créée'); load();
    } catch (e) { flash(errText(e)); }
  };

  const section = { fontSize: 9, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: T.fgMuted, padding: '6px 6px 4px' };
  const chip = (shd) => ({
    fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap',
    background: shd ? 'rgba(52,211,153,.16)' : 'rgba(148,163,184,.18)', color: shd ? '#10B981' : T.fgMuted,
  });
  const row = (v) => (
    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 9, marginBottom: 3,
      border: '1px solid ' + (activeId === v.id ? '#38BDF8' : T.border), background: activeId === v.id ? 'rgba(56,189,248,.10)' : T.bgAlt }}>
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => editId !== v.id && apply(v)} title="Appliquer cette vue">
        {editId === v.id ? (
          <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Enter') rename(v); if (e.key === 'Escape') setEditId(null); }} onBlur={() => rename(v)}
            style={{ width: '100%', fontSize: 11, padding: '2px 5px', borderRadius: 5, border: '1px solid ' + T.border, background: T.bgCard, color: T.fg }} />
        ) : (
          <div style={{ fontSize: 11, fontWeight: 700, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</div>
        )}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
          <span style={chip(v.shared)}>{v.shared ? '👥 Partagée' : '🔒 Privée'}</span>
          {!v.mine && <span style={{ fontSize: 9, color: T.fgMuted }}>par {v.owner_name || 'un collègue'}</span>}
        </div>
      </div>
      {v.mine && !(readOnly && v.shared) ? (
        <div style={{ display: 'flex', gap: 0 }}>
          <button style={{ ...ico, color: T.fgMuted }} title="Remplacer par la disposition actuelle" onClick={() => overwrite(v)}>💾</button>
          {!readOnly && <button style={{ ...ico, color: T.fgMuted }} title={v.shared ? 'Rendre privée' : 'Partager avec l’équipe'} onClick={() => toggleShare(v)}>{v.shared ? '🔒' : '👥'}</button>}
          <button style={{ ...ico, color: T.fgMuted }} title="Renommer" onClick={() => { setEditId(v.id); setEditName(v.name); }}>✏️</button>
          <button style={{ ...ico, color: '#EF4444' }} title="Supprimer" onClick={() => remove(v)}>🗑</button>
        </div>
      ) : (
        <button style={{ ...ico, color: T.fgMuted }} title="Dupliquer en vue personnelle" onClick={() => duplicate(v)}>⧉</button>
      )}
    </div>
  );

  const mine = views.filter((v) => v.mine);
  const others = views.filter((v) => !v.mine);

  return (
    <div className="mapping-trigger-anchor" style={{ position: 'relative' }}>
      <button className="mapping-trigger views-trigger" aria-haspopup="true" aria-expanded={open} onClick={onToggle}
        style={{ ...B, background: open ? 'linear-gradient(135deg,#A78BFA26,#6366F116)' : toolbarSurface, color: open ? '#C4B5FD' : T.fgMuted,
          border: '1px solid ' + (open ? '#A78BFA55' : T.border), padding: '4px 10px', fontSize: 12, fontWeight: 600, letterSpacing: 0, borderRadius: 6, height: 28, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span className="views-trigger-icon" aria-hidden="true"><Eye size={15} strokeWidth={2} /></span>Vues ▾
      </button>
      {open && (
        <div className="mapping-menu" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: T.bgCard, border: '1px solid ' + T.border,
          borderRadius: 12, padding: 10, width: 300, boxShadow: '0 16px 38px rgba(0,0,0,.32)', zIndex: 300, maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={section}>Enregistrer la disposition actuelle</div>
          <div style={{ display: 'flex', gap: 6, padding: '0 4px' }}>
            <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} placeholder="Nom de la vue…" maxLength={80}
              style={{ flex: 1, fontSize: 11, padding: '6px 8px', borderRadius: 8, border: '1px solid ' + T.border, background: T.bgAlt, color: T.fg, minWidth: 0 }} />
            <button onClick={save} style={{ ...B, background: '#6366F1', color: '#fff', padding: '6px 10px', fontSize: 10, borderRadius: 8 }}>Enregistrer</button>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '8px 4px 4px' }}>
            {[{ v: false, l: '🔒 Privée' }, { v: true, l: '👥 Partagée' }].map((o) => (
              <button key={String(o.v)} disabled={readOnly && o.v} onClick={() => setShared(o.v)}
                style={{ flex: 1, padding: '5px 6px', fontSize: 10, fontWeight: 700, borderRadius: 8, cursor: 'pointer',
                  border: '1px solid ' + (shared === o.v ? '#A78BFA' : T.border), background: shared === o.v ? 'rgba(167,139,250,.16)' : T.bgAlt,
                  color: shared === o.v ? '#A78BFA' : T.fgMuted }}>{o.l}</button>
            ))}
          </div>
          <div style={{ fontSize: 9, color: T.fgMuted, padding: '0 6px 4px' }}>
            {shared ? 'Toute l’équipe du projet pourra appliquer cette vue.' : 'Vous seul verrez cette vue.'}
          </div>
          {msg && <div style={{ fontSize: 10, color: '#38BDF8', padding: '2px 6px' }}>{msg}</div>}
          <div style={{ height: 1, background: T.border, margin: '6px 2px' }} />
          <div style={section}>Mes vues ({mine.length})</div>
          {loading && !views.length && <div style={{ fontSize: 10, color: T.fgMuted, padding: 6 }}>Chargement…</div>}
          {!loading && !mine.length && <div style={{ fontSize: 10, color: T.fgMuted, padding: '2px 8px 6px' }}>Aucune vue enregistrée.</div>}
          {mine.map(row)}
          {others.length > 0 && <div style={section}>Partagées par l’équipe ({others.length})</div>}
          {others.map(row)}
        </div>
      )}
    </div>
  );
}
