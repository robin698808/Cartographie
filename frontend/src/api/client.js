import axios from 'axios';

// URL de l'API : relative ('/api') par défaut — le reverse proxy relaie vers le backend.
// Surchargeable via VITE_API_URL (ex: http://localhost:8001/api en dev sans proxy).
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Injecte le token JWT automatiquement
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirige vers /login si 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────
export const register = (data) => API.post('/auth/register', data);
export const login = (email, password) => {
  const form = new FormData();
  form.append('username', email);
  form.append('password', password);
  return API.post('/auth/login', form);
};
export const getMe = () => API.get('/auth/me');
export const updateMyProfile = (data) => API.patch('/auth/me', data);
export const forgotPassword = (email) => API.post('/auth/forgot-password', { email });
export const resetPassword = (token, new_password) => API.post('/auth/reset-password', { token, new_password });

// ─── Projects ────────────────────────────────────────────
export const getProjects = () => API.get('/projects');
export const createProject = (data) => API.post('/projects', data);
export const deleteProject = (id) => API.delete(`/projects/${id}`);
export const updateProject = (id, data) => API.patch(`/projects/${id}`, data);

// ─── Snapshots ───────────────────────────────────────────
export const getLatestSnapshot = (projectId) =>
  API.get(`/projects/${projectId}/snapshots/latest`);
export const saveSnapshot = (projectId, data) =>
  API.post(`/projects/${projectId}/snapshots`, data);
export const getSnapshots = (projectId) =>
  API.get(`/projects/${projectId}/snapshots`);

// ─── Members ─────────────────────────────────────────────
export const getMembers       = (projectId)              => API.get(`/projects/${projectId}/members`);
export const inviteMember     = (projectId, email, role) => API.post(`/projects/${projectId}/members`, { email, role });
export const updateMemberRole = (projectId, userId, role)=> API.patch(`/projects/${projectId}/members/${userId}`, { role });
export const removeMember     = (projectId, userId)      => API.delete(`/projects/${projectId}/members/${userId}`);

// ─── Admin — Utilisateurs ────────────────────────────────
export const getUsers       = ()         => API.get('/users');
export const updateUserRole = (id, role) => API.patch(`/users/${id}`, { role });
export const deleteUser     = (id)       => API.delete(`/users/${id}`);

export default API;
