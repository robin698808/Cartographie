import { useState, useEffect, useRef } from 'react';
import { Palette } from 'lucide-react';
import { THEMES, applyTheme, buildThemeFromAccent } from '../utils/themes';
import { BG_PRESETS, useBranding, saveBranding, fileToDataUrl } from '../utils/branding';

export default function ThemePicker() {
  const [open, setOpen]         = useState(false);
  const [activeId, setActiveId] = useState('indigo');
  const [custom, setCustom]     = useState('#6366F1');
  const panelRef = useRef();
  const branding = useBranding();
  const [err, setErr] = useState('');

  const pickFile = async (e, kind) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setErr('');
    try {
      const ok = kind === 'logo'
        ? saveBranding({ ...branding, logo: await fileToDataUrl(f, 400, 'image/png') })
        : saveBranding({ ...branding, bg: { type: 'image', value: await fileToDataUrl(f, 1600, 'image/jpeg', 0.8) } });
      if (!ok) setErr('Image trop volumineuse');
    } catch (ex) { setErr(ex.message); }
  };
  const setBg = (type, value) => saveBranding({ ...branding, bg: { type, value } });

  // Detect current theme from localStorage on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('carto_theme') || 'null');
      if (saved?.id)     setActiveId(saved.id);
      if (saved?.custom) { setActiveId('custom'); setCustom(saved.custom); }
    } catch {}
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selectTheme = (theme) => {
    setActiveId(theme.id);
    applyTheme(theme);
  };

  const applyCustom = () => {
    setActiveId('custom');
    applyTheme(custom);
  };

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="btn btn-s btn-sm"
        title="Personnaliser les couleurs"
      >
        <Palette size={13} strokeWidth={1.8} />
        Custom
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r5)', boxShadow: 'var(--s4)',
          padding: '16px', width: 280, zIndex: 200,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Thème de couleurs
          </p>

          {/* Predefined palette swatches */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
            {THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => selectTheme(theme)}
                title={theme.name}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px',
                  borderRadius: 'var(--r3)',
                  outline: activeId === theme.id ? `2px solid ${theme.accent}` : '2px solid transparent',
                  outlineOffset: 1,
                  transition: 'outline 0.12s',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: theme.accentGrad,
                  boxShadow: activeId === theme.id ? `0 0 0 3px ${theme.accentPale}` : 'none',
                  transition: 'box-shadow 0.12s',
                }} />
                <span style={{ fontSize: 9, color: 'var(--t3)', textAlign: 'center', lineHeight: 1.2 }}>
                  {theme.name}
                </span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)', marginBottom: 12 }} />

          {/* Custom colour */}
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Couleur personnalisée
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="color"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              style={{
                width: 36, height: 36, border: '1px solid var(--border)',
                borderRadius: 'var(--r3)', cursor: 'pointer', padding: 2,
                background: 'var(--surface)',
              }}
            />
            <input
              type="text"
              value={custom}
              onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setCustom(e.target.value); }}
              maxLength={7}
              className="inp"
              style={{ flex: 1, fontSize: 12, padding: '6px 8px', fontFamily: 'monospace' }}
              placeholder="#6366F1"
            />
            <button
              onClick={applyCustom}
              className="btn btn-p"
              style={{ fontSize: 11, padding: '6px 10px', whiteSpace: 'nowrap' }}
            >
              Appliquer
            </button>
          </div>

          {/* Logo */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0 12px' }} />
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Logo de l'entreprise
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 56, height: 36, border: '1px dashed var(--border-md)', borderRadius: 'var(--r3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--surface-2)' }}>
              {branding.logo && <img src={branding.logo} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
            </div>
            <label className="btn btn-s btn-sm" style={{ cursor: 'pointer' }}>
              Importer
              <input type="file" accept="image/*" hidden onChange={e => pickFile(e, 'logo')} />
            </label>
            {branding.logo && (
              <button className="btn btn-s btn-sm" onClick={() => saveBranding({ ...branding, logo: '' })}>Retirer</button>
            )}
          </div>

          {/* Fond */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0 12px' }} />
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Fond de l'écran d'accueil
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 8 }}>
            {BG_PRESETS.map(p => (
              <button key={p.id} title={p.name} onClick={() => setBg(p.value ? 'gradient' : 'none', p.value)}
                style={{
                  height: 28, borderRadius: 'var(--r3)', cursor: 'pointer',
                  background: p.value || 'var(--bg)',
                  border: branding.bg.value === p.value && branding.bg.type !== 'image' && branding.bg.type !== 'color' ? '2px solid var(--accent)' : '1px solid var(--border-md)',
                }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={branding.bg.type === 'color' ? branding.bg.value : '#f5f3ff'}
              onChange={e => setBg('color', e.target.value)}
              style={{ width: 36, height: 30, border: '1px solid var(--border)', borderRadius: 'var(--r3)', cursor: 'pointer', padding: 2, background: 'var(--surface)' }} />
            <label className="btn btn-s btn-sm" style={{ cursor: 'pointer' }}>
              Image…
              <input type="file" accept="image/*" hidden onChange={e => pickFile(e, 'bg')} />
            </label>
          </div>
          {err && <p style={{ color: '#DC2626', fontSize: 11, marginTop: 8 }}>{err}</p>}

          <button className="btn btn-s btn-sm" style={{ width: '100%', marginTop: 14 }}
            onClick={() => {
              selectTheme(THEMES[0]);
              setCustom(THEMES[0].accent);
              saveBranding({ logo: '', bg: { type: 'none', value: '' } });
              setErr('');
            }}>
            Revenir à l'écran par défaut
          </button>

          {/* Preview band */}
          <div style={{
            marginTop: 12, height: 6, borderRadius: 'var(--rFull)',
            background: activeId === 'custom'
              ? buildThemeFromAccent(custom).accentGrad
              : (THEMES.find(t => t.id === activeId)?.accentGrad || 'var(--accent-grad)'),
          }} />
        </div>
      )}
    </div>
  );
}
