import express from 'express';
import db, { audit, NOW } from '../db.js';
import { auth, requirePermission, can, ah } from '../middleware/rbac.js';
import { str, phone, email, oneOf, intId, ValidationError } from '../utils/validate.js';

const router = express.Router();
const STATUSES = ['unpaid', 'paid', 'void'];
const round2 = (n) => Math.round(n * 100) / 100;

const parse = (row) => row && { ...row, items: JSON.parse(row.items) };

// Next number in the yearly series, e.g. PK-INV-2026-0007. Based on the highest existing
// number (not a count), and the insert retries if another invoice took the same number.
const nextNumber = async (t) => {
  const year = new Date().getFullYear();
  const prefix = `PK-INV-${year}-`;
  const row = await t.get('SELECT MAX(CAST(SUBSTRING(number FROM ?::int) AS INTEGER)) n FROM invoices WHERE number LIKE ?', prefix.length + 1, `${prefix}%`);
  return `${prefix}${String((row?.n || 0) + 1).padStart(4, '0')}`;
};

const readItems = (items) => {
  if (!Array.isArray(items) || !items.length || items.length > 30) throw new ValidationError('Add at least one line item.');
  return items.map((it) => {
    const qty = Number(it.qty);
    const rate = Number(it.rate);
    if (!(qty > 0) || qty > 100000) throw new ValidationError('Invalid quantity.');
    if (!(rate >= 0) || rate > 10000000) throw new ValidationError('Invalid rate.');
    return {
      description: str(it.description, { field: 'Item description', min: 2, max: 200, required: true }),
      unit: str(it.unit, { field: 'Unit', max: 20 }) || 'nos',
      qty: round2(qty),
      rate: round2(rate),
      amount: round2(qty * rate),
    };
  });
};

// Clients see invoices linked to their account only (phone numbers are not verified).
const ownsInvoice = (user, inv) => user.role === 'client' && inv.user_id === user.id;

router.post('/', requirePermission('invoices.manage'), ah(async (req, res) => {
  const b = req.body || {};
  const lead = b.leadId ? await db.get('SELECT * FROM leads WHERE id = ?', intId(b.leadId)) : null;
  if (b.leadId && !lead) throw new ValidationError('Booking not found.');
  const items = readItems(b.items);
  const gstRate = b.gstRate === undefined ? 18 : Number(b.gstRate);
  if (![0, 5, 12, 18, 28].includes(gstRate)) throw new ValidationError('GST rate must be 0, 5, 12, 18 or 28.');
  const subtotal = round2(items.reduce((s, i) => s + i.amount, 0));
  const gstAmount = round2(subtotal * gstRate / 100);
  const total = round2(subtotal + gstAmount);
  const fields = [
    lead?.id ?? null, lead?.user_id ?? null,
    str(b.customerName ?? lead?.name, { field: 'Customer name', min: 2, max: 120, required: true }),
    phone(b.customerPhone ?? lead?.phone),
    email(b.customerEmail ?? lead?.email),
    str(b.customerAddress ?? [lead?.address, lead?.city].filter(Boolean).join(', '), { field: 'Address', max: 300 }),
    str(b.customerGstin, { field: 'GSTIN', max: 20 })?.toUpperCase() ?? null,
    JSON.stringify(items), subtotal, gstRate, gstAmount, total,
    str(b.notes, { field: 'Notes', max: 1000 }), req.user.id,
  ];

  let inv;
  for (let attempt = 0; !inv; attempt += 1) {
    try {
      inv = await db.tx(async (t) => {
        const row = await t.get(`INSERT INTO invoices
          (number, lead_id, user_id, customer_name, customer_phone, customer_email, customer_address, customer_gstin, items, subtotal, gst_rate, gst_amount, total, notes, issued_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`, await nextNumber(t), ...fields);
        if (lead && lead.amount == null) await t.run('UPDATE leads SET amount = ? WHERE id = ?', total, lead.id);
        return row;
      });
    } catch (e) {
      if (e.code !== '23505' || attempt >= 4) throw e; // unique violation on number: retry with the next one
    }
  }
  audit(req, 'invoice.create', 'invoice', inv.number, { total: inv.total });
  res.status(201).json(parse(inv));
}));

router.get('/', requirePermission('invoices.manage'), ah(async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.status && STATUSES.includes(req.query.status)) { where.push('status = ?'); params.push(req.query.status); }
  if (req.query.q) { where.push('(number ILIKE ? OR customer_name ILIKE ? OR customer_phone ILIKE ?)'); const q = `%${String(req.query.q).slice(0, 60)}%`; params.push(q, q, q); }
  res.json((await db.all(`SELECT * FROM invoices ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY issued_at DESC, id DESC LIMIT 500`, ...params)).map(parse));
}));

router.get('/mine', auth, ah(async (req, res) => {
  res.json((await db.all("SELECT * FROM invoices WHERE status != 'void' AND user_id = ? ORDER BY issued_at DESC, id DESC", req.user.id)).map(parse));
}));

router.get('/:id', auth, ah(async (req, res) => {
  const inv = parse(await db.get('SELECT * FROM invoices WHERE id = ?', intId(req.params.id)));
  if (!inv || !(can(req.user, 'invoices.manage') || ownsInvoice(req.user, inv))) return res.status(404).json({ error: 'Invoice not found.' });
  res.json(inv);
}));

router.patch('/:id', requirePermission('invoices.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const status = oneOf(req.body.status, STATUSES, 'status');
  const inv = await db.get('SELECT * FROM invoices WHERE id = ?', id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found.' });
  if (inv.status === 'void') return res.status(409).json({ error: 'A void invoice cannot be changed.' });
  const row = await db.get(`UPDATE invoices SET status = ?, paid_at = ${status === 'paid' ? `COALESCE(paid_at, ${NOW})` : 'NULL'} WHERE id = ? RETURNING *`, status, id);
  audit(req, `invoice.${status}`, 'invoice', inv.number);
  res.json(parse(row));
}));

export default router;
