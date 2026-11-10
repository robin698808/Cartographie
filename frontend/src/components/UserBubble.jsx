import { useAuth } from '../api/AuthContext';
import '../pages/Projects.css';

const ROLES = { admin: 'Admin', member: 'Membre' };

function initials(nom) {
  if (!nom) return '?';
  return nom.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function UserBubble({ onClick }) {
  const { user } = useAuth();
  if (!user) return null;
  const fullName = user.prenom ? `${user.prenom} ${user.nom}` : user.nom;
  const role = ROLES[user.role] || 'Lecteur';
  return (
    <div className="pj-profile" onClick={onClick} title={`${fullName} · Modifier mon profil`}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 'var(--r4)' }}>
      {user.avatar
        ? <img src={user.avatar} alt="avatar" className="pj-avatar-img" style={{ width: 32, height: 32 }} />
        : <div className="av av-sm" style={{ width: 32, height: 32 }}>{initials(user.nom)}</div>}
      <span className="pj-role" data-role={user.role}>{role}</span>
    </div>
  );
}
