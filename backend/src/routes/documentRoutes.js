// Technical documents for products: safety data sheets (SDS/MSDS), labels, technical datasheets,
// certificates. Staff upload real files with metadata; visitors see only what their access allows.
// Nothing here generates documents: every file is one a person uploaded.
import express from 'express';
import db, { audit, NOW } from '../db.js';
import { optionalAuth, requirePermission, can, ah } from '../middleware/rbac.js';
import { str, intId, oneOf, ValidationError } from '../utils/validate.js';
import { readDataUrl } from '../utils/files.js';
import { isApprovedBuyer } from './productRoutes.js';

const router = express.Router();

export const DOC_TYPES = {
  msds: 'Safety data sheet (SDS / MSDS)',
  label: 'Label & leaflet',
  tds: 'Technical datasheet (TDS)',
  certificate: 'Certificate',
  other: 'Other document',
};
export const VISIBILITY = { public: 'Everyone', pco: 'Verified PCO buyers and staff', staff: 'Staff only' };
const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_BYTES = 5 * 1024 * 1024;

const META_COLS = `d.id, d.product_id, d.kind, d.title, d.description, d.manufacturer, d.version, d.issue_date, d.revision_date,
  d.visibility, d.mime, d.size, d.uploaded_at, COALESCE(d.updated_at, d.uploaded_at) AS updated_at`;

/** Which visibility levels a request may see. */
export const docAccess = async (user) => {
  if (can(user, 'products.view') || can(user, 'products.edit')) return ['public', 'pco', 'staff'];
  if (await isApprovedBuyer(user?.id)) return ['public', 'pco'];
  return ['public'];
};

export const shapeDoc = (d) => ({
  id: d.id,
  product_id: d.product_id,
  kind: d.kind,
  type: DOC_TYPES[d.kind] || DOC_TYPES.other,
  title: d.title || DOC_TYPES[d.kind] || 'Document',
  description: d.description || null,
  manufacturer: d.manufacturer || null,
  version: d.version || null,
  issue_date: d.issue_date || null,
  revision_date: d.revision_date || null,
  visibility: d.visibility,
  mime: d.mime,
  size: d.size,
  updated_at: d.updated_at,
  url: `/api/documents/${d.id}/file`,
  download_url: `/api/documents/${d.id}/file?download=1`,
  ...(d.slug ? { product: { slug: d.slug, name: d.name, brand: d.brand, technical: d.technical, pack_size: d.pack_size } } : {}),
});

/** Documents of one product that `levels` may see (newest first within each type). */
export const documentsFor = async (productId, levels = ['public']) => (await db.all(
  `SELECT ${META_COLS} FROM product_documents d WHERE d.product_id = ? AND d.visibility IN (${levels.map(() => '?').join(', ')})
   ORDER BY CASE d.kind WHEN 'msds' THEN 0 WHEN 'label' THEN 1 WHEN 'tds' THEN 2 WHEN 'certificate' THEN 3 ELSE 4 END, COALESCE(d.updated_at, d.uploaded_at) DESC`,
  productId, ...levels,
)).map(shapeDoc);

const dateValue = (v, field) => {
  const s = str(v, { field, max: 10 });
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) throw new ValidationError(`${field} must be a valid date.`);
  return s;
};

const readMeta = (b, { partial }) => {
  const m = {};
  if (!partial || b.kind !== undefined) m.kind = oneOf(b.kind, Object.keys(DOC_TYPES), 'document type');
  if (!partial || b.title !== undefined) m.title = str(b.title, { field: 'Title', min: 3, max: 150, required: true });
  if (b.description !== undefined) m.description = str(b.description, { field: 'Description', max: 1000 });
  if (b.manufacturer !== undefined) m.manufacturer = str(b.manufacturer, { field: 'Manufacturer', max: 120 });
  if (b.version !== undefined) m.version = str(b.version, { field: 'Version', max: 40 });
  if (b.issueDate !== undefined) m.issue_date = dateValue(b.issueDate, 'Issue date');
  if (b.revisionDate !== undefined) m.revision_date = dateValue(b.revisionDate, 'Revision date');
  if (!partial || b.visibility !== undefined) m.visibility = oneOf(b.visibility ?? 'public', Object.keys(VISIBILITY), 'visibility');
  if (m.issue_date && m.revision_date && m.revision_date < m.issue_date) throw new ValidationError('Revision date cannot be before the issue date.');
  return m;
};

/* ---------- Public ---------- */

// List: ?productId= for one product; otherwise the library of every document you may see.
router.get('/', optionalAuth, ah(async (req, res) => {
  const levels = await docAccess(req.user);
  if (req.query.productId) return res.json(await documentsFor(intId(req.query.productId), levels));
  const kind = DOC_TYPES[req.query.kind] ? req.query.kind : null;
  const rows = await db.all(`SELECT ${META_COLS}, p.slug, p.name, p.brand, p.technical, p.pack_size
    FROM product_documents d JOIN products p ON p.id = d.product_id
    WHERE p.is_active = 1 AND d.visibility IN (${levels.map(() => '?').join(', ')}) ${kind ? 'AND d.kind = ?' : ''}
    ORDER BY p.brand, p.name, d.kind, COALESCE(d.updated_at, d.uploaded_at) DESC LIMIT 2000`, ...levels, ...(kind ? [kind] : []));
  res.json(rows.map(shapeDoc));
}));

// View (inline) or download (?download=1) one file. Hidden documents answer 404, not 403.
router.get('/:id/file', optionalAuth, ah(async (req, res) => {
  const d = await db.get(`SELECT d.*, p.slug, p.is_active FROM product_documents d JOIN products p ON p.id = d.product_id WHERE d.id = ?`, intId(req.params.id));
  const levels = await docAccess(req.user);
  const staff = levels.includes('staff');
  if (!d || !levels.includes(d.visibility) || (!d.is_active && !staff)) return res.status(404).json({ error: 'Document not found.' });
  if (!d.data || !d.size) return res.status(410).json({ error: 'This file is damaged or missing. Please ask us for a copy.' });
  const ext = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }[d.mime] || 'bin';
  const name = `${d.slug}-${d.kind}${d.version ? `-v${String(d.version).replace(/[^\w.-]/g, '')}` : ''}.${ext}`;
  res.set({
    'Content-Type': d.mime,
    'Content-Length': String(d.size),
    'Content-Disposition': `${req.query.download ? 'attachment' : 'inline'}; filename="${name}"`,
    'Cache-Control': d.visibility === 'public' ? 'public, max-age=600' : 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.send(Buffer.from(d.data));
}));

/* ---------- Staff ---------- */

router.post('/', requirePermission('products.edit'), ah(async (req, res) => {
  const productId = intId(req.body?.productId);
  if (!await db.get('SELECT 1 FROM products WHERE id = ?', productId)) return res.status(404).json({ error: 'Product not found.' });
  const meta = readMeta(req.body || {}, { partial: false });
  const { mime, data } = readDataUrl(req.body?.dataUrl, { types: FILE_TYPES, maxBytes: MAX_BYTES, label: 'document' });
  const keys = Object.keys(meta);
  const row = await db.get(`INSERT INTO product_documents (product_id, ${keys.join(', ')}, mime, data, size, uploaded_by, uploaded_at, updated_at)
    VALUES (?, ${keys.map(() => '?').join(', ')}, ?, ?, ?, ?, ${NOW}, ${NOW}) RETURNING id`, productId, ...keys.map((k) => meta[k]), mime, data, data.length, req.user.id);
  audit(req, 'document.create', 'product', productId, { id: row.id, kind: meta.kind, bytes: data.length });
  res.status(201).json(shapeDoc(await db.get(`SELECT ${META_COLS} FROM product_documents d WHERE d.id = ?`, row.id)));
}));

// Edit details and/or replace the file (e.g. a newer SDS revision).
router.patch('/:id', requirePermission('products.edit'), ah(async (req, res) => {
  const id = intId(req.params.id);
  if (!await db.get('SELECT 1 FROM product_documents WHERE id = ?', id)) return res.status(404).json({ error: 'Document not found.' });
  const changes = readMeta(req.body || {}, { partial: true });
  if (req.body?.dataUrl) {
    const { mime, data } = readDataUrl(req.body.dataUrl, { types: FILE_TYPES, maxBytes: MAX_BYTES, label: 'document' });
    Object.assign(changes, { mime, data, size: data.length });
  }
  const keys = Object.keys(changes);
  if (!keys.length) throw new ValidationError('Nothing to update.');
  await db.run(`UPDATE product_documents SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = ${NOW} WHERE id = ?`, ...keys.map((k) => changes[k]), id);
  audit(req, 'document.update', 'document', id, { fields: keys.filter((k) => k !== 'data'), replacedFile: Boolean(req.body?.dataUrl) });
  res.json(shapeDoc(await db.get(`SELECT ${META_COLS} FROM product_documents d WHERE d.id = ?`, id)));
}));

router.delete('/:id', requirePermission('products.delete'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const d = await db.get('SELECT product_id, kind FROM product_documents WHERE id = ?', id);
  if (!d) return res.status(404).json({ error: 'Document not found.' });
  await db.run('DELETE FROM product_documents WHERE id = ?', id);
  audit(req, 'document.delete', 'product', d.product_id, { id, kind: d.kind });
  res.json({ message: 'Document deleted.' });
}));

export default router;
