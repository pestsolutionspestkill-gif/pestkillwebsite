// Expired-product replacement. This is the only replacement we offer: if a pesticide we supplied was
// already expired, the buyer reports it with the order, product, batch number, expiry date and photos,
// and staff replace it with a fresh lot after checking. Nothing here promises a refund.
//   POST  /api/replacements              buyer: new request (with 1–3 photos)
//   GET   /api/replacements/mine         buyer: own requests
//   GET   /api/replacements              staff (orders.view / orders.manage): all requests
//   GET   /api/replacements/:id/photos/:photoId   buyer who raised it, or staff
//   PATCH /api/replacements/:id          staff (orders.manage): approve / reject / mark replaced
import express from 'express';
import db, { audit, NOW } from '../db.js';
import { auth, requirePermission, can, ah } from '../middleware/rbac.js';
import { str, oneOf, intId, ValidationError } from '../utils/validate.js';
import { readDataUrl } from '../utils/files.js';

const router = express.Router();
const STATUSES = ['pending', 'approved', 'rejected', 'replaced'];
const istToday = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

const shape = async (rows) => {
  if (!rows.length) return [];
  const photos = await db.all(`SELECT id, request_id FROM replacement_photos WHERE request_id IN (${rows.map(() => '?').join(', ')}) ORDER BY id`, ...rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, photos: photos.filter((p) => p.request_id === r.id).map((p) => `/api/replacements/${r.id}/photos/${p.id}`) }));
};

router.post('/', auth, ah(async (req, res) => {
  const b = req.body || {};
  const orderId = intId(b.orderId);
  const productId = intId(b.productId);
  const order = await db.get('SELECT id, user_id, status, created_at FROM orders WHERE id = ?', orderId);
  if (!order || order.user_id !== req.user.id) return res.status(404).json({ error: 'Order not found.' });
  if (!['shipped', 'delivered'].includes(order.status)) throw new ValidationError('A replacement can be requested once the order has been delivered.');
  const line = await db.get('SELECT product_id, quantity, COALESCE(product_name, (SELECT name FROM products WHERE id = product_id)) AS name, pack_size FROM order_items WHERE order_id = ? AND product_id = ?', orderId, productId);
  if (!line) throw new ValidationError('Choose a product from this order.');
  const batch = str(b.batchNo, { field: 'Batch number', min: 2, max: 40, required: true });
  const expiry = str(b.expiryDate, { field: 'Expiry date', max: 10, required: true });
  if (!/^\d{4}-\d{2}(-\d{2})?$/.test(expiry)) throw new ValidationError('Enter the expiry date printed on the pack.');
  const expiryDay = expiry.length === 7 ? `${expiry}-28` : expiry; // month-only labels: treat as within that month
  if (expiryDay > istToday()) throw new ValidationError('This expiry date has not passed. Only products that were already expired when supplied can be replaced.');
  const qty = Math.max(1, Math.min(line.quantity, parseInt(b.quantity, 10) || 1));
  const details = str(b.details, { field: 'Details', max: 600 });
  const photos = Array.isArray(b.photos) ? b.photos : [];
  if (photos.length < 1 || photos.length > 3) throw new ValidationError('Add 1 to 3 photos showing the pack label with the batch number and expiry date.');
  const files = photos.map((p) => readDataUrl(p, { types: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 1.5 * 1024 * 1024, label: 'photo' }));
  if (await db.get("SELECT 1 FROM replacement_requests WHERE order_id = ? AND product_id = ? AND status IN ('pending', 'approved')", orderId, productId)) {
    throw new ValidationError('A replacement request for this product is already open.');
  }
  const row = await db.tx(async (t) => {
    const r = await t.get(`INSERT INTO replacement_requests (order_id, user_id, product_id, product_name, batch_no, expiry_date, quantity, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`, orderId, req.user.id, productId, `${line.name}${line.pack_size ? ` · ${line.pack_size}` : ''}`, batch, expiry, qty, details);
    for (const f of files) await t.run('INSERT INTO replacement_photos (request_id, mime, data, size) VALUES (?, ?, ?, ?)', r.id, f.mime, f.data, f.data.length);
    return r;
  });
  audit(req, 'replacement.create', 'order', orderId, { request: row.id, productId, batch });
  res.status(201).json((await shape([row]))[0]);
}));

router.get('/mine', auth, ah(async (req, res) => {
  res.json(await shape(await db.all('SELECT * FROM replacement_requests WHERE user_id = ? ORDER BY created_at DESC, id DESC', req.user.id)));
}));

router.get('/', requirePermission('orders.view', 'orders.manage'), ah(async (req, res) => {
  const status = STATUSES.includes(req.query.status) ? req.query.status : null;
  res.json(await shape(await db.all(`SELECT r.*, u.name AS user_name, u.phone AS user_phone, o.firm_name FROM replacement_requests r
    JOIN users u ON u.id = r.user_id JOIN orders o ON o.id = r.order_id ${status ? 'WHERE r.status = ?' : ''} ORDER BY r.created_at DESC, r.id DESC LIMIT 300`, ...(status ? [status] : []))));
}));

router.get('/:id/photos/:photoId', auth, ah(async (req, res) => {
  const r = await db.get('SELECT user_id FROM replacement_requests WHERE id = ?', intId(req.params.id));
  if (!r || (r.user_id !== req.user.id && !can(req.user, 'orders.view') && !can(req.user, 'orders.manage'))) return res.status(404).json({ error: 'Photo not found.' });
  const p = await db.get('SELECT mime, data FROM replacement_photos WHERE id = ? AND request_id = ?', intId(req.params.photoId), intId(req.params.id));
  if (!p) return res.status(404).json({ error: 'Photo not found.' });
  res.set({ 'Content-Type': p.mime, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
  res.send(Buffer.from(p.data));
}));

router.patch('/:id', requirePermission('orders.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const status = oneOf(req.body.status, STATUSES.filter((s) => s !== 'pending'), 'status');
  const note = str(req.body.note, { field: 'Note', max: 500 });
  if (status === 'rejected' && !note) throw new ValidationError('Add a short reason so the buyer knows why.');
  const row = await db.get(`UPDATE replacement_requests SET status = ?, admin_note = COALESCE(?, admin_note), reviewed_by = ?, updated_at = ${NOW} WHERE id = ? RETURNING *`, status, note, req.user.id, id);
  if (!row) return res.status(404).json({ error: 'Request not found.' });
  audit(req, `replacement.${status}`, 'order', row.order_id, { request: id, note });
  res.json((await shape([row]))[0]);
}));

export default router;
