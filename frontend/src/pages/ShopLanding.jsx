import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, MessageCircle, Calculator, FileText, BadgeCheck, MapPin, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { priceInfo } from '../lib/shop';
import { usePreloaded } from '../lib/preload';
import { PEST_LANDING, BRAND_LANDING, landingApiPath } from '../data/shopLanding';
import { CITIES, cityPath } from '../data/rajasthan';
import businessConfig from '../data/businessConfig';
import { ProductCard, BuyerBanner } from './Shop';
import './Shop.css';
import './ShopLanding.css';

const wa = (text) => `https://wa.me/${businessConfig.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;

/** /shop/pest/:key and /shop/brand/:key: keyword landing pages with the live product list. */
const ShopLanding = ({ kind }) => {
  const { key } = useParams();
  const info = kind === 'pest' ? PEST_LANDING[key] : BRAND_LANDING[key];
  const path = info ? landingApiPath(kind, key) : null;
  const preloaded = usePreloaded(path);
  // Keep the list together with the path it belongs to, so switching pages never shows the old list.
  const [state, setState] = useState({ path, data: preloaded });
  const data = state.path === path ? state.data : null;
  const [error, setError] = useState('');

  useEffect(() => {
    if (!path) return undefined;
    let live = true;
    setError('');
    api(path).then((d) => live && setState({ path, data: d })).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [path]);

  if (!info) return <Navigate to="/shop" replace />;
  const title = kind === 'pest' ? info.name : `${info.name} Pest Control Products`;
  const products = data?.products || [];
  const brands = [...new Set(products.map((p) => p.brand))];
  const priced = products.map(priceInfo).filter((i) => !i.onRequest);
  const low = priced.length ? Math.min(...priced.map((i) => i.pay)) : null;
  const otherPests = Object.entries(PEST_LANDING).filter(([k]) => !(kind === 'pest' && k === key));
  const otherBrands = Object.entries(BRAND_LANDING).filter(([k]) => !(kind === 'brand' && k === key));

  return (
    <div className="shop-page sl-page">
      <section className="sl-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/shop">PCO Shop</Link><ChevronRight size={14} />
            <span>{kind === 'pest' ? 'By pest' : 'By brand'}</span><ChevronRight size={14} />
            <span aria-current="page">{kind === 'pest' ? info.short : info.name}</span>
          </nav>
          <h1>{title}{kind === 'pest' && <span className="sl-hi" lang="hi">{info.hi}</span>}</h1>
          <p className="sl-lead">{kind === 'pest' ? info.intro : info.blurb}</p>
          <div className="sl-facts">
            <span><strong>{data ? products.length : '…'}</strong> products</span>
            {kind === 'pest' && <span><strong>{data ? brands.length : '…'}</strong> brands</span>}
            {low != null && <span>From <strong>₹{low.toLocaleString('en-IN')}</strong></span>}
            <span><BadgeCheck size={15} /> Genuine sealed packs · Invoice with every order</span>
          </div>
          <div className="sl-actions">
            <a className="btn btn-primary" href={wa(`Hi PestKill, I need a price list for ${title}.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> Get price list on WhatsApp</a>
            <Link to="/shop/dose-calculator" className="btn btn-white"><Calculator size={17} /> Dose calculator</Link>
            <Link to="/shop/library" className="btn btn-white"><FileText size={17} /> TDS &amp; MSDS</Link>
          </div>
        </div>
      </section>

      <div className="container shop-wrap">
        <BuyerBanner />
        {kind === 'pest' && (
          <div className="sl-ingredients">
            <span>Popular active ingredients</span>
            {info.ingredients.map((x) => <Link key={x} to={`/shop?q=${encodeURIComponent(x.split(' ')[0])}`}>{x}</Link>)}
          </div>
        )}
        {error && <p className="form-error">{error}</p>}
        <div className="pgrid sl-grid">
          {!data && !error && Array.from({ length: 6 }, (_, i) => <div key={i} className="pcard skeleton" />)}
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>

        {kind === 'pest' && (
          <section className="sl-section" lang="hi-Latn">
            <h2>{info.short}: kharidne se pehle</h2>
            <p>{info.hinglish}</p>
            <p>Sabhi products sirf licensed pest control operators (PCO) ke liye hain. PCO account banakar licence verify karwaiye; uske baad online order, GST invoice aur trade price milta hai. Order Jaipur se dispatch hote hain.</p>
          </section>
        )}

        {kind === 'pest' && info.faqs.length > 0 && (
          <section className="sl-section">
            <h2>Questions about {info.short.toLowerCase()}</h2>
            <div className="sl-faq">
              {info.faqs.map((f) => (
                <details key={f.q}><summary>{f.q}<ChevronDown size={18} /></summary><p>{f.a}</p></details>
              ))}
            </div>
          </section>
        )}

        <section className="sl-section sl-links">
          <div>
            <h3>Shop by pest</h3>
            <div>{otherPests.map(([k, v]) => <Link key={k} to={`/shop/pest/${k}`}>{v.short}</Link>)}</div>
          </div>
          <div>
            <h3>Shop by brand</h3>
            <div>{otherBrands.map(([k, v]) => <Link key={k} to={`/shop/brand/${k}`}>{v.name}</Link>)}</div>
          </div>
          <div>
            <h3><MapPin size={16} /> We supply PCOs across Rajasthan</h3>
            <div>
              {CITIES.slice(0, 12).map((c) => <Link key={c.slug} to={cityPath(c.slug)}>{c.name}</Link>)}
              <Link to="/locations" className="all">All cities <ArrowRight size={13} /></Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ShopLanding;
