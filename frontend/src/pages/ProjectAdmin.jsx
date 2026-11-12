import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMembers, inviteMember, removeMember, updateMemberRole, getProjects, updateProject, transferOwnership } from '../api/client';
import { useAuth } from '../api/AuthContext';
import { LogoMark } from '../components/Logo';
import UserBubble from '../components/UserBubble';
import ProfileModal from '../components/ProfileModal';
import LangToggle from '../components/LangToggle';
import ThemeToggle from '../components/ThemeToggle';

function initials(nom) {
  if (!nom) return '?';
  return nom.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ROLE_LABELS = { owner: 'Propriétaire', editor: 'Éditeur', viewer: 'Lecteur' };
const ROLE_ICONS = { owner: '👑', editor: '✏️', viewer: '👁' };
const ROLE_BADGE  = { owner: 'badge-ad', editor: 'badge-a', viewer: 'badge-m' };
const MEMBER_COLUMNS = 'minmax(180px, 1fr) 130px 110px 150px 65px';

export default function ProjectAdmin() {
  const { projectId }         = useParams();
  const { user: me, logout }  = useAuth();
  const navigate              = useNavigate();

  const [project,     setProject]     = useState(null);
  const [members,     setMembers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  // Formulaire invitation
  const [invEmail, setInvEmail] = useState('');
  const [invRole,  setInvRole]  = useState('editor');
  const [inviting, setInviting] = useState(false);
  const [invErr,   setInvErr]   = useState('');

  // Formulaire édition projet
  const [editMode,    setEditMode]    = useState(false);
  const [editForm,    setEditForm]    = useState({});
  const [editSaving,  setEditSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, membRes] = await Promise.all([
        getProjects(),
        getMembers(projectId),
      ]);
      const proj = projRes.data.find(p => p.id === parseInt(projectId));
      setProject(proj);
      setEditForm({ nom: proj?.nom || '', description: proj?.description || '', visibility: proj?.visibility || 'private' });
      setMembers(membRes.data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setEditMode(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* ── Invitation ── */
  const handleInvite = async (e) => {
    e.preventDefault();
    setInvErr('');
    setInviting(true);
    try {
      await inviteMember(projectId, invEmail, invRole);
      setInvEmail('');
      setInvRole('editor');
      notify('Membre ajouté avec succès');
      load();
    } catch (err) {
      setInvErr(err.response?.data?.detail || 'Erreur lors de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  /* ── Changer rôle ── */
  const handleRoleChange = async (m, newRole) => {
    try {
      await updateMemberRole(projectId, m.user.id, newRole);
      setMembers(prev => prev.map(x => x.id === m.id ? { ...x, role: newRole } : x));
      notify(`Rôle de ${m.user.nom} mis à jour`);
    } catch (err) {
      notify(err.response?.data?.detail || 'Erreur', 'error');
    }
  };

  /* ── Retirer membre ── */
  const handleRemove = async (m) => {
    if (!confirm(`Retirer ${m.user.nom} du projet ?`)) return;
    try {
      await removeMember(projectId, m.user.id);
      setMembers(prev => prev.filter(x => x.id !== m.id));
      notify(`${m.user.nom} retiré du projet`);
    } catch (err) {
      notify(err.response?.data?.detail || 'Erreur', 'error');
    }
  };

  const handleTransfer = async (m) => {
    if (!confirm(`Transférer la propriété du projet à ${m.user.nom} ?`)) return;
    try {
      await transferOwnership(projectId, m.user.id);
      notify('Propriété du projet transférée');
      await load();
    } catch (err) {
      notify(err.response?.data?.detail || 'Erreur lors du transfert', 'error');
    }
  };

  /* ── Modifier projet ── */
  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      await updateProject(projectId, editForm);
      notify('Projet mis à jour');
      setEditMode(false);
      load();
    } catch (err) {
      notify(err.response?.data?.detail || 'Erreur', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  /* Droits : owner ou admin */
  const canManage    = project?.effective_role === 'admin' || project?.effective_role === 'owner';

  return (
    <div className="page va">

      {/* ── Header ── */}
      <header className="header admin-header">
        <div className="row g3">
          <button onClick={() => navigate('/')} className="btn btn-s btn-sm row g2">
            <span>Projets</span>
          </button>
          <span className="ctx-sep">/</span>
          <button
            onClick={() => navigate(`/canvas/${projectId}`)}
            className="btn btn-s btn-sm"
          >
            {loading ? '…' : project?.nom}
          </button>
          <span className="ctx-sep">/</span>
          <span className="f14 w7 t1">Administration</span>
        </div>
        <div className="row g3">
          {me?.role === 'admin' && (
            <button onClick={() => navigate('/admin/users')} className="btn btn-s btn-sm">
              🛡️ Utilisateurs
            </button>
          )}
          <LangToggle />
          <ThemeToggle />
          <UserBubble onClick={() => setShowProfile(true)} />
          <button onClick={logout} className="btn btn-s btn-sm">Déconnexion</button>
        </div>
      </header>
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      <div className="container">
        <div className="project-admin-layout">

          {/* ── Colonne principale ── */}
          <div className="col g5" style={{ minWidth: 0 }}>

            {/* Infos projet */}
            <div className="card">
              <div className="row jcb" style={{ marginBottom: 16 }}>
                <h2 className="f18 w7 t1">Informations du projet</h2>
                {canManage && !editMode && (
                  <button onClick={() => setEditMode(true)} className="btn btn-s btn-sm">
                    ✏️ Modifier
                  </button>
                )}
              </div>

              {editMode ? (
                <form onSubmit={handleEditSave}>
                  <div className="fg">
                    <label className="lbl">Nom du projet *</label>
                    <input className="inp" value={editForm.nom}
                      onChange={e => setEditForm({ ...editForm, nom: e.target.value })}
                      required autoFocus />
                  </div>
                  <div className="fg">
                    <label className="lbl">Description</label>
                    <textarea className="inp" value={editForm.description} rows={3}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                  </div>
                  <div className="fg-lg">
                    <label className="lbl">Visibilité</label>
                    <select className="inp" value={editForm.visibility}
                      onChange={e => setEditForm({ ...editForm, visibility: e.target.value })}>
                      <option value="private">🔒 Privé</option>
                      <option value="team">👥 Équipe</option>
                    </select>
                  </div>
                  <div className="modal-row">
                    <button type="button" onClick={() => setEditMode(false)} className="btn btn-s" style={{ flex: 1 }}>
                      Annuler
                    </button>
                    <button type="submit" disabled={editSaving} className="btn btn-p" style={{ flex: 2 }}>
                      {editSaving ? <><span className="spin" /> Sauvegarde…</> : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              ) : (
                loading ? (
                  <div className="col g3">
                    <div className="skel" style={{ height: 18, width: '50%' }} />
                    <div className="skel" style={{ height: 14, width: '80%' }} />
                    <div className="skel" style={{ height: 14, width: '60%' }} />
                  </div>
                ) : (
                  <div className="col g3">
                    <div>
                      <span className="lbl">Nom</span>
                      <p className="f15 w6 t1">{project?.nom}</p>
                    </div>
                    {project?.description && (
                      <div>
                        <span className="lbl">Description</span>
                        <p className="f13 t2" style={{ lineHeight: 1.6 }}>{project.description}</p>
                      </div>
                    )}
                    <div>
                      <span className="lbl">Visibilité</span>
                      <p className="f13 t2">
                        {project?.visibility === 'team' ? '👥 Partagé avec l\'équipe' : '🔒 Privé'}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Membres */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="row jcb" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <h2 className="f16 w7 t1">
                  Membres
                  {!loading && <span className="f13 t3 w4" style={{ marginLeft: 8 }}>({members.length})</span>}
                </h2>
              </div>

              <div style={{ overflowX: 'auto' }}>
              {/* En-tête colonnes */}
              <div style={{
                display: 'grid', gridTemplateColumns: MEMBER_COLUMNS, minWidth: 635,
                padding: '10px 20px', borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)',
              }}>
                {['Membre', 'Rôle', 'Rejoint le', 'Transfert de propriété', 'Retirer'].map(h => (
                  <span key={h} className="f11 w6 t3 caps">{h}</span>
                ))}
              </div>

              {loading ? (
                <div className="col g3" style={{ padding: 20 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: MEMBER_COLUMNS, minWidth: 595 }}>
                      <div className="skel" style={{ height: 16 }} />
                      <div className="skel" style={{ height: 20, width: 90 }} />
                      <div className="skel" style={{ height: 16 }} />
                      <div className="skel" style={{ height: 28, width: 60 }} />
                      <div className="skel" style={{ height: 28, width: 30 }} />
                    </div>
                  ))}
                </div>
              ) : members.length === 0 ? (
                <div className="tc" style={{ padding: '32px 20px', color: 'var(--t4)', fontSize: 13 }}>
                  Aucun membre
                </div>
              ) : (
                members.map((m, idx) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    isMe={m.user?.id === me?.id}
                    isOwner={m.user?.id === project?.owner_id}
                    canManage={canManage}
                    isLast={idx === members.length - 1}
                    onRoleChange={(role) => handleRoleChange(m, role)}
                    onRemove={() => handleRemove(m)}
                    onTransfer={() => handleTransfer(m)}
                  />
                ))
              )}
              </div>
            </div>
          </div>

          {/* ── Panneau invitation ── */}
          <div className="col g4">
            {canManage && (
              <div className="card">
                <h3 className="f15 w7 t1" style={{ marginBottom: 18 }}>Inviter un membre</h3>
                <form onSubmit={handleInvite}>
                  <div className="fg">
                    <label className="lbl">Email</label>
                    <input
                      className="inp"
                      type="email"
                      value={invEmail}
                      onChange={e => setInvEmail(e.target.value)}
                      placeholder="prenom.nom@entreprise.com"
                      required
                    />
                  </div>
                  <div className="fg-lg">
                    <label className="lbl">Rôle</label>
                    <select className="inp" value={invRole} onChange={e => setInvRole(e.target.value)}>
                      <option value="editor">✏️ Éditeur — peut modifier</option>
                      <option value="viewer">👁 Lecteur — lecture seule</option>
                    </select>
                  </div>
                  {invErr && (
                    <div className="alert alert-e" style={{ marginBottom: 14 }}>
                      <span>⚠</span><span>{invErr}</span>
                    </div>
                  )}
                  <button type="submit" disabled={inviting} className="btn btn-p btn-fw">
                    {inviting ? <><span className="spin" /> Invitation…</> : '+ Inviter'}
                  </button>
                </form>
              </div>
            )}

            {/* Légende des rôles */}
            <div className="card">
              <h3 className="f13 w7 t2 caps" style={{ marginBottom: 14 }}>Permissions</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '4px 0', color: 'var(--t3)', fontWeight: 600 }}>Action</th>
                    {['owner', 'editor', 'viewer'].map(r => (
                      <th key={r} style={{ textAlign: 'center', padding: '4px 6px', color: 'var(--t3)', fontWeight: 600 }}>
                        <span role="img" aria-label={ROLE_LABELS[r]} title={ROLE_LABELS[r]}>{ROLE_ICONS[r]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Voir le projet',       true,  true,  true],
                    ['Modifier apps/flux',   true,  true,  false],
                    ['Inviter des membres',  true,  false, false],
                    ['Modifier le projet',   true,  false, false],
                    ['Supprimer le projet',  true,  false, false],
                  ].map(([label, ...perms]) => (
                    <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '7px 0', color: 'var(--t2)' }}>{label}</td>
                      {perms.map((ok, i) => (
                        <td key={i} style={{ textAlign: 'center', padding: '7px 6px' }}>
                          {ok
                            ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
                            : <span style={{ color: 'var(--t4)' }}>—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 300,
          background: toast.type === 'error' ? 'var(--error)' : 'var(--success)',
          color: '#fff', padding: '11px 18px', borderRadius: 'var(--r4)',
          fontSize: 13, fontWeight: 600, boxShadow: 'var(--s3)',
          animation: '_up var(--ts)',
        }}>
          {toast.type === 'error' ? '⚠ ' : '✓ '}{toast.msg}
        </div>
      )}
    </div>
  );
}

/* ── Ligne membre ─────────────────────────────────────────────────── */
function MemberRow({ member, isMe, isOwner, canManage, isLast, onRoleChange, onRemove, onTransfer }) {
  const displayRole = isOwner ? 'owner' : member.user?.role === 'viewer' ? 'viewer' : member.role === 'owner' ? 'editor' : member.role;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: MEMBER_COLUMNS, minWidth: 635,
      alignItems: 'center', padding: '12px 20px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      transition: 'background var(--tn)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
      onMouseLeave={e => e.currentTarget.style.background = ''}
    >
      {/* Identité */}
      <div className="row g2">
        {member.user?.avatar
          ? <img src={member.user.avatar} alt={member.user?.nom} title={member.user?.nom} style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--border)', flexShrink:0 }} />
          : <div className="av av-sm">{initials(member.user?.nom)}</div>
        }
        <div>
          <div className="f13 w6 t1">
            {member.user?.nom}
            {isMe && <span className="f11 t3" style={{ marginLeft: 6 }}>(vous)</span>}
          </div>
          <div className="f11 t3">{member.user?.email}</div>
        </div>
      </div>

      {/* Rôle */}
      <div style={{ display:'flex', alignItems:'center' }}>
        {canManage && !isOwner && !isMe ? (
          <select
            className="inp"
            aria-label="Rôle"
            value={displayRole}
            onChange={e => onRoleChange(e.target.value)}
            style={{ fontSize:12, padding:'4px 28px 4px 10px', width:'auto', minWidth:110, height:26 }}
          >
            <option value="editor" disabled={member.user?.role === 'viewer'}>✏️ Éditeur</option>
            <option value="viewer">👁 Lecteur</option>
          </select>
        ) : (
          <span className={`badge ${ROLE_BADGE[displayRole]}`} style={{ gap:5 }}>
            <span aria-hidden="true" style={{ fontSize:11, lineHeight:1 }}>{ROLE_ICONS[displayRole]}</span>
            {ROLE_LABELS[displayRole]}
          </span>
        )}
      </div>

      {/* Date */}
      <div style={{ display:'flex', alignItems:'center' }}>
        <span className="f12 t4">{fmtDate(member.joined_at)}</span>
      </div>

      {/* Transfert de propriété */}
      <div style={{ display:'flex', alignItems:'center' }}>
        {canManage && !isOwner && !isMe && member.user?.role !== 'viewer' ? (
          <button onClick={onTransfer} className="btn btn-s btn-xs" title="Transférer la propriété" aria-label="Transférer la propriété">👑</button>
        ) : (
          <span className="f11 t4">—</span>
        )}
      </div>

      {/* Retrait */}
      <div style={{ display:'flex', alignItems:'center' }}>
        {canManage && !isOwner && !isMe ? (
          <button onClick={onRemove} className="btn-d" title="Retirer du projet" aria-label="Retirer du projet" style={{ fontSize:14, lineHeight:1 }}>🗑</button>
        ) : (
          <span className="f11 t4">—</span>
        )}
      </div>
    </div>
  );
}
