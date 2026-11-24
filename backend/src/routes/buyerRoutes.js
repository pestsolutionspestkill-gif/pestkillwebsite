// PCO (pest control operator) buyer accounts. Pesticides are sold only to licensed PCOs, so a
// customer account must apply with licence details and be approved before it can place orders.
import express from 'express';
import db, { audit, NOW } from '../db.js';
import { auth, requirePermission, ah } from '../middleware/rbac.js';
import { str, oneOf, intId, ValidationError } from '../utils/validate.js';
import { checkFirmName } from '../utils/antiAbuse.js';

const router = express.Router();
const STATUSES = ['pending', 'approved', 'rejected'];

const readApplication = (b) => {
  const gstin = str(b.gstin, { field: 'GSTIN', max: 15 })?.toUpperCase() ?? null;
  if (gstin && !/^[0-9]{2}[A-Z0-9]{13}$/.test(gstin)) throw new ValidationError('GSTIN should be 15 characters, e.g. 08ABCDE1234F1Z5.');
  const pincode = str(b.pincode, { field: 'PIN code', max: 6 });
  if (pincode && !/^[1-9][0-9]{5}$/.test(pincode)) throw new ValidationError('Enter a valid 6-digit PIN code.');
  return {
    firm_name: checkFirmName(b.firmName, 'Firm name'),
    licence_no: str(b.licenceNo, { field: 'Pest control licence number', min: 3, max: 80, required: true }),
    licence_valid_till: str(b.licenceValidTill, { field: 'Licence validity', max: 20 }),
    gstin,
    address: str(b.address, { field: 'Address', min: 6, max: 300, required: true }),
    city: str(b.city, { field: 'City', min: 2, max: 60, required: true }),
    state: str(b.state, { field: 'State', max: 60 }),
    pincode,
  };
};

router.get('/me', auth, ah(async (req, res) => {
  res.json(await db.get('SELECT firm_name, licence_no, licence_valid_till, gstin, address, city, state, pincode, status, admin_note, applied_at, reviewed_at FROM buyer_profiles WHERE user_id = ?', req.user.id) || null);
}));

// Apply, or update a pending/rejected application (which goes back to review).
router.post('/apply', auth, ah(async (req, res) => {
  if (req.user.role !== 'client') throw new ValidationError('Staff accounts cannot apply as PCO buyers. Use a customer account.');
  const existing = await db.get('SELECT status FROM buyer_profiles WHERE user_id = ?', req.user.id);
  if (existing?.status === 'approved') return res.status(409).json({ error: 'Your PCO account is already approved. Contact us to change licence details.' });
  const a = readApplication(req.body || {});
  const keys = Object.keys(a);
  await db.run(`INSERT INTO buyer_profiles (user_id, ${keys.join(', ')}, status, applied_at) VALUES (?, ${keys.map(() => '?').join(', ')}, 'pending', ${NOW})
    ON CONFLICT (user_id) DO UPDATE SET ${keys.map((k) => `${k} = EXCLUDED.${k}`).join(', ')}, status = 'pending', admin_note = NULL, applied_at = ${NOW}, reviewed_at = NULL, reviewed_by = NULL`,
  req.user.id, ...keys.map((k) => a[k]));
  audit(req, 'buyer.apply', 'user', req.user.id, { firm: a.firm_name });
  res.status(201).json(await db.get('SELECT firm_name, licence_no, licence_valid_till, gstin, address, city, state, pincode, status, admin_note, applied_at FROM buyer_profiles WHERE user_id = ?', req.user.id));
}));

router.get('/', requirePermission('buyers.manage'), ah(async (req, res) => {
  const status = req.query.status && STATUSES.includes(req.query.status) ? req.query.status : null;
  res.json(await db.all(`SELECT b.*, u.name, u.email, u.phone, r.name AS reviewed_by_name,
      (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = b.user_id) AS orders
    FROM buyer_profiles b JOIN users u ON u.id = b.user_id LEFT JOIN users r ON r.id = b.reviewed_by
    ${status ? 'WHERE b.status = ?' : ''}
    ORDER BY CASE b.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, b.applied_at DESC LIMIT 500`, ...(status ? [status] : [])));
}));

router.patch('/:userId', requirePermission('buyers.manage'), ah(async (req, res) => {
  const userId = intId(req.params.userId);
  const status = oneOf(req.body.status, ['approved', 'rejected'], 'status');
  const note = str(req.body.note, { field: 'Note', max: 500 });
  if (status === 'rejected' && !note) throw new ValidationError('Add a short reason so the buyer knows what to fix.');
  const row = await db.get(`UPDATE buyer_profiles SET status = ?, admin_note = ?, reviewed_at = ${NOW}, reviewed_by = ? WHERE user_id = ? RETURNING user_id`, status, note, req.user.id, userId);
  if (!row) return res.status(404).json({ error: 'Application not found.' });
  audit(req, `buyer.${status}`, 'user', userId, { note });
  res.json(await db.get('SELECT b.*, u.name, u.email, u.phone FROM buyer_profiles b JOIN users u ON u.id = b.user_id WHERE b.user_id = ?', userId));
}));

export default router;
