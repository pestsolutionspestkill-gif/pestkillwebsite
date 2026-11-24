import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, FileText, Download, ChevronDown, Archive, ListChecks, Info, BookOpen, ShieldAlert } from 'lucide-react';
import { productGuide } from '../lib/productGuide';
import { calcDose } from '../lib/shop';
import './ProductExtras.css';

const fmt = (n, d = 1) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: d });
const unitOf = (p) => (/\b(g|gm|gram|kg)\b/i.test(p.pack_size || '') || /\b(WP|WG|WDG|GR|DP)\b/.test(p.formulation || '') ? 'g' : 'ml');

/** Area → diluted solution → product needed, from the label rate staff entered for this product. */
export const DoseCalc = ({ product, initialArea = '' }) => {
  const [area, setArea] = useState(initialArea);
  const dose = product.dose;
  if (!dose?.per_litre || !dose?.solution_per_sqm) return null;
  const unit = unitOf(product);
  const r = calcDose({ areaSqft: area, perLitre: dose.per_litre, solutionPerSqm: dose.solution_per_sqm });
  return (
    <div className="dose-calc">
      <label>
        Area to treat (sq.ft.)
        <input type="number" min="1" inputMode="numeric" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. 1200" />
      </label>
      <div className="dose-out" aria-live="polite">
        {r ? (
          <>
            <div><span>Diluted solution</span><strong>{fmt(r.solution)} litres</strong></div>
            <div><span>{product.name} needed</span><strong>{fmt(r.product, 0)} {unit}</strong></div>
            <div><span>Mix</span><strong>{fmt(dose.per_litre, 2)} {unit} per litre of water</strong></div>
          </>
        ) : <p>Enter the area to see how much product and solution you need.</p>}
      </div>
      <p className="dose-note"><Info size={14} /> Based on the label rate of {fmt(dose.per_litre, 2)} {unit}/litre and {fmt(dose.solution_per_sqm, 2)} litres of solution per m²{dose.note ? ` (${dose.note})` : ''}. Always follow the label and leaflet supplied with the pack.</p>
    </div>
  );
};

const Section = ({ icon: Icon, title, children, open = false }) => (
  <details className="px-section" open={open}>
    <summary><Icon size={18} /> {title}<ChevronDown size={18} className="px-chev" /></summary>
    <div className="px-body">{children}</div>
  </details>
);

/** Extra product information blocks shown below the buy box. */
const ProductExtras = ({ product: p }) => {
  const guide = productGuide(p);
  const faqs = [...(p.faqs || []), ...guide.faqs.filter((g) => !(p.faqs || []).some((f) => f.q === g.q))];
  const steps = (p.how_to_use || '').split('\n').map((x) => x.trim()).filter(Boolean);
  return (
    <div className="px-wrap">
      <Section icon={BookOpen} title="Poori jaankari" open>
        <div className="px-guide" lang="hi-Latn">
          <p>{guide.intro}</p>
          {guide.formulation && <p><strong>{guide.formulation[0]}:</strong> {guide.formulation[1]}</p>}
          {guide.pests.length > 0 && (
            <div className="px-guide-pests">
              {guide.pests.map((x) => <Link key={x.key} to={`/shop/pest/${x.key}`}><strong>{x.label}</strong><span lang="hi">{x.hi}</span></Link>)}
            </div>
          )}
          <ul>{guide.uses.map((u) => <li key={u}>{u}</li>)}</ul>
        </div>
      </Section>
      <Section icon={ShieldAlert} title="Safety aur storage">
        <ul className="px-list">{guide.safety.map((x) => <li key={x}>{x}</li>)}</ul>
      </Section>
      {steps.length > 0 && (
        <Section icon={ListChecks} title="How to use" open>
          {steps.length > 1 ? <ol>{steps.map((s) => <li key={s}>{s}</li>)}</ol> : <p>{steps[0]}</p>}
        </Section>
      )}
      {p.dose && (
        <Section icon={Calculator} title="Dose calculator" open={!steps.length}>
          <DoseCalc product={p} />
        </Section>
      )}
      {p.documents?.length > 0 && (
        <Section icon={FileText} title="Downloads" open>
          <ul className="px-docs">
            {p.documents.map((d) => (
              <li key={d.kind}><a href={d.url} target="_blank" rel="noopener noreferrer"><Download size={16} /> {d.title} <small>PDF · {Math.max(1, Math.round(d.size / 1024))} KB</small></a></li>
            ))}
          </ul>
        </Section>
      )}
      {p.storage_info && <Section icon={Archive} title="Storage & shelf life"><p>{p.storage_info}</p></Section>}
      {faqs.length > 0 && (
        <div className="px-faq">
          <h2>Questions about {p.name}</h2>
          {faqs.map((f) => (
            <details key={f.q}><summary>{f.q}<ChevronDown size={18} className="px-chev" /></summary><p>{f.a}</p></details>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductExtras;
