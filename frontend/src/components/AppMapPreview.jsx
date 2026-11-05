import { useMemo, useRef, useState } from 'react';
import './AppMapPreview.css';

const ZONES = [
  { id: 'front', label: 'Relation client', x: 2,  y: 4,  w: 42, h: 40 },
  { id: 'back',  label: 'Finance & RH',    x: 56, y: 4,  w: 42, h: 40 },
  { id: 'tech',  label: 'Socle technique', x: 2,  y: 56, w: 96, h: 38 },
];

const NODES = [
  { id: 'crm',    label: 'CRM',         x: 14, y: 22, status: 'keep'    },
  { id: 'portal', label: 'Portail web', x: 33, y: 16, status: 'migrate' },
  { id: 'shop',   label: 'E-commerce',  x: 28, y: 33, status: 'keep'    },
  { id: 'erp',    label: 'ERP',         x: 68, y: 16, status: 'keep'    },
  { id: 'pay',    label: 'Paie',        x: 88, y: 16, status: 'sunset'  },
  { id: 'acc',    label: 'Compta',      x: 80, y: 33, status: 'migrate' },
  { id: 'k8s',    label: 'Kubernetes',       x: 14, y: 77, status: 'keep'    },
  { id: 'pg',     label: 'PostgreSQL',       x: 38, y: 77, status: 'keep'    },
  { id: 'ad',     label: 'Active Directory', x: 63, y: 77, status: 'keep'    },
  { id: 'ora',    label: 'Oracle 11g',       x: 87, y: 77, status: 'sunset'  },
];

const EDGES = [
  ['crm', 'portal'], ['crm', 'shop'], ['crm', 'erp'], ['erp', 'pay'], ['erp', 'acc'],
  ['portal', 'k8s'], ['shop', 'k8s'], ['erp', 'pg'], ['k8s', 'pg'], ['acc', 'ad'], ['pay', 'ora'], ['pg', 'ad'],
];

const STATUS = {
  keep:    'Conserver',
  migrate: 'Migrer',
  sunset:  'Décommissionner',
};

const ASPECT = 0.5; // hauteur / largeur de la scène : le viewBox SVG garde des proportions réelles
const byId = Object.fromEntries(NODES.map(n => [n.id, n]));
const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function AppMapPreview() {
  const [hovered, setHovered] = useState(null);
  const tiltRef = useRef(null);

  const linked = useMemo(() => {
    if (!hovered) return null;
    const set = new Set([hovered]);
    EDGES.forEach(([a, b]) => { if (a === hovered) set.add(b); if (b === hovered) set.add(a); });
    return set;
  }, [hovered]);

  const onMove = (e) => {
    const el = tiltRef.current;
    if (!el || REDUCED_MOTION) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg)`;
  };
  const onLeave = () => {
    setHovered(null);
    if (tiltRef.current) tiltRef.current.style.transform = '';
  };

  return (
    <div className="amp-wrap" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div ref={tiltRef} className="amp" role="img" aria-label="Aperçu d'une cartographie applicative : applications regroupées par domaine, reliées par des flux">
        <div className="amp-bar">
          <span className="amp-dots"><i /><i /><i /></span>
          <span className="amp-bar-title">
            Aperçu · SI Groupe (exemple)
            <em>{NODES.length} applications · {EDGES.length} flux · {ZONES.length} domaines</em>
          </span>
          <span className="amp-live"><i /> Temps réel</span>
        </div>

        <div className={`amp-stage ${hovered ? 'has-hover' : ''}`}>
          <svg className="amp-edges" viewBox={`0 0 100 ${100 * ASPECT}`} aria-hidden="true">
            {EDGES.map(([a, b], i) => {
              const A = byId[a], B = byId[b];
              const hot = hovered && (a === hovered || b === hovered);
              const d = `M${A.x} ${A.y * ASPECT} L${B.x} ${B.y * ASPECT}`;
              return (
                <g key={`${a}-${b}`} className={hot ? 'hot' : ''}>
                  <path d={d} vectorEffect="non-scaling-stroke" />
                  {!REDUCED_MOTION && (
                    <circle r="0.6">
                      <animateMotion dur={`${3 + (i % 4) * 0.7}s`} begin={`${(i * 0.37).toFixed(2)}s`} repeatCount="indefinite" path={d} />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {ZONES.map(z => (
            <div key={z.id} className="amp-zone" style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}>
              <span>{z.label}</span>
            </div>
          ))}

          {NODES.map((n, i) => (
            <div
              key={n.id}
              className={`amp-node ${n.status} ${hovered === n.id ? 'is-hover' : ''} ${linked && !linked.has(n.id) ? 'is-dim' : ''}`}
              style={{ left: `${n.x}%`, top: `${n.y}%`, animationDelay: `${i * 0.35}s` }}
              onPointerEnter={() => setHovered(n.id)}
            >
              <i />{n.label}
            </div>
          ))}
        </div>

        <div className="amp-legend">
          {Object.entries(STATUS).map(([k, label]) => (
            <span key={k} className={k}><i />{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
