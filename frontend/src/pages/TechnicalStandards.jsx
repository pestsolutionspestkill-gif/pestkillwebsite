// Public reference list of technical standards (BIS codes of practice) relevant to our work.
// Each entry shows how it was checked; listing a standard is not a claim of certification.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ExternalLink, Info } from 'lucide-react';
import { api } from '../lib/api';
import Credentials from '../components/Credentials';
import './TechnicalStandards.css';

const STATUS = {
  verified_official: { label: 'Checked on the official BIS portal', tone: 'ok' },
  archived_copy: { label: 'Checked against an archived copy of the standard', tone: 'info' },
  not_confirmed: { label: 'Not confirmed', tone: 'warn' },
};
const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

const TechnicalStandards = () => {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api('/standards').then(setRows).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="std-page">
      <section className="std-hero">
        <div className="container">
          <span className="eyebrow">Technical reference</span>
          <h1>Technical standards</h1>
          <p>Indian Standards that relate to anti-termite work in buildings, with where each detail was checked. Product dilutions and application rates always come from the product&apos;s approved label, never from this list.</p>
        </div>
      </section>

      <section className="section-sm">
        <div className="container std-wrap">
          <p className="std-note"><Info size={16} /> This is a reference list. Showing a standard here does not mean PestKill holds a BIS certificate for it. The current edition, amendments and reaffirmation of each standard should be confirmed on the <a href="https://www.bis.gov.in/" target="_blank" rel="noopener noreferrer">BIS portal</a>.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          {!rows && !error && <p className="std-loading"><span className="spinner" /> Loading standards…</p>}
          {rows && rows.length === 0 && <p>No standards published yet.</p>}
          <div className="std-list">
            {(rows || []).map((s) => {
              const st = STATUS[s.verification_status] || STATUS.not_confirmed;
              return (
                <article key={s.id} className="std-card">
                  <header>
                    <span className="std-ico" aria-hidden="true"><BookOpen size={20} /></span>
                    <div>
                      <h2>{s.code}</h2>
                      <p>{s.title}</p>
                    </div>
                  </header>
                  <dl>
                    {s.edition && <div><dt>Edition</dt><dd>{s.edition}</dd></div>}
                    {s.scope && <div><dt>Scope</dt><dd>{s.scope}</dd></div>}
                    {s.applies_to && <div><dt>Applies to</dt><dd>{s.applies_to}</dd></div>}
                    {s.amendment_status && <div><dt>Amendments</dt><dd>{s.amendment_status}</dd></div>}
                    <div><dt>Checked</dt><dd><span className={`std-chip is-${st.tone}`}>{st.label}</span>{s.verified_on ? ` · ${fmt(s.verified_on)}` : ''}</dd></div>
                    {s.source_note && <div><dt>Source</dt><dd>{s.source_note}</dd></div>}
                  </dl>
                  {s.source_url && <a className="std-src" href={s.source_url} target="_blank" rel="noopener noreferrer">View source <ExternalLink size={14} /></a>}
                </article>
              );
            })}
          </div>
          <p className="std-more">Need the label rate for a product? Use the <Link to="/shop/dose-calculator">dose calculator</Link> (verified label data only) or download the label and SDS from the <Link to="/shop/library">documents library</Link>.</p>
        </div>
      </section>

      <Credentials />
    </div>
  );
};

export default TechnicalStandards;
