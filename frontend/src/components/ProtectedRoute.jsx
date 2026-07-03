import { Navigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';

function Spinner() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', fontFamily: 'var(--font)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span className="spin spin-dark" style={{ width: 22, height: 22 }} />
        <span className="f13 t3">Chargement…</span>
      </div>
    </div>
  );
}

/** Route protégée — authentification requise */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/** Route protégée — rôle admin requis */
export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
