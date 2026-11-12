import { useEffect, useState, useRef, useLayoutEffect, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, Settings } from 'lucide-react';
import { getLatestSnapshot, saveSnapshot, getProjects } from '../api/client';
import { useAuth } from '../api/AuthContext';
import UserBubble from '../components/UserBubble';
import ProfileModal from '../components/ProfileModal';
import ThemeToggle from '../components/ThemeToggle';
import LangToggle from '../components/LangToggle';

const CanvasApp = lazy(() => import('../canvas/CanvasApp'));

function initials(nom) {
  if (!nom) return '?';
  return nom.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Canvas() {
  const { projectId } = useParams();
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const wsRef         = useRef(null);
  const canvasStateRef = useRef(null);
  const lastCanvasStateRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const savingRef = useRef(false);
  const canvasInitializedRef = useRef(false);

  const [project,         setProject]         = useState(null);
  const [saving,          setSaving]          = useState(false);
  const [unsavedChanges,  setUnsavedChanges]  = useState(false);
  const [saveFailed,      setSaveFailed]      = useState(false);
  const [viewsSlot,       setViewsSlot]       = useState(null);
  const [lastSaved,       setLastSaved]       = useState(null);
  const [presence,        setPresence]        = useState([]);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [snapshotLoaded,  setSnapshotLoaded]  = useState(false);
  const [wsMessage,       setWsMessage]       = useState(null);
  // Suit le thème du canvas pour adapter la barre de contexte
  const [canvasDark,      setCanvasDark]      = useState(true);
  const [showProfile,     setShowProfile]     = useState(false);
  const [rightsChanged,   setRightsChanged]   = useState(false);
  const [loadError,       setLoadError]       = useState('');
  const [topOffset,       setTopOffset]       = useState(0);
  const ctxBarRef = useRef(null);

  useLayoutEffect(() => {
    if (ctxBarRef.current) {
      setTopOffset(ctxBarRef.current.getBoundingClientRect().height);
    }
  }, []);

  /* Charger projet + snapshot */
  useEffect(() => {
    const load = async () => {
      canvasInitializedRef.current = false;
      lastCanvasStateRef.current = null;
      canvasStateRef.current = null;
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      setLastSaved(null);
      setUnsavedChanges(false);
      setSaveFailed(false);
      setSnapshotLoaded(false);
      setInitialSnapshot(null);
      setProject(null);
      setLoadError('');
      try {
        const res = await getProjects();
        const proj = res.data.find((p) => p.id === parseInt(projectId));
        if (!proj) throw new Error('Projet introuvable ou accès refusé.');
        setProject(proj);
        const snap = await getLatestSnapshot(projectId);
        setInitialSnapshot(snap.data);
      } catch (err) {
        if (err.response?.status !== 404) {
          setLoadError(err.response?.data?.detail || err.message || 'Erreur lors du chargement du projet.');
        }
      }
      finally { setSnapshotLoaded(true); }
    };
    load();
  }, [projectId]);

  /* WebSocket */
  useEffect(() => {
    const token = localStorage.getItem('token');
    // Base WS : VITE_WS_URL si défini, sinon dérivée de l'origine courante
    // (wss:// automatique en HTTPS). Le reverse proxy relaie /ws vers le backend.
    const wsBase = import.meta.env.VITE_WS_URL
      || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
    const ws    = new WebSocket(`${wsBase}/ws/${projectId}?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (['presence_init','user_joined','user_left'].includes(msg.type)) setPresence(msg.presence || []);
      if (['apps_update','flows_update','dom_colors_update'].includes(msg.type)) setWsMessage(msg);
    };
    ws.onerror = () => {};
    ws.onclose = (event) => {
      if (event.code === 4003) {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
        setRightsChanged(true);
      }
    };
    return () => ws.close();
  }, [projectId]);

  const handleSave = useCallback(async (label = 'Sauvegarde manuelle') => {
    if (!project || project.effective_role === 'viewer' || rightsChanged) return;
    const state = canvasStateRef.current;
    if (!state || savingRef.current) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    savingRef.current = true;
    setSaving(true);
    setSaveFailed(false);
    try {
      await saveSnapshot(projectId, {
        apps:       state.apps      || [],
        flows:      state.flows     || [],
        dom_colors: state.domColors || {},
        label,
      });
      setLastSaved(new Date());
      if (JSON.stringify(canvasStateRef.current) === JSON.stringify(state)) {
        setUnsavedChanges(false);
      }
    } catch {
      setSaveFailed(true);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [projectId, project, rightsChanged]);

  const handleCanvasSave = useCallback((state) => {
    canvasStateRef.current = state;
    if (!project || project.effective_role === 'viewer' || rightsChanged) return;
    const signature = JSON.stringify(state);
    if (!canvasInitializedRef.current) {
      canvasInitializedRef.current = true;
      lastCanvasStateRef.current = signature;
      return;
    }
    if (signature === lastCanvasStateRef.current) return;
    lastCanvasStateRef.current = signature;
    setUnsavedChanges(true);
    setSaveFailed(false);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    const runAutoSave = () => {
      if (savingRef.current) {
        autoSaveTimerRef.current = setTimeout(runAutoSave, 250);
        return;
      }
      autoSaveTimerRef.current = null;
      void handleSave('Sauvegarde automatique');
    };
    autoSaveTimerRef.current = setTimeout(runAutoSave, 2000);
  }, [handleSave, project, rightsChanged]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [projectId]);

  const others = presence.filter((p) => p.user_id !== user?.id);

  // Styles adaptatifs selon le thème du canvas
  const ctxBg    = canvasDark ? 'rgba(13,13,26,0.92)'   : 'rgba(255,255,255,0.92)';
  const ctxBd    = canvasDark ? '#22224A'                : '#E0E7FF';
  const ctxText  = canvasDark ? '#C8C8F0'                : '#1E1B4B';
  const ctxMuted = canvasDark ? '#6060A0'                : '#64748B';
  const btnStyle = canvasDark
    ? { background:'#1A1A35', color:'#C8C8F0', border:'1px solid #2A2A50' }
    : { background:'#fff',    color:'#3D3A6E', border:'1px solid #E0E7FF' };

  if (loadError) return <div role="alert" style={{ padding: 24 }}>
    <p>{loadError}</p>
    <button className="btn btn-s" onClick={() => navigate('/')}>Retour aux projets</button>
  </div>;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh' }}>
      {rightsChanged && <div role="alert" style={{ padding: 10, background: '#7f1d1d', color: '#fff', textAlign: 'center' }}>
        Vos droits ont changé. Rechargez la page pour actualiser votre accès.
        <button onClick={() => window.location.reload()} style={{ marginLeft: 12 }}>Recharger</button>
      </div>}

      {/* ── Context bar — s'adapte au thème sombre/clair du canvas ── */}
      <div ref={ctxBarRef} style={{
        display:'flex', alignItems:'center', gap:10, padding:'7px 14px', flexShrink:0,
        background: ctxBg,
        backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
        borderBottom:`1px solid ${ctxBd}`,
        position:'relative', zIndex:500,
      }}>
        <button
          onClick={() => navigate('/')}
          aria-label="Accueil"
          title="Accueil"
          onMouseEnter={e => { e.currentTarget.style.background = canvasDark ? '#29294A' : '#EEF2FF'; e.currentTarget.style.color = canvasDark ? '#C4B5FD' : '#4F46E5'; }}
          onMouseLeave={e => { e.currentTarget.style.background = btnStyle.background; e.currentTarget.style.color = btnStyle.color; }}
          style={{ ...btnStyle, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', padding:0, borderRadius:8, cursor:'pointer', transition:'background 150ms ease, color 150ms ease, transform 150ms ease' }}
        >
          <Home size={18} strokeWidth={2} />
        </button>

        <span aria-hidden="true" style={{ color: ctxMuted, fontSize:16, fontWeight:300 }}>/</span>

        <span style={{ fontSize:13, fontWeight:600, color: ctxText, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }} title={project?.nom}>
          {project?.nom || '—'}
        </span>

        <span aria-hidden="true" style={{ color: ctxMuted, fontSize:16, fontWeight:300 }}>/</span>

        {project?.visibility === 'team' && (
          <span style={{ background:'rgba(99,102,241,0.15)', color:'#818CF8', border:'1px solid rgba(99,102,241,0.2)', borderRadius:999, padding:'2px 8px', fontSize:9, fontWeight:700, letterSpacing:'0.06em' }}>Équipe</span>
        )}

        <button onClick={() => navigate(`/projects/${projectId}/admin`)} aria-label="Paramètres du projet" style={{ ...btnStyle, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', padding:0, borderRadius:6, cursor:'pointer', fontFamily:'inherit' }} title="Paramètres du projet">
          <Settings size={16} />
        </button>

        {others.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', marginLeft:4 }}>
            {others.slice(0, 5).map((p) => (
              <div key={p.user_id} title={p.nom} style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', border:`2px solid ${ctxBg}`, marginLeft:-6 }}>
                {initials(p.nom)}
              </div>
            ))}
            {others.length > 5 && <span style={{ fontSize:11, color:ctxMuted, marginLeft:8 }}>+{others.length - 5}</span>}
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:'auto' }}>
          {project?.effective_role === 'viewer' ? <span style={{ color: ctxMuted, fontSize: 12 }}>Lecture seule</span> : <button onClick={() => handleSave()} disabled={saving || rightsChanged || !project} style={{ background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', border:'none', padding:'6px 14px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit', opacity: saving ? 0.5 : 1 }}>
            {saving ? <span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'_spin 0.6s linear infinite' }} /> : '💾'} Sauvegarder
          </button>}
          {project?.effective_role !== 'viewer' && (saving ? (
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:ctxMuted }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block' }} /> Sauvegarde…
            </span>
          ) : saveFailed ? (
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#EF4444' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block' }} /> Échec de la sauvegarde
            </span>
          ) : unsavedChanges ? (
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:ctxMuted }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block' }} /> Modifications en attente
            </span>
          ) : lastSaved ? (
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color: canvasDark ? '#4CAF50' : '#059669' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block' }} />
              Sauvegardé {lastSaved.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}
            </span>
          ) : (
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:ctxMuted }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block' }} /> Non sauvegardé
            </span>
          ))}
          <div ref={setViewsSlot} style={{ display:'flex' }} />
          <LangToggle />
          <ThemeToggle />
          <UserBubble onClick={() => setShowProfile(true)} />
        </div>
      </div>
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      {/* ── Canvas ── */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {!snapshotLoaded && (
          <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#08080F', gap:16 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🗺️</div>
            <div style={{ color:'#9090B8', fontSize:13 }}>Chargement de la cartographie…</div>
          </div>
        )}
        {snapshotLoaded && (
        <Suspense fallback={
          <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#08080F', gap:16 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🗺️</div>
            <div style={{ color:'#9090B8', fontSize:13 }}>Chargement de la cartographie…</div>
            <div style={{ width:160, height:3, background:'#1A1A30', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', background:'linear-gradient(90deg,#6366F1,#8B5CF6)', borderRadius:4 }} />
            </div>
          </div>
        }>
          <CanvasApp
            initialSnapshot={initialSnapshot}
            onSave={handleCanvasSave}
            wsMessage={wsMessage}
            projectId={projectId}
            onThemeChange={setCanvasDark}
            topOffset={topOffset}
            isAdmin={user?.role === 'admin'}
            readOnly={project?.effective_role === 'viewer' || rightsChanged}
            projectType={project?.project_type || 'deal'}
            viewsSlot={viewsSlot}
          />
        </Suspense>
        )}
      </div>
    </div>
  );
}
