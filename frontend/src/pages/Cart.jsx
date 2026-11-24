import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, CheckCircle2, ArrowRight, Lock, MessageCircle } from 'lucide-react';
import businessConfig from '../data/businessConfig';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useBuyer } from '../hooks/useBuyer';
import PackShot from '../components/PackShot';
import { BuyerBanner } from './Shop';
import { priceInfo, rupees, PAYMENT_LABELS } from '../lib/shop';
import './Shop.css';
import { LicenceLine } from '../components/Credentials';

const Cart = () => {
  const { lines, setQty, remove, clear } = useCart();
  const { user } = useAuth();
  const { buyer, approved } = useBuyer();
  const location = useLocation();
  const [products, setProducts] = useState(null);
  const [form, setForm] = useState({ address: '', city: '', pincode: '', phone: '', paymentMethod: 'cod', notes: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(null);

  const ids = lines.map((l) => l.id).sort((a, b) => a - b).join(',');
  useEffect(() => {
    if (!ids) { setProducts([]); return undefined; }
    let live = true;
    api(`/products?ids=${ids}`).then((d) => live && setProducts(d.products)).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [ids]);

  // Prefill delivery details from the PCO profile.
  useEffect(() => {
    if (buyer) setForm((f) => ({ ...f, address: f.address || buyer.address || '', city: f.city || buyer.city || '', pincode: f.pincode || buyer.pincode || '' }));
  }, [buyer]);
  useEffect(() => { if (user?.phone) setForm((f) => ({ ...f, phone: f.phone || user.phone })); }, [user]);

  const rows = useMemo(() => (products || []).map((p) => ({ p, qty: lines.find((l) => l.id === p.id)?.qty || 0, info: priceInfo(p) })).filter((r) => r.qty), [products, lines]);
  // Drop cart lines for products that no longer exist.
  useEffect(() => {
    if (products) lines.filter((l) => !products.some((p) => p.id === l.id)).forEach((l) => remove(l.id));
  }, [products]); // eslint-disable-line react-hooks/exhaustive-deps

  const blocked = rows.filter((r) => r.info.onRequest || !r.p.in_stock);
  const total = rows.reduce((s, r) => s + (r.info.onRequest ? 0 : r.info.pay * r.qty), 0);
  const mrpTotal = rows.reduce((s, r) => s + (r.info.onRequest ? 0 : r.info.mrp * r.qty), 0);
  const count = rows.reduce((s, r) => s + r.qty, 0);

  const placeOrder = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const order = await api('/orders', { method: 'POST', body: { ...form, items: rows.map((r) => ({ productId: r.p.id, quantity: r.qty })) } });
      setPlaced(order);
      clear();
      window.scrollTo({ top: 0 });
    } catch (err) { setError(err.message); }
    setBusy(false);
  };

  if (placed) {
    return (
      <div className="cart-page">
        <div className="container cart-done">
          <CheckCircle2 size={56} />
          <h1>Order placed</h1>
          <p>Order <strong>#{placed.id}</strong> for <strong>{rupees(placed.total)}</strong> ({placed.item_count} items) has been received. We'll call you on {placed.phone} to confirm availability, delivery and payment ({PAYMENT_LABELS[placed.payment_method]}).</p>
          <div className="cart-done-actions">
            <Link to="/dashboard" state={{ tab: 'orders' }} className="btn btn-primary">Track my orders</Link>
            <Link to="/shop" className="btn btn-outline">Continue shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="cart-title">Your cart{count ? <span> · {count} item{count > 1 ? 's' : ''}</span> : ''}</h1>
        {products === null && lines.length > 0 && <p className="adm-muted">Loading your cart…</p>}
        {lines.length === 0 && (
          <div className="cart-empty">
            <ShoppingBag size={44} />
            <h2>Your cart is empty</h2>
            <p>Browse genuine professional products from Envu, Syngenta, Heranba, Arbuda and Kalyani.</p>
            <Link to="/shop" className="btn btn-primary">Go to shop <ArrowRight size={16} /></Link>
          </div>
        )}

        {rows.length > 0 && (
          <div className="cart-grid">
            <div className="cart-lines">
              {rows.map(({ p, qty, info }) => (
                <article key={p.id} className="cart-line">
                  <Link to={`/shop/${p.slug}`} className="cart-thumb"><PackShot product={p} /></Link>
                  <div className="cart-line-info">
                    <span className="pcard-brand">{p.brand}</span>
                    <Link to={`/shop/${p.slug}`} className="cart-line-name">{p.name} · {p.pack_size}</Link>
                    <span className="pcard-tech">{p.technical}</span>
                    {info.onRequest ? <span className="form-error">Price on request — remove this item and ask us for a quote.</span>
                      : !p.in_stock ? <span className="form-error">Out of stock — please remove.</span>
                        : <span className="cart-unit">{rupees(info.pay)} each{info.kind !== 'mrp' && <s> MRP {rupees(info.mrp)}</s>}{info.kind === 'offer' && <em className="cart-offer"> {info.offer.label || 'Offer'}</em>}</span>}
                    <div className="cart-line-actions">
                      <div className="qty small">
                        <button type="button" onClick={() => setQty(p.id, qty - 1)} disabled={qty <= 1} aria-label="Decrease"><Minus size={14} /></button>
                        <input value={qty} inputMode="numeric" onChange={(e) => setQty(p.id, parseInt(e.target.value, 10) || 1)} aria-label="Quantity" />
                        <button type="button" onClick={() => setQty(p.id, qty + 1)} aria-label="Increase"><Plus size={14} /></button>
                      </div>
                      <button type="button" className="text-link danger" onClick={() => remove(p.id)}><Trash2 size={14} /> Remove</button>
                    </div>
                  </div>
                  <strong className="cart-line-total">{info.onRequest ? '—' : rupees(info.pay * qty)}</strong>
                </article>
              ))}
            </div>

            <aside className="cart-summary">
              <h3>Order summary</h3>
              <dl>
                <div><dt>Items ({count})</dt><dd>{rupees(mrpTotal)}</dd></div>
                {mrpTotal > total && <div className="save"><dt>Discount</dt><dd>− {rupees(mrpTotal - total)}</dd></div>}
                <div><dt>Delivery</dt><dd>Confirmed on call</dd></div>
                <div className="grand"><dt>Total</dt><dd>{rupees(total)}</dd></div>
              </dl>
              <p className="cart-tax">MRP is inclusive of all taxes.</p>

              {!user && (
                <Link to="/login" state={{ from: location.pathname }} className="btn btn-primary btn-block"><Lock size={15} /> Login to checkout</Link>
              )}
              {user && buyer !== undefined && !approved && <BuyerBanner />}
              {user && approved && (
                <form className="checkout" onSubmit={placeOrder}>
                  <h4>Delivery details</h4>
                  <label>Address<textarea rows="2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required minLength={6} /></label>
                  <div className="checkout-row">
                    <label>City<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></label>
                    <label>PIN code<input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} inputMode="numeric" maxLength={6} /></label>
                  </div>
                  <label>Mobile<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" required /></label>
                  <fieldset>
                    <legend>Payment</legend>
                    {Object.entries(PAYMENT_LABELS).map(([k, l]) => (
                      <label key={k} className="radio"><input type="radio" name="pay" checked={form.paymentMethod === k} onChange={() => setForm({ ...form, paymentMethod: k })} /> {l}</label>
                    ))}
                  </fieldset>
                  <label>Note for us <small>(optional)</small><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Delivery timing, landmark…" /></label>
                  {error && <p className="form-error">{error}</p>}
                  <button type="submit" className="btn btn-primary btn-block" disabled={busy || blocked.length > 0}>{busy ? 'Placing order…' : `Place order · ${rupees(total)}`}</button>
                  <p className="cart-tax">We confirm every order by phone before dispatch.</p>
                  <LicenceLine kind="sale" />
                </form>
              )}
              {!approved && error && <p className="form-error">{error}</p>}
              {rows.length > 0 && (
                <a className="cart-wa" target="_blank" rel="noopener noreferrer"
                  href={`https://wa.me/${businessConfig.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    ['Hi PestKill, please send a quotation (proforma) for:', ...rows.map((r) => `• ${r.p.brand} ${r.p.name} ${r.p.pack_size} × ${r.qty}`), user?.name ? `Name: ${user.name}` : ''].filter(Boolean).join('\n'),
                  )}`}>
                  <MessageCircle size={16} /> Get a quotation on WhatsApp instead
                </a>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
