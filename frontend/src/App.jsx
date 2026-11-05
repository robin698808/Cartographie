import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import ThemeToggle from './components/ThemeToggle';
import { AuthProvider } from './api/AuthContext';
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute';
import { loadSavedTheme } from './utils/themes';

// Apply persisted theme before first render
loadSavedTheme();
import Login from './pages/Login';
import Projects from './pages/Projects';
import Canvas from './pages/Canvas';
import ProjectAdmin from './pages/ProjectAdmin';
import AdminUsers from './pages/AdminUsers';
import ResetPassword from './pages/ResetPassword';

// Le toggle est int?gr? aux en-t?tes de Projets et du canvas ; flottant ailleurs
function FloatingToggle() {
  const { pathname } = useLocation();
  if (pathname === '/' || pathname.startsWith('/canvas/')) return null;
  return <ThemeToggle floating />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <FloatingToggle />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/" element={
            <ProtectedRoute><Projects /></ProtectedRoute>
          } />

          <Route path="/canvas/:projectId" element={
            <ProtectedRoute><Canvas /></ProtectedRoute>
          } />

          {/* Gestion membres d'un projet — owner ou admin */}
          <Route path="/projects/:projectId/admin" element={
            <ProtectedRoute><ProjectAdmin /></ProtectedRoute>
          } />

          {/* Administration globale des utilisateurs — admin only */}
          <Route path="/admin/users" element={
            <AdminRoute><AdminUsers /></AdminRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
