import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, updateUserRole, deleteUser } from '../api/client';
import { useAuth } from '../api/AuthContext';
import { LogoMark } from '../components/Logo';
import UserBubble from '../components/UserBubble';
import ProfileModal from '../components/ProfileModal';
import LangToggle from '../components/LangToggle';
import ThemeToggle from '../components/ThemeToggle';
import {
  Users, ShieldCheck, UserCheck, Search, ChevronLeft,
  Crown, UserCog, Trash2, Calendar, Mail, ArrowUpDown,
  CheckCircle2, XCircle,
} from 'lucide-react';

function initials(nom) {
  if (!nom) return '?';
  return nom.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ROLE_CONFIG = {
  admin:  { label: 'Admin',   Icon: Crown,     color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', border: 'rgba(124,58,237,0.25)' },
  member: { label: 'Membre',  Icon: UserCheck,  color: '#2563EB', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.20)' },
  viewer: { label: 'Lecteur', Icon: Users,      color: '#059669', bg: 'rgba(5,150,105,0.08)',  border: 'rgba(5,150,105,0.20)' },
};

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,      setSearch]      = useState('');
  const [toast,       setToast]       = useState(null);
  const [sortAsc,     setSortAsc]     = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const { user: me, logout }          = useAuth();
  const navigate                      = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await getUsers(); setUsers(res.data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRoleChange = async (u, newRole) => {
    try {
      await updateUserRole(u.id, newRole);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
      notify(`${u.nom} → ${ROLE_CONFIG[newRole]?.label || newRole}`);
    } catch (err) {
      notify(err.response?.data?.detail || 'Erreur lors du changement de rôle', 'error');
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Supprimer "${u.nom}" (${u.email}) ?`)) return;
    try {
      await deleteUser(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      notify(`${u.nom} supprimé`);
    } catch (err) {
      notify(err.response?.data?.detail || 'Erreur lors de la suppression', 'error');
    }
  };

  const admins  = users.filter(u => u.role === 'admin').length;
  const members = users.filter(u => u.role === 'member').length;

  const filtered = users
    .filter(u =>
      u.nom.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => sortAsc
      ? a.nom.localeCompare(b.nom)
      : b.nom.localeCompare(a.nom)
    );

  return (
    <div className="page va" style={{ background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <header className="header admin-header">
        <div className="row g3">
          <button
            onClick={() => navigate('/')}
            className="btn btn-s btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ChevronLeft size={14} strokeWidth={2} />
            <span>Projets</span>
          </button>
          <span className="ctx-sep">/</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={15} color="var(--t2)" strokeWidth={1.8} />
            <span className="f14 w7 t1">Gestion des utilisateurs</span>
          </div>
          <span className="badge badge-ad caps" style={{ display:'flex', alignItems:'center', gap:4 }}>
            <ShieldCheck size={10} strokeWidth={2} />Admin
          </span>
        </div>
        <div className="row g3">
          <LangToggle />
          <ThemeToggle />
          <UserBubble onClick={() => setShowProfile(true)} />
          <button onClick={logout} className="btn btn-s btn-sm">Déconnexion</button>
        </div>
      </header>
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      <div className="container">

        {/* ── Stats ── */}
        {!loading && (
          <div className="stat-bar" style={{ marginBottom: 24 }}>
            <StatPill
              icon={<Users size={18} strokeWidth={1.7} />}
              gradient="linear-gradient(135deg,#2563EB,#60A5FA)"
              glow="rgba(37,99,235,0.18)"
              value={users.length}
              label="Utilisateurs"
            />
            <div className="stat-sep" />
            <StatPill
              icon={<Crown size={18} strokeWidth={1.7} />}
              gradient="linear-gradient(135deg,#7C3AED,#A78BFA)"
              glow="rgba(124,58,237,0.18)"
              value={admins}
              label="Administrateurs"
            />
            <div className="stat-sep" />
            <StatPill
              icon={<UserCheck size={18} strokeWidth={1.7} />}
              gradient="linear-gradient(135deg,#059669,#34D399)"
              glow="rgba(5,150,105,0.18)"
              value={members}
              label="Membres"
            />
          </div>
        )}

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Search size={14} color="var(--t4)" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
            <input
              className="inp"
              style={{ paddingLeft: 32, fontSize: 13 }}
              placeholder="Rechercher un utilisateur…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn btn-s btn-sm"
            onClick={() => setSortAsc(a => !a)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title="Trier par nom"
          >
            <ArrowUpDown size={13} strokeWidth={2} />
            Nom {sortAsc ? 'A→Z' : 'Z→A'}
          </button>
          <span className="f12 t4" style={{ marginLeft: 'auto' }}>
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── User cards ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            [1,2,3,4].map(i => <SkeletonRow key={i} />)
          ) : filtered.length === 0 ? (
            <div className="empty" style={{ border: '1.5px dashed var(--border)', borderRadius: 'var(--r5)' }}>
              <Users size={32} color="var(--t4)" strokeWidth={1.4} />
              <p className="f14 w6 t3" style={{ marginTop: 8 }}>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            filtered.map((u, idx) => (
              <UserCard
                key={u.id}
                user={u}
                isMe={u.id === me?.id}
                isFirst={idx === 0}
                onRoleChange={(role) => handleRoleChange(u, role)}
                onDelete={() => handleDelete(u)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 300,
          background: toast.type === 'error' ? 'var(--error)' : '#111827',
          color: '#fff', padding: '12px 20px', borderRadius: 'var(--r4)',
          fontSize: 13, fontWeight: 500, boxShadow: 'var(--s4)',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: '_up 0.28s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {toast.type === 'error'
            ? <XCircle size={16} strokeWidth={2} />
            : <CheckCircle2 size={16} strokeWidth={2} color="#34D399" />
          }
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ── Stat pill ───────────────────────────────────────────────────── */
function StatPill({ icon, gradient, glow, value, label }) {
  return (
    <div className="stat-item">
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--r4)', flexShrink: 0,
        background: gradient, boxShadow: `0 4px 12px ${glow}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
      }}>
        {icon}
      </div>
      <div>
        <div className="stat-val">{value}</div>
        <div className="stat-lbl">{label}</div>
      </div>
    </div>
  );
}

/* ── User card row ───────────────────────────────────────────────── */
function UserCard({ user, isMe, onRoleChange, onDelete }) {
  const [open, setOpen] = useState(false);
  const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.member;
  const { Icon: RoleIcon } = cfg;

  return (
    <div
      className="card"
      style={{
        padding: 0, overflow: 'hidden',
        border: isMe ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
        transition: 'box-shadow var(--tn), border-color var(--tn)',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--s2)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
    >
      {/* Main row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 130px 150px 100px',
        alignItems: 'center',
        gap: 16, padding: '14px 18px',
      }}>

        {/* Avatar + info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: isMe
              ? 'linear-gradient(135deg,var(--accent),var(--accent-light))'
              : `linear-gradient(135deg,${cfg.color}cc,${cfg.color}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff',
            overflow: 'hidden',
          }}>
            {user.avatar
              ? <img src={user.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : initials(user.nom)
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="f14 w6 t1">{user.nom}</span>
              {isMe && (
                <span style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--accent)',
                  background: 'var(--accent-pale)', borderRadius: 'var(--rFull)',
                  padding: '1px 6px',
                }}>vous</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <Mail size={11} color="var(--t4)" strokeWidth={1.5} />
              <span className="f12 t4 trunc">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          borderRadius: 'var(--rFull)', padding: '5px 10px',
          flexShrink: 0,
        }}>
          <RoleIcon size={12} color={cfg.color} strokeWidth={2} />
          <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
        </div>

        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <Calendar size={12} color="var(--t4)" strokeWidth={1.5} />
          <span className="f12 t4">{fmtDate(user.created_at)}</span>
        </div>

        {/* Actions */}
        {!isMe ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => setOpen(o => !o)}
              className="btn btn-s btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              title="Changer le rôle"
            >
              <UserCog size={13} strokeWidth={1.8} />
              Rôle
            </button>
            <button
              onClick={onDelete}
              style={{
                background: 'none', border: '1px solid var(--border)', cursor: 'pointer',
                padding: '5px 8px', borderRadius: 'var(--r3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--t4)', transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--error-bg)'; e.currentTarget.style.borderColor = 'var(--error-bd)'; e.currentTarget.style.color = 'var(--error)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--t4)'; }}
              title="Supprimer"
            >
              <Trash2 size={13} strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* Role picker dropdown */}
      {open && !isMe && (
        <div style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--surface-2)',
          padding: '10px 18px',
          display: 'flex', gap: 8,
        }}>
          <span className="f12 t3 w5" style={{ alignSelf: 'center', marginRight: 4 }}>Attribuer :</span>
          {Object.entries(ROLE_CONFIG).map(([role, { label, Icon: RIcon, color, bg, border }]) => (
            <button
              key={role}
              onClick={() => { onRoleChange(role); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: user.role === role ? bg : 'transparent',
                border: `1.5px solid ${user.role === role ? border : 'var(--border)'}`,
                borderRadius: 'var(--rFull)', padding: '5px 12px', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, color: user.role === role ? color : 'var(--t3)',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (user.role !== role) { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = border; e.currentTarget.style.color = color; } }}
              onMouseLeave={e => { if (user.role !== role) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--t3)'; } }}
            >
              <RIcon size={12} strokeWidth={2} />
              {label}
              {user.role === role && <CheckCircle2 size={11} strokeWidth={2} />}
            </button>
          ))}
          <button
            onClick={() => setOpen(false)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--t4)' }}
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="card" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="skel" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skel" style={{ height: 14, width: '30%', marginBottom: 6 }} />
          <div className="skel" style={{ height: 11, width: '45%' }} />
        </div>
        <div className="skel" style={{ height: 26, width: 80, borderRadius: 'var(--rFull)' }} />
        <div className="skel" style={{ height: 12, width: 90 }} />
        <div className="skel" style={{ height: 30, width: 70, borderRadius: 'var(--r3)' }} />
      </div>
    </div>
  );
}
