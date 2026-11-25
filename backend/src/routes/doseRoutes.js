// Label dosage records for the dosage calculator.
// Staff enter the rates printed on a product's label (or its registered leaflet) and attach the
// source. A record is used for calculations only after a manager/owner marks it verified; changing
// any number puts it back to "unverified". Nothing here suggests or invents a dose.
import express from 'express';
import db, { audit, NOW } from '../db.js';
import { requirePermission, ah } from '../middleware/rbac.js';
import { str, intId, oneOf, ValidationError } from '../utils/validate.js';

const router = express.Router();

// Which label rates each activity uses. Units: product_per_litre = ml or g of product per litre
// of water; rate_horizontal / rate_vertical = litres of diluted solution per m²; rate_running =
// litres per running metre; product_per_1000l = ml or g per 1000 L of water; bait_per_point = g.
export const ACTIVITIES = {
  termite_pre: { label: 'Termite: pre-construction soil treatment', dilution: true, rates: ['rate_horizontal', 'rate_vertical', 'rate_running'] },
  termite_post: { label: 'Termite: post-construction treatment', dilution: true, rates: ['rate_running', 'rate_horizontal'] },
  cockroach: { label: 'Cockroach: residual spray', dilution: true, rates: ['rate_horizontal'] },
  bedbug: { label: 'Bed bug: residual spray', dilution: true, rates: ['rate_horizontal'] },
  general: { label: 'General pests: residual spray', dilution: true, rates: ['rate_horizontal'] },
  mosquito_residual: { label: 'Mosquito: indoor residual spray', dilution: true, rates: ['rate_horizontal'] },
  larvicide: { label: 'Mosquito: larvicide in water', dilution: false, rates: ['product_per_1000l'] },
  rodent: { label: 'Rodent: bait placement', dilution: false, rates: ['bait_per_point'] },
};
const NUMBERS = ['product_per_litre', 'rate_horizontal', 'rate_vertical', 'rate_running', 'product_per_1000l', 'bait_per_point'];
const LIMITS = { product_per_litre: 1000, rate_horizontal: 50, rate_vertical: 50, rate_running: 50, product_per_1000l: 100000, bait_per_point: 5000 };

const num = (v, field) => {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0 || n > LIMITS[field]) throw new ValidationError(`${field.replace(/_/g, ' ')} must be a positive number up to ${LIMITS[field]}.`);
  return n;
};

const shape = (r) => ({
  id: r.id, product_id: r.product_id, activity: r.activity, activity_label: ACTIVITIES[r.activity]?.label || r.activity,
  method: r.method, amount_unit: r.amount_unit, notes: r.notes,
  product_per_litre: r.product_per_litre, rate_horizontal: r.rate_horizontal, rate_vertical: r.rate_vertical,
  rate_running: r.rate_running, product_per_1000l: r.product_per_1000l, bait_per_point: r.bait_per_point,
  status: r.status, verified_at: r.verified_at, verified_by_name: r.verified_by_name || null,
  source_note: r.source_note || null,
  manufacturer: r.manufacturer || null,
  // Reference only: the rate itself always comes from the product label.
  standard: r.standard_id ? { id: r.standard_id, code: r.standard_code, title: r.standard_title, status: r.standard_status } : null,
  source_document: r.source_document_id ? { id: r.source_document_id, title: r.source_title || 'Label', url: `/api/documents/${r.source_document_id}/file` } : null,
});

const SELECT = `SELECT r.*, u.name AS verified_by_name, d.title AS source_title, s.code AS standard_code, s.title AS standard_title,
    s.verification_status AS standard_status, p.brand AS manufacturer
  FROM dose_records r LEFT JOIN users u ON u.id = r.verified_by LEFT JOIN product_documents d ON d.id = r.source_document_id
  LEFT JOIN technical_references s ON s.id = r.standard_id LEFT JOIN products p ON p.id = r.product_id`;

/** Verified records for one product (public). */
export const verifiedDosesFor = async (productId) => (await db.all(`${SELECT} WHERE r.product_id = ? AND r.status = 'verified' ORDER BY r.activity, r.id`, productId)).map(shape);

const validateRecord = (row) => {
  const a = ACTIVITIES[row.activity];
  if (a.dilution && row.product_per_litre == null) throw new ValidationError('Enter the label dilution (product per litre of water).');
  if (!a.rates.some((k) => row[k] != null)) throw new ValidationError(`Enter at least one label rate for "${a.label}".`);
};

const readRecord = (b, { partial }) => {
  const m = {};
  if (!partial || b.activity !== undefined) m.activity = oneOf(b.activity, Object.keys(ACTIVITIES), 'activity');
  if (!partial || b.method !== undefined) m.method = str(b.method, { field: 'Application method', min: 3, max: 200, required: true });
  if (b.amountUnit !== undefined) m.amount_unit = oneOf(b.amountUnit, ['ml', 'g'], 'unit');
  if (b.notes !== undefined) m.notes = str(b.notes, { field: 'Notes', max: 600 });
  if (b.standardId !== undefined) m.standard_id = b.standardId ? intId(b.standardId) : null;
  for (const k of NUMBERS) {
    const camel = k.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
    const v = num(b[camel], k);
    if (v !== undefined) m[k] = v;
  }
  return m;
};

/* ---------- Public: verified data for the calculator ---------- */
router.get('/calculator', ah(async (req, res) => {
  const activity = oneOf(req.query.activity, Object.keys(ACTIVITIES), 'activity');
  const rows = await db.all(`${SELECT} WHERE r.activity = ? AND r.status = 'verified'
    AND EXISTS (SELECT 1 FROM products p WHERE p.id = r.product_id AND p.is_active = 1) ORDER BY r.id`, activity);
  const out = [];
  for (const r of rows) {
    const p = await db.get('SELECT id, slug, name, brand, technical, formulation FROM products WHERE id = ?', r.product_id);
    // Pack sizes of the same product, with prices where an MRP or running offer exists.
    const packs = await db.all(`SELECT id, slug, pack_size, mrp, mrp_verified, offer_price, offer_ends FROM products
      WHERE brand = ? AND name = ? AND is_active = 1 ORDER BY mrp ASC NULLS LAST, id`, p.brand, p.name);
    const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
    out.push({
      ...shape(r),
      product: p,
      packs: packs.map((x) => ({ id: x.id, slug: x.slug, pack_size: x.pack_size,
        // Only pack-verified MRPs are shown to customers.
        price: Number(x.mrp_verified) !== 1 || x.mrp == null ? null : x.offer_price != null && x.offer_price < x.mrp && (!x.offer_ends || x.offer_ends >= today) ? x.offer_price : x.mrp })),
    });
  }
  const pending = (await db.get("SELECT COUNT(*)::int n FROM dose_records WHERE activity = ? AND status <> 'verified'", activity)).n;
  res.json({ activity, label: ACTIVITIES[activity].label, records: out, pending });
}));

router.get('/activities', (_req, res) => res.json(Object.entries(ACTIVITIES).map(([key, a]) => ({ key, label: a.label, rates: a.rates, dilution: a.dilution }))));

/* ---------- Staff ---------- */
router.get('/', requirePermission('products.view', 'products.edit'), ah(async (req, res) => {
  const productId = req.query.productId ? intId(req.query.productId) : null;
  res.json((await db.all(`${SELECT} ${productId ? 'WHERE r.product_id = ?' : ''} ORDER BY r.product_id, r.activity, r.id`, ...(productId ? [productId] : []))).map(shape));
}));

router.post('/', requirePermission('products.edit'), ah(async (req, res) => {
  const productId = intId(req.body?.productId);
  if (!await db.get('SELECT 1 FROM products WHERE id = ?', productId)) return res.status(404).json({ error: 'Product not found.' });
  const m = readRecord(req.body || {}, { partial: false });
  m.amount_unit = m.amount_unit || 'ml';
  validateRecord(m);
  const keys = Object.keys(m);
  const row = await db.get(`INSERT INTO dose_records (product_id, ${keys.join(', ')}, status, created_by, updated_at)
    VALUES (?, ${keys.map(() => '?').join(', ')}, 'unverified', ?, ${NOW}) RETURNING id`, productId, ...keys.map((k) => m[k]), req.user.id);
  audit(req, 'dose.create', 'product', productId, { id: row.id, activity: m.activity });
  res.status(201).json(shape(await db.get(`${SELECT} WHERE r.id = ?`, row.id)));
}));

// Any change to the numbers or method needs a fresh verification.
router.patch('/:id', requirePermission('products.edit'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const before = await db.get('SELECT * FROM dose_records WHERE id = ?', id);
  if (!before) return res.status(404).json({ error: 'Dose record not found.' });
  const m = readRecord(req.body || {}, { partial: true });
  validateRecord({ ...before, ...m });
  const keys = Object.keys(m);
  if (!keys.length) throw new ValidationError('Nothing to update.');
  // Notes and the related standard are references only; any label figure or the method needs re-verification.
  const resets = keys.some((k) => !['notes', 'standard_id'].includes(k) && String(m[k]) !== String(before[k]));
  await db.run(`UPDATE dose_records SET ${keys.map((k) => `${k} = ?`).join(', ')}${resets ? ", status = 'unverified', verified_by = NULL, verified_at = NULL" : ''}, updated_at = ${NOW} WHERE id = ?`,
    ...keys.map((k) => m[k]), id);
  audit(req, 'dose.update', 'dose', id, { fields: keys, needsReverification: resets });
  res.json(shape(await db.get(`${SELECT} WHERE r.id = ?`, id)));
}));

// Verification needs the label as an uploaded document of this product, or a written source reference.
router.post('/:id/verify', requirePermission('products.edit'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const r = await db.get('SELECT * FROM dose_records WHERE id = ?', id);
  if (!r) return res.status(404).json({ error: 'Dose record not found.' });
  if (!['owner', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Only an owner or manager can verify label data.' });
  const docId = req.body?.sourceDocumentId ? intId(req.body.sourceDocumentId) : null;
  const note = str(req.body?.sourceNote, { field: 'Source reference', max: 400 });
  if (docId && !await db.get("SELECT 1 FROM product_documents WHERE id = ? AND product_id = ? AND kind IN ('label', 'tds', 'msds')", docId, r.product_id)) {
    throw new ValidationError('The source must be a label, TDS or SDS uploaded for this product.');
  }
  if (!docId && (!note || note.length < 10)) throw new ValidationError('Attach the product label (upload it under documents) or describe the source, e.g. label revision and date.');
  if (req.body?.confirm !== true) throw new ValidationError('Confirm that every number matches the source exactly.');
  await db.run(`UPDATE dose_records SET status = 'verified', source_document_id = ?, source_note = ?, verified_by = ?, verified_at = ${NOW}, updated_at = ${NOW} WHERE id = ?`,
    docId, note, req.user.id, id);
  audit(req, 'dose.verify', 'dose', id, { sourceDocumentId: docId });
  res.json(shape(await db.get(`${SELECT} WHERE r.id = ?`, id)));
}));

router.post('/:id/unverify', requirePermission('products.edit'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const row = await db.get(`UPDATE dose_records SET status = 'unverified', verified_by = NULL, verified_at = NULL, updated_at = ${NOW} WHERE id = ? RETURNING id`, id);
  if (!row) return res.status(404).json({ error: 'Dose record not found.' });
  audit(req, 'dose.unverify', 'dose', id);
  res.json(shape(await db.get(`${SELECT} WHERE r.id = ?`, id)));
}));

router.delete('/:id', requirePermission('products.edit'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const row = await db.get('DELETE FROM dose_records WHERE id = ? RETURNING product_id', id);
  if (!row) return res.status(404).json({ error: 'Dose record not found.' });
  audit(req, 'dose.delete', 'product', row.product_id, { id });
  res.json({ message: 'Dose record deleted.' });
}));

export default router;
