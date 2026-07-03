import { useEffect, useState, useRef, useLayoutEffect, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLatestSnapshot, saveSnapshot, getProjects } from '../api/client';
import { useAuth } from '../api/AuthContext';
import { LogoMark } from '../components/Logo';
import ProfileModal from '../components/ProfileModal';

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

  const [project,         setProject]         = useState(null);
  const [saving,          setSaving]          = useState(false);
  const [lastSaved,       setLastSaved]       = useState(null);
  const [presence,        setPresence]        = useState([]);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [wsMessage,       setWsMessage]       = useState(null);
  // Suit le thème du canvas pour adapter la barre de contexte
  const [canvasDark,      setCanvasDark]      = useState(true);
  const [showProfile,     setShowProfile]     = useState(false);
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
      const res  = await getProjects();
      const proj = res.data.find((p) => p.id === parseInt(projectId));
      setProject(proj);
      try {
        const snap = await getLatestSnapshot(projectId);
        setInitialSnapshot(snap.data);
      } catch { /* canvas vierge */ }
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
    return () => ws.close();
  }, [projectId]);

  const handleCanvasSave = useCallback((state) => { canvasStateRef.current = state; }, []);

  const handleSave = useCallback(async () => {
    const state = canvasStateRef.current;
    if (!state) return;
    setSaving(true);
    try {
      await saveSnapshot(projectId, {
        apps:       state.apps      || [],
        flows:      state.flows     || [],
        dom_colors: state.domColors || {},
        label:      'Auto-save',
      });
      setLastSaved(new Date());
    } finally {
      setSaving(false);
    }
  }, [projectId]);

  useEffect(() => {
    const timer = setInterval(handleSave, 30000);
    return () => clearInterval(timer);
  }, [handleSave]);

  const others = presence.filter((p) => p.user_id !== user?.id);

  // Styles adaptatifs selon le thème du canvas
  const ctxBg    = canvasDark ? 'rgba(13,13,26,0.92)'   : 'rgba(255,255,255,0.92)';
  const ctxBd    = canvasDark ? '#22224A'                : '#E0E7FF';
  const ctxText  = canvasDark ? '#C8C8F0'                : '#1E1B4B';
  const ctxMuted = canvasDark ? '#6060A0'                : '#64748B';
  const btnStyle = canvasDark
    ? { background:'#1A1A35', color:'#C8C8F0', border:'1px solid #2A2A50' }
    : { background:'#fff',    color:'#3D3A6E', border:'1px solid #E0E7FF' };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh' }}>

      {/* ── Context bar — s'adapte au thème sombre/clair du canvas ── */}
      <div ref={ctxBarRef} style={{
        display:'flex', alignItems:'center', gap:10, padding:'7px 14px', flexShrink:0,
        background: ctxBg,
        backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
        borderBottom:`1px solid ${ctxBd}`,
        zIndex:10,
      }}>
        <button onClick={() => navigate('/')} style={{ ...btnStyle, display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          <span>Projets</span>
        </button>

        <span style={{ color: ctxMuted, fontSize:16, fontWeight:300 }}>/</span>

        <span style={{ fontSize:13, fontWeight:600, color: ctxText, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }} title={project?.nom}>
          {project?.nom || '—'}
        </span>

        {project?.visibility === 'team' && (
          <span style={{ background:'rgba(99,102,241,0.15)', color:'#818CF8', border:'1px solid rgba(99,102,241,0.2)', borderRadius:999, padding:'2px 8px', fontSize:9, fontWeight:700, letterSpacing:'0.06em' }}>Équipe</span>
        )}

        <button onClick={() => navigate(`/projects/${projectId}/admin`)} style={{ ...btnStyle, padding:'4px 10px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} title="Gérer les membres">
          ⚙️ Membres
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
          {saving ? (
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:ctxMuted }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block' }} /> Sauvegarde…
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
          )}
          <button onClick={handleSave} disabled={saving} style={{ background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', border:'none', padding:'6px 14px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit', opacity: saving ? 0.5 : 1 }}>
            {saving ? <span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'_spin 0.6s linear infinite' }} /> : '💾'} Sauvegarder
          </button>
          <div onClick={() => setShowProfile(true)} title="Modifier mon profil"
            style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:6, padding:'2px 6px', borderRadius:6, border:`1px solid ${ctxBd}`, transition:'background 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.background = canvasDark ? '#1A1A35' : '#F1F5F9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" style={{ width:24, height:24, borderRadius:'50%', objectFit:'cover', border:`1.5px solid ${ctxBd}` }} />
              : <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{initials(user?.nom)}</div>
            }
            <span style={{ fontSize:12, fontWeight:500, color:ctxText, maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.prenom ? `${user.prenom} ${user.nom}` : user?.nom}
            </span>
          </div>
        </div>
      </div>
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      {/* ── Canvas ── */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
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
          />
        </Suspense>
      </div>
    </div>
  );
}
