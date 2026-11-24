import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShoppingCart, Check, BadgeCheck, ShieldCheck, Truck, ReceiptText, SlidersHorizontal, X, MessageCircle, Clock, Calculator, FileText, MapPin } from 'lucide-react';
import businessConfig from '../data/businessConfig';
import { PEST_LANDING, BRAND_LANDING } from '../data/shopLanding';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useBuyer } from '../hooks/useBuyer';
import PackShot from '../components/PackShot';
import { priceInfo, rupees, quoteLink, fmtEnds, PEST_OPTIONS, pestLabel } from '../lib/shop';
import './Shop.css';
import Credentials, { LicenceLine } from '../components/Credentials';

export const BuyerBanner = () => {
  const { user } = useAuth();
  const { buyer } = useBuyer();
  if (buyer?.status === 'approved') {
    return <div className="buyer-banner ok"><BadgeCheck size={18} /> <span><strong>{buyer.firm_name}</strong> — verified PCO buyer. You can order online.</span></div>;
  }
  if (buyer?.status === 'pending') {
    return <div className="buyer-banner wait"><Clock size={18} /> <span>Your PCO buyer application is under review. You can fill your cart now; ordering opens once approved.</span></div>;
  }
  return (
    <div className="buyer-banner">
      <ShieldCheck size={18} />
      <span>Professional products are sold only to <strong>licensed pest control operators</strong>. {buyer?.status === 'rejected' ? 'Your application needs changes.' : 'Create a free PCO buyer account to order.'}</span>
      <Link to="/pco-account" className="btn btn-primary btn-sm">{user ? (buyer?.status === 'rejected' ? 'Update application' : 'Apply as PCO buyer') : 'Create PCO account'}</Link>
    </div>
  );
};

export const AddToCart = ({ product, qty = 1, block = false }) => {
  const { add, has } = useCart();
  const [added, setAdded] = useState(false);
  const info = priceInfo(product);
  if (info.onRequest) {
    return <a className={`btn btn-outline btn-sm ${block ? 'btn-block' : ''}`} href={quoteLink(product)} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} /> Ask price</a>;
  }
  if (!product.in_stock) return <button type="button" className={`btn btn-outline btn-sm ${block ? 'btn-block' : ''}`} disabled>Out of stock</button>;
  return (
    <button type="button" className={`btn btn-primary btn-sm ${block ? 'btn-block' : ''}`} onClick={() => { add(product.id, qty); setAdded(true); setTimeout(() => setAdded(false), 1600); }}>
      {added ? <><Check size={15} /> Added</> : <><ShoppingCart size={15} /> {has(product.id) ? 'Add more' : 'Add to cart'}</>}
    </button>
  );
};

export const Price = ({ product, large = false }) => {
  const info = priceInfo(product);
  if (info.onRequest) return <div className={`price-block ${large ? 'large' : ''}`}><span className="price-request">Price on request</span></div>;
  return (
    <div className={`price-block ${large ? 'large' : ''}`}>
      {info.kind === 'offer' && <span className="price-offer-tag">{info.offer.label || 'Special offer'}{info.offer.ends ? ` · till ${fmtEnds(info.offer.ends)}` : ''}</span>}
      <div className="price-row">
        <span className="price-pay">{rupees(info.pay)}</span>
        {info.kind !== 'mrp' && <><span className="price-mrp">MRP {rupees(info.mrp)}</span><span className="price-off">{info.off}% off</span></>}
      </div>
      <span className="price-note">{{ pco: 'Your PCO price · ', offer: 'Offer price · ', mrp: 'MRP · ' }[info.kind]}incl. of all taxes</span>
    </div>
  );
};

export const ProductCard = ({ p }) => (
  <article className="pcard">
    <Link to={`/shop/${p.slug}`} className="pcard-media" aria-label={`${p.brand} ${p.name} ${p.pack_size}`}>
      <PackShot product={p} />
      {p.formulation && <span className="pcard-chip">{p.formulation}</span>}
      {priceInfo(p).off > 0 && <span className="pcard-deal">{priceInfo(p).off}% off</span>}
    </Link>
    <div className="pcard-body">
      <span className="pcard-brand">{p.brand}</span>
      <Link to={`/shop/${p.slug}`} className="pcard-name">{p.name}</Link>
      <span className="pcard-tech">{p.technical}</span>
      <span className="pcard-pack">{p.pack_size}{p.stock != null && p.stock > 0 && p.stock <= 10 ? <em> · Only {p.stock} left</em> : ''}</span>
      <Price product={p} />
      <AddToCart product={p} block />
    </div>
  </article>
);

const SORTS = [['', 'Featured'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low'], ['name', 'Name A–Z']];

const Shop = () => {
  const [params, setParams] = useSearchParams();
  const brand = params.get('brand') || '';
  const category = params.get('category') || '';
  const pest = params.get('pest') || '';
  const formulation = params.get('formulation') || '';
  const sort = params.get('sort') || '';
  const [q, setQ] = useState(params.get('q') || '');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Built from the address bar itself: navigations render in a transition, so the hook's copy can lag
  // behind and quick taps on several filters would otherwise undo each other.
  const set = (key, value) => {
    const next = new URLSearchParams(typeof window === 'undefined' ? params : window.location.search);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => { const t = setTimeout(() => { if ((params.get('q') || '') !== q) set('q', q.trim()); }, 300); return () => clearTimeout(t); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const query = useMemo(() => new URLSearchParams(Object.entries({ brand, category, pest, formulation, sort, q: params.get('q') || '' }).filter(([, v]) => v)).toString(), [brand, category, pest, formulation, sort, params]);
  useEffect(() => {
    let live = true;
    setError('');
    api(`/products${query ? `?${query}` : ''}`).then((d) => live && setData(d)).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [query]);

  const activeFilters = [pest && ['pest', pestLabel(pest)], brand && ['brand', brand], category && ['category', category], formulation && ['formulation', formulation]].filter(Boolean);

  const Filters = () => (
    <>
      {data?.pests?.length > 0 && (
        <div className="filter-group">
          <h4>Pest</h4>
          <button type="button" className={!pest ? 'active' : ''} onClick={() => set('pest', '')}>All pests</button>
          {data.pests.map((x) => <button type="button" key={x.key} className={pest === x.key ? 'active' : ''} onClick={() => set('pest', x.key)}>{x.label} <span>{x.n}</span></button>)}
        </div>
      )}
      <div className="filter-group">
        <h4>Brand</h4>
        <button type="button" className={!brand ? 'active' : ''} onClick={() => set('brand', '')}>All brands</button>
        {data?.brands.map((b) => <button type="button" key={b.name} className={brand === b.name ? 'active' : ''} onClick={() => set('brand', b.name)}>{b.name} <span>{b.n}</span></button>)}
      </div>
      <div className="filter-group">
        <h4>Category</h4>
        <button type="button" className={!category ? 'active' : ''} onClick={() => set('category', '')}>All categories</button>
        {data?.categories.map((c) => <button type="button" key={c.name} className={category === c.name ? 'active' : ''} onClick={() => set('category', c.name)}>{c.name} <span>{c.n}</span></button>)}
      </div>
      {data?.formulations?.some((f) => f.name) && (
        <div className="filter-group">
          <h4>Formulation</h4>
          <button type="button" className={!formulation ? 'active' : ''} onClick={() => set('formulation', '')}>All formulations</button>
          {data.formulations.filter((f) => f.name).map((f) => <button type="button" key={f.name} className={formulation === f.name ? 'active' : ''} onClick={() => set('formulation', f.name)}>{f.name} <span>{f.n}</span></button>)}
        </div>
      )}
    </>
  );

  return (
    <div className="shop-page">
      <section className="shop-hero">
        <div className="container">
          <span className="eyebrow">PestKill PCO Store</span>
          <h1>Professional chemicals.<br /><span className="text-gradient">Genuine. At MRP or better.</span></h1>
          <p>Authorised products from Envu, Syngenta, Heranba, Arbuda and Kalyani for licensed pest control operators.</p>
          <div className="shop-trust">
            <span><BadgeCheck size={16} /> Genuine, sealed packs</span>
            <span><ReceiptText size={16} /> Invoice with every order</span>
            <span><Truck size={16} /> Dispatched from Jaipur</span>
          </div>
          <LicenceLine kind="sale" />
        </div>
      </section>

      <div className="container shop-wrap">
        <BuyerBanner />

        <div className="shop-pests" role="list" aria-label="Shop by pest">
          {PEST_OPTIONS.map((x) => (
            <button type="button" role="listitem" key={x.key} className={pest === x.key ? 'active' : ''} onClick={() => set('pest', pest === x.key ? '' : x.key)}>
              <strong>{x.label}</strong><span lang="hi">{x.hi}</span>
            </button>
          ))}
        </div>

        <div className="shop-tools">
          <Link to="/shop/dose-calculator"><Calculator size={18} /><span><strong>Dose calculator</strong>How much product for your area</span></Link>
          <Link to="/shop/library"><FileText size={18} /><span><strong>Datasheets &amp; MSDS</strong>Download TDS, MSDS and labels</span></Link>
          <a href={`https://wa.me/${businessConfig.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi PestKill, I need a bulk / trade price for: ')}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /><span><strong>Bulk order</strong>Trade price on WhatsApp</span></a>
          <Link to="/contact"><MapPin size={18} /><span><strong>Visit us in Jaipur</strong>Vidhyadhar Nagar · {businessConfig.workingHours}</span></Link>
        </div>

        <nav className="shop-pricelists" aria-label="Price lists">
          <span>Price lists:</span>
          {Object.entries(PEST_LANDING).map(([k, v]) => <Link key={k} to={`/shop/pest/${k}`}>{v.short}</Link>)}
          {Object.entries(BRAND_LANDING).map(([k, v]) => <Link key={k} to={`/shop/brand/${k}`}>{v.name}</Link>)}
        </nav>

        <div className="shop-toolbar">
          <label className="shop-search"><Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product, brand or active ingredient (e.g. Fipronil)" /></label>
          <select value={sort} onChange={(e) => set('sort', e.target.value)} aria-label="Sort">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm filter-toggle" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} /> Filters{activeFilters.length ? ` (${activeFilters.length})` : ''}</button>
        </div>

        <div className="shop-layout">
          <aside className="shop-filters"><Filters /></aside>
          <div>
            <div className="shop-meta">
              <span>{data ? `${data.products.length} products` : 'Loading products…'}</span>
              {activeFilters.map(([k, v]) => <button type="button" key={k} className="filter-pill" onClick={() => set(k, '')}>{v} <X size={13} /></button>)}
            </div>
            {error && <p className="form-error">{error}</p>}
            {data && data.products.length === 0 && <div className="shop-empty">No products match. <button type="button" className="link-more" onClick={() => { setQ(''); setParams({}, { replace: true }); }}>Clear filters</button></div>}
            <div className="pgrid">
              {!data && !error && Array.from({ length: 8 }, (_, i) => <div key={i} className="pcard skeleton" />)}
              {data?.products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
            <p className="shop-footnote">Product images are illustrations unless a photo is shown; the pack you receive carries the manufacturer's printed MRP, batch number and expiry. Use only as directed on the label and leaflet.</p>
          </div>
        </div>
      </div>

      <Credentials only={['sale']} compact title="Licensed pesticide dealer" intro="Products in this store are sold under our pesticide sale licence, only to licensed pest control operators." />

      {filtersOpen && (
        <div className="filter-sheet" onClick={() => setFiltersOpen(false)}>
          <div className="filter-sheet-panel" onClick={(e) => e.stopPropagation()} data-lenis-prevent>
            <div className="filter-sheet-head"><h3>Filters</h3><button type="button" className="icon-btn" onClick={() => setFiltersOpen(false)} aria-label="Close"><X size={18} /></button></div>
            <Filters />
            <button type="button" className="btn btn-primary btn-block" onClick={() => setFiltersOpen(false)}>Show {data?.products.length ?? ''} products</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
