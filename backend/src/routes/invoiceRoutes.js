import express from 'express';
import db, { audit, NOW } from '../db.js';
import { auth, requirePermission, ownerOnly, can, ah } from '../middleware/rbac.js';
import { str, phone, email, oneOf, intId, ValidationError } from '../utils/validate.js';

const router = express.Router();
const STATUSES = ['unpaid', 'paid', 'void'];
const round2 = (n) => Math.round(n * 100) / 100;

const parse = (row) => row && { ...row, items: JSON.parse(row.items) };

// Next number in the yearly series, e.g. PK-INV-2026-0007. Based on the highest existing
// number (not a count), and the insert retries if another invoice took the same number.
// The number of a deleted invoice is remembered, so a number is never issued twice.
const seqKey = (year) => `invoice_seq_${year}`;
const nextNumber = async (t) => {
  const year = new Date().getFullYear();
  const prefix = `PK-INV-${year}-`;
  const row = await t.get('SELECT MAX(CAST(SUBSTRING(number FROM ?::int) AS INTEGER)) n FROM invoices WHERE number LIKE ?', prefix.length + 1, `${prefix}%`);
  const kept = Number((await t.get('SELECT value FROM app_settings WHERE key = ?', seqKey(year)))?.value || 0);
  return `${prefix}${String(Math.max(row?.n || 0, kept) + 1).padStart(4, '0')}`;
};
const rememberNumber = async (t, number) => {
  const m = /^PK-INV-(\d{4})-(\d+)$/.exec(number);
  if (!m) return;
  await t.run(`INSERT INTO app_settings (key, value) VALUES (?, ?)
    ON CONFLICT (key) DO UPDATE SET value = GREATEST(app_settings.value::int, EXCLUDED.value::int)::text`, seqKey(m[1]), String(Number(m[2])));
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

// Customer details, line items and totals from the invoice form (create and edit).
const readInvoice = (b, lead = null) => {
  const items = readItems(b.items);
  const gstRate = b.gstRate === undefined ? 18 : Number(b.gstRate);
  if (![0, 5, 12, 18, 28].includes(gstRate)) throw new ValidationError('GST rate must be 0, 5, 12, 18 or 28.');
  const subtotal = round2(items.reduce((s, i) => s + i.amount, 0));
  const gstAmount = round2(subtotal * gstRate / 100);
  return [
    str(b.customerName ?? lead?.name, { field: 'Customer name', min: 2, max: 120, required: true }),
    phone(b.customerPhone ?? lead?.phone),
    email(b.customerEmail ?? lead?.email),
    str(b.customerAddress ?? [lead?.address, lead?.city].filter(Boolean).join(', '), { field: 'Address', max: 300 }),
    str(b.customerGstin, { field: 'GSTIN', max: 20 })?.toUpperCase() || null,
    JSON.stringify(items), subtotal, gstRate, gstAmount, round2(subtotal + gstAmount),
    str(b.notes, { field: 'Notes', max: 1000 }) || null,
  ];
};

// Invoice date chosen by the owner when editing (Indian calendar date, not in the future).
const istToday = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const readIssuedOn = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const d = String(v);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;
  if (!valid || d < '2000-01-01') throw new ValidationError('Invalid invoice date.');
  if (d > istToday()) throw new ValidationError('The invoice date cannot be in the future.');
  return d;
};

router.post('/', requirePermission('invoices.manage'), ah(async (req, res) => {
  const b = req.body || {};
  const lead = b.leadId ? await db.get('SELECT * FROM leads WHERE id = ?', intId(b.leadId)) : null;
  if (b.leadId && !lead) throw new ValidationError('Booking not found.');
  const fields = [lead?.id ?? null, lead?.user_id ?? null, ...readInvoice(b, lead), req.user.id];

  let inv;
  for (let attempt = 0; !inv; attempt += 1) {
    try {
      inv = await db.tx(async (t) => {
        const row = await t.get(`INSERT INTO invoices
          (number, lead_id, user_id, customer_name, customer_phone, customer_email, customer_address, customer_gstin, items, subtotal, gst_rate, gst_amount, total, notes, issued_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`, await nextNumber(t), ...fields);
        if (lead && lead.amount == null) await t.run('UPDATE leads SET amount = ? WHERE id = ?', row.total, lead.id);
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

// Owner only: change any part of an invoice. Totals are worked out again from the line items;
// the invoice number stays the same. Every change is written to the audit log.
router.put('/:id', ownerOnly, ah(async (req, res) => {
  const id = intId(req.params.id);
  const inv = await db.get('SELECT * FROM invoices WHERE id = ?', id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found.' });
  const b = req.body || {};
  const fields = readInvoice(b);
  const status = b.status === undefined ? inv.status : oneOf(b.status, STATUSES, 'status');
  const issuedOn = readIssuedOn(b.issuedOn);
  const row = await db.tx(async (t) => {
    const r = await t.get(`UPDATE invoices SET customer_name = ?, customer_phone = ?, customer_email = ?, customer_address = ?, customer_gstin = ?,
        items = ?, subtotal = ?, gst_rate = ?, gst_amount = ?, total = ?, notes = ?,
        status = ?, paid_at = CASE WHEN ?::text = 'paid' THEN COALESCE(paid_at, ${NOW}) ELSE NULL END,
        issued_at = CASE WHEN ?::date IS NULL THEN issued_at
          ELSE ((?::date + (issued_at AT TIME ZONE 'utc' AT TIME ZONE 'Asia/Kolkata')::time) AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'utc' END
      WHERE id = ? RETURNING *`, ...fields, status, status, issuedOn, issuedOn, id);
    // Keep the booking amount in step when it was taken from this invoice.
    if (inv.lead_id) await t.run('UPDATE leads SET amount = ? WHERE id = ? AND amount = ?', r.total, inv.lead_id, inv.total);
    return r;
  });
  audit(req, 'invoice.edit', 'invoice', inv.number, {
    before: { total: inv.total, status: inv.status, customer: inv.customer_name },
    after: { total: row.total, status: row.status, customer: row.customer_name },
  });
  res.json(parse(row));
}));

// Owner only: delete an invoice for good. Its number is never issued again.
router.delete('/:id', ownerOnly, ah(async (req, res) => {
  const id = intId(req.params.id);
  const inv = await db.get('SELECT * FROM invoices WHERE id = ?', id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found.' });
  await db.tx(async (t) => {
    await rememberNumber(t, inv.number);
    await t.run('DELETE FROM invoices WHERE id = ?', id);
  });
  audit(req, 'invoice.delete', 'invoice', inv.number, { total: inv.total, status: inv.status, customer: inv.customer_name });
  res.json({ message: `Invoice ${inv.number} deleted.` });
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
