import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject, deleteProject, updateProject } from '../api/client';
import { useAuth } from '../api/AuthContext';
import BrandLockup from '../components/BrandLockup';
import ProfileModal from '../components/ProfileModal';
import ThemePicker from '../components/ThemePicker';
import ThemeToggle from '../components/ThemeToggle';
import LangToggle from '../components/LangToggle';
import ProjectAppearancePicker, { getIconComponent } from '../components/ProjectAppearancePicker';
import {
  Users, Trash2, FolderOpen, Share2, Handshake, Map as MapIcon, Search, X, ArrowUpDown,
  LayoutGrid, List, Star, Palette, Plus, ArrowRight, Lock, Clock, Sparkles, Shield,
} from 'lucide-react';
import './Projects.css';

function initials(nom) {
  if (!nom) return '?';
  return nom.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function timeAgo(date) {
  const min = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (min < 1)  return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1)  return 'hier';
  if (d < 7)    return `il y a ${d} j`;
  if (d < 30)   return `il y a ${Math.floor(d / 7)} sem.`;
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function greeting() {
  const h = new Date().getHours();
  return h < 6 || h >= 18 ? 'Bonsoir' : 'Bonjour';
}
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

const TYPE_META = {
  deal:         { label: 'Projet Deal IT/TECH', Icon: Handshake, tone: 'amber' },
  cartographie: { label: 'Projet IT/SI',        Icon: MapIcon,   tone: 'cyan'  },
};

const DEFAULT_FORM = { nom: '', description: '', visibility: 'private', color: '#6366F1', icon: 'Network', logo: null, project_type: 'deal', project_subtype: '' };

const STAT_DEFAULTS = [
  { gradient: 'linear-gradient(135deg,#6366F1,#818CF8)', glow: 'rgba(99,102,241,0.25)' },
  { gradient: 'linear-gradient(135deg,#D97706,#FCD34D)', glow: 'rgba(217,119,6,0.25)'  },
  { gradient: 'linear-gradient(135deg,#0891B2,#22D3EE)', glow: 'rgba(8,145,178,0.25)'  },
  { gradient: 'linear-gradient(135deg,#059669,#34D399)', glow: 'rgba(5,150,105,0.25)'  },
];
const STAT_STORAGE_KEY = 'carto_statbar_colors_v2';

const SORT_OPTIONS = [
  { id: 'updated_desc', label: 'Modifié récemment' },
  { id: 'updated_asc',  label: 'Modifié ancien'    },
  { id: 'created_desc', label: 'Créé récemment'    },
  { id: 'created_asc',  label: 'Créé ancien'       },
  { id: 'name_asc',     label: 'Nom A → Z'         },
  { id: 'name_desc',    label: 'Nom Z → A'         },
];

export default function Projects() {
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm]               = useState(DEFAULT_FORM);
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');
  const [editProject, setEditProject] = useState(null);
  const [search,      setSearch]      = useState('');
  const [filterVis,   setFilterVis]   = useState('');   // '' | 'private' | 'team'
  const [filterType,  setFilterType]  = useState('');   // '' | 'deal' | 'cartographie'
  const [sortBy,      setSortBy]      = useState('updated_desc');
  const [view,        setView]        = useState(() => localStorage.getItem('carto_projects_view') || 'grid');
  const [pins,        setPins]        = useState(() => loadJSON('carto_pinned_projects', []));
  const [showProfile, setShowProfile] = useState(false);
  const [statColors,  setStatColors]  = useState(() => loadJSON(STAT_STORAGE_KEY, STAT_DEFAULTS));
  const [statBarMenu, setStatBarMenu] = useState(null); // { x, y }
  const statBarMenuRef = useRef(null);
  const searchRef      = useRef(null);
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await getProjects(); setProjects(res.data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setShowCreate(false); setEditProject(null); setStatBarMenu(null); }
      const tag = e.target?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
        if (e.key === 'n') { e.preventDefault(); setShowCreate(true); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!statBarMenu) return;
    const handler = (e) => {
      if (statBarMenuRef.current && !statBarMenuRef.current.contains(e.target)) setStatBarMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statBarMenu]);

  const changeView = (v) => { setView(v); localStorage.setItem('carto_projects_view', v); };
  const togglePin = (id) => setPins(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    localStorage.setItem('carto_pinned_projects', JSON.stringify(next));
    return next;
  });

  const applyStatColor = (idx, hex) => {
    const next = statColors.map((c, i) => i === idx
      ? { gradient: `linear-gradient(135deg,${hex},${hex}CC)`, glow: `${hex}40` }
      : c
    );
    setStatColors(next);
    localStorage.setItem(STAT_STORAGE_KEY, JSON.stringify(next));
  };
  const resetStatColors = () => {
    setStatColors(STAT_DEFAULTS);
    localStorage.removeItem(STAT_STORAGE_KEY);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true); setCreateError('');
    try {
      await createProject(form);
      setShowCreate(false);
      setForm(DEFAULT_FORM);
      load();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Erreur lors de la création';
      setCreateError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally { setCreating(false); }
  };

  const handleDelete = async (id, nom) => {
    if (!confirm(`Supprimer "${nom}" ? Cette action est irréversible.`)) return;
    await deleteProject(id);
    setPins(prev => prev.filter(x => x !== id));
    load();
  };

  const handleAppearanceSave = async () => {
    if (!editProject) return;
    await updateProject(editProject.id, { color: editProject.color, icon: editProject.icon, logo: editProject.logo ?? null });
    setEditProject(null);
    load();
  };

  const counts = useMemo(() => ({
    total: projects.length,
    deal:  projects.filter(p => p.project_type !== 'cartographie').length,
    carto: projects.filter(p => p.project_type === 'cartographie').length,
    team:  projects.filter(p => p.visibility === 'team').length,
  }), [projects]);

  const lastProject = useMemo(
    () => [...projects].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0],
    [projects],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects
      .filter(p => !q || p.nom.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
      .filter(p => !filterVis  || p.visibility === filterVis)
      .filter(p => !filterType || (filterType === 'deal' ? p.project_type !== 'cartographie' : p.project_type === 'cartographie'))
      .sort((a, b) => {
        switch (sortBy) {
          case 'name_asc':     return a.nom.localeCompare(b.nom);
          case 'name_desc':    return b.nom.localeCompare(a.nom);
          case 'created_asc':  return new Date(a.created_at) - new Date(b.created_at);
          case 'created_desc': return new Date(b.created_at) - new Date(a.created_at);
          case 'updated_asc':  return new Date(a.updated_at) - new Date(b.updated_at);
          default:             return new Date(b.updated_at) - new Date(a.updated_at);
        }
      });
  }, [projects, search, filterVis, filterType, sortBy]);

  const pinned = filtered.filter(p => pins.includes(p.id));
  const others = filtered.filter(p => !pins.includes(p.id));

  const hasFilters = search || filterVis || filterType || sortBy !== 'updated_desc';
  const resetFilters = () => { setSearch(''); setFilterVis(''); setFilterType(''); setSortBy('updated_desc'); };

  const roleLabel = user?.role === 'admin' ? 'Admin' : user?.role === 'member' ? 'Membre' : 'Lecteur';
  const displayName = user?.prenom || user?.nom || '';

  const renderProjects = (list) => {
    const cardProps = (p) => {
      const canDelete = user?.role === 'admin' || p.owner_id === user?.id;
      return {
        project: p,
        pinned: pins.includes(p.id),
        canDelete,
        canEditAppearance: canDelete,
        onOpen: () => navigate(`/canvas/${p.id}`),
        onAdmin: () => navigate(`/projects/${p.id}/admin`),
        onDelete: () => handleDelete(p.id, p.nom),
        onPin: () => togglePin(p.id),
        onEditAppearance: () => setEditProject({ ...p }),
      };
    };
    return view === 'grid'
      ? <div className="pj-grid">{list.map(p => <ProjectCard key={p.id} {...cardProps(p)} />)}</div>
      : <div className="pj-list">{list.map(p => <ProjectRow key={p.id} {...cardProps(p)} />)}</div>;
  };

  return (
    <div className="page va pj-page">

      {/* ── Header ── */}
      <header className="header">
        <BrandLockup size={30} tone="dark" />

        <div className="row g3">
          <LangToggle />
          <ThemeToggle />
          <ThemePicker />
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin/users')} className="btn btn-s btn-sm pj-btn-ic">
              <Shield size={14} /> Utilisateurs
            </button>
          )}
          <div className="row g2 pj-profile" onClick={() => setShowProfile(true)} title="Modifier mon profil">
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" className="pj-avatar-img" style={{ width: 30, height: 30 }} />
              : <div className="av av-sm">{initials(user?.nom)}</div>
            }
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="f13 t2 w5">{user?.prenom ? `${user.prenom} ${user.nom}` : user?.nom}</span>
              <span className="pj-role" data-role={user?.role}>{roleLabel}</span>
            </div>
          </div>
          <button onClick={logout} className="btn btn-s btn-sm">Déconnexion</button>
        </div>
      </header>

      <div className="pj-container">

        {/* ── Hero ── */}
        <section className="pj-hero">
          <div className="pj-hero-main">
            <p className="pj-eyebrow"><Sparkles size={13} /> Espace de travail</p>
            <h1 className="pj-title">{`${greeting()}${displayName ? `, ${displayName}` : ''} 👋`}</h1>
            <p className="pj-sub">
              {loading ? 'Chargement de vos projets…'
                : projects.length === 0 ? 'Créez votre premier projet pour démarrer une cartographie.'
                : `${projects.length} projet${projects.length > 1 ? 's' : ''} dans votre espace${counts.team ? ` · ${counts.team} partagé${counts.team > 1 ? 's' : ''} avec l'équipe` : ''}.`}
            </p>
            <div className="row g2" style={{ marginTop: 18, flexWrap: 'wrap' }}>
              <button onClick={() => setShowCreate(true)} className="pj-hero-btn">
                <Plus size={16} /> Nouveau projet <kbd>N</kbd>
              </button>
              {lastProject && (
                <button onClick={() => navigate(`/canvas/${lastProject.id}`)} className="pj-hero-btn pj-hero-btn-ghost">
                  <Clock size={15} /> Reprendre : <strong className="trunc" style={{ maxWidth: 180 }}>{lastProject.nom}</strong>
                </button>
              )}
            </div>
          </div>
          <div className="pj-hero-deco" aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>
        </section>

        {/* ── Stats cliquables ── */}
        {!loading && projects.length > 0 && (
          <div
            className="pj-stats"
            onContextMenu={e => { e.preventDefault(); setStatBarMenu({ x: e.clientX, y: e.clientY }); }}
            title="Clic pour filtrer · Clic droit pour personnaliser les couleurs"
          >
            <StatTile idx={0} colors={statColors} icon={<FolderOpen size={19} strokeWidth={1.8} />} value={counts.total} label="Tous les projets"
              active={!filterType && !filterVis} onClick={() => { setFilterType(''); setFilterVis(''); }} />
            <StatTile idx={1} colors={statColors} icon={<Handshake size={19} strokeWidth={1.8} />} value={counts.deal} label="Projet Deal IT/TECH"
              active={filterType === 'deal'} onClick={() => setFilterType(filterType === 'deal' ? '' : 'deal')} />
            <StatTile idx={2} colors={statColors} icon={<MapIcon size={19} strokeWidth={1.8} />} value={counts.carto} label="Projet IT/SI"
              active={filterType === 'cartographie'} onClick={() => setFilterType(filterType === 'cartographie' ? '' : 'cartographie')} />
            <StatTile idx={3} colors={statColors} icon={<Share2 size={19} strokeWidth={1.8} />} value={counts.team} label="Partagés en équipe"
              active={filterVis === 'team'} onClick={() => setFilterVis(filterVis === 'team' ? '' : 'team')} />
          </div>
        )}

        {statBarMenu && (
          <div ref={statBarMenuRef} className="pj-menu" style={{ left: statBarMenu.x, top: statBarMenu.y }}>
            <p className="pj-menu-title">Couleur des icônes</p>
            {['Tous les projets', 'Projet Deal IT/TECH', 'Projet IT/SI', 'Partagés en équipe'].map((label, idx) => {
              const match = statColors[idx]?.gradient.match(/#[0-9a-fA-F]{6}/);
              const hex   = match ? match[0] : '#6366F1';
              return (
                <div key={idx} className="row g2" style={{ marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: statColors[idx].gradient, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--t2)' }}>{label}</span>
                  <input type="color" value={hex} onChange={e => applyStatColor(idx, e.target.value)} className="pj-color-inp" />
                </div>
              );
            })}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8 }}>
              <button onClick={() => { resetStatColors(); setStatBarMenu(null); }} className="btn btn-s btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                Réinitialiser
              </button>
            </div>
          </div>
        )}

        {/* ── Toolbar ── */}
        {!loading && projects.length > 0 && (
          <div className="pj-toolbar">
            <div className="pj-search">
              <Search size={15} className="pj-search-ico" strokeWidth={1.9} />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') { setSearch(''); e.currentTarget.blur(); } }}
                placeholder="Rechercher un projet…"
                aria-label="Rechercher un projet"
              />
              {search
                ? <button onClick={() => setSearch('')} className="pj-search-clear" aria-label="Effacer"><X size={14} /></button>
                : <kbd>/</kbd>}
            </div>

            <div className="pj-seg" role="group" aria-label="Type de projet">
              {[
                { id: '',             label: 'Tous',     n: counts.total },
                { id: 'deal',         label: 'Deal IT/TECH', n: counts.deal  },
                { id: 'cartographie', label: 'IT/SI',        n: counts.carto },
              ].map(o => (
                <button key={o.id} onClick={() => setFilterType(o.id)} className={filterType === o.id ? 'on' : ''}>
                  {o.label}<span>{o.n}</span>
                </button>
              ))}
            </div>

            <div className="pj-seg" role="group" aria-label="Visibilité">
              <button onClick={() => setFilterVis('')} className={filterVis === '' ? 'on' : ''}>Tout</button>
              <button onClick={() => setFilterVis('private')} className={filterVis === 'private' ? 'on' : ''}><Lock size={12} /> Privé</button>
              <button onClick={() => setFilterVis('team')} className={filterVis === 'team' ? 'on' : ''}><Users size={12} /> Équipe</button>
            </div>

            <div className="pj-select">
              <ArrowUpDown size={13} strokeWidth={1.9} />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Trier">
                {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>

            <div className="pj-seg pj-seg-ic" role="group" aria-label="Affichage" style={{ marginLeft: 'auto' }}>
              <button onClick={() => changeView('grid')} className={view === 'grid' ? 'on' : ''} title="Vue cartes" aria-label="Vue cartes"><LayoutGrid size={15} /></button>
              <button onClick={() => changeView('list')} className={view === 'list' ? 'on' : ''} title="Vue liste" aria-label="Vue liste"><List size={15} /></button>
            </div>

            {hasFilters && (
              <button onClick={resetFilters} className="pj-reset"><X size={12} /> Réinitialiser</button>
            )}
          </div>
        )}

        {/* ── Contenu ── */}
        {loading ? <SkeletonGrid /> : projects.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : filtered.length === 0 ? (
          <div className="pj-noresult">
            <Search size={34} strokeWidth={1.2} />
            <p className="f15 w6 t2">Aucun projet ne correspond</p>
            <p className="f13 t3">Modifiez vos filtres ou <button onClick={resetFilters}>réinitialisez la recherche</button></p>
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <>
                <h2 className="pj-section"><Star size={14} fill="currentColor" /> Épinglés <span>{pinned.length}</span></h2>
                {renderProjects(pinned)}
              </>
            )}
            {others.length > 0 && (
              <>
                {pinned.length > 0 && <h2 className="pj-section" style={{ marginTop: 28 }}>Tous les projets <span>{others.length}</span></h2>}
                {renderProjects(others)}
              </>
            )}
            {view === 'grid' && !hasFilters && (
              <button className="pj-newtile" onClick={() => setShowCreate(true)}>
                <span><Plus size={20} /></span>
                Ajouter un nouveau projet
              </button>
            )}
          </>
        )}
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      {/* ── Modal apparence projet ── */}
      {editProject && (
        <div className="overlay" onClick={() => setEditProject(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Apparence du projet</h2>
              <button onClick={() => setEditProject(null)} className="btn btn-s btn-xs" style={{ fontSize:16, lineHeight:1 }}>✕</button>
            </div>

            <AppearancePreview color={editProject.color} logo={editProject.logo} icon={editProject.icon} nom={editProject.nom} />

            <ProjectAppearancePicker
              color={editProject.color}
              icon={editProject.icon}
              logo={editProject.logo}
              onChange={({ color, icon, logo }) => setEditProject(p => ({ ...p, color, icon, logo }))}
            />

            <div className="modal-row" style={{ marginTop: 20 }}>
              <button onClick={() => setEditProject(null)} className="btn btn-s" style={{ flex: 1 }}>Annuler</button>
              <button onClick={handleAppearanceSave} className="btn btn-p" style={{ flex: 2 }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal création ── */}
      {showCreate && (
        <div className="overlay" onClick={() => { setShowCreate(false); setCreateError(''); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Nouveau projet</h2>

            <form onSubmit={handleCreate}>
              <AppearancePreview color={form.color} logo={form.logo} icon={form.icon} nom={form.nom || 'Nom du projet'} />

              <label className="lbl">Type de projet</label>
              <div className="pj-types">
                {[
                  { value: 'deal',         desc: 'Carve-out, M&A, transition' },
                  { value: 'cartographie', desc: 'Rationalisation, modernisation' },
                ].map(t => {
                  const { Icon, label, tone } = TYPE_META[t.value];
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, project_type: t.value, project_subtype: '' }))}
                      className={`pj-type ${form.project_type === t.value ? 'on' : ''}`}
                    >
                      <span className={`pj-type-ico tone-${tone}`}><Icon size={18} /></span>
                      <strong>{label}</strong>
                      <small>{t.desc}</small>
                    </button>
                  );
                })}
              </div>

              {form.project_type === 'cartographie' && (
                <div className="fg">
                  <label className="lbl">Type de cartographie</label>
                  <select
                    value={form.project_subtype}
                    onChange={e => setForm(f => ({ ...f, project_subtype: e.target.value }))}
                    className="inp"
                  >
                    <option value="">— Sélectionner —</option>
                    <option value="Rationalisation & Optimisation du SI">Rationalisation &amp; Optimisation du SI</option>
                    <option value="Transformation & Modernisation du SI">Transformation &amp; Modernisation du SI</option>
                    <option value="Urbanisation du SI">Urbanisation du SI</option>
                    <option value="Audit & Diagnostic du SI">Audit &amp; Diagnostic du SI</option>
                    <option value="Consolidation applicative">Consolidation applicative</option>
                    <option value="Migration Cloud">Migration Cloud</option>
                  </select>
                </div>
              )}

              <div className="fg">
                <label className="lbl">Nom du projet *</label>
                <input className="inp" value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex : SI Groupe 2025" required autoFocus />
              </div>
              <div className="fg">
                <label className="lbl">Description</label>
                <textarea className="inp" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Contexte de la mission, périmètre couvert…" rows={2} />
              </div>
              <div className="fg">
                <label className="lbl">Visibilité</label>
                <select className="inp" value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                  <option value="private">🔒 Privé — accessible uniquement par vous</option>
                  <option value="team">👥 Équipe — partagé avec les membres invités</option>
                </select>
              </div>

              <hr className="divider" style={{ margin: '4px 0 12px' }} />

              <ProjectAppearancePicker
                color={form.color}
                icon={form.icon}
                logo={form.logo}
                onChange={({ color, icon, logo }) => setForm(f => ({ ...f, color, icon, logo }))}
              />

              {createError && (
                <div className="alert alert-e" style={{ marginTop: 12, marginBottom: 0 }}>⚠️ {createError}</div>
              )}

              <div className="modal-row" style={{ marginTop: 16 }}>
                <button type="button" onClick={() => { setShowCreate(false); setCreateError(''); }}
                  className="btn btn-s" style={{ flex: 1 }}>Annuler</button>
                <button type="submit" disabled={creating} className="btn btn-p" style={{ flex: 2 }}>
                  {creating ? <><span className="spin" /> Création…</> : 'Créer le projet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Appearance preview (modals) ──────────────────────────────────── */
function AppearancePreview({ color, logo, icon, nom }) {
  const Icon = getIconComponent(icon);
  return (
    <div className="pj-preview" style={{ background: `${color}12`, border: `1.5px solid ${color}40` }}>
      <div className="pj-tile" style={{ width: 36, height: 36, background: `${color}20`, border: `1px solid ${color}30` }}>
        {logo
          ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }} />
          : <Icon size={20} color={color} strokeWidth={1.6} />}
      </div>
      <span className="f14 w7 t1">{nom}</span>
    </div>
  );
}

/* ── Shared bits ──────────────────────────────────────────────────── */
function ProjectIcon({ project, size = 44 }) {
  const color = project.color || '#6366F1';
  const Icon  = getIconComponent(project.icon);
  return (
    <div className="pj-tile" style={{ width: size, height: size, background: `${color}1F`, border: `1px solid ${color}33` }}>
      {project.logo
        ? <img src={project.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 5 }} />
        : <Icon size={Math.round(size * 0.5)} color={color} strokeWidth={1.7} />}
    </div>
  );
}

function TypeChip({ type }) {
  const meta = TYPE_META[type] || TYPE_META.deal;
  return <span className={`pj-chip tone-${meta.tone}`}><meta.Icon size={11} /> {meta.label}</span>;
}

function VisibilityChip({ visibility }) {
  return visibility === 'team'
    ? <span className="pj-chip tone-accent"><Users size={11} /> Équipe</span>
    : <span className="pj-chip tone-muted"><Lock size={11} /> Privé</span>;
}

function OwnerAvatar({ owner }) {
  if (!owner?.nom) return null;
  return owner.avatar
    ? <img src={owner.avatar} alt={owner.nom} title={owner.nom} className="pj-avatar-img" style={{ width: 22, height: 22 }} />
    : <div className="av av-xs" title={owner.nom}>{initials(owner.nom)}</div>;
}

function Actions({ project, pinned, canDelete, canEditAppearance, onPin, onEditAppearance, onAdmin, onDelete }) {
  return (
    <div className="pj-actions" onClick={e => e.stopPropagation()}>
      <button onClick={onPin} className={`pj-act ${pinned ? 'is-pinned' : ''}`} title={pinned ? 'Retirer des épinglés' : 'Épingler'} aria-label="Épingler">
        <Star size={15} fill={pinned ? 'currentColor' : 'none'} />
      </button>
      {canEditAppearance && (
        <button onClick={onEditAppearance} className="pj-act" title="Couleur & icône" aria-label="Couleur et icône"><Palette size={15} /></button>
      )}
      <button onClick={onAdmin} className="pj-act" title="Membres" aria-label="Membres"><Users size={15} /></button>
      {canDelete && (
        <button onClick={onDelete} className="pj-act pj-act-danger" title={`Supprimer ${project.nom}`} aria-label="Supprimer"><Trash2 size={15} /></button>
      )}
    </div>
  );
}

const onEnter = (fn) => (e) => { if (e.key === 'Enter' && e.target === e.currentTarget) fn(); };

/* ── Project card ─────────────────────────────────────────────────── */
function ProjectCard(props) {
  const { project, pinned, onOpen } = props;
  const color = project.color || '#6366F1';
  return (
    <div
      className={`pj-card ${pinned ? 'pinned' : ''}`}
      style={{ '--pc': color }}
      onClick={onOpen}
      onKeyDown={onEnter(onOpen)}
      role="button"
      tabIndex={0}
    >
      <div className="pj-card-bar" />
      <div className="pj-card-top">
        <ProjectIcon project={project} />
        <Actions {...props} />
      </div>
      <div className="pj-card-body">
        <h3 className="pj-card-title" title={project.nom}>{project.nom}</h3>
        <div className="pj-chips">
          <TypeChip type={project.project_type} />
          <VisibilityChip visibility={project.visibility} />
        </div>
        {project.description
          ? <p className="pj-desc clamp2">{project.description}</p>
          : <p className="pj-desc pj-desc-empty">Aucune description</p>}
      </div>
      <div className="pj-card-foot">
        <span className="pj-owner">
          <OwnerAvatar owner={project.owner} />
          <span className="trunc">{project.owner?.nom}</span>
        </span>
        <span className="pj-meta"><Users size={12} /> {project.member_count}</span>
        <span className="pj-meta"><Clock size={12} /> {timeAgo(project.updated_at)}</span>
        <span className="pj-open"><ArrowRight size={15} /></span>
      </div>
    </div>
  );
}

/* ── Project row (vue liste) ──────────────────────────────────────── */
function ProjectRow(props) {
  const { project, pinned, onOpen } = props;
  const color = project.color || '#6366F1';
  return (
    <div
      className={`pj-row ${pinned ? 'pinned' : ''}`}
      style={{ '--pc': color }}
      onClick={onOpen}
      onKeyDown={onEnter(onOpen)}
      role="button"
      tabIndex={0}
    >
      <div className="pj-row-main">
        <ProjectIcon project={project} size={38} />
        <div style={{ minWidth: 0 }}>
          <h3 className="pj-card-title trunc">{project.nom}</h3>
          <p className="pj-desc pj-desc-row trunc">{project.description || 'Aucune description'}</p>
        </div>
      </div>
      <div className="pj-row-cell pj-hide-sm"><TypeChip type={project.project_type} /></div>
      <div className="pj-row-cell pj-hide-sm"><VisibilityChip visibility={project.visibility} /></div>
      <div className="pj-row-cell pj-meta pj-hide-md"><Users size={12} /> {project.member_count}</div>
      <div className="pj-row-cell pj-meta pj-hide-md"><OwnerAvatar owner={project.owner} /> {timeAgo(project.updated_at)}</div>
      <Actions {...props} />
    </div>
  );
}

/* ── Stat tile ────────────────────────────────────────────────────── */
function StatTile({ idx, colors, icon, value, label, active, onClick }) {
  const c = colors[idx] || STAT_DEFAULTS[idx];
  return (
    <button className={`pj-stat ${active ? 'on' : ''}`} onClick={onClick}>
      <span className="pj-stat-ico" style={{ background: c.gradient, boxShadow: `0 4px 12px ${c.glow}` }}>{icon}</span>
      <span>
        <span className="pj-stat-val">{value}</span>
        <span className="pj-stat-lbl">{label}</span>
      </span>
    </button>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────────── */
function SkeletonGrid() {
  return (
    <div className="pj-grid">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="pj-card" style={{ cursor: 'default', gap: 14 }}>
          <div className="row g3">
            <div className="skel" style={{ width: 44, height: 44, borderRadius: 'var(--r5)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skel" style={{ height: 14, width: '60%', marginBottom: 8 }} />
              <div className="skel" style={{ height: 16, width: 90 }} />
            </div>
          </div>
          <div className="skel" style={{ height: 13, width: '100%' }} />
          <div className="skel" style={{ height: 13, width: '70%' }} />
        </div>
      ))}
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────────────── */
function EmptyState({ onCreate }) {
  return (
    <div className="empty">
      <span className="empty-ico">🗺️</span>
      <p className="f16 w7 t1" style={{ marginBottom: 8 }}>Aucun projet pour l'instant</p>
      <p className="f13 t3" style={{ marginBottom: 24 }}>Créez votre premier projet de cartographie applicative IT</p>
      <button onClick={onCreate} className="btn btn-p btn-lg">+ Créer un projet</button>
    </div>
  );
}
