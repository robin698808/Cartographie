import './FeatureVisuals.css';

/* Mini-illustrations animées affichées dans les cartes de fonctionnalités */

export function CanvasVisual() {
  return (
    <svg className="fv fv-canvas" viewBox="0 0 96 52" aria-hidden="true">
      <path d="M22 16 L48 38 M22 16 L74 14 M48 38 L74 14" />
      <rect x="8"  y="8"  width="28" height="16" rx="5" className="a" />
      <rect x="34" y="30" width="28" height="16" rx="5" className="b" />
      <rect x="60" y="6"  width="28" height="16" rx="5" className="c" />
      <circle cx="22" cy="16" r="2.4" />
      <circle cx="48" cy="38" r="2.4" />
      <circle cx="74" cy="14" r="2.4" />
    </svg>
  );
}

export function LayersVisual() {
  return (
    <div className="fv fv-layers" aria-hidden="true">
      <span style={{ '--w': '100%' }}><i />Métier</span>
      <span style={{ '--w': '84%' }}><i />Applicatifs</span>
      <span style={{ '--w': '66%' }}><i />Flux</span>
    </div>
  );
}

export function DonutVisual() {
  return (
    <div className="fv fv-donut" aria-hidden="true">
      <div className="fv-donut-ring"><span>10</span></div>
      <ul>
        <li className="k"><i />6</li>
        <li className="m"><i />2</li>
        <li className="s"><i />2</li>
      </ul>
    </div>
  );
}

export function TeamVisual() {
  return (
    <div className="fv fv-team" aria-hidden="true">
      <div className="fv-avatars">
        <span style={{ background: 'linear-gradient(135deg,#60a5fa,#6366f1)' }}>AL</span>
        <span style={{ background: 'linear-gradient(135deg,#f472b6,#e11d48)' }}>MK</span>
        <span style={{ background: 'linear-gradient(135deg,#34d399,#0d9488)' }}>SB</span>
        <span className="more">+2</span>
      </div>
      <div className="fv-online"><i />En ligne</div>
    </div>
  );
}
