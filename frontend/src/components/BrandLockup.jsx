import { LogoMark } from './Logo';
import { useBranding } from '../utils/branding';
import './BrandLockup.css';

export default function BrandLockup({ size = 34, tone = 'light', compact = false }) {
  const { logo } = useBranding();
  return (
    <div className={`bl bl-${tone}${compact ? ' bl-compact' : ''}`}>
      {logo
        ? <img src={logo} alt="Logo" style={{ width: size + 8, height: size + 8, borderRadius: '50%', objectFit: 'contain', background: '#fff', padding: 4, boxSizing: 'border-box', border: '1px solid var(--border-md)', flexShrink: 0 }} />
        : <LogoMark size={size} />}
      <div className="bl-text" style={logo ? { display: 'none' } : undefined}>
        <span className="bl-name">Cartographe</span>
        {!compact && <span className="bl-by">by <strong>onepoint</strong></span>}
      </div>
    </div>
  );
}
