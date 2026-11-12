import { useEffect, useMemo, useRef, useState } from 'react';
import API from '../api/client';
import { buildPriorityItems } from './priority-score';

// Catalogue aligné sur backend/pptx_generator.py (SECTIONS)
const CATALOG = [
  { group: '2. Vue exécutive', items: [
    { id: 'cover', label: 'Page de garde', hint: 'Titre et identité du client' },
    { id: 'key_graphs', label: 'Graphiques clés', hint: 'Statuts, hébergement et répartition du portefeuille' },
    { id: 'key_information', label: 'Informations clés', hint: 'Applications, domaines, flux et criticité' },
    { id: 'synthese', label: 'Messages clés et synthèse exécutive', hint: 'Dépendances et points d’attention' },
  ] },
  { group: '3. Vue cartographie', items: [
    { id: 'portfolio_map', label: 'Applications et statuts par domaine', hint: 'Vue consolidée sur une page, sans flux ; texte réduit si nécessaire' },
    { id: 'domain_view', label: 'Applications et flux par domaine', hint: 'Carte consolidée si lisible, sinon détail paginé avec applications liées' },
  ] },
  { group: '4. Annexes', items: [
    { id: 'flow_register', label: 'Matrice détaillée des flux', hint: 'Domaine, applications, objet, priorité, protocole, licences et coûts', requires: 'flows' },
  ] },
];

const COLORS = ['0B2545', '1B3A5C', '2979FF', '10B981', '6366F1', 'EF6C00', 'E06C75', '2D6A4F'];

export default function ExportModal({ T, apps, flows, doms, projectType, projectId, readOnly, initialOpts, onClose, onExport }) {
  const isDeal = projectType === 'deal';
  const available = (g, it) => !((g.requires === 'flows' && !flows.length) || (g.requires === 'deal' && !isDeal) || (it.requires === 'flows' && !flows.length));
  const allIds = useMemo(() => CATALOG.flatMap((g) => g.items.filter((it) => available(g, it)).map((it) => it.id)), [flows.length, isDeal]); // eslint-disable-line
  const [selected, setSelected] = useState(() => new Set(allIds));
  const [domains, setDomains] = useState(() => new Set(doms));
  const [primary, setPrimary] = useState(initialOpts.clientPrimary || '2979FF');
  const [clientName, setClientName] = useState(initialOpts.clientName || '');
  const [logo, setLogo] = useState(initialOpts.clientLogo || null);
  const [hubLimit] = useState(initialOpts.hubLimit || 8);
  const [plan, setPlan] = useState(null);
  const [planErr, setPlanErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [template, setTemplate] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [templateError, setTemplateError] = useState(null);
  const [templateReady, setTemplateReady] = useState(false);
  const [templateVersion, setTemplateVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setTemplateLoading(true);
    API.get(`/export/pptx/template/${projectId}`)
      .then((r) => { if (active) { setTemplate(r.data.filename); setTemplateError(null); setTemplateReady(true); } })
      .catch((e) => { if (active) setTemplateError(e?.response?.data?.detail || e.message); })
      .finally(() => { if (active) setTemplateLoading(false); });
    return () => { active = false; };
  }, [projectId]);

  const updateTemplate = async (file) => {
    setTemplateLoading(true);
    setTemplateError(null);
    try {
      if (file) {
        const form = new FormData();
        form.append('file', file);
        const response = await API.put(`/export/pptx/template/${projectId}`, form);
        setTemplate(response.data.filename);
      } else {
        await API.delete(`/export/pptx/template/${projectId}`);
        setTemplate(null);
      }
      setTemplateVersion((version) => version + 1);
    } catch (e) {
      setTemplateError(e?.response?.data?.detail || e.message);
    } finally {
      setTemplateLoading(false);
    }
  };

  const scoped = useMemo(() => {
    const a = apps.filter((x) => domains.has(x.domain));
    const ids = new Set(a.map((x) => x.id));
    return { apps: a, flows: flows.filter((f) => ids.has(f.from) && ids.has(f.to)) };
  }, [apps, flows, domains]);

  const priorityScores = useMemo(() => Object.fromEntries(
    buildPriorityItems(apps, flows).map(({ app, score }) => [app.id, score])
  ), [apps, flows]);
  const opts = useMemo(() => ({
    sections: allIds.filter((id) => selected.has(id)),
    clientPrimary: primary,
    clientName,
    hubLimit,
    inclDomainStatus: isDeal,
    projectType,
    contextApps: apps,
    contextFlows: flows,
    priorityScores,
  }), [allIds, selected, primary, clientName, hubLimit, isDeal, projectType, apps, flows, priorityScores]);

  const reqRef = useRef(0);
  useEffect(() => {
    if (templateLoading || !templateReady) return undefined;
    const request = reqRef;
    const id = ++request.current;
    setLoading(true);
    const t = setTimeout(() => {
      API.post('/export/pptx/plan', { apps: scoped.apps, flows: scoped.flows, opts, project_id: Number(projectId) })
        .then((r) => { if (id === request.current) { setPlan(r.data); setPlanErr(null); } })
        .catch((e) => { if (id === request.current) setPlanErr(e?.response?.data?.detail || e.message); })
        .finally(() => { if (id === request.current) setLoading(false); });
    }, 500);
    return () => { clearTimeout(t); if (request.current === id) request.current++; };
  }, [scoped, opts, projectId, templateLoading, templateReady, templateVersion]);

  const toggle = (ids, on) => setSelected((p) => { const n = new Set(p); ids.forEach((i) => (on ? n.add(i) : n.delete(i))); return n; });
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
      await onExport({ apps: scoped.apps, flows: scoped.flows, opts: { ...opts, clientLogo: logo }, project_id: Number(projectId) }, { primary, clientName, hubLimit, logo });
      onClose();
    } catch (err) {
      let detail = err?.response?.data?.detail;
      if (err?.response?.data instanceof Blob) {
        try { detail = JSON.parse(await err.response.data.text()).detail; } catch { detail = err.message; }
      }
      alert('Erreur export PPTX :\n' + (detail || err?.message || String(err)));
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

        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', overflowY: 'auto', minHeight: 0 }}>
          {/* Colonne gauche : contenu */}
          <div style={{ padding: '16px 22px', flex: '1 1 420px', minWidth: 0, borderRight: '1px solid ' + T.border }}>
            <div style={lbl}>1. Modèle PowerPoint du projet</div>
            <div style={{ fontSize: 11, color: T.fg, marginBottom: 8 }}>
              {templateLoading ? 'Chargement du modèle…' : !templateReady ? 'Chargement du modèle impossible' : template ? `Modèle utilisé : ${template}` : 'Modèle par défaut'}
            </div>
            {!readOnly && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ ...chip(false), display: 'inline-block' }}>
                {template ? 'Remplacer le modèle' : 'Joindre un modèle PPTX'}
                <input type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" disabled={templateLoading || busy || !templateReady} style={{ display: 'block', marginTop: 4, maxWidth: '100%', fontSize: 10, color: T.fg }} onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) updateTemplate(file); }} />
              </label>
              {template && <button type="button" disabled={templateLoading || busy} style={{ ...chip(false), background: 'transparent' }} onClick={() => { if (window.confirm('Supprimer le modèle du projet et revenir au modèle par défaut ?')) updateTemplate(null); }}>Utiliser le modèle par défaut</button>}
            </div>}
            <div style={{ fontSize: 10, color: T.fgMuted, marginBottom: 8 }}>PPTX jusqu’à 25 Mo, partagé avec les membres du projet. Les diapositives du fichier servent de modèle et ne sont pas conservées.</div>
            {templateError && <div role="alert" style={{ color: '#EF4444', fontSize: 11, marginBottom: 8 }}>Modèle : {String(templateError)}</div>}
            <div style={{ fontSize: 10, color: T.fgMuted, marginBottom: 8 }}>
              {isDeal ? 'Projet Deal : trajectoire Day 1 / Day 2, criticité et dépendances.' : 'Projet hors Deal : statut, hébergement, criticité et dépendances.'}
            </div>
            {CATALOG.map((group) => (
              <div key={group.group} style={{ marginTop: 12 }}>
                <div style={lbl}>{group.group}</div>
                {group.items.filter((item) => available(group, item)).map((item) => (
                  <div key={item.id} style={{ padding: '6px 8px', borderRadius: 6, background: selected.has(item.id) ? '#2979FF0D' : 'transparent' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: T.fg }}>
                      <input type="checkbox" checked={selected.has(item.id)} onChange={(e) => toggle([item.id], e.target.checked)} style={{ accentColor: '#2979FF' }} />
                      <span style={{ flex: 1 }}>{item.label}<span style={{ display: 'block', fontSize: 10, color: T.fgMuted }}>{item.hint}</span></span>
                      {selected.has(item.id) && planBySection[item.id] > 0 && <span style={{ fontSize: 10, color: '#2979FF' }}>{planBySection[item.id]} diap.</span>}
                    </label>
                  </div>
                ))}
              </div>
            ))}
            <details style={{ marginTop: 16 }}>
              <summary style={{ color: T.fg, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Périmètre et identité</summary>
            <div style={{ ...lbl, marginTop: 18 }}>Domaines inclus</div>
            <div style={{ fontSize: 10, color: T.fgMuted, marginBottom: 6 }}>Les vues par domaine incluent les applications externes liées. Les annexes couvrent les flux dont les deux applications sont dans le périmètre.</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {doms.map((d) => <button type="button" key={d} style={chip(domains.has(d))} aria-pressed={domains.has(d)} onClick={() => toggleDomain(d)}>{d}</button>)}
            </div>

            <div style={{ ...lbl, marginTop: 18 }}>Identité</div>
            <input placeholder="Nom du client (page de garde)" value={clientName} onChange={(e) => setClientName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', borderRadius: 6, border: '1px solid ' + T.border, background: T.bg, color: T.fg, fontSize: 12, marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {COLORS.map((c) => <div key={c} onClick={() => setPrimary(c)} style={{ width: 22, height: 22, borderRadius: 5, background: '#' + c, cursor: 'pointer', boxShadow: primary === c ? '0 0 0 2px #' + c + ', 0 0 0 4px ' + T.bgCard : 'none' }} />)}
              <input type="color" value={'#' + primary} onChange={(e) => setPrimary(e.target.value.replace('#', ''))} style={{ width: 30, height: 24, border: 'none', background: 'none' }} />
              <input type="file" accept="image/png,image/jpeg" style={{ fontSize: 10, color: T.fg }} onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => setLogo(ev.target.result); r.readAsDataURL(f); }} />
              {logo && <><img src={logo} alt="logo" style={{ height: 24, maxWidth: 70, objectFit: 'contain' }} /><span style={{ cursor: 'pointer', color: T.fgMuted }} onClick={() => setLogo(null)}>✕</span></>}
            </div>
            </details>
          </div>

          {/* Colonne droite : aperçu du plan */}
          <div style={{ padding: '16px 22px', flex: '1 1 280px', minWidth: 0, background: T.bgAlt }}>
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
                  <span style={{ fontSize: 11, color: T.fg }}>
                    {s.title}
                    {s.warnings?.length > 0 && <span style={{ display: 'block', fontSize: 10, color: '#D97706' }}>Attention : {s.warnings.join(' · ')}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 22px', borderTop: '1px solid ' + T.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: T.fgMuted }}>Objets natifs PowerPoint, modifiables après export.</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ ...btn, background: T.border, padding: '9px 20px', fontSize: 12 }}>Annuler</button>
            <button disabled={busy || loading || templateLoading || !templateReady || !!planErr || count === 0} onClick={generate} style={{ ...btn, background: '#EF6C00', padding: '9px 28px', fontWeight: 800, fontSize: 13, opacity: busy || loading || templateLoading || !templateReady || planErr || count === 0 ? 0.5 : 1 }}>{busy ? 'Génération…' : '⬇ Générer le PPTX'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
