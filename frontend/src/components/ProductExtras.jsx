import { Link } from 'react-router-dom';
import { Calculator, FileText, Download, Eye, ChevronDown, Archive, ListChecks, BookOpen, ShieldAlert, AlertTriangle, BadgeCheck } from 'lucide-react';
import { productGuide } from '../lib/productGuide';
import businessConfig from '../data/businessConfig';
import './ProductExtras.css';

const day = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null);
const kb = (n) => `${Math.max(1, Math.round(n / 1024))} KB`;

const Section = ({ icon: Icon, title, children, open = false }) => (
  <details className="px-section" open={open}>
    <summary><Icon size={18} /> {title}<ChevronDown size={18} className="px-chev" /></summary>
    <div className="px-body">{children}</div>
  </details>
);

/** Technical documents: type, version, dates, view and download, or an honest "not available". */
const Documents = ({ product: p }) => {
  const wa = `https://wa.me/${businessConfig.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi PestKill, please share the SDS / label for ${p.brand} ${p.name}.`)}`;
  if (!p.documents?.length) {
    return (
      <p className="px-empty"><AlertTriangle size={15} /> No SDS, label or datasheet has been uploaded for this product yet. <a href={wa} target="_blank" rel="noopener noreferrer">Request a copy on WhatsApp</a>.</p>
    );
  }
  return (
    <ul className="px-docs">
      {p.documents.map((d) => (
        <li key={d.id}>
          <div className="px-doc-meta">
            <strong>{d.title}</strong>
            <span>{d.type}{d.version ? ` · Version ${d.version}` : ''}{d.manufacturer ? ` · ${d.manufacturer}` : ''}</span>
            <span>Updated {day(d.updated_at)}{d.revision_date ? ` · Revised ${day(d.revision_date)}` : ''} · {d.mime === 'application/pdf' ? 'PDF' : 'Image'}, {kb(d.size)}</span>
          </div>
          <div className="px-doc-actions">
            <a href={d.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${d.title}`}><Eye size={15} /> View</a>
            <a href={d.download_url} aria-label={`Download ${d.title}`}><Download size={15} /> Download</a>
          </div>
        </li>
      ))}
    </ul>
  );
};

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
      <Section icon={FileText} title={`Technical documents${p.documents?.length ? ` (${p.documents.length})` : ''}`} open>
        <Documents product={p} />
      </Section>
      <Section icon={Calculator} title="Dosage">
        {p.doses?.length ? (
          <ul className="px-dose-list">
            {p.doses.map((d) => (
              <li key={d.id}>
                <BadgeCheck size={16} />
                <span><strong>{d.activity_label}</strong> · {d.method}</span>
                <Link to={`/shop/dose-calculator?activity=${d.activity}&record=${d.id}`} className="px-dose-link">Calculate</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-empty"><AlertTriangle size={15} /> Verified label dosage for this product has not been added to the calculator yet. Use the dose printed on the pack label.</p>
        )}
      </Section>
      <Section icon={ShieldAlert} title="Safety aur storage">
        <ul className="px-list">{guide.safety.map((x) => <li key={x}>{x}</li>)}</ul>
      </Section>
      {steps.length > 0 && (
        <Section icon={ListChecks} title="How to use">
          {steps.length > 1 ? <ol>{steps.map((s) => <li key={s}>{s}</li>)}</ol> : <p>{steps[0]}</p>}
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
