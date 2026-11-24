import { useEffect, useState } from 'react';
import { refineHead } from '../seo/RouteSeo';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Minus, Plus, ShieldAlert, BadgeCheck, ReceiptText, Truck, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { useCart } from '../context/CartContext';
import PackShot from '../components/PackShot';
import { BuyerBanner, AddToCart, Price } from './Shop';
import { priceInfo, rupees } from '../lib/shop';
import './Shop.css';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [p, setP] = useState(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let live = true;
    setP(null); setError(''); setQty(1);
    api(`/products/${encodeURIComponent(slug)}`).then((d) => live && setP(d)).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [slug]);

  // Page title for client-side visits (the server already sends it on a direct load).
  useEffect(() => {
    if (p) refineHead({ title: `${[p.brand, p.name, p.pack_size].filter(Boolean).join(' ')} | PCO Shop | PestKill` });
  }, [p]);

  if (error) return <div className="container pd-state"><h2>Product not found</h2><p>{error}</p><Link to="/shop" className="btn btn-primary">Back to shop</Link></div>;
  if (!p) return <div className="container pd-state"><span className="spinner" /></div>;

  const info = priceInfo(p);
  const buyNow = () => { add(p.id, qty); navigate('/cart'); };

  return (
    <div className="pd-page">
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/shop">Shop</Link><ChevronRight size={14} />
          <Link to={`/shop?brand=${encodeURIComponent(p.brand)}`}>{p.brand}</Link><ChevronRight size={14} />
          <span>{p.name}</span>
        </nav>

        <div className="pd-grid">
          <div className="pd-media">
            <PackShot product={p} />
            {!p.image_url && <span className="pd-media-note">Illustration — the delivered pack carries the manufacturer's label, batch and expiry.</span>}
          </div>

          <div className="pd-info">
            <Link to={`/shop?brand=${encodeURIComponent(p.brand)}`} className="pcard-brand">{p.brand}</Link>
            <h1>{p.name} <span>{p.pack_size}</span></h1>
            {p.technical && <p className="pd-tech">{p.technical}</p>}

            <Price product={p} large />

            {p.variants?.length > 1 && (
              <div className="pd-variants">
                <h4>Pack size</h4>
                <div>
                  {p.variants.map((v) => (
                    <Link key={v.id} to={`/shop/${v.slug}`} className={v.id === p.id ? 'active' : ''}>
                      <strong>{v.pack_size}</strong>
                      <span>{v.mrp != null ? rupees(v.mrp) : 'On request'}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!info.onRequest && p.in_stock && (
              <div className="pd-buy">
                <div className="qty">
                  <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity"><Minus size={16} /></button>
                  <input value={qty} inputMode="numeric" onChange={(e) => setQty(Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1)))} aria-label="Quantity" />
                  <button type="button" onClick={() => setQty(Math.min(999, qty + 1))} aria-label="Increase quantity"><Plus size={16} /></button>
                </div>
                <AddToCart product={p} qty={qty} />
                <button type="button" className="btn btn-navy btn-sm" onClick={buyNow}><Zap size={15} /> Buy now</button>
              </div>
            )}
            {(info.onRequest || !p.in_stock) && <div className="pd-buy"><AddToCart product={p} /></div>}
            {p.stock != null && p.stock > 0 && p.stock <= 10 && <p className="pd-stock">Only {p.stock} left in stock</p>}

            <ul className="pd-assure">
              <li><BadgeCheck size={17} /> Genuine product, sealed manufacturer pack</li>
              <li><ReceiptText size={17} /> Invoice with every order</li>
              <li><Truck size={17} /> Dispatched from Jaipur; delivery charges, if any, confirmed before dispatch</li>
            </ul>

            <BuyerBanner />

            <dl className="pd-specs">
              <div><dt>Brand</dt><dd>{p.brand}</dd></div>
              <div><dt>Active ingredient</dt><dd>{p.technical || '—'}</dd></div>
              <div><dt>Formulation</dt><dd>{p.formulation || '—'}</dd></div>
              <div><dt>Category</dt><dd>{p.category}</dd></div>
              <div><dt>Pack size</dt><dd>{p.pack_size}</dd></div>
              {p.usage_info && <div><dt>Used for</dt><dd>{p.usage_info}</dd></div>}
            </dl>

            <div className="pd-safety">
              <ShieldAlert size={18} />
              <p>For professional use by licensed pest control operators. Read the label and leaflet before use, wear protective equipment, and keep away from children, food and animals.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
