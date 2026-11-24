// Business licences shown across the site.
// The numbers come from businessConfig (so pre-rendered pages always carry them) and are then
// refreshed from /api/licences, where the owner manages visibility, the licence copy and its
// verification. Issuing authority and validity appear only after the owner has verified them
// against the licence copy; nothing here is filled in by the website itself.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, FileText, ShieldCheck, Store } from 'lucide-react';
import businessConfig from '../data/businessConfig';
import { api } from '../lib/api';
import './Credentials.css';

const FALLBACK = businessConfig.licences.map((l) => ({ ...l, status: 'unverified', has_document: false, document_url: null }));

let cache = null;
let pending = null;
const loadLicences = () => {
  if (cache) return Promise.resolve(cache);
  pending ||= api('/licences').then((rows) => { cache = Array.isArray(rows) ? rows : null; return cache; }).catch(() => null).finally(() => { pending = null; });
  return pending;
};

/** Licences to display. Starts with the configured numbers; replaced by the admin-managed list once loaded. */
export const useLicences = () => {
  const [list, setList] = useState(cache || FALLBACK);
  useEffect(() => {
    let live = true;
    loadLicences().then((rows) => { if (live && rows) setList(rows); });
    return () => { live = false; };
  }, []);
  return list;
};

const ICONS = { pco: ShieldCheck, sale: Store };
const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

const Card = ({ l }) => {
  const Icon = ICONS[l.key] || BadgeCheck;
  const verified = l.status === 'verified';
  return (
    <article className="cred-card" data-licence={l.key}>
      <span className="cred-ico" aria-hidden="true"><Icon size={22} /></span>
      <div className="cred-body">
        <h3>{l.title}</h3>
        <p className="cred-no"><span className="sr-only">Licence number </span><span translate="no">{l.number}</span></p>
        <dl>
          <div><dt>Covers</dt><dd>{l.activity}</dd></div>
          {verified && l.issuing_authority && <div><dt>Issued by</dt><dd>{l.issuing_authority}</dd></div>}
          {verified && (l.valid_from || l.valid_until) && (
            <div><dt>Valid</dt><dd>{[fmt(l.valid_from), fmt(l.valid_until)].filter(Boolean).join(' – ')}</dd></div>
          )}
        </dl>
        <p className={`cred-status ${verified ? 'is-ok' : ''}`}>
          {verified ? <><BadgeCheck size={14} /> Details checked against the licence copy</> : 'Licence copy available on request'}
        </p>
        {l.has_document && l.document_url && (
          <a className="cred-view" href={l.document_url} target="_blank" rel="noopener noreferrer"><FileText size={15} /> View licence</a>
        )}
      </div>
    </article>
  );
};

/**
 * "Licensed Operations & Professional Credentials" section.
 * only: limit to licence keys, e.g. ['pco'] on service pages, ['sale'] on the shop.
 */
export const Credentials = ({ id, only, compact = false, title = 'Licensed Operations & Professional Credentials', intro }) => {
  const list = useLicences().filter((l) => !only || only.includes(l.key));
  if (!list.length) return null;
  return (
    <section id={id} className={`cred-section ${compact ? 'is-compact' : ''}`} aria-labelledby={`${id || 'cred'}-title`}>
      <div className="container">
        <div className="cred-head">
          <span className="eyebrow">Credentials</span>
          <h2 id={`${id || 'cred'}-title`}>{title}</h2>
          <p>{intro || 'PestKill Pest Solutions operates under the licences below. Ask us for a copy at any time, or check it with the issuing office.'}</p>
        </div>
        <div className="cred-grid">{list.map((l) => <Card key={l.key} l={l} />)}</div>
      </div>
    </section>
  );
};

/** One-line licence mention for forms, product pages and the footer. */
export const LicenceLine = ({ kind, className = '' }) => {
  const l = useLicences().find((x) => x.key === kind);
  if (!l) return null;
  return (
    <p className={`lic-line ${className}`} data-licence={l.key}>
      <BadgeCheck size={15} aria-hidden="true" />
      <span>{l.title}: <strong translate="no">{l.number}</strong></span>
      {l.has_document && l.document_url && <a href={l.document_url} target="_blank" rel="noopener noreferrer">View</a>}
    </p>
  );
};

export const CredentialsLink = () => <Link to="/about#credentials">Licences &amp; credentials</Link>;

export default Credentials;
