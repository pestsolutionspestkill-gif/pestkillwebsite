// Public certificate check behind the QR code on every treatment certificate. Anyone (tenant, buyer,
// food-safety auditor) can confirm a certificate is genuine. Only non-sensitive facts are shown:
// masked customer name, city, service, treatment date and warranty — never phone or address.
import express from 'express';
import db from '../db.js';
import { rateLimit, ah } from '../middleware/rbac.js';
import { warrantyStatus } from '../utils/warranty.js';

const router = express.Router();
const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 60 });

const mask = (name) => String(name || '').split(/\s+/).filter(Boolean)
  .map((w) => (w.length <= 1 ? w : `${w[0]}${'•'.repeat(Math.min(5, w.length - 1))}`)).join(' ');

router.get('/:ref', limiter, ah(async (req, res) => {
  const ref = String(req.params.ref).toUpperCase().replace(/^PK-CERT-/, '').slice(0, 40);
  const lead = await db.get('SELECT ref, name, city, service, property, area_sqft, status, completed_at, warranty, chemicals_used FROM leads WHERE ref = ?', ref);
  if (!lead) return res.status(404).json({ valid: false, error: 'No certificate exists with this number.' });
  if (lead.status !== 'completed') return res.json({ valid: false, ref: lead.ref, error: 'This service has not been completed yet, so no certificate has been issued.' });
  res.json({
    valid: true,
    number: `PK-CERT-${lead.ref}`,
    ref: lead.ref,
    customer: mask(lead.name),
    city: lead.city,
    service: lead.service,
    property: lead.property,
    area_sqft: lead.area_sqft,
    treated_on: lead.completed_at,
    products: lead.chemicals_used,
    warranty: lead.warranty,
    warranty_status: warrantyStatus(lead),
  });
}));

export default router;
