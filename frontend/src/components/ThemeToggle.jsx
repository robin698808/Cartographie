import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getMode, toggleMode } from '../utils/mode';

export default function ThemeToggle({ floating = false }) {
  const [mode, setModeState] = useState(getMode);

  useEffect(() => {
    const onChange = (e) => setModeState(e.detail);
    window.addEventListener('carto:mode-change', onChange);
    return () => window.removeEventListener('carto:mode-change', onChange);
  }, []);

  const dark = mode === 'dark';
  const label = dark ? 'Passer en mode jour' : 'Passer en mode nuit';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={label}
      title={label}
      onClick={toggleMode}
      className={`mode-toggle${floating ? ' mode-toggle-floating' : ''}`}
    >
      <span className="mode-toggle-knob" style={{ transform: dark ? 'translateX(34px)' : 'translateX(0)' }} />
      <Sun size={14} className={dark ? 'dim' : 'on'} />
      <Moon size={14} className={dark ? 'on' : 'dim'} />
    </button>
  );
}
