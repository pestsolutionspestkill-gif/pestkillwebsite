// PCO (pest control operator) buyer accounts. Pesticides are sold only to licensed PCOs, so a
// customer account must apply with licence details and a copy of the licence, and be approved
// before it can place orders. An approved account stops ordering when its licence expires.
import express from 'express';
import db, { audit, NOW } from '../db.js';
import { auth, requirePermission, ah } from '../middleware/rbac.js';
import { str, oneOf, intId, ValidationError } from '../utils/validate.js';
import { checkFirmName } from '../utils/antiAbuse.js';
import { readDataUrl } from '../utils/files.js';

const router = express.Router();
const STATUSES = ['pending', 'approved', 'rejected'];
const DOC_KINDS = { licence: 'pest control licence', gst: 'GST certificate' };
const DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const istToday = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

// GST state codes for the states offered on the form.
const GST_STATE = { '08': 'Rajasthan', '07': 'Delhi', '06': 'Haryana', '09': 'Uttar Pradesh', 23: 'Madhya Pradesh', 24: 'Gujarat', '03': 'Punjab', 27: 'Maharashtra' };

/** Validates a GSTIN's format and its check digit (the official mod-36 checksum). */
export const checkGstin = (gstin, state) => {
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
    throw new ValidationError('GSTIN should look like 08ABCDE1234F1Z5 (15 characters).');
  }
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let sum = 0;
  for (let i = 0; i < 14; i += 1) {
    const p = chars.indexOf(gstin[i]) * (i % 2 ? 2 : 1);
    sum += Math.floor(p / 36) + (p % 36);
  }
  if (chars[(36 - (sum % 36)) % 36] !== gstin[14]) throw new ValidationError('This GSTIN is not valid. Please check it against your GST certificate.');
  const code = gstin.slice(0, 2);
  if (state && GST_STATE[code] && state !== 'Other' && GST_STATE[code] !== state) {
    throw new ValidationError(`This GSTIN is registered in ${GST_STATE[code]}, but the state selected is ${state}.`);
  }
  return gstin;
};

const readApplication = (b) => {
  const state = str(b.state, { field: 'State', max: 60 });
  const gstinRaw = str(b.gstin, { field: 'GSTIN', max: 15 })?.toUpperCase() ?? null;
  const pincode = str(b.pincode, { field: 'PIN code', max: 6 });
  if (pincode && !/^[1-9][0-9]{5}$/.test(pincode)) throw new ValidationError('Enter a valid 6-digit PIN code.');
  const validTill = str(b.licenceValidTill, { field: 'Licence validity', max: 20 });
  if (!validTill || !/^\d{4}-\d{2}-\d{2}$/.test(validTill) || Number.isNaN(Date.parse(validTill))) throw new ValidationError('Enter the date your licence is valid till.');
  if (validTill < istToday()) throw new ValidationError('Your licence has expired. Renew it and upload the renewed licence.');
  return {
    firm_name: checkFirmName(b.firmName, 'Firm name'),
    licence_no: str(b.licenceNo, { field: 'Pest control licence number', min: 3, max: 80, required: true }),
    licence_valid_till: validTill,
    gstin: gstinRaw ? checkGstin(gstinRaw, state) : null,
    address: str(b.address, { field: 'Address', min: 6, max: 300, required: true }),
    city: str(b.city, { field: 'City', min: 2, max: 60, required: true }),
    state,
    pincode,
  };
};

const documentsOf = async (userId) => db.all('SELECT kind, mime, size, uploaded_at FROM buyer_documents WHERE user_id = ? ORDER BY kind', userId);

const profile = async (userId) => {
  const b = await db.get('SELECT firm_name, licence_no, licence_valid_till, gstin, address, city, state, pincode, status, admin_note, applied_at, reviewed_at FROM buyer_profiles WHERE user_id = ?', userId);
  if (!b) return null;
  const expired = Boolean(b.licence_valid_till && b.licence_valid_till < istToday());
  const daysLeft = b.licence_valid_till ? Math.round((Date.parse(b.licence_valid_till) - Date.parse(istToday())) / 86400000) : null;
  return { ...b, licence_expired: expired, licence_days_left: daysLeft, documents: await documentsOf(userId) };
};

router.get('/me', auth, ah(async (req, res) => { res.json(await profile(req.user.id)); }));

// Upload (or replace) a licence or GST certificate copy: PDF, JPG, PNG or WebP up to 5 MB.
router.post('/documents/:kind', auth, ah(async (req, res) => {
  if (req.user.role !== 'client') throw new ValidationError('Staff accounts cannot apply as PCO buyers.');
  const kind = req.params.kind;
  if (!DOC_KINDS[kind]) throw new ValidationError('Upload a licence or GST certificate.');
  const { mime, data } = readDataUrl(req.body?.dataUrl, { types: DOC_TYPES, maxBytes: 5 * 1024 * 1024, label: DOC_KINDS[kind] });
  await db.run(`INSERT INTO buyer_documents (user_id, kind, mime, data, size, uploaded_at) VALUES (?, ?, ?, ?, ?, ${NOW})
    ON CONFLICT (user_id, kind) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, size = EXCLUDED.size, uploaded_at = EXCLUDED.uploaded_at`,
  req.user.id, kind, mime, data, data.length);
  audit(req, 'buyer.document', 'user', req.user.id, { kind, bytes: data.length });
  res.status(201).json(await documentsOf(req.user.id));
}));

// Apply, update a pending/rejected application, or renew an expired licence (all go back to review).
router.post('/apply', auth, ah(async (req, res) => {
  if (req.user.role !== 'client') throw new ValidationError('Staff accounts cannot apply as PCO buyers. Use a customer account.');
  const existing = await profile(req.user.id);
  if (existing?.status === 'approved' && !existing.licence_expired) {
    return res.status(409).json({ error: 'Your PCO account is already approved. Contact us to change licence details.' });
  }
  if (!await db.get("SELECT 1 FROM buyer_documents WHERE user_id = ? AND kind = 'licence'", req.user.id)) {
    throw new ValidationError('Upload a copy of your pest control licence (PDF or photo).');
  }
  const a = readApplication(req.body || {});
  const keys = Object.keys(a);
  await db.run(`INSERT INTO buyer_profiles (user_id, ${keys.join(', ')}, status, applied_at) VALUES (?, ${keys.map(() => '?').join(', ')}, 'pending', ${NOW})
    ON CONFLICT (user_id) DO UPDATE SET ${keys.map((k) => `${k} = EXCLUDED.${k}`).join(', ')}, status = 'pending', admin_note = NULL, applied_at = ${NOW}, reviewed_at = NULL, reviewed_by = NULL`,
  req.user.id, ...keys.map((k) => a[k]));
  audit(req, 'buyer.apply', 'user', req.user.id, { firm: a.firm_name });
  res.status(201).json(await profile(req.user.id));
}));

router.get('/', requirePermission('buyers.manage'), ah(async (req, res) => {
  const status = req.query.status && STATUSES.includes(req.query.status) ? req.query.status : null;
  const rows = await db.all(`SELECT b.*, u.name, u.email, u.phone, r.name AS reviewed_by_name,
      (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = b.user_id) AS orders,
      (SELECT string_agg(d.kind, ',') FROM buyer_documents d WHERE d.user_id = b.user_id) AS document_kinds
    FROM buyer_profiles b JOIN users u ON u.id = b.user_id LEFT JOIN users r ON r.id = b.reviewed_by
    ${status ? 'WHERE b.status = ?' : ''}
    ORDER BY CASE b.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, b.applied_at DESC LIMIT 500`, ...(status ? [status] : []));
  const today = istToday();
  res.json(rows.map((r) => ({ ...r, documents: r.document_kinds ? r.document_kinds.split(',') : [], licence_expired: Boolean(r.licence_valid_till && r.licence_valid_till < today) })));
}));

// Staff view a buyer's uploaded licence / GST certificate.
router.get('/:userId/documents/:kind', requirePermission('buyers.manage'), ah(async (req, res) => {
  const d = await db.get('SELECT mime, data FROM buyer_documents WHERE user_id = ? AND kind = ?', intId(req.params.userId), String(req.params.kind));
  if (!d) return res.status(404).json({ error: 'Document not found.' });
  res.set({ 'Content-Type': d.mime, 'Content-Disposition': 'inline', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
  res.send(Buffer.from(d.data));
}));

router.patch('/:userId', requirePermission('buyers.manage'), ah(async (req, res) => {
  const userId = intId(req.params.userId);
  const status = oneOf(req.body.status, ['approved', 'rejected'], 'status');
  const note = str(req.body.note, { field: 'Note', max: 500 });
  if (status === 'rejected' && !note) throw new ValidationError('Add a short reason so the buyer knows what to fix.');
  if (status === 'approved') {
    const b = await db.get('SELECT licence_valid_till FROM buyer_profiles WHERE user_id = ?', userId);
    if (b?.licence_valid_till && b.licence_valid_till < istToday()) throw new ValidationError('This licence has expired; ask the buyer to upload the renewed licence.');
    if (!await db.get("SELECT 1 FROM buyer_documents WHERE user_id = ? AND kind = 'licence'", userId)) {
      throw new ValidationError('No licence copy has been uploaded yet. Check the licence before approving.');
    }
  }
  const row = await db.get(`UPDATE buyer_profiles SET status = ?, admin_note = ?, reviewed_at = ${NOW}, reviewed_by = ? WHERE user_id = ? RETURNING user_id`, status, note, req.user.id, userId);
  if (!row) return res.status(404).json({ error: 'Application not found.' });
  audit(req, `buyer.${status}`, 'user', userId, { note });
  res.json(await db.get('SELECT b.*, u.name, u.email, u.phone FROM buyer_profiles b JOIN users u ON u.id = b.user_id WHERE b.user_id = ?', userId));
}));

export default router;
