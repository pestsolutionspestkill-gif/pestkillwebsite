import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calculator, FileText, Download, Search, ArrowLeft, Info } from 'lucide-react';
import { api } from '../lib/api';
import { DoseCalc } from '../components/ProductExtras';
import '../components/ProductExtras.css';
import './Shop.css';

const Back = () => <Link to="/shop" className="tools-back"><ArrowLeft size={16} /> Back to shop</Link>;

/** /shop/dose-calculator: pick a product (or ?p=<slug>) and an area; uses the product's label rate. */
export const DoseCalculator = () => {
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const slug = params.get('p') || '';

  useEffect(() => {
    api('/products').then((d) => setList(d.products.filter((p) => p.dose))).catch((e) => setError(e.message));
  }, []);
  const product = useMemo(() => list?.find((p) => p.slug === slug) || list?.[0] || null, [list, slug]);

  return (
    <div className="tools-page">
      <div className="container tools-wrap">
        <Back />
        <span className="eyebrow"><Calculator size={15} /> Dose calculator</span>
        <h1>How much product do you need?</h1>
        <p className="tools-lead">Choose the product and enter the area. We work out the diluted solution and the quantity of product from the rate printed on its label.</p>
        {error && <p className="form-error">{error}</p>}
        {!list && !error && <span className="spinner" />}
        {list?.length === 0 && (
          <div className="tools-empty"><Info size={18} /> Label rates are being added to the catalogue. Until then, follow the dose on the product label, or ask us on WhatsApp.</div>
        )}
        {product && (
          <div className="tools-card">
            <label className="tools-select">Product
              <select value={product.slug} onChange={(e) => setParams({ p: e.target.value }, { replace: true })}>
                {list.map((p) => <option key={p.id} value={p.slug}>{p.brand} {p.name} ({p.pack_size})</option>)}
              </select>
            </label>
            <DoseCalc key={product.id} product={product} />
            <Link to={`/shop/${product.slug}`} className="link-more">View {product.name} →</Link>
          </div>
        )}
      </div>
    </div>
  );
};

/** /shop/library: every datasheet, safety data sheet and label, searchable. */
export const DocumentLibrary = () => {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => { api('/products/documents').then(setDocs).catch((e) => setError(e.message)); }, []);
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const map = new Map();
    for (const d of docs || []) {
      if (needle && ![d.brand, d.name, d.technical].join(' ').toLowerCase().includes(needle)) continue;
      const key = `${d.brand} ${d.name}`;
      if (!map.has(key)) map.set(key, { ...d, docs: [] });
      map.get(key).docs.push(d);
    }
    return [...map.values()];
  }, [docs, q]);

  return (
    <div className="tools-page">
      <div className="container tools-wrap">
        <Back />
        <span className="eyebrow"><FileText size={15} /> Downloads library</span>
        <h1>Datasheets, MSDS and labels</h1>
        <p className="tools-lead">Technical datasheets (TDS), safety data sheets (MSDS) and labels for the products we sell. Free to download.</p>
        <label className="shop-search tools-search"><Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by product, brand or active ingredient" /></label>
        {error && <p className="form-error">{error}</p>}
        {!docs && !error && <span className="spinner" />}
        {docs?.length === 0 && <div className="tools-empty"><Info size={18} /> Documents are being added. Ask us on WhatsApp for any datasheet you need.</div>}
        <div className="lib-list">
          {groups.map((g) => (
            <article key={`${g.brand}-${g.name}`} className="lib-item">
              <div>
                <span className="pcard-brand">{g.brand}</span>
                <Link to={`/shop/${g.slug}`}><strong>{g.name}</strong></Link>
                {g.technical && <small>{g.technical}</small>}
              </div>
              <div className="lib-docs">
                {g.docs.map((d) => <a key={d.kind} href={d.url} target="_blank" rel="noopener noreferrer"><Download size={15} /> {d.kind.toUpperCase()}</a>)}
              </div>
            </article>
          ))}
          {docs?.length > 0 && groups.length === 0 && <p className="tools-empty">No documents match “{q}”.</p>}
        </div>
      </div>
    </div>
  );
};
