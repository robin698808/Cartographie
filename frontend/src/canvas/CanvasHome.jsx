import { useRef, useState } from 'react';
import { LogoMark } from '../components/Logo';
import {
  Upload, Sparkles, FolderOpen, FileSpreadsheet, Download, Sun, Moon, ArrowRight,
  ScanSearch, Columns3, Network, GitCompareArrows, MousePointerClick,
} from 'lucide-react';
import './CanvasHome.css';

const IMPORT_EXT = ['.csv', '.tsv', '.txt', '.xlsx', '.xls', '.xlsm', '.xlsb', '.ods'];
const IMPORT_FORMATS = ['XLSX', 'CSV', 'XLS', 'ODS', 'TSV'];

const STEPS = [
  { Icon: Upload,           label: 'Importer',   desc: 'Votre inventaire' },
  { Icon: Columns3,         label: 'Mapper',     desc: 'Colonnes détectées' },
  { Icon: Network,          label: 'Visualiser', desc: 'Applications & flux' },
  { Icon: GitCompareArrows, label: 'Décider',    desc: 'Plan de rationalisation' },
];

const TEMPLATE_COLUMNS = {
  deal: ['Application', 'Domaine', 'Criticité', 'Statut Day 1', 'Statut Day 2', 'Flux', 'Coûts (option)'],
  cartographie: ['Application', 'Domaine', 'Statut', 'Coût annuel/mensuel', 'Type de coût (OPEX/CAPEX)', 'Licences', 'Hébergement', 'Type d\'app', 'Fin de service', 'Flux'],
};
const TEMPLATE_DESC = {
  deal: 'Un fichier pré-formaté avec exemples et instructions, incluant la trajectoire Day 1 / Day 2 et, en option, coûts, hébergement et fin de service.',
  cartographie: 'Un fichier pré-formaté avec exemples et instructions, incluant coûts annuels/mensuels (OPEX/CAPEX), hébergement, type d\'application et fin de mise en service.',
};

const PROJECT_LABELS = { deal: 'Projet Deal IT/TECH', cartographie: 'Projet IT/SI' };

const hasExt = (file, exts) => exts.some(e => file.name.toLowerCase().endsWith(e));

/* Carte d'action : halo qui suit le curseur, glisser-déposer optionnel */
function ActionCard({ tone, Icon, title, desc, cta, accept, exts, onFile, onClick, children }) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');
  const isFile = Boolean(onFile);

  const spot = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const pick = (file) => {
    if (!file) return;
    if (exts && !hasExt(file, exts)) { setError(`Format non pris en charge (${file.name})`); return; }
    setError('');
    onFile(file);
  };

  const dropProps = isFile ? {
    onDragOver:  (e) => { e.preventDefault(); setDrag(true); },
    onDragLeave: () => setDrag(false),
    onDrop:      (e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); },
  } : {};

  const body = (
    <>
      <span className="ch-card-glow" />
      <span className={`ch-card-ico ch-${tone}`}><Icon size={22} strokeWidth={1.9} /></span>
      <span className="ch-card-text">
        <strong>{title}</strong>
        <small>{drag ? 'Déposez le fichier ici' : desc}</small>
      </span>
      {children}
      {error && <span className="ch-card-error">{error}</span>}
      <span className="ch-card-cta">{drag ? 'Relâcher pour importer' : cta} <ArrowRight size={14} /></span>
    </>
  );

  const cls = `ch-card ch-card-${tone} ${drag ? 'is-drag' : ''}`;

  return isFile ? (
    <label className={cls} onPointerMove={spot} {...dropProps}>
      {body}
      <input type="file" accept={accept} onChange={(e) => { pick(e.target.files[0]); e.target.value = ''; }} />
    </label>
  ) : (
    <button type="button" className={cls} onPointerMove={spot} onClick={onClick}>{body}</button>
  );
}

export default function CanvasHome({ isDark, onToggleTheme, projectType, onImportFile, onScratch, onLoadJson, onDownloadTemplate }) {
  const rootRef = useRef(null);
  const typeLabel = PROJECT_LABELS[projectType] || PROJECT_LABELS.deal;

  return (
    <div ref={rootRef} className="ch" data-theme={isDark ? 'dark' : 'light'}>
      <div className="ch-bg" aria-hidden="true">
        <i className="ch-blob ch-blob-a" /><i className="ch-blob ch-blob-b" /><i className="ch-blob ch-blob-c" />
        <span className="ch-grid" />
      </div>

      <button type="button" className="ch-theme" onClick={onToggleTheme} role="switch" aria-checked={isDark} aria-label="Basculer entre mode clair et mode sombre">
        <span className={`ch-theme-knob ${isDark ? 'is-dark' : ''}`} />
        <span className={!isDark ? 'on' : ''}><Sun size={14} /> Clair</span>
        <span className={isDark ? 'on' : ''}><Moon size={14} /> Sombre</span>
      </button>

      <main className="ch-main">
        <header className="ch-hero">
          <div className="ch-logo"><LogoMark size={64} /></div>
          <span className="ch-chip">{typeLabel}</span>
          <h1>Démarrez votre cartographie</h1>
          <p>Importez votre inventaire applicatif, partez d'une page blanche ou reprenez un projet existant.</p>
        </header>

        <ol className="ch-steps" aria-label="Étapes">
          {STEPS.map(({ Icon, label, desc }, i) => (
            <li key={label} style={{ '--i': i }}>
              <span className="ch-step-ico"><Icon size={16} /></span>
              <span><strong>{label}</strong><small>{desc}</small></span>
            </li>
          ))}
        </ol>

        <section className="ch-cards">
          <ActionCard
            tone="blue" Icon={Upload} title="Importer un fichier"
            desc="Glissez-déposez votre inventaire : les colonnes sont reconnues automatiquement."
            cta="Choisir un fichier" accept={IMPORT_EXT.join(',')} exts={IMPORT_EXT} onFile={onImportFile}
          >
            <span className="ch-formats">{IMPORT_FORMATS.map(f => <em key={f}>{f}</em>)}</span>
          </ActionCard>

          <ActionCard
            tone="violet" Icon={Sparkles} title="Page blanche"
            desc="Un canvas vide : ajoutez vos applications et vos flux à la main."
            cta="Ouvrir un canvas vide" onClick={onScratch}
          >
            <span className="ch-hint"><MousePointerClick size={13} /> Idéal pour un petit périmètre</span>
          </ActionCard>

          <ActionCard
            tone="teal" Icon={FolderOpen} title="Reprendre un export"
            desc="Rechargez un projet sauvegardé au format JSON."
            cta="Choisir un fichier .json" accept=".json" exts={['.json']} onFile={onLoadJson}
          >
            <span className="ch-formats"><em>JSON</em></span>
          </ActionCard>
        </section>

        <section className="ch-template">
          <span className="ch-template-ico"><FileSpreadsheet size={24} strokeWidth={1.7} /></span>
          <div className="ch-template-text">
            <strong>Template Excel</strong>
            <small>{TEMPLATE_DESC[projectType] || TEMPLATE_DESC.deal}</small>
            <span className="ch-cols">{(TEMPLATE_COLUMNS[projectType] || TEMPLATE_COLUMNS.deal).map(c => <em key={c}>{c}</em>)}<em>…</em></span>
          </div>
          <button type="button" className="ch-btn" onClick={onDownloadTemplate}><Download size={15} /> Télécharger .xlsx</button>
        </section>

        <p className="ch-foot"><ScanSearch size={13} /> Votre travail est sauvegardé automatiquement toutes les 30 secondes.</p>
      </main>
    </div>
  );
}
