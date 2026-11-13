import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import {
  Network, Database, Cloud, Server, Shield, BarChart3, Code2, Smartphone,
  GitMerge, Monitor, Building2, FileSearch, Settings2, Globe, Layers,
  Cpu, Workflow, Users, Zap, Lock, Boxes, Radio, BrainCircuit, Landmark,
  FolderKanban,
} from 'lucide-react';

// ─── Icon catalogue ───────────────────────────────────────────────────────────

export const PROJECT_ICONS = [
  { id: 'Network',      label: 'Réseau',       Icon: Network },
  { id: 'Layers',       label: 'Architecture',  Icon: Layers },
  { id: 'Database',     label: 'Base de données',Icon: Database },
  { id: 'Server',       label: 'Serveur',       Icon: Server },
  { id: 'Cloud',        label: 'Cloud',         Icon: Cloud },
  { id: 'Cpu',          label: 'Infrastructure',Icon: Cpu },
  { id: 'Monitor',      label: 'Supervision',   Icon: Monitor },
  { id: 'Shield',       label: 'Sécurité',      Icon: Shield },
  { id: 'Lock',         label: 'Conformité',    Icon: Lock },
  { id: 'Code2',        label: 'Développement', Icon: Code2 },
  { id: 'GitMerge',     label: 'Intégration',   Icon: GitMerge },
  { id: 'Workflow',     label: 'Processus',     Icon: Workflow },
  { id: 'BarChart3',    label: 'Analytique',    Icon: BarChart3 },
  { id: 'BrainCircuit', label: 'IA / Données',  Icon: BrainCircuit },
  { id: 'Globe',        label: 'Web / SaaS',    Icon: Globe },
  { id: 'Smartphone',   label: 'Mobile',        Icon: Smartphone },
  { id: 'Boxes',        label: 'Applicatif',    Icon: Boxes },
  { id: 'Landmark',     label: 'Institution',   Icon: Landmark },
  { id: 'Building2',    label: 'Entreprise',    Icon: Building2 },
  { id: 'Users',        label: 'Organisation',  Icon: Users },
  { id: 'Radio',        label: 'Télécoms',      Icon: Radio },
  { id: 'FileSearch',   label: 'Audit / Due dil.',Icon: FileSearch },
  { id: 'Settings2',    label: 'Configuration', Icon: Settings2 },
  { id: 'FolderKanban', label: 'Projet',        Icon: FolderKanban },
  { id: 'Zap',          label: 'Performance',   Icon: Zap },
];

// ─── Colour palette ───────────────────────────────────────────────────────────

export const PROJECT_COLORS = [
  { id: 'indigo',   hex: '#6366F1', label: 'Indigo'    },
  { id: 'blue',     hex: '#2563EB', label: 'Bleu'      },
  { id: 'teal',     hex: '#0891B2', label: 'Bleu canard' },
  { id: 'green',    hex: '#059669', label: 'Vert'      },
  { id: 'emerald',  hex: '#10B981', label: 'Émeraude'  },
  { id: 'orange',   hex: '#EA580C', label: 'Orange'    },
  { id: 'red',      hex: '#DC2626', label: 'Rouge'     },
  { id: 'rose',     hex: '#DB2777', label: 'Rose'      },
  { id: 'purple',   hex: '#7C3AED', label: 'Violet'    },
  { id: 'amber',    hex: '#D97706', label: 'Ambre'     },
  { id: 'slate',    hex: '#475569', label: 'Ardoise'   },
  { id: 'pink',     hex: '#EC4899', label: 'Rose vif'  },
];

// ─── Helper: resolve icon component from id string ───────────────────────────

export function getIconComponent(iconId) {
  return PROJECT_ICONS.find(i => i.id === iconId)?.Icon || Network;
}

// ─── Picker component ─────────────────────────────────────────────────────────

export default function ProjectAppearancePicker({ color, icon, logo, onChange }) {
  const fileRef = useRef();

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 128;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        onChange({ color, icon, logo: canvas.toDataURL('image/png') });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Logo upload ── */}
      <div>
        <label className="lbl" style={{ marginBottom: 8, display: 'block' }}>Logo du projet <span className="t4" style={{ fontSize: 11 }}>(optionnel)</span></label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Preview */}
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--r4)', flexShrink: 0,
            border: '1.5px dashed var(--border-md)', background: 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {logo
              ? <img src={logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <Upload size={18} color="var(--t4)" strokeWidth={1.5} />
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button type="button" onClick={() => fileRef.current.click()}
              className="btn btn-s btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Upload size={12} strokeWidth={2} />
              {logo ? 'Changer' : 'Importer un logo'}
            </button>
            {logo && (
              <button type="button" onClick={() => onChange({ color, icon, logo: null })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <X size={11} strokeWidth={2} /> Supprimer
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
        </div>
      </div>

      {/* ── Colour row ── */}
      <div>
        <label className="lbl" style={{ marginBottom: 8, display: 'block' }}>Couleur</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PROJECT_COLORS.map(c => (
            <button
              key={c.id}
              type="button"
              title={c.label}
              onClick={() => onChange({ color: c.hex, icon, logo })}
              style={{
                width: 26, height: 26, borderRadius: '50%',
                background: c.hex, border: 'none', cursor: 'pointer',
                outline: color === c.hex ? `3px solid ${c.hex}` : '3px solid transparent',
                outlineOffset: 2,
                boxShadow: color === c.hex ? `0 0 0 1px white, 0 0 0 3px ${c.hex}` : 'none',
                transition: 'box-shadow 0.12s, outline 0.12s',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Icon grid ── */}
      <div>
        <label className="lbl" style={{ marginBottom: 8, display: 'block' }}>Icône</label>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6,
          maxHeight: 180, overflowY: 'auto', paddingRight: 2,
        }}>
          {PROJECT_ICONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => onChange({ color, icon: id, logo })}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '7px 4px', border: '1.5px solid',
                borderColor: icon === id ? color : 'var(--border)',
                borderRadius: 'var(--r3)', background: icon === id ? `${color}15` : 'transparent',
                cursor: 'pointer', transition: 'all 0.12s',
              }}
            >
              <Icon size={18} color={icon === id ? color : 'var(--t3)'} strokeWidth={1.6} />
              <span style={{ fontSize: 8.5, color: icon === id ? color : 'var(--t4)', lineHeight: 1.2, textAlign: 'center' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
