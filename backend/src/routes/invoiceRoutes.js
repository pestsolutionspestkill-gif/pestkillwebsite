import express from 'express';
import db, { audit } from '../db.js';
import { auth, requirePermission, can } from '../middleware/rbac.js';
import { str, phone, email, oneOf, intId, ValidationError } from '../utils/validate.js';

const router = express.Router();
const STATUSES = ['unpaid', 'paid', 'void'];
const round2 = (n) => Math.round(n * 100) / 100;

const parse = (row) => row && { ...row, items: JSON.parse(row.items) };

const nextNumber = () => {
  const year = new Date().getFullYear();
  const { n } = db.prepare("SELECT COUNT(*) n FROM invoices WHERE number LIKE ?").get(`PK-INV-${year}-%`);
  return `PK-INV-${year}-${String(n + 1).padStart(4, '0')}`;
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

const ownsInvoice = (user, inv) => user.role === 'client'
  && (inv.user_id === user.id || (inv.user_id == null && inv.customer_phone === String(user.phone || '').slice(-10)));

router.post('/', requirePermission('invoices.manage'), (req, res, next) => {
  try {
    const b = req.body || {};
    const lead = b.leadId ? db.prepare('SELECT * FROM leads WHERE id = ?').get(intId(b.leadId)) : null;
    if (b.leadId && !lead) throw new ValidationError('Booking not found.');
    const items = readItems(b.items);
    const gstRate = b.gstRate === undefined ? 18 : Number(b.gstRate);
    if (![0, 5, 12, 18, 28].includes(gstRate)) throw new ValidationError('GST rate must be 0, 5, 12, 18 or 28.');
    const subtotal = round2(items.reduce((s, i) => s + i.amount, 0));
    const gstAmount = round2(subtotal * gstRate / 100);

    const create = db.transaction(() => {
      const number = nextNumber();
      const { lastInsertRowid } = db.prepare(`INSERT INTO invoices
        (number, lead_id, user_id, customer_name, customer_phone, customer_email, customer_address, customer_gstin, items, subtotal, gst_rate, gst_amount, total, notes, issued_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        number, lead?.id ?? null, lead?.user_id ?? null,
        str(b.customerName ?? lead?.name, { field: 'Customer name', min: 2, max: 120, required: true }),
        phone(b.customerPhone ?? lead?.phone),
        email(b.customerEmail ?? lead?.email),
        str(b.customerAddress ?? [lead?.address, lead?.city].filter(Boolean).join(', '), { field: 'Address', max: 300 }),
        str(b.customerGstin, { field: 'GSTIN', max: 20 })?.toUpperCase() ?? null,
        JSON.stringify(items), subtotal, gstRate, gstAmount, round2(subtotal + gstAmount),
        str(b.notes, { field: 'Notes', max: 1000 }), req.user.id,
      );
      if (lead && lead.amount == null) db.prepare('UPDATE leads SET amount = ? WHERE id = ?').run(round2(subtotal + gstAmount), lead.id);
      return lastInsertRowid;
    });
    const id = create();
    const inv = parse(db.prepare('SELECT * FROM invoices WHERE id = ?').get(id));
    audit(req, 'invoice.create', 'invoice', inv.number, { total: inv.total });
    res.status(201).json(inv);
  } catch (e) { next(e); }
});

router.get('/', requirePermission('invoices.manage'), (req, res) => {
  const where = [];
  const params = [];
  if (req.query.status && STATUSES.includes(req.query.status)) { where.push('status = ?'); params.push(req.query.status); }
  if (req.query.q) { where.push('(number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)'); const q = `%${String(req.query.q).slice(0, 60)}%`; params.push(q, q, q); }
  res.json(db.prepare(`SELECT * FROM invoices ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY issued_at DESC LIMIT 500`).all(...params).map(parse));
});

router.get('/mine', auth, (req, res) => {
  res.json(db.prepare(`SELECT * FROM invoices WHERE status != 'void' AND (user_id = ? OR (user_id IS NULL AND customer_phone = ?)) ORDER BY issued_at DESC`)
    .all(req.user.id, String(req.user.phone || '').slice(-10)).map(parse));
});

router.get('/:id', auth, (req, res, next) => {
  try {
    const inv = parse(db.prepare('SELECT * FROM invoices WHERE id = ?').get(intId(req.params.id)));
    if (!inv || !(can(req.user, 'invoices.manage') || ownsInvoice(req.user, inv))) return res.status(404).json({ error: 'Invoice not found.' });
    res.json(inv);
  } catch (e) { next(e); }
});

router.patch('/:id', requirePermission('invoices.manage'), (req, res, next) => {
  try {
    const id = intId(req.params.id);
    const status = oneOf(req.body.status, STATUSES, 'status');
    const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    if (!inv) return res.status(404).json({ error: 'Invoice not found.' });
    if (inv.status === 'void') return res.status(409).json({ error: 'A void invoice cannot be changed.' });
    db.prepare('UPDATE invoices SET status = ?, paid_at = ? WHERE id = ?').run(status, status === 'paid' ? new Date().toISOString() : null, id);
    audit(req, `invoice.${status}`, 'invoice', inv.number);
    res.json(parse(db.prepare('SELECT * FROM invoices WHERE id = ?').get(id)));
  } catch (e) { next(e); }
});

export default router;
