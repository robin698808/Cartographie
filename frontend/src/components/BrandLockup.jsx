import { LogoMark } from './Logo';
import './BrandLockup.css';

export default function BrandLockup({ size = 34, tone = 'light' }) {
  return (
    <div className={`bl bl-${tone}`}>
      <LogoMark size={size} />
      <div className="bl-text">
        <span className="bl-name">Cartographe</span>
        <span className="bl-by">by <strong>onepoint</strong></span>
      </div>
    </div>
  );
}
