import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PALETTES, CUSTOM_DEFAULT, isCustom, customId, resolvePalette } from '../utils/chartPalettes';

export function swatchBackground(p) {
  if (!p.stops && !p.colors) return 'repeating-linear-gradient(45deg,#CBD5E1 0 4px,#E2E8F0 4px 8px)';
  if (p.stops) return `linear-gradient(90deg, ${p.stops.join(', ')})`;
  const n = p.colors.length;
  return `linear-gradient(90deg, ${p.colors.map((c, i) => `${c} ${(i / n) * 100}% ${((i + 1) / n) * 100}%`).join(', ')})`;
}

const Swatch = ({ p, w = 64 }) => (
  <span style={{ display: 'inline-block', width: w, height: 12, borderRadius: 6, background: swatchBackground(p), border: '1px solid rgba(0,0,0,.12)', flexShrink: 0 }} />
);

export default function PaletteSelect({ value, onChange, T, buttonStyle }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btn = useRef(null);
  const cur = resolvePalette(value);
  const customStops = isCustom(value) ? cur.stops : CUSTOM_DEFAULT;
  const customP = resolvePalette(customId(customStops));
  const setStop = (k, c) => { const s = customStops.slice(); s[k] = c; onChange(customId(s)); };

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    const onKey = e => { if (e.key === 'Escape') close(); };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = e => {
    e.stopPropagation();
    if (!open && btn.current) {
      const r = btn.current.getBoundingClientRect();
      setPos({ top: Math.max(8, Math.min(r.bottom + 4, window.innerHeight - 470)), left: Math.max(8, Math.min(r.left, window.innerWidth - 228)) });
    }
    setOpen(o => !o);
  };

  return (
    <>
      <button ref={btn} type="button" title="Nuancier de couleurs" onClick={toggle} onMouseDown={e => e.stopPropagation()}
        style={{ ...buttonStyle, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 8px', maxWidth: 'none' }}>
        <Swatch p={cur} w={34} />
        <span style={{ fontSize: 10, opacity: 0.7 }}>▾</span>
      </button>
      {open && createPortal(
        <>
          <div onClick={e => { e.stopPropagation(); setOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 9990 }} />
          <div role="listbox" onClick={e => e.stopPropagation()}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: 220, zIndex: 9999, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,.25)', padding: 4, maxHeight: 'calc(100vh - 24px)', overflowY: 'auto' }}>
            {PALETTES.map(p => {
              const on = !isCustom(value) && p.id === cur.id;
              return (
                <button key={p.id} type="button" role="option" aria-selected={on}
                  onClick={e => { e.stopPropagation(); onChange(p.id); setOpen(false); }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 5, width: '100%', textAlign: 'left', padding: '7px 9px', border: 'none', borderRadius: 7, cursor: 'pointer', background: on ? 'rgba(99,102,241,.14)' : 'transparent', color: on ? '#818CF8' : T.fg, fontSize: 11.5, fontWeight: on ? 700 : 500 }}>
                  <span>{p.label}</span>
                  <Swatch p={p} w="100%" />
                </button>
              );
            })}
            <div style={{ marginTop: 4, padding: '8px 9px', borderTop: `1px solid ${T.border}`, borderRadius: 7, background: isCustom(value) ? 'rgba(99,102,241,.14)' : 'transparent' }}>
              <div style={{ fontSize: 11.5, fontWeight: isCustom(value) ? 700 : 500, color: isCustom(value) ? '#818CF8' : T.fg, marginBottom: 6 }}>Personnalisé</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="color" aria-label="Couleur de départ" value={customStops[0]} onChange={e => setStop(0, e.target.value)} style={{ width: 28, height: 24, padding: 0, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}><Swatch p={customP} w="100%" /></span>
                <input type="color" aria-label="Couleur d'arrivée" value={customStops[customStops.length - 1]} onChange={e => setStop(customStops.length - 1, e.target.value)} style={{ width: 28, height: 24, padding: 0, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }} />
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); onChange(customId(customStops)); }}
                style={{ marginTop: 6, width: '100%', border: `1px solid ${T.border}`, background: T.bgAlt, color: T.fg, borderRadius: 6, fontSize: 10.5, padding: '3px 0', cursor: 'pointer' }}>Appliquer ce dégradé</button>
            </div>
          </div>
        </>,

        document.body,
      )}
    </>
  );
};
