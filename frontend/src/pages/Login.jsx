import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, getMe, forgotPassword } from '../api/client';
import { useAuth } from '../api/AuthContext';
import { LogoMark, LogoMarkHero, NetworkPattern } from '../components/Logo';
import { Network, Building2, BarChart3, Users, TrendingUp, Layers, ShieldCheck, Zap } from 'lucide-react';

const FEATURES = [
  {
    Icon: Network,
    grad: 'linear-gradient(135deg,#60a5fa,#3b82f6)',
    label: 'Canvas applicatif',
    desc: 'Drag & drop, flux, domaines métier',
  },
  {
    Icon: Building2,
    grad: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
    label: 'Vue Urbanisme',
    desc: 'Zones SI, cartographie par couches',
  },
  {
    Icon: BarChart3,
    grad: 'linear-gradient(135deg,#34d399,#059669)',
    label: 'Dashboard & Décisions',
    desc: 'D1/D2, keep/sunset/migrate',
  },
  {
    Icon: Users,
    grad: 'linear-gradient(135deg,#fbbf24,#d97706)',
    label: 'Collaboration temps réel',
    desc: 'Multi-utilisateurs, WebSocket',
  },
];

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', nom: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotDone, setForgotDone] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const switchMode = (m) => { setMode(m); setError(''); setShowPwd(false); };

  const submitForgot = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail);
      setForgotDone(true);
    } finally {
      setForgotLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await register({ email: form.email, password: form.password, nom: form.nom });
      }
      const res = await login(form.email, form.password);
      localStorage.setItem('token', res.data.access_token);
      const me = await getMe();
      setUser(me.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ── Panneau gauche — branding visuel ── */}
      <div className="login-panel">
        {/* Réseau topologique SVG en fond */}
        <div className="login-panel-net">
          <NetworkPattern width={440} height={760} />
        </div>

        <div className="login-panel-content">
          {/* Brand */}
          <div className="login-panel-brand">
            <LogoMark size={36} />
            <span className="login-panel-brand-name">Cartographe</span>
          </div>

          {/* Headline */}
          <h1 className="login-panel-headline">
            Cartographiez votre<br />Système d'Information
          </h1>
          <p className="login-panel-sub">
            Outil de cartographie applicative IT pour due diligence,
            audit SI et carve-out. Visualisez, analysez, décidez.
          </p>

          {/* Feature cards */}
          <div className="login-features">
            {FEATURES.map(({ Icon, grad, label, desc }) => (
              <div key={label} className="login-feature">
                <div className="login-feature-ico" style={{ background: grad }}>
                  <Icon size={17} color="#fff" strokeWidth={1.8} />
                </div>
                <div className="login-feature-text">
                  <div className="login-feature-label">{label}</div>
                  <div className="login-feature-desc">{desc}</div>
                </div>
                <ShieldCheck size={13} color="rgba(255,255,255,0.35)" strokeWidth={1.5} />
              </div>
            ))}
          </div>

        </div>

        <div className="login-panel-footer">
          <p>Cartographe © 2025 · Due diligence IT</p>
        </div>
      </div>

      {/* ── Modal mot de passe oublié ── */}
      {showForgot && (
        <div className="overlay" onClick={() => setShowForgot(false)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Mot de passe oublié</h2>
              <button onClick={() => setShowForgot(false)} className="btn btn-s btn-xs" style={{ fontSize:16, lineHeight:1 }}>✕</button>
            </div>
            {forgotDone ? (
              <div>
                <div className="alert alert-s" style={{ marginBottom: 16 }}>
                  <span>✓</span>
                  <span>Si cet email existe, un lien de réinitialisation vous a été envoyé.</span>
                </div>
                <button onClick={() => setShowForgot(false)} className="btn btn-p btn-fw">Fermer</button>
              </div>
            ) : (
              <form onSubmit={submitForgot} className="va">
                <p className="f13 t3" style={{ marginBottom: 12 }}>
                  Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
                <div className="fg">
                  <label className="lbl">Adresse email</label>
                  <input
                    className="inp"
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="vous@entreprise.com"
                    required
                    autoFocus
                  />
                </div>
                <div className="modal-row" style={{ marginTop: 4 }}>
                  <button type="button" onClick={() => setShowForgot(false)} className="btn btn-s" style={{ flex:1 }}>
                    Annuler
                  </button>
                  <button type="submit" disabled={forgotLoading} className="btn btn-p" style={{ flex:2 }}>
                    {forgotLoading ? <><span className="spin" /> Envoi…</> : 'Envoyer le lien'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Panneau droit — formulaire ── */}
      <div className="login-form-side">
        <div className="login-card">

          {/* Mobile logo (masqué sur desktop car panneau gauche présent) */}
          <div style={{ display:'none' /* affiché via media query dans CSS si nécessaire */ }}>
            <LogoMarkHero size={56} />
          </div>

          <div className="login-head">
            <h2 className="login-title">
              {mode === 'login' ? 'Connexion' : 'Créer un compte'}
            </h2>
            <p className="login-sub">
              {mode === 'login'
                ? 'Accédez à vos projets de cartographie'
                : 'Rejoignez votre équipe sur Cartographe'}
            </p>
          </div>

          {/* Tabs */}
          <div className="login-tabs">
            <button className={`login-tab${mode === 'login' ? ' act' : ''}`} onClick={() => switchMode('login')}>
              Connexion
            </button>
            <button className={`login-tab${mode === 'register' ? ' act' : ''}`} onClick={() => switchMode('register')}>
              Créer un compte
            </button>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="va">
            {mode === 'register' && (
              <div className="fg">
                <label className="lbl">Nom complet</label>
                <input
                  className="inp"
                  name="nom"
                  value={form.nom}
                  onChange={handle}
                  placeholder="Jean Dupont"
                  required
                  autoFocus
                />
              </div>
            )}

            <div className="fg">
              <label className="lbl">Adresse email</label>
              <input
                className="inp"
                name="email"
                type="email"
                value={form.email}
                onChange={handle}
                placeholder="vous@entreprise.com"
                required
                autoFocus={mode === 'login'}
              />
            </div>

            <div className="fg-lg">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 4 }}>
                <label className="lbl" style={{ margin: 0 }}>Mot de passe</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setForgotEmail(form.email); setForgotDone(false); }}
                    style={{ background:'none', border:'none', padding:0, cursor:'pointer', fontSize:11, color:'var(--accent)' }}
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="inp-wrap">
                <input
                  className="inp"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={handle}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="inp-act"
                  onClick={() => setShowPwd(!showPwd)}
                  title={showPwd ? 'Masquer' : 'Afficher'}
                >
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-e" style={{ marginBottom: 16 }}>
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-p btn-lg btn-fw">
              {loading
                ? <><span className="spin" />{mode === 'login' ? ' Connexion…' : ' Création…'}</>
                : mode === 'login' ? 'Se connecter' : 'Créer mon compte'
              }
            </button>
          </form>

          {/* Switch mode link */}
          <p className="f12 t3 tc" style={{ marginTop: 20 }}>
            {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
            <button
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontFamily: 'inherit', fontSize: 'inherit', cursor: 'pointer',
              }}
              className="f12 w6 ta"
            >
              {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
