// Registers the owner maintains: business licences, technical standards and market reference prices.
//   /api/licences          public list (display on) + licence copy; admin edit, upload, verify
//   /api/standards         public list (display on); admin create, edit, delete
//   /api/reference-prices  staff only: comparison with our prices; edit, link, review status
import express from 'express';
import db, { audit, NOW } from '../db.js';
import { requirePermission, ah, signFileToken, verifyFileToken } from '../middleware/rbac.js';
import { str, intId, oneOf, ValidationError } from '../utils/validate.js';
import { readDataUrl } from '../utils/files.js';

export const licenceRouter = express.Router();
export const standardRouter = express.Router();
export const referencePriceRouter = express.Router();

const dateValue = (v, field) => {
  const s = str(v, { field, max: 10 });
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) throw new ValidationError(`${field} must be a valid date.`);
  return s;
};

/* ======================= Licences ======================= */
const LIC_COLS = 'id, key, title, number, activity, issuing_authority, valid_from, valid_until, status, display, doc_mime, doc_size, sort, updated_at';
// Authority and validity are published only after the licence has been verified against its copy.
// The licence copy itself is private: the public list says only whether one is on file.
const publicLicence = (l) => ({
  id: l.id, key: l.key, title: l.title, number: l.number, activity: l.activity, status: l.status,
  has_document: Boolean(l.doc_size),
  ...(l.status === 'verified' ? { issuing_authority: l.issuing_authority, valid_from: l.valid_from, valid_until: l.valid_until } : {}),
});

licenceRouter.get('/', ah(async (_req, res) => {
  res.json((await db.all(`SELECT ${LIC_COLS} FROM licences WHERE display = 1 ORDER BY sort, id`)).map(publicLicence));
}));

licenceRouter.get('/all', requirePermission('settings.manage'), ah(async (_req, res) => {
  res.json(await db.all(`SELECT ${LIC_COLS} FROM licences ORDER BY sort, id`));
}));

// Licence copies are never served from a permanent public URL. An owner asks for a link that is
// valid for 5 minutes and bound to their account; every link issued and every view is audit-logged.
licenceRouter.post('/:id/document-link', requirePermission('settings.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const l = await db.get('SELECT doc_size FROM licences WHERE id = ?', id);
  if (!l?.doc_size) return res.status(404).json({ error: 'No licence copy uploaded.' });
  const t = signFileToken(`licence:${id}`, req.user.id, 300);
  audit(req, 'licence.document_link', 'licence', id);
  res.json({ url: `/api/licences/${id}/document?t=${encodeURIComponent(t)}`, expires_in: 300 });
}));

licenceRouter.get('/:id/document', ah(async (req, res) => {
  const id = intId(req.params.id);
  const tok = verifyFileToken(req.query.t, `licence:${id}`);
  if (!tok) return res.status(403).json({ error: 'This link has expired or is not valid. Open the licence again from the admin console.' });
  const l = await db.get('SELECT doc_mime, doc_data, doc_size, key FROM licences WHERE id = ?', id);
  if (!l?.doc_size) return res.status(404).json({ error: 'Licence copy not available.' });
  const viewer = await db.get('SELECT id, name, role FROM users WHERE id = ?', Number(tok.sub));
  audit({ user: viewer || null, ip: req.ip }, 'licence.document_view', 'licence', id);
  res.set({
    'Content-Type': l.doc_mime,
    'Content-Disposition': `inline; filename="pestkill-${l.key}-licence.${l.doc_mime === 'application/pdf' ? 'pdf' : l.doc_mime === 'image/png' ? 'png' : 'jpg'}"`,
    'Cache-Control': 'private, no-store, max-age=0', 'Pragma': 'no-cache', 'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  });
  res.send(Buffer.from(l.doc_data));
}));

licenceRouter.patch('/:id', requirePermission('settings.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const before = await db.get('SELECT * FROM licences WHERE id = ?', id);
  if (!before) return res.status(404).json({ error: 'Licence not found.' });
  const b = req.body || {};
  const m = {};
  if (b.title !== undefined) m.title = str(b.title, { field: 'Title', min: 3, max: 120, required: true });
  if (b.number !== undefined) m.number = str(b.number, { field: 'Licence number', min: 3, max: 80, required: true });
  if (b.activity !== undefined) m.activity = str(b.activity, { field: 'Activity', min: 3, max: 200, required: true });
  if (b.issuingAuthority !== undefined) m.issuing_authority = str(b.issuingAuthority, { field: 'Issuing authority', max: 200 });
  if (b.validFrom !== undefined) m.valid_from = dateValue(b.validFrom, 'Valid from');
  if (b.validUntil !== undefined) m.valid_until = dateValue(b.validUntil, 'Valid until');
  if (b.display !== undefined) m.display = b.display ? 1 : 0;
  if (b.status !== undefined) m.status = oneOf(b.status, ['unverified', 'verified'], 'status');
  const next = { ...before, ...m };
  if (next.valid_from && next.valid_until && next.valid_until < next.valid_from) throw new ValidationError('"Valid until" cannot be before "Valid from".');
  if (m.status === 'verified' && !before.doc_size) throw new ValidationError('Upload the licence copy before marking it verified.');
  // Changing what the licence says needs a fresh verification.
  if (['number', 'issuing_authority', 'valid_from', 'valid_until'].some((k) => k in m && String(m[k] ?? '') !== String(before[k] ?? '')) && m.status !== 'verified') m.status = 'unverified';
  const keys = Object.keys(m);
  if (!keys.length) throw new ValidationError('Nothing to update.');
  await db.run(`UPDATE licences SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = ${NOW} WHERE id = ?`, ...keys.map((k) => m[k]), id);
  audit(req, 'licence.update', 'licence', id, { fields: keys });
  res.json(await db.get(`SELECT ${LIC_COLS} FROM licences WHERE id = ?`, id));
}));

licenceRouter.put('/:id/document', requirePermission('settings.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  if (!await db.get('SELECT 1 FROM licences WHERE id = ?', id)) return res.status(404).json({ error: 'Licence not found.' });
  const { mime, data } = readDataUrl(req.body?.dataUrl, { types: ['application/pdf', 'image/jpeg', 'image/png'], maxBytes: 5 * 1024 * 1024, label: 'licence copy' });
  // A new copy needs to be checked again before validity is shown.
  await db.run(`UPDATE licences SET doc_mime = ?, doc_data = ?, doc_size = ?, status = 'unverified', updated_at = ${NOW} WHERE id = ?`, mime, data, data.length, id);
  audit(req, 'licence.document', 'licence', id, { bytes: data.length });
  res.json(await db.get(`SELECT ${LIC_COLS} FROM licences WHERE id = ?`, id));
}));

licenceRouter.delete('/:id/document', requirePermission('settings.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  await db.run(`UPDATE licences SET doc_mime = NULL, doc_data = NULL, doc_size = NULL, status = 'unverified', updated_at = ${NOW} WHERE id = ?`, id);
  audit(req, 'licence.document_removed', 'licence', id);
  res.json(await db.get(`SELECT ${LIC_COLS} FROM licences WHERE id = ?`, id));
}));

/* ======================= Technical standards ======================= */
const STD_STATUS = ['verified_official', 'archived_copy', 'not_confirmed'];
const readStandard = (b, partial) => {
  const m = {};
  const text = (key, field, max, required = false) => { if (!partial || b[key] !== undefined) m[key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = str(b[key], { field, max, required, min: required ? 2 : 0 }); };
  text('code', 'Standard number', 80, true);
  text('title', 'Title', 300, true);
  text('edition', 'Edition', 120);
  text('amendmentStatus', 'Amendment status', 400);
  text('scope', 'Scope', 1500);
  text('sourceNote', 'Source note', 600);
  text('appliesTo', 'Applies to', 300);
  if (!partial || b.sourceUrl !== undefined) {
    const u = str(b.sourceUrl, { field: 'Source URL', max: 500 });
    if (u && !/^https:\/\/[^\s]+$/.test(u)) throw new ValidationError('Source URL must start with https://');
    m.source_url = u;
  }
  if (!partial || b.verificationStatus !== undefined) m.verification_status = oneOf(b.verificationStatus ?? 'not_confirmed', STD_STATUS, 'verification status');
  if (b.verifiedOn !== undefined) m.verified_on = dateValue(b.verifiedOn, 'Verified on');
  if (b.display !== undefined) m.display = b.display ? 1 : 0;
  if (b.sort !== undefined) m.sort = Math.max(0, Math.min(1000, parseInt(b.sort, 10) || 0));
  return m;
};

standardRouter.get('/', ah(async (_req, res) => {
  res.json(await db.all('SELECT id, code, title, edition, amendment_status, scope, source_url, source_note, verification_status, verified_on, applies_to FROM technical_references WHERE display = 1 ORDER BY sort, id'));
}));
standardRouter.get('/all', requirePermission('settings.manage', 'products.edit'), ah(async (_req, res) => {
  res.json(await db.all('SELECT * FROM technical_references ORDER BY sort, id'));
}));
standardRouter.post('/', requirePermission('settings.manage'), ah(async (req, res) => {
  const m = readStandard(req.body || {}, false);
  const keys = Object.keys(m);
  const row = await db.get(`INSERT INTO technical_references (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`, ...keys.map((k) => m[k]));
  audit(req, 'standard.create', 'standard', row.id, { code: row.code });
  res.status(201).json(row);
}));
standardRouter.patch('/:id', requirePermission('settings.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const m = readStandard(req.body || {}, true);
  const keys = Object.keys(m);
  if (!keys.length) throw new ValidationError('Nothing to update.');
  const row = await db.get(`UPDATE technical_references SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = ${NOW} WHERE id = ? RETURNING *`, ...keys.map((k) => m[k]), id);
  if (!row) return res.status(404).json({ error: 'Reference not found.' });
  audit(req, 'standard.update', 'standard', id, { fields: keys });
  res.json(row);
}));
standardRouter.delete('/:id', requirePermission('settings.manage'), ah(async (req, res) => {
  const row = await db.get('DELETE FROM technical_references WHERE id = ? RETURNING id', intId(req.params.id));
  if (!row) return res.status(404).json({ error: 'Reference not found.' });
  audit(req, 'standard.delete', 'standard', row.id);
  res.json({ message: 'Deleted.' });
}));

/* ======================= Reference prices ======================= */
// Comparison of market reference prices with our own MRP and selling price. Never changes our prices.
referencePriceRouter.get('/', requirePermission('products.view', 'products.edit'), ah(async (req, res) => {
  const status = ['matched', 'review', 'unmatched'].includes(req.query.status) ? req.query.status : null;
  const rows = await db.all(`SELECT r.*, p.slug, p.name AS our_name, p.pack_size AS our_pack, p.mrp AS our_mrp, p.offer_price AS our_offer, p.pco_price AS our_pco
    FROM reference_prices r LEFT JOIN products p ON p.id = r.product_id ${status ? 'WHERE r.match_status = ?' : ''} ORDER BY r.match_status, r.ref_brand, r.ref_name`, ...(status ? [status] : []));
  const ours = (r) => r.our_offer ?? r.our_mrp;
  res.json(rows.map((r) => ({
    ...r,
    our_selling: ours(r),
    difference: r.displayed_price != null && ours(r) != null ? Math.round((ours(r) - r.displayed_price) * 100) / 100 : null,
    mrp_difference: r.displayed_mrp != null && r.our_mrp != null ? Math.round((r.our_mrp - r.displayed_mrp) * 100) / 100 : null,
  })));
}));

referencePriceRouter.patch('/:id', requirePermission('products.edit'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const b = req.body || {};
  const m = {};
  if (b.productId !== undefined) {
    m.product_id = b.productId ? intId(b.productId) : null;
    if (m.product_id && !await db.get('SELECT 1 FROM products WHERE id = ?', m.product_id)) throw new ValidationError('Product not found.');
  }
  if (b.matchStatus !== undefined) m.match_status = oneOf(b.matchStatus, ['matched', 'review', 'unmatched'], 'match status');
  if (m.match_status === 'matched' && !(m.product_id ?? (await db.get('SELECT product_id FROM reference_prices WHERE id = ?', id))?.product_id)) {
    throw new ValidationError('Choose our product before marking it matched.');
  }
  for (const [k, col] of [['displayedPrice', 'displayed_price'], ['displayedMrp', 'displayed_mrp']]) {
    if (b[k] === undefined) continue;
    if (b[k] === null || b[k] === '') { m[col] = null; continue; }
    const n = Number(b[k]);
    if (!Number.isFinite(n) || n < 0 || n > 10000000) throw new ValidationError(`Invalid ${k}.`);
    m[col] = n;
  }
  if (b.checkedOn !== undefined) m.checked_on = dateValue(b.checkedOn, 'Checked on') || new Date().toISOString().slice(0, 10);
  if (b.notes !== undefined) m.notes = str(b.notes, { field: 'Notes', max: 500 });
  const keys = Object.keys(m);
  if (!keys.length) throw new ValidationError('Nothing to update.');
  const row = await db.get(`UPDATE reference_prices SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = ${NOW} WHERE id = ? RETURNING id`, ...keys.map((k) => m[k]), id);
  if (!row) return res.status(404).json({ error: 'Reference not found.' });
  audit(req, 'reference_price.update', 'reference_price', id, { fields: keys });
  res.json(await db.get('SELECT * FROM reference_prices WHERE id = ?', id));
}));
