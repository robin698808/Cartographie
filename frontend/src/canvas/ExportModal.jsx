import { useEffect, useMemo, useRef, useState } from 'react';
import API from '../api/client';

// Catalogue aligné sur backend/pptx_generator.py (SECTIONS)
const CATALOG = [
  { group: 'Introduction', items: [
    { id: 'cover', label: 'Page de garde' },
    { id: 'synthese', label: 'Synthèse & messages clés', hint: 'Flux dominants, domaines, hubs' },
    { id: 'executive', label: 'Synthèse exécutive', hint: 'Chiffres clés du périmètre' },
  ] },
  { group: 'Cartographie', requires: 'apps', items: [
    { id: 'carto_globale', label: 'Cartographie globale', hint: 'Applications par domaine + tous les flux' },
    { id: 'domain_view', label: 'Vue par domaine', hint: '1 diapositive par domaine : applications et flux' },
  ] },
  { group: 'Flux', requires: 'flows', items: [
    { id: 'flux_matrix', label: 'Matrice des flux inter-domaines' },
    { id: 'hubs', label: 'Hubs applicatifs (vue d’ensemble)' },
    { id: 'hub_detail', label: 'Détail par hub', hint: '1 diapositive par hub', hubOptions: true },
    { id: 'flux_table', label: 'Tableau détaillé des flux', hint: 'Paginé, en-têtes répétés' },
  ] },
  { group: 'Domaines', requires: 'deal', items: [
    { id: 'domain_status', label: 'Cartographie par domaine (Day 1 / Day 2)' },
    { id: 'env_d1', label: 'Environnement applicatif — Day 1' },
    { id: 'env_d2', label: 'Environnement applicatif — Day 2' },
  ] },
  { group: 'Portefeuille', items: [
    { id: 'paysage', label: 'Paysage applicatif', hint: 'Treemap par domaine' },
    { id: 'recap_apps', label: 'Récapitulatif des applications', hint: 'Tableau paginé' },
  ] },
  { group: 'Conclusion', items: [{ id: 'end', label: 'Diapositive de fin' }] },
];

const PRESETS = {
  synthese: { label: 'Synthèse (comité)', ids: ['cover', 'synthese', 'executive', 'carto_globale', 'domain_view', 'flux_matrix', 'hubs', 'paysage', 'end'] },
  complet: { label: 'Complet', ids: null },
  decision: { label: 'Décision (Day 1/2)', ids: ['cover', 'synthese', 'executive', 'domain_status', 'env_d1', 'env_d2', 'paysage', 'end'] },
};

const COLORS = ['0B2545', '1B3A5C', '2979FF', '10B981', '6366F1', 'EF6C00', 'E06C75', '2D6A4F'];

export default function ExportModal({ T, apps, flows, doms, projectType, initialOpts, onClose, onExport }) {
  const isDeal = projectType === 'deal';
  const available = (g, it) => !((g.requires === 'flows' && !flows.length) || (g.requires === 'deal' && !isDeal) || (it.requires === 'flows' && !flows.length));
  const allIds = useMemo(() => CATALOG.flatMap((g) => g.items.filter((it) => available(g, it)).map((it) => it.id)), [flows.length, isDeal]); // eslint-disable-line
  const [selected, setSelected] = useState(() => new Set(allIds));
  const [domains, setDomains] = useState(() => new Set(doms));
  const [primary, setPrimary] = useState(initialOpts.clientPrimary || '2979FF');
  const [clientName, setClientName] = useState(initialOpts.clientName || '');
  const [logo, setLogo] = useState(initialOpts.clientLogo || null);
  const [hubLimit, setHubLimit] = useState(initialOpts.hubLimit || 8);
  const [plan, setPlan] = useState(null);
  const [planErr, setPlanErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const scoped = useMemo(() => {
    const a = apps.filter((x) => domains.has(x.domain));
    const ids = new Set(a.map((x) => x.id));
    return { apps: a, flows: flows.filter((f) => ids.has(f.from) && ids.has(f.to)) };
  }, [apps, flows, domains]);

  const opts = useMemo(() => ({
    sections: allIds.filter((id) => selected.has(id)),
    clientPrimary: primary,
    clientName,
    hubLimit,
    inclDomainStatus: isDeal,
  }), [allIds, selected, primary, clientName, hubLimit, isDeal]);

  const reqRef = useRef(0);
  useEffect(() => {
    const id = ++reqRef.current;
    setLoading(true);
    const t = setTimeout(() => {
      API.post('/export/pptx/plan', { apps: scoped.apps, flows: scoped.flows, opts })
        .then((r) => { if (id === reqRef.current) { setPlan(r.data); setPlanErr(null); } })
        .catch((e) => { if (id === reqRef.current) setPlanErr(e?.response?.data?.detail || e.message); })
        .finally(() => { if (id === reqRef.current) setLoading(false); });
    }, 500);
    return () => clearTimeout(t);
  }, [scoped, opts]);

  const toggle = (ids, on) => setSelected((p) => { const n = new Set(p); ids.forEach((i) => (on ? n.add(i) : n.delete(i))); return n; });
  const applyPreset = (p) => setSelected(new Set((p.ids || allIds).filter((i) => allIds.includes(i))));
  const toggleDomain = (d) => setDomains((p) => { const n = new Set(p); if (n.has(d)) n.delete(d); else n.add(d); return n; });

  const lbl = { fontSize: 10, fontWeight: 700, color: T.fgMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 };
  const chip = (on) => ({ fontSize: 10, padding: '3px 9px', borderRadius: 12, cursor: 'pointer', border: '1px solid ' + (on ? '#2979FF' : T.border), background: on ? '#2979FF18' : 'transparent', color: on ? '#2979FF' : T.fgMuted });
  const btn = { border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' };
  const count = plan?.count ?? 0;
  const planBySection = useMemo(() => {
    const m = {};
    (plan?.slides || []).forEach((s) => { m[s.section] = (m[s.section] || 0) + 1; });
    return m;
  }, [plan]);

  const generate = async () => {
    setBusy(true);
    try {
      await onExport({ apps: scoped.apps, flows: scoped.flows, opts: { ...opts, clientLogo: logo } }, { primary, clientName, hubLimit, logo });
      onClose();
    } catch (err) {
      alert('Erreur export PPTX :\n' + (err?.response?.data?.detail || err?.message || String(err)));
    } finally { setBusy(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: T.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: T.bgCard, borderRadius: 14, width: 'min(1040px,96vw)', height: 'min(760px,92vh)', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 50px #00000070' }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid ' + T.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.fg }}>Export PowerPoint</div>
            <div style={{ fontSize: 10, color: T.fgMuted, marginTop: 3 }}>{scoped.apps.length} applications · {scoped.flows.length} flux · {domains.size} domaines</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: T.fgMuted, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', minHeight: 0 }}>
          {/* Colonne gauche : contenu */}
          <div style={{ padding: '16px 22px', overflowY: 'auto', borderRight: '1px solid ' + T.border }}>
            <div style={lbl}>Modèles</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
              {Object.values(PRESETS).map((p) => <span key={p.label} style={chip(false)} onClick={() => applyPreset(p)}>{p.label}</span>)}
              <span style={chip(false)} onClick={() => setSelected(new Set())}>Tout décocher</span>
            </div>

            {CATALOG.map((g) => {
              const items = g.items.filter((it) => available(g, it));
              if (!items.length) return null;
              const ids = items.map((i) => i.id);
              const nOn = ids.filter((i) => selected.has(i)).length;
              return (
                <div key={g.group} style={{ marginTop: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 4 }}>
                    <input type="checkbox" checked={nOn === ids.length} ref={(el) => { if (el) el.indeterminate = nOn > 0 && nOn < ids.length; }} onChange={(e) => toggle(ids, e.target.checked)} style={{ accentColor: '#2979FF' }} />
                    <span style={{ ...lbl, marginBottom: 0 }}>{g.group}</span>
                  </label>
                  {items.map((it) => {
                    const on = selected.has(it.id);
                    return (
                      <div key={it.id} style={{ marginLeft: 22, padding: '6px 10px', borderRadius: 8, background: on ? '#2979FF0D' : 'transparent', border: '1px solid ' + (on ? '#2979FF40' : 'transparent'), marginBottom: 3 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input type="checkbox" checked={on} onChange={(e) => toggle([it.id], e.target.checked)} style={{ accentColor: '#2979FF' }} />
                          <span style={{ flex: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.fg }}>{it.label}</span>
                            {it.hint && <span style={{ display: 'block', fontSize: 10, color: T.fgMuted }}>{it.hint}</span>}
                          </span>
                          {on && planBySection[it.id] > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#2979FF' }}>{planBySection[it.id]} diap.</span>}
                        </label>
                        {on && it.hubOptions && (
                          <div style={{ marginTop: 6, marginLeft: 24, fontSize: 11, color: T.fgMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
                            Nombre de hubs max
                            <input type="number" min={1} max={15} value={hubLimit} onChange={(e) => setHubLimit(Math.max(1, Math.min(15, parseInt(e.target.value, 10) || 1)))} style={{ width: 54, padding: '2px 6px', borderRadius: 6, border: '1px solid ' + T.border, background: T.bg, color: T.fg }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <div style={{ ...lbl, marginTop: 18 }}>Domaines inclus</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {doms.map((d) => <span key={d} style={chip(domains.has(d))} onClick={() => toggleDomain(d)}>{d}</span>)}
            </div>

            <div style={{ ...lbl, marginTop: 18 }}>Identité</div>
            <input placeholder="Nom du client (page de garde)" value={clientName} onChange={(e) => setClientName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', borderRadius: 6, border: '1px solid ' + T.border, background: T.bg, color: T.fg, fontSize: 12, marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {COLORS.map((c) => <div key={c} onClick={() => setPrimary(c)} style={{ width: 22, height: 22, borderRadius: 5, background: '#' + c, cursor: 'pointer', boxShadow: primary === c ? '0 0 0 2px #' + c + ', 0 0 0 4px ' + T.bgCard : 'none' }} />)}
              <input type="color" value={'#' + primary} onChange={(e) => setPrimary(e.target.value.replace('#', ''))} style={{ width: 30, height: 24, border: 'none', background: 'none' }} />
              <input type="file" accept="image/png,image/jpeg" style={{ fontSize: 10, color: T.fg }} onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => setLogo(ev.target.result); r.readAsDataURL(f); }} />
              {logo && <><img src={logo} alt="logo" style={{ height: 24, maxWidth: 70, objectFit: 'contain' }} /><span style={{ cursor: 'pointer', color: T.fgMuted }} onClick={() => setLogo(null)}>✕</span></>}
            </div>
          </div>

          {/* Colonne droite : aperçu du plan */}
          <div style={{ padding: '16px 22px', overflowY: 'auto', background: T.bgAlt }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#EF6C00', lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: 11, color: T.fgMuted }}>diapositives {loading && '· calcul…'}</div>
            </div>
            {planErr && <div style={{ color: '#EF4444', fontSize: 11, marginTop: 8 }}>Aperçu indisponible : {String(planErr)}</div>}
            {count === 0 && !loading && !planErr && <div style={{ fontSize: 11, color: T.fgMuted, marginTop: 12 }}>Aucune diapositive : cochez au moins une section.</div>}
            <div style={{ marginTop: 12, opacity: loading ? 0.5 : 1 }}>
              {(plan?.slides || []).map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 8px', marginBottom: 3, borderRadius: 6, background: T.bgCard, border: '1px solid ' + T.border }}>
                  <span style={{ width: 20, fontSize: 10, fontWeight: 700, color: T.fgMuted, textAlign: 'right' }}>{i + 1}</span>
                  <span style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: '#' + primary }} />
                  <span style={{ fontSize: 11, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 22px', borderTop: '1px solid ' + T.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: T.fgMuted }}>Objets natifs PowerPoint, modifiables après export.</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ ...btn, background: T.border, padding: '9px 20px', fontSize: 12 }}>Annuler</button>
            <button disabled={busy || count === 0} onClick={generate} style={{ ...btn, background: '#EF6C00', padding: '9px 28px', fontWeight: 800, fontSize: 13, opacity: busy || count === 0 ? 0.5 : 1 }}>{busy ? 'Génération…' : '⬇ Générer le PPTX'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
