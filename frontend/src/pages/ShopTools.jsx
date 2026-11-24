import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Eye, Search, ArrowLeft, Info } from 'lucide-react';
import { api } from '../lib/api';
import './Shop.css';

const KINDS = [['', 'All types'], ['msds', 'SDS / MSDS'], ['label', 'Labels'], ['tds', 'Datasheets'], ['certificate', 'Certificates'], ['other', 'Other']];
const day = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/** /shop/library: every technical document visitors may see, searchable and filterable by type. */
export const DocumentLibrary = () => {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('');
  useEffect(() => { api('/documents').then(setDocs).catch((e) => setError(e.message)); }, []);
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const map = new Map();
    for (const d of docs || []) {
      if (kind && d.kind !== kind) continue;
      if (needle && ![d.product?.brand, d.product?.name, d.product?.technical, d.title].join(' ').toLowerCase().includes(needle)) continue;
      const key = `${d.product.brand} ${d.product.name}`;
      if (!map.has(key)) map.set(key, { product: d.product, docs: [] });
      map.get(key).docs.push(d);
    }
    return [...map.values()];
  }, [docs, q, kind]);

  return (
    <div className="tools-page">
      <div className="container tools-wrap">
        <Link to="/shop" className="tools-back"><ArrowLeft size={16} /> Back to shop</Link>
        <span className="eyebrow"><FileText size={15} /> Downloads library</span>
        <h1>SDS, labels and technical documents</h1>
        <p className="tools-lead">Safety data sheets, labels, technical datasheets and certificates for the products we sell, as supplied by the manufacturers. Free to view and download.</p>
        <div className="lib-filters">
          <label className="shop-search tools-search"><Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by product, brand or active ingredient" aria-label="Search documents" /></label>
          <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Document type">{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </div>
        {error && <p className="form-error">{error}</p>}
        {!docs && !error && <span className="spinner" />}
        {docs?.length === 0 && <div className="tools-empty"><Info size={18} /> No documents have been uploaded yet. Ask us on WhatsApp for any SDS or label you need.</div>}
        <div className="lib-list">
          {groups.map((g) => (
            <article key={`${g.product.brand}-${g.product.name}`} className="lib-item">
              <div>
                <span className="pcard-brand">{g.product.brand}</span>
                <Link to={`/shop/${g.product.slug}`}><strong>{g.product.name}</strong></Link>
                {g.product.technical && <small>{g.product.technical}</small>}
              </div>
              <ul className="lib-docs">
                {g.docs.map((d) => (
                  <li key={d.id}>
                    <span className="lib-doc-title">{d.type}{d.version ? ` · v${d.version}` : ''}<small>Updated {day(d.updated_at)}</small></span>
                    <a href={d.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${d.title}`}><Eye size={15} /> View</a>
                    <a href={d.download_url} aria-label={`Download ${d.title}`}><Download size={15} /> Download</a>
                  </li>
                ))}
              </ul>
            </article>
          ))}
          {docs?.length > 0 && groups.length === 0 && <p className="tools-empty">No documents match your search.</p>}
        </div>
      </div>
    </div>
  );
};
