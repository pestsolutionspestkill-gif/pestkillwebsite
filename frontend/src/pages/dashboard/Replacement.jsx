// Expired-product replacement request for one delivered order. The only replacement we offer is for a
// pesticide that was already expired when supplied; it is replaced with a fresh lot after our check.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Camera, X } from 'lucide-react';
import { api, openPrivateFile } from '../../lib/api';

/** Shrinks a phone photo to a JPEG of at most 1600 px, so uploads stay small. */
const shrink = (file) => new Promise((resolve, reject) => {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { reject(new Error('Choose JPG, PNG or WebP photos.')); return; }
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    resolve(c.toDataURL('image/jpeg', 0.85));
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this photo.')); };
  img.src = url;
});

const STATUS = { pending: 'Under review', approved: 'Approved: fresh lot being arranged', rejected: 'Not approved', replaced: 'Replaced' };

export const ReplacementRequests = ({ requests }) => (requests?.length ? (
  <ul className="rep-list">
    {requests.map((r) => (
      <li key={r.id}>
        <strong>{r.product_name}</strong> · batch {r.batch_no} · expiry {r.expiry_date}
        <span className={`rep-status is-${r.status}`}>{STATUS[r.status] || r.status}</span>
        {r.admin_note && <small>PestKill team: {r.admin_note}</small>}
        {r.photos?.length > 0 && <span className="rep-photos">{r.photos.map((p, i) => <button type="button" key={p} className="text-btn" onClick={() => openPrivateFile(p.replace(/^\/api/, ''))}>Photo {i + 1}</button>)}</span>}
      </li>
    ))}
  </ul>
) : null);

const ReplacementForm = ({ order, onDone }) => {
  const [f, setF] = useState({ productId: String(order.items[0]?.product_id || ''), batchNo: '', expiryDate: '', quantity: 1, details: '' });
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const item = order.items.find((i) => String(i.product_id) === f.productId);
  const addPhotos = async (files) => {
    setError('');
    try {
      const next = [...photos];
      for (const file of [...files].slice(0, 3 - photos.length)) next.push(await shrink(file));
      setPhotos(next);
    } catch (e) { setError(e.message); }
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!photos.length) { setError('Add at least one photo of the pack label showing the batch number and expiry date.'); return; }
    setBusy(true); setError('');
    try {
      const r = await api('/replacements', { method: 'POST', body: { orderId: order.id, ...f, productId: Number(f.productId), quantity: Number(f.quantity), photos } });
      onDone(r);
    } catch (err) { setError(err.message); }
    setBusy(false);
  };
  return (
    <form className="rep-form" onSubmit={submit}>
      <p className="rep-note"><AlertTriangle size={15} /> Replacement is available only for a product that was <strong>already expired when we supplied it</strong>. It is replaced with a fresh lot after we check the batch. <Link to="/replacement-policy">Read the policy</Link>.</p>
      <div className="rep-grid">
        <label>Product<select value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value, quantity: 1 })}>
          {order.items.map((i) => <option key={i.product_id} value={i.product_id}>{i.brand} {i.name} · {i.pack_size}</option>)}
        </select></label>
        <label>Batch number (as printed)<input value={f.batchNo} onChange={(e) => setF({ ...f, batchNo: e.target.value })} required minLength={2} maxLength={40} /></label>
        <label>Expiry date (as printed)<input type="date" value={f.expiryDate} onChange={(e) => setF({ ...f, expiryDate: e.target.value })} required /></label>
        <label>Packs affected<input type="number" min="1" max={item?.quantity || 1} value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} /></label>
      </div>
      <label>Anything else we should know <small>(optional)</small><textarea rows="2" maxLength={600} value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} /></label>
      <div className="rep-photos-pick">
        {photos.map((p, i) => (
          <span key={p.slice(-24)} className="rep-thumb"><img src={p} alt={`Photo ${i + 1}`} /><button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos(photos.filter((_, j) => j !== i))}><X size={12} /></button></span>
        ))}
        {photos.length < 3 && (
          <label className="btn btn-outline btn-sm rep-add"><Camera size={14} /> Add photo of label ({photos.length}/3)
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
          </label>
        )}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="rep-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onDone(null)}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Sending…' : 'Send replacement request'}</button>
      </div>
    </form>
  );
};

export default ReplacementForm;
