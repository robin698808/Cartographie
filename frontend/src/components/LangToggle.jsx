import { useEffect, useState } from 'react';
import { getLang, setLang } from '../i18n';

const FlagFR = () => (
  <svg width="20" height="14" viewBox="0 0 3 2" aria-hidden="true" style={{ borderRadius: 2, display: 'block' }}>
    <rect width="1" height="2" fill="#0055A4" />
    <rect x="1" width="1" height="2" fill="#FFFFFF" />
    <rect x="2" width="1" height="2" fill="#EF4135" />
  </svg>
);

const FlagGB = () => (
  <svg width="20" height="14" viewBox="0 0 60 40" aria-hidden="true" style={{ borderRadius: 2, display: 'block' }}>
    <rect width="60" height="40" fill="#012169" />
    <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="8" />
    <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3" />
    <path d="M30,0 V40 M0,20 H60" stroke="#FFFFFF" strokeWidth="13" />
    <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="7" />
  </svg>
);

export default function LangToggle({ floating = false }) {
  const [lang, setLangState] = useState(getLang);

  useEffect(() => {
    const onChange = (e) => setLangState(e.detail);
    window.addEventListener('carto:lang-change', onChange);
    return () => window.removeEventListener('carto:lang-change', onChange);
  }, []);

  const item = (code, label, Flag) => (
    <button
      type="button"
      key={code}
      aria-pressed={lang === code}
      aria-label={label}
      title={label}
      data-notranslate
      onClick={() => setLang(code)}
      className={`lang-btn${lang === code ? ' on' : ''}`}
    >
      <Flag />
    </button>
  );

  return (
    <div role="group" aria-label={lang === 'en' ? 'Language' : 'Langue'} data-notranslate className={`lang-toggle${floating ? ' lang-toggle-floating' : ''}`}>
      {item('fr', 'Français', FlagFR)}
      {item('en', 'English', FlagGB)}
    </div>
  );
}
