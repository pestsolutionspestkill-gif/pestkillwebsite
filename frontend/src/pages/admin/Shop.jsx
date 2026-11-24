import { useMemo, useState } from 'react';
import { Search, Plus, X, Upload, Trash2, AlertTriangle, CheckCircle, Phone, MapPin, BadgeCheck, Pencil } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import PackShot from '../../components/PackShot';
import { rupees, PAYMENT_LABELS, fmtEnds } from '../../lib/shop';
import { useLoad, State, Badge, fmtDate, fmtDay, label } from './shared';

const PACK_STYLES = ['bottle', 'jerrycan', 'gel', 'sachet', 'tub', 'box'];
const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

// Shrinks a photo in the browser before upload (max 900 px, WebP) so it stays small in the database.
export const resizeImage = (file) => new Promise((resolve, reject) => {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { reject(new Error('Choose a JPG, PNG or WebP photo.')); return; }
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, 900 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(img.src);
    let out = canvas.toDataURL('image/webp', 0.85);
    if (!out.startsWith('data:image/webp')) out = canvas.toDataURL('image/jpeg', 0.85);
    resolve(out);
  };
  img.onerror = () => reject(new Error('Could not read this image.'));
  img.src = URL.createObjectURL(file);
});

const toForm = (p) => ({
  name: p?.name || '', brand: p?.brand || '', category: p?.category || '', technical: p?.technical || '', formulation: p?.formulation || '',
  packSize: p?.pack_size || '', packStyle: p?.pack_style || 'bottle', mrp: p?.mrp ?? '', pcoPrice: p?.pco_price ?? '',
  offerPrice: p?.offer_price ?? '', offerLabel: p?.offer_label || '', offerEnds: p?.offer_ends || '',
  mrpVerified: Boolean(p?.mrp_verified), stock: p?.stock ?? '', usage: p?.usage_info || '', description: p?.description || '',
  sort: p?.sort ?? 0, isActive: p ? Boolean(p.is_active) : true,
});

const ProductDrawer = ({ product, brands, categories, onClose, onSaved, onDeleted, notify }) => {
  const { can } = useAuth();
  const [p, setP] = useState(product);
  const [form, setForm] = useState(toForm(product));
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fullEdit = can('products.edit') || (!product && can('products.create'));
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const preview = { ...(p || {}), name: form.name || 'Product', brand: form.brand, technical: form.technical, pack_size: form.packSize, pack_style: form.packStyle, mrp: form.mrp === '' ? null : Number(form.mrp) };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const orNull = (v) => (v === '' ? null : v);
      const body = fullEdit
        ? { ...form, mrp: orNull(form.mrp), pcoPrice: orNull(form.pcoPrice), offerPrice: orNull(form.offerPrice), offerLabel: orNull(form.offerLabel), offerEnds: orNull(form.offerEnds), stock: orNull(form.stock) }
        : { stock: orNull(form.stock) };
      const saved = p ? await api(`/products/${p.id}`, { method: 'PUT', body }) : await api('/products', { method: 'POST', body });
      notify(p ? 'Product saved' : 'Product added');
      onSaved(saved);
      setP(saved);
    } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };

  const upload = async (file) => {
    if (!file || !p) return;
    setBusy(true);
    try {
      const dataUrl = await resizeImage(file);
      const saved = await api(`/products/${p.id}/image`, { method: 'PUT', body: { dataUrl } });
      setP(saved); onSaved(saved); notify('Photo uploaded');
    } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };
  const removeImage = async () => {
    setBusy(true);
    try { const saved = await api(`/products/${p.id}/image`, { method: 'DELETE' }); setP(saved); onSaved(saved); notify('Photo removed'); } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };
  const del = async () => {
    if (!window.confirm(`Delete ${p.brand} ${p.name} (${p.pack_size})?`)) return;
    try { const r = await api(`/products/${p.id}`, { method: 'DELETE' }); notify(r.message); onDeleted(p, r.hidden); } catch (err) { notify(err.message, 'error'); }
  };

  return (
    <div className="drawer-scrim" onMouseDown={onClose}>
      <aside className="drawer wide" onMouseDown={(e) => e.stopPropagation()} data-lenis-prevent>
        <header className="drawer-head">
          <div><span className="mono">{p ? `#${p.id} · ${p.slug}` : 'New product'}</span><h3>{p ? `${p.name} · ${p.pack_size}` : 'Add product'}</h3></div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        <div className="prod-editor">
          <div className="prod-photo">
            <div className={`prod-photo-box ${dragOver ? 'drop' : ''}`}
              onDragOver={(e) => { if (p && can('products.edit')) { e.preventDefault(); setDragOver(true); } }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); if (p && can('products.edit')) upload(e.dataTransfer.files[0]); }}>
              <PackShot product={preview} />
            </div>
            {p && can('products.edit') && (
              <div className="prod-photo-actions">
                <label className="btn btn-outline btn-sm"><Upload size={14} /> {p.image_url ? 'Replace photo' : 'Upload photo'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => upload(e.target.files[0])} />
                </label>
                {p.image_url && <button type="button" className="text-btn danger" onClick={removeImage}>Remove photo</button>}
              </div>
            )}
            <small className="adm-muted">{p ? 'Drag a photo here or use the button. A clear photo of the pack with the MRP visible works best.' : 'Save the product first, then upload a photo.'}</small>
          </div>

          <form className="inv-form" onSubmit={save}>
            <fieldset disabled={!fullEdit} className="plain">
              <div className="inv-grid">
                <label>Product name<input value={form.name} onChange={set('name')} required /></label>
                <label>Brand<input value={form.brand} onChange={set('brand')} list="brand-list" required /></label>
                <label>Category<input value={form.category} onChange={set('category')} list="cat-list" required /></label>
                <label>Pack size<input value={form.packSize} onChange={set('packSize')} placeholder="e.g. 500 ml" required /></label>
                <label>Active ingredient<input value={form.technical} onChange={set('technical')} placeholder="e.g. Fipronil 0.05% Gel" /></label>
                <div className="inline-grid">
                  <label>Formulation<input value={form.formulation} onChange={set('formulation')} placeholder="SC, EC, Gel" /></label>
                  <label>Pack picture<select value={form.packStyle} onChange={set('packStyle')}>{PACK_STYLES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></label>
                </div>
              </div>
              <datalist id="brand-list">{brands.map((b) => <option key={b} value={b} />)}</datalist>
              <datalist id="cat-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>

              <h4>Price</h4>
              <div className="inv-grid">
                <label>MRP (₹, as printed on pack)<input type="number" min="0" step="0.01" value={form.mrp} onChange={set('mrp')} placeholder="Empty = price on request" /></label>
                <label>PCO price (₹, optional)<input type="number" min="0" step="0.01" value={form.pcoPrice} onChange={set('pcoPrice')} placeholder="Shown only to approved buyers" /></label>
              </div>
              {p?.mrp_note && !form.mrpVerified && <p className="mrp-warn"><AlertTriangle size={15} /> MRP source: {p.mrp_note}. Check it against the pack.</p>}
              <label className="check-row"><input type="checkbox" checked={form.mrpVerified} onChange={set('mrpVerified')} /> I have checked this MRP against the printed pack</label>

              <h4>Offer <small className="adm-muted">(shown to everyone; leave empty for no offer)</small></h4>
              <div className="inv-grid three">
                <label>Offer price (₹)<input type="number" min="0" step="0.01" value={form.offerPrice} onChange={set('offerPrice')} placeholder="Below MRP" /></label>
                <label>Offer name<input value={form.offerLabel} onChange={set('offerLabel')} maxLength={40} placeholder="e.g. Diwali offer" /></label>
                <label>Ends on<input type="date" value={form.offerEnds} onChange={set('offerEnds')} /></label>
              </div>
              {form.offerPrice !== '' && form.mrp !== '' && Number(form.offerPrice) < Number(form.mrp) && (
                <p className="offer-preview">Customers see <strong>{rupees(Number(form.offerPrice))}</strong> <s>MRP {rupees(Number(form.mrp))}</s> — {Math.round((1 - Number(form.offerPrice) / Number(form.mrp)) * 100)}% off{form.offerEnds ? `, until ${fmtEnds(form.offerEnds)}` : ''}.</p>
              )}
              {(form.offerPrice !== '' || form.offerLabel || form.offerEnds) && (
                <button type="button" className="text-btn" onClick={() => setForm({ ...form, offerPrice: '', offerLabel: '', offerEnds: '' })}>Remove offer</button>
              )}
            </fieldset>

            <div className="inv-grid">
              <label>Stock (units)<input type="number" min="0" step="1" value={form.stock} onChange={set('stock')} placeholder="Empty = not tracked" /></label>
              <fieldset disabled={!fullEdit} className="plain"><label>Display order<input type="number" min="0" value={form.sort} onChange={set('sort')} /></label></fieldset>
            </div>
            <fieldset disabled={!fullEdit} className="plain">
              <label>Used for<input value={form.usage} onChange={set('usage')} placeholder="Target pests and use" /></label>
              <label>Description<textarea rows="3" value={form.description} onChange={set('description')} /></label>
              <label className="check-row"><input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Show in shop</label>
            </fieldset>

            <div className="drawer-foot">
              {p && can('products.delete') && <button type="button" className="text-btn danger" onClick={del}><Trash2 size={14} /> Delete</button>}
              <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : p ? 'Save changes' : 'Add product'}</button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  );
};

// Inline photo change used in the bulk editor rows.
const PhotoCell = ({ p, onSaved, notify, canEdit }) => {
  const [busy, setBusy] = useState(false);
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try { onSaved(await api(`/products/${p.id}/image`, { method: 'PUT', body: { dataUrl: await resizeImage(file) } })); notify(`Photo updated: ${p.name} ${p.pack_size}`); } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };
  return (
    <label className={`photo-cell ${canEdit ? 'editable' : ''} ${busy ? 'busy' : ''}`} title={canEdit ? 'Click or drop a photo to change it' : ''}
      onDragOver={(e) => { if (canEdit) e.preventDefault(); }} onDrop={(e) => { if (canEdit) { e.preventDefault(); upload(e.dataTransfer.files[0]); } }}>
      <PackShot product={p} />
      {canEdit && <span className="photo-cell-hint"><Upload size={12} /></span>}
      {canEdit && <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => upload(e.target.files[0])} />}
    </label>
  );
};

const EDIT_FIELDS = [['mrp', 'mrp'], ['offerPrice', 'offer_price'], ['offerLabel', 'offer_label'], ['offerEnds', 'offer_ends'], ['pcoPrice', 'pco_price'], ['stock', 'stock']];
const asInput = (v) => (v == null ? '' : String(v));

const BulkEditor = ({ rows, onSaved, onCancel, notify }) => {
  const { can } = useAuth();
  const priceEdit = can('products.edit');
  const [draft, setDraft] = useState({}); // id -> { field: string }
  const [pct, setPct] = useState('10');
  const [label, setLabelText] = useState('');
  const [ends, setEnds] = useState('');
  const [busy, setBusy] = useState(false);

  const val = (p, key, col) => (draft[p.id]?.[key] ?? asInput(p[col]));
  const setVal = (p, key, v) => setDraft((d) => ({ ...d, [p.id]: { ...d[p.id], [key]: v } }));
  const changed = rows.map((p) => {
    const d = draft[p.id];
    if (!d) return null;
    const diff = Object.fromEntries(EDIT_FIELDS.filter(([k, col]) => k in d && d[k] !== asInput(p[col])).map(([k]) => [k, d[k] === '' ? null : d[k]]));
    if ('mrpVerified' in d && Boolean(d.mrpVerified) !== Boolean(p.mrp_verified)) diff.mrpVerified = d.mrpVerified;
    return Object.keys(diff).length ? { id: p.id, ...diff } : null;
  }).filter(Boolean);

  const applyOffer = () => {
    const n = Number(pct);
    if (!(n > 0 && n < 100)) { notify('Enter a discount between 1 and 99%.', 'error'); return; }
    const mrpOf = (p) => Number(draft[p.id]?.mrp ?? p.mrp);
    const eligible = rows.filter((p) => mrpOf(p) > 0);
    if (!eligible.length) { notify('None of these products has an MRP yet.', 'error'); return; }
    setDraft((d) => {
      const next = { ...d };
      eligible.forEach((p) => { next[p.id] = { ...next[p.id], offerPrice: String(Math.round(mrpOf(p) * (1 - n / 100))), offerLabel: label, offerEnds: ends }; });
      return next;
    });
    notify(`${n}% offer filled in for ${eligible.length} products with an MRP — review and save.`);
  };
  const clearOffers = () => setDraft((d) => {
    const next = { ...d };
    rows.forEach((p) => { if (p.offer_price != null || next[p.id]?.offerPrice) next[p.id] = { ...next[p.id], offerPrice: '', offerLabel: '', offerEnds: '' }; });
    return next;
  });

  const save = async () => {
    setBusy(true);
    try {
      const updated = await api('/products/bulk', { method: 'PATCH', body: { updates: changed } });
      updated.forEach(onSaved);
      setDraft({});
      notify(`${updated.length} products saved`);
    } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };

  return (
    <>
      {priceEdit && (
        <div className="bulk-tools">
          <strong>Offer for the {rows.length} products shown</strong>
          <label><input type="number" min="1" max="99" value={pct} onChange={(e) => setPct(e.target.value)} /> % off MRP</label>
          <input value={label} onChange={(e) => setLabelText(e.target.value)} placeholder="Offer name (e.g. Diwali offer)" maxLength={40} />
          <label>ends <input type="date" value={ends} onChange={(e) => setEnds(e.target.value)} /></label>
          <button type="button" className="btn btn-sm btn-navy" onClick={applyOffer}>Fill offer</button>
          <button type="button" className="text-btn danger" onClick={clearOffers}>Clear offers</button>
        </div>
      )}
      <div className="table-wrap">
        <table className="adm-table static bulk-table">
          <thead><tr><th>Photo</th><th>Product</th><th>MRP ₹</th><th>✓</th><th>Offer ₹</th><th>Offer name</th><th>Ends</th><th>PCO ₹</th><th>Stock</th></tr></thead>
          <tbody>{rows.map((p) => {
            const dirty = changed.some((c) => c.id === p.id);
            const mrp = Number(val(p, 'mrp', 'mrp'));
            const offer = Number(val(p, 'offerPrice', 'offer_price'));
            const badOffer = val(p, 'offerPrice', 'offer_price') !== '' && !(offer < mrp);
            return (
              <tr key={p.id} className={dirty ? 'dirty' : ''}>
                <td><PhotoCell p={p} onSaved={onSaved} notify={notify} canEdit={priceEdit} /></td>
                <td><strong>{p.name}</strong><small>{p.brand} · {p.pack_size}</small></td>
                <td><input className="num" type="number" min="0" step="0.01" disabled={!priceEdit} value={val(p, 'mrp', 'mrp')} onChange={(e) => setVal(p, 'mrp', e.target.value)} placeholder="—" /></td>
                <td><input type="checkbox" title="MRP checked against pack" disabled={!priceEdit} checked={Boolean(draft[p.id]?.mrpVerified ?? p.mrp_verified)} onChange={(e) => setVal(p, 'mrpVerified', e.target.checked)} /></td>
                <td><input className={`num ${badOffer ? 'bad' : ''}`} type="number" min="0" step="0.01" disabled={!priceEdit} value={val(p, 'offerPrice', 'offer_price')} onChange={(e) => setVal(p, 'offerPrice', e.target.value)} placeholder="—" title={badOffer ? 'Offer must be lower than MRP' : ''} /></td>
                <td><input disabled={!priceEdit} value={val(p, 'offerLabel', 'offer_label')} onChange={(e) => setVal(p, 'offerLabel', e.target.value)} maxLength={40} /></td>
                <td><input type="date" disabled={!priceEdit} value={val(p, 'offerEnds', 'offer_ends')} onChange={(e) => setVal(p, 'offerEnds', e.target.value)} /></td>
                <td><input className="num" type="number" min="0" step="0.01" disabled={!priceEdit} value={val(p, 'pcoPrice', 'pco_price')} onChange={(e) => setVal(p, 'pcoPrice', e.target.value)} placeholder="—" /></td>
                <td><input className="num short" type="number" min="0" step="1" value={val(p, 'stock', 'stock')} onChange={(e) => setVal(p, 'stock', e.target.value)} placeholder="∞" /></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <div className="bulk-bar">
        <span>{changed.length ? `${changed.length} product${changed.length > 1 ? 's' : ''} changed` : 'No changes yet'}</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => { if (!changed.length || window.confirm('Discard your changes?')) { setDraft({}); onCancel(); } }}>Done</button>
        <button type="button" className="btn btn-primary btn-sm" disabled={!changed.length || busy} onClick={save}>{busy ? 'Saving…' : `Save ${changed.length || ''} changes`}</button>
      </div>
    </>
  );
};

export const ShopProducts = ({ notify }) => {
  const { can } = useAuth();
  const { data, setData, error, loading } = useLoad('/products?all=1');
  const [q, setQ] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [view, setView] = useState('');
  const [bulk, setBulk] = useState(false);
  const [open, setOpen] = useState(undefined); // undefined = closed, null = new
  const products = data?.products || [];
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products]);
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);
  const toCheck = products.filter((p) => p.mrp != null && !p.mrp_verified).length;
  const onRequest = products.filter((p) => p.mrp == null).length;
  const onOffer = products.filter((p) => p.offer).length;
  const noPhoto = products.filter((p) => !p.image_url).length;

  const rows = products.filter((p) => (!brand || p.brand === brand)
    && (!category || p.category === category)
    && (!q || `${p.name} ${p.brand} ${p.technical} ${p.pack_size}`.toLowerCase().includes(q.toLowerCase()))
    && (view !== 'check' || (p.mrp != null && !p.mrp_verified))
    && (view !== 'request' || p.mrp == null)
    && (view !== 'offer' || p.offer)
    && (view !== 'nophoto' || !p.image_url)
    && (view !== 'hidden' || !p.is_active));

  const saved = (p) => setData((d) => {
    const exists = d.products.some((x) => x.id === p.id);
    return { ...d, products: exists ? d.products.map((x) => (x.id === p.id ? p : x)) : [p, ...d.products] };
  });

  return (
    <>
      <div className="shop-stats">
        <button type="button" className={view === '' ? 'active' : ''} onClick={() => setView('')}><strong>{products.length}</strong><span>Products</span></button>
        <button type="button" className={view === 'offer' ? 'active' : ''} onClick={() => setView('offer')}><strong>{onOffer}</strong><span>On offer</span></button>
        <button type="button" className={`${view === 'check' ? 'active' : ''} ${toCheck ? 'warn' : ''}`} onClick={() => setView('check')}><strong>{toCheck}</strong><span>MRP to check</span></button>
        <button type="button" className={view === 'request' ? 'active' : ''} onClick={() => setView('request')}><strong>{onRequest}</strong><span>No MRP yet</span></button>
        <button type="button" className={view === 'nophoto' ? 'active' : ''} onClick={() => setView('nophoto')}><strong>{noPhoto}</strong><span>No photo</span></button>
      </div>
      <div className="toolbar">
        <label className="search-field"><Search size={16} /><input placeholder="Search product, ingredient, pack" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <select value={brand} onChange={(e) => setBrand(e.target.value)}><option value="">All brands</option>{brands.map((b) => <option key={b}>{b}</option>)}</select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={view} onChange={(e) => setView(e.target.value)}>
          <option value="">All products</option><option value="offer">On offer</option><option value="check">MRP to check</option><option value="request">No MRP yet</option><option value="nophoto">No photo</option><option value="hidden">Hidden</option>
        </select>
        <span className="toolbar-count">{rows.length} shown</span>
        {(can('products.edit') || can('inventory.manage')) && !bulk && <button type="button" className="btn btn-navy btn-sm" onClick={() => setBulk(true)}><Pencil size={15} /> Edit prices & offers</button>}
        {can('products.create') && !bulk && <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(null)}><Plus size={16} /> Add product</button>}
      </div>
      <State loading={loading && !data} error={error} empty={data && products.length === 0 && 'No products yet.'}>
        {bulk ? <BulkEditor rows={rows} onSaved={saved} onCancel={() => setBulk(false)} notify={notify} /> : (
          <div className="table-wrap">
            <table className="adm-table">
              <thead><tr><th /><th>Product</th><th>Pack</th><th>MRP</th><th>Offer</th><th>PCO price</th><th>Stock</th><th>Status</th></tr></thead>
              <tbody>{rows.map((p) => (
                <tr key={p.id} onClick={() => setOpen(p)}>
                  <td className="prod-thumb"><PackShot product={p} /></td>
                  <td><strong>{p.name}</strong><small>{p.brand} · {p.technical}</small></td>
                  <td className="nowrap">{p.pack_size}</td>
                  <td className="nowrap">{p.mrp == null ? <span className="adm-muted">Not set</span> : <>{rupees(p.mrp)} {p.mrp_verified ? <CheckCircle size={13} className="ok-ic" /> : <span className="chip-warn">Check</span>}</>}</td>
                  <td className="nowrap">{p.offer ? <><strong className="offer-txt">{rupees(p.offer.price)}</strong><small>{p.offer.label || 'Offer'}{p.offer.ends ? ` · till ${fmtEnds(p.offer.ends)}` : ''}</small></> : p.offer_price != null ? <span className="adm-muted">Ended</span> : '—'}</td>
                  <td className="nowrap">{p.pco_price != null ? rupees(p.pco_price) : '—'}</td>
                  <td>{p.stock == null ? <span className="adm-muted">Not tracked</span> : p.stock}</td>
                  <td>{p.is_active ? <Badge value="active" /> : <Badge value="hidden" />}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </State>
      {open !== undefined && (
        <ProductDrawer key={open?.id || 'new'} product={open} brands={brands} categories={categories} notify={notify}
          onClose={() => setOpen(undefined)} onSaved={(p) => { saved(p); if (!open) setOpen(p); }}
          onDeleted={(p, hidden) => { setData((d) => ({ ...d, products: hidden ? d.products.map((x) => (x.id === p.id ? { ...x, is_active: 0 } : x)) : d.products.filter((x) => x.id !== p.id) })); setOpen(undefined); }} />
      )}
    </>
  );
};

const OrderDrawer = ({ order, onClose, onSaved, notify }) => {
  const { can } = useAuth();
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState(order.admin_note || '');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (status === 'cancelled' && order.status !== 'cancelled' && !window.confirm('Cancel this order? Stock will be returned.')) return;
    setBusy(true);
    try { const o = await api(`/orders/${order.id}`, { method: 'PATCH', body: { status, adminNote: note } }); onSaved(o); notify(`Order #${o.id} updated`); } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };
  return (
    <div className="drawer-scrim" onMouseDown={onClose}>
      <aside className="drawer" onMouseDown={(e) => e.stopPropagation()} data-lenis-prevent>
        <header className="drawer-head">
          <div><span className="mono">Order #{order.id} · {fmtDate(order.created_at)}</span><h3>{order.firm_name || order.user_name}</h3></div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="drawer-actions">
          <a className="btn btn-sm btn-navy" href={`tel:${order.phone}`}><Phone size={14} /> {order.phone}</a>
        </div>
        <ul className="order-items">
          {order.items.map((i) => (
            <li key={`${i.product_id}-${i.pack_size}`}><span><strong>{i.brand} {i.name}</strong> · {i.pack_size}<small>{rupees(i.price)} × {i.quantity}</small></span><strong>{rupees(i.price * i.quantity)}</strong></li>
          ))}
          <li className="total"><span>Total (incl. taxes)</span><strong>{rupees(order.total)}</strong></li>
        </ul>
        <dl className="detail-list">
          <div><dt>Buyer</dt><dd>{order.user_name}{order.user_email ? ` · ${order.user_email}` : ''}</dd></div>
          {order.gstin && <div><dt>GSTIN</dt><dd>{order.gstin}</dd></div>}
          <div><dt>Deliver to</dt><dd><MapPin size={13} /> {[order.address, order.city, order.pincode].filter(Boolean).join(', ')}</dd></div>
          <div><dt>Payment</dt><dd>{PAYMENT_LABELS[order.payment_method] || '—'}</dd></div>
          {order.notes && <div><dt>Buyer note</dt><dd className="pre">{order.notes}</dd></div>}
        </dl>
        {can('orders.manage') && (
          <div className="drawer-form">
            <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)} disabled={order.status === 'cancelled'}>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></label>
            <label>Note to buyer<textarea rows="3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Dispatch details, courier, payment received…" /></label>
            <button type="button" className="btn btn-sm btn-primary" disabled={busy || order.status === 'cancelled'} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        )}
      </aside>
    </div>
  );
};

export const ShopOrders = ({ notify }) => {
  const [status, setStatus] = useState('');
  const { data, setData, error, loading } = useLoad(`/orders${status ? `?status=${status}` : ''}`);
  const [open, setOpen] = useState(null);
  const live = (data || []).filter((o) => o.status !== 'cancelled');
  return (
    <>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All orders</option>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
        <span className="toolbar-count">{data ? `${data.length} orders · ${rupees(live.reduce((s, o) => s + o.total, 0))}` : ''}</span>
      </div>
      <State loading={loading && !data} error={error} empty={data?.length === 0 && 'No shop orders yet.'}>
        <div className="table-wrap">
          <table className="adm-table">
            <thead><tr><th>Order</th><th>Buyer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>{data?.map((o) => (
              <tr key={o.id} onClick={() => setOpen(o)}>
                <td className="nowrap"><strong>#{o.id}</strong><small>{fmtDate(o.created_at)}</small></td>
                <td><strong>{o.firm_name || o.user_name}</strong><small>{o.city} · {o.phone}</small></td>
                <td className="clip">{o.items.map((i) => `${i.name} ${i.pack_size} ×${i.quantity}`).join(', ')}</td>
                <td className="nowrap"><strong>{rupees(o.total)}</strong></td>
                <td className="nowrap">{PAYMENT_LABELS[o.payment_method] || '—'}</td>
                <td><Badge value={o.status} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </State>
      {open && <OrderDrawer key={open.id} order={open} notify={notify} onClose={() => setOpen(null)} onSaved={(o) => { setData((rows) => rows.map((r) => (r.id === o.id ? o : r))); setOpen(o); }} />}
    </>
  );
};

export const Buyers = ({ notify }) => {
  const [status, setStatus] = useState('');
  const { data, setData, error, loading } = useLoad(`/buyers${status ? `?status=${status}` : ''}`);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const decide = async (b, decision, note) => {
    try {
      const updated = await api(`/buyers/${b.user_id}`, { method: 'PATCH', body: { status: decision, note } });
      setData((rows) => rows.map((r) => (r.user_id === b.user_id ? { ...r, ...updated } : r)));
      setRejecting(null); setReason('');
      notify(`${b.firm_name} ${decision}`);
    } catch (err) { notify(err.message, 'error'); }
  };
  const pending = (data || []).filter((b) => b.status === 'pending').length;
  return (
    <>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All applications</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
        </select>
        {pending > 0 && <span className="toolbar-count">{pending} waiting for review</span>}
      </div>
      <State loading={loading && !data} error={error} empty={data?.length === 0 && 'No PCO buyer applications yet.'}>
        <div className="buyer-cards">
          {data?.map((b) => (
            <article key={b.user_id} className="panel buyer-card">
              <header>
                <div><h3>{b.firm_name}</h3><small>{b.name} · {b.phone} · {b.email}</small></div>
                <Badge value={b.status} />
              </header>
              <dl className="detail-list">
                <div><dt>Licence no.</dt><dd><strong>{b.licence_no}</strong>{b.licence_valid_till ? ` · valid till ${fmtDay(b.licence_valid_till)}` : ''}</dd></div>
                {b.gstin && <div><dt>GSTIN</dt><dd>{b.gstin}</dd></div>}
                <div><dt>Address</dt><dd>{[b.address, b.city, b.state, b.pincode].filter(Boolean).join(', ')}</dd></div>
                <div><dt>Applied</dt><dd>{fmtDate(b.applied_at)}{b.reviewed_at ? ` · reviewed ${fmtDate(b.reviewed_at)}${b.reviewed_by_name ? ` by ${b.reviewed_by_name}` : ''}` : ''}</dd></div>
                {b.orders > 0 && <div><dt>Orders</dt><dd>{b.orders}</dd></div>}
                {b.admin_note && <div><dt>Note</dt><dd>{b.admin_note}</dd></div>}
              </dl>
              {rejecting === b.user_id ? (
                <div className="reply">
                  <textarea rows="2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason, e.g. licence number not readable — please re-check" />
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => setRejecting(null)}>Back</button>
                  <button type="button" className="btn btn-sm btn-navy" disabled={!reason.trim()} onClick={() => decide(b, 'rejected', reason)}>Reject</button>
                </div>
              ) : (
                <div className="drawer-docs">
                  {b.status !== 'approved' && <button type="button" className="btn btn-sm btn-primary" onClick={() => decide(b, 'approved')}><BadgeCheck size={14} /> Approve</button>}
                  {b.status !== 'rejected' && <button type="button" className="btn btn-sm btn-outline" onClick={() => setRejecting(b.user_id)}>{b.status === 'approved' ? 'Revoke' : 'Reject'}</button>}
                </div>
              )}
            </article>
          ))}
        </div>
      </State>
    </>
  );
};
