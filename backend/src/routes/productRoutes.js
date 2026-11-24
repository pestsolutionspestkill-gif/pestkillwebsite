import express from 'express';
import db, { audit, NOW, slugify } from '../db.js';
import { requirePermission, optionalAuth, can, ah } from '../middleware/rbac.js';
import { str, intId, ValidationError } from '../utils/validate.js';
import { readDataUrl } from '../utils/files.js';
import { documentsFor } from './documentRoutes.js';
import { verifiedDosesFor } from './doseRoutes.js';

const router = express.Router();
const PACK_STYLES = ['bottle', 'jerrycan', 'gel', 'sachet', 'tub', 'box'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

const BASE_SQL = `SELECT p.id, p.slug, p.name, p.brand, p.technical, p.formulation, p.category, p.pack_size, p.pack_style,
  p.mrp, p.pco_price, p.offer_price, p.offer_label, p.offer_ends, p.mrp_note, p.mrp_verified, p.usage_info, p.description, p.stock, p.is_active, p.sort, p.updated_at,
  p.how_to_use, p.storage_info, p.faqs, p.target_pests, p.dose_per_litre, p.solution_per_sqm, p.dose_note,
  pi.updated_at AS image_updated, pi.source_url AS image_source, pi.credit AS image_credit, pi.licence_note AS image_licence
  FROM products p LEFT JOIN product_images pi ON pi.product_id = p.id`;

// Indian calendar date (YYYY-MM-DD); offers run until the end of their last day in IST.
const istToday = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
export const activeOffer = (p) => (p.offer_price != null && p.mrp != null && p.offer_price < p.mrp && (!p.offer_ends || p.offer_ends >= istToday())
  ? { price: p.offer_price, label: p.offer_label || null, ends: p.offer_ends || null } : null);
// Lowest applicable price: MRP, a running public offer, or the PCO price (approved buyers only).
export const bestPrice = (p, { pco }) => {
  const prices = [p.mrp, activeOffer(p)?.price, pco ? p.pco_price : null].filter((v) => v != null);
  return prices.length ? Math.min(...prices) : null;
};

/* ---------- Pests a product is used against ----------
   Staff can set target_pests exactly; otherwise it is read from the name, usage and description. */
export const PESTS = {
  termite: { label: 'Termites', re: /termit|deemak|dimak|wood ?borer/i },
  cockroach: { label: 'Cockroaches', re: /cockroach|roach/i },
  mosquito: { label: 'Mosquitoes', re: /mosquito|larv|dengue|malaria/i },
  rodent: { label: 'Rats & mice', re: /\brodent|\brats?\b|\bmice\b|\bmouse|brodifacoum|bromadiolone|zinc phosphide|wax ?block/i },
  fly: { label: 'Flies', re: /\bfl(y|ies)\b|housefl/i },
  ant: { label: 'Ants', re: /\bants?\b/i },
  bedbug: { label: 'Bed bugs', re: /bed ?bugs?/i },
};
export const pestsFor = (p) => {
  const set = String(p.target_pests || '').split(',').map((x) => x.trim()).filter((x) => PESTS[x]);
  if (set.length) return set;
  const text = [p.name, p.usage_info, p.description].filter(Boolean).join(' ');
  return Object.keys(PESTS).filter((k) => PESTS[k].re.test(text));
};
const parseFaqs = (v) => { try { const a = JSON.parse(v || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } };

// Approved and the licence has not expired (an expired licence must be renewed and re-checked).
export const isApprovedBuyer = async (userId) => Boolean(userId
  && await db.get("SELECT 1 FROM buyer_profiles WHERE user_id = ? AND status = 'approved' AND (licence_valid_till IS NULL OR licence_valid_till >= ?)", userId, istToday()));

// Public shape. PCO price only for approved buyers and staff; MRP notes only for staff.
const shape = (p, { pco, staff }) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  brand: p.brand,
  technical: p.technical,
  formulation: p.formulation,
  category: p.category,
  pack_size: p.pack_size,
  pack_style: p.pack_style,
  mrp: p.mrp,
  pco_price: pco || staff ? p.pco_price : null,
  offer: activeOffer(p),
  in_stock: p.stock == null || p.stock > 0,
  stock: staff ? p.stock : (p.stock != null && p.stock <= 10 ? p.stock : null), // show "only N left"
  usage_info: p.usage_info,
  description: p.description,
  pests: pestsFor(p),
  how_to_use: p.how_to_use || null,
  storage_info: p.storage_info || null,
  faqs: parseFaqs(p.faqs),
  // Label dose for the calculator; only present when staff have entered it from the label.
  dose: p.dose_per_litre != null ? { per_litre: p.dose_per_litre, solution_per_sqm: p.solution_per_sqm, note: p.dose_note || null } : null,
  image_url: p.image_updated ? `/api/products/${p.id}/image?v=${encodeURIComponent(p.image_updated)}` : null,
  // Where the photo came from (shown as a credit; empty until staff record it).
  image_meta: p.image_updated ? { source_url: p.image_source || null, credit: p.image_credit || null, licence: p.image_licence || null } : null,
  ...(staff ? { offer_price: p.offer_price, offer_label: p.offer_label, offer_ends: p.offer_ends, is_active: p.is_active, mrp_note: p.mrp_note, mrp_verified: p.mrp_verified, sort: p.sort, target_pests: p.target_pests } : {}),
});

const viewer = async (req) => {
  const staff = can(req.user, 'products.view') || can(req.user, 'products.edit');
  return { staff, pco: staff || await isApprovedBuyer(req.user?.id) };
};

/** Product listing (also used by the website server to pre-render shop pages). */
export const listProducts = async (query, v = { staff: false, pco: false }) => {
  const req = { query };
  const where = [];
  const params = [];
  if (!(v.staff && req.query.all === '1')) where.push('p.is_active = 1');
  if (req.query.brand) { where.push('p.brand = ?'); params.push(String(req.query.brand).slice(0, 60)); }
  if (req.query.category) { where.push('p.category = ?'); params.push(String(req.query.category).slice(0, 80)); }
  if (req.query.formulation) { where.push('p.formulation = ?'); params.push(String(req.query.formulation).slice(0, 20)); }
  if (req.query.photo === 'missing') where.push('pi.product_id IS NULL');
  if (req.query.ids) {
    const ids = String(req.query.ids).split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 100);
    if (!ids.length) return { products: [], brands: [], categories: [], pests: [] };
    where.push(`p.id IN (${ids.map(() => '?').join(', ')})`); params.push(...ids);
  }
  if (req.query.q) {
    const q = `%${String(req.query.q).slice(0, 60)}%`;
    where.push('(p.name ILIKE ? OR p.brand ILIKE ? OR p.technical ILIKE ? OR p.category ILIKE ? OR p.usage_info ILIKE ?)');
    params.push(q, q, q, q, q);
  }
  const order = { 'price-asc': 'p.mrp ASC NULLS LAST', 'price-desc': 'p.mrp DESC NULLS LAST', name: 'p.name ASC, p.mrp ASC' }[req.query.sort] || 'p.sort ASC, p.id ASC';
  let rows = await db.all(`${BASE_SQL} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order} LIMIT 500`, ...params);
  const pest = PESTS[req.query.pest] ? req.query.pest : null;
  if (pest) rows = rows.filter((p) => pestsFor(p).includes(pest));
  const all = await db.all('SELECT name, usage_info, description, target_pests FROM products WHERE is_active = 1');
  const pests = Object.entries(PESTS).map(([key, x]) => ({ key, label: x.label, n: all.filter((p) => pestsFor(p).includes(key)).length })).filter((x) => x.n);
  const facets = await db.all('SELECT brand, category, formulation, COUNT(*)::int n FROM products WHERE is_active = 1 GROUP BY brand, category, formulation');
  const count = (key) => Object.entries(facets.reduce((m, f) => ({ ...m, [f[key]]: (m[f[key]] || 0) + f.n }), {}))
    .filter(([k]) => k && k !== 'null').map(([name, n]) => ({ name, n })).sort((a, b) => a.name.localeCompare(b.name));
  return { products: rows.map((p) => shape(p, v)), brands: count('brand'), categories: count('category'), formulations: count('formulation'), pests };
};

router.get('/', optionalAuth, ah(async (req, res) => { res.json(await listProducts(req.query, await viewer(req))); }));

router.get('/:id/image', ah(async (req, res) => {
  const img = await db.get('SELECT mime, data FROM product_images WHERE product_id = ?', intId(req.params.id));
  if (!img) return res.status(404).json({ error: 'No image.' });
  res.set({ 'Content-Type': img.mime, 'Cache-Control': 'public, max-age=31536000, immutable' });
  res.send(Buffer.from(img.data));
}));

/* ---------- Documents ----------
   Managed in routes/documentRoutes.js (/api/documents). The old per-type URLs below keep working
   for links shared earlier: they send the newest public document of that type. */
router.get('/documents', optionalAuth, ah(async (req, res) => {
  const rows = await db.all(`SELECT d.id, d.product_id, d.kind, d.title, d.version, d.size, COALESCE(d.updated_at, d.uploaded_at) AS updated_at,
      p.slug, p.name, p.brand, p.technical, p.pack_size
    FROM product_documents d JOIN products p ON p.id = d.product_id WHERE p.is_active = 1 AND d.visibility = 'public' ORDER BY p.brand, p.name, d.kind`);
  res.json(rows.map((r) => ({ ...r, url: `/api/documents/${r.id}/file` })));
}));

router.get('/:id/documents/:kind', ah(async (req, res) => {
  const d = await db.get(`SELECT d.id FROM product_documents d JOIN products p ON p.id = d.product_id
    WHERE d.product_id = ? AND d.kind = ? AND d.visibility = 'public' AND p.is_active = 1 ORDER BY COALESCE(d.updated_at, d.uploaded_at) DESC LIMIT 1`,
  intId(req.params.id), String(req.params.kind).slice(0, 20));
  if (!d) return res.status(404).json({ error: 'Document not found.' });
  res.redirect(302, `/api/documents/${d.id}/file`);
}));

const levelsFor = (v) => (v.staff ? ['public', 'pco', 'staff'] : v.pco ? ['public', 'pco'] : ['public']);

/** One product with its pack sizes, equivalents and documents, or null. */
export const productDetail = async (key, v = { staff: false, pco: false }) => {
  key = String(key);
  const p = /^\d+$/.test(key)
    ? await db.get(`${BASE_SQL} WHERE p.id = ?`, Number(key))
    : await db.get(`${BASE_SQL} WHERE p.slug = ?`, key.slice(0, 100));
  if (!p || (!p.is_active && !v.staff)) return null;
  // Other pack sizes of the same product.
  const variants = await db.all(`${BASE_SQL} WHERE p.brand = ? AND p.name = ? AND p.is_active = 1 ORDER BY p.mrp ASC NULLS LAST, p.id`, p.brand, p.name);
  // Alternatives with the same active ingredient from other products (one pack per product).
  const equivalents = p.technical
    ? await db.all(`SELECT DISTINCT ON (p.brand, p.name) p.id, p.slug, p.name, p.brand, p.pack_size, p.mrp, p.technical
        FROM products p WHERE p.is_active = 1 AND lower(p.technical) = lower(?) AND NOT (p.brand = ? AND p.name = ?)
        ORDER BY p.brand, p.name, p.mrp ASC NULLS LAST LIMIT 4`, p.technical, p.brand, p.name)
    : [];
  return { ...shape(p, v), variants: variants.map((x) => ({ id: x.id, slug: x.slug, pack_size: x.pack_size, mrp: x.mrp })), equivalents,
    documents: await documentsFor(p.id, levelsFor(v)),
    // Verified label dosage records (used by the dosage calculator).
    doses: await verifiedDosesFor(p.id) };
};

router.get('/:key', optionalAuth, ah(async (req, res) => {
  const p = await productDetail(req.params.key, await viewer(req));
  if (!p) return res.status(404).json({ error: 'Product not found.' });
  res.json(p);
}));

const money = (v, field) => {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 10000000) throw new ValidationError(`Invalid ${field}.`);
  return Math.round(n * 100) / 100;
};
const stockValue = (v) => {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null; // not tracked
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 1000000) throw new ValidationError('Stock must be a whole number (leave empty to not track).');
  return n;
};

const dateValue = (v) => {
  if (v === null || v === '') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v)) || Number.isNaN(Date.parse(v))) throw new ValidationError('Offer end date must be a valid date.');
  return String(v);
};

// Price rules on the final values: PCO and offer prices may not exceed MRP; an offer needs an MRP.
const checkPrices = (row) => {
  const who = `${row.name || 'Product'}${row.pack_size ? ` (${row.pack_size})` : ''}`;
  if (row.pco_price != null && row.mrp != null && row.pco_price > row.mrp) throw new ValidationError(`${who}: PCO price cannot be more than the MRP.`);
  if (row.offer_price != null && row.mrp == null) throw new ValidationError(`${who}: set the MRP before adding an offer.`);
  if (row.offer_price != null && row.offer_price >= row.mrp) throw new ValidationError(`${who}: offer price must be lower than the MRP.`);
};

// Applies validated changes to one product row (shared by single and bulk edits).
const applyChanges = async (t, req, id, body) => {
  const before = await t.get('SELECT * FROM products WHERE id = ?', id);
  if (!before) throw Object.assign(new Error(`Product #${id} not found.`), { status: 404 });
  const changes = can(req.user, 'products.edit') ? readFields(body || {}, { partial: true }) : {};
  const stock = stockValue(body?.stock);
  if (stock !== undefined) changes.stock = stock;
  if ('mrp' in changes) changes.price = changes.mrp;
  checkPrices({ ...before, ...changes });
  const keys = Object.keys(changes);
  if (keys.length) await t.run(`UPDATE products SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = ${NOW} WHERE id = ?`, ...keys.map((k) => changes[k]), id);
  return changes;
};

const positive = (v, field, max) => {
  if (v === null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0 || n > max) throw new ValidationError(`${field} must be a number between 0 and ${max}.`);
  return n;
};
const readPests = (v) => {
  const list = (Array.isArray(v) ? v : String(v || '').split(',')).map((x) => String(x).trim()).filter(Boolean);
  const bad = list.find((x) => !PESTS[x]);
  if (bad) throw new ValidationError(`Unknown pest "${bad}".`);
  return list.length ? [...new Set(list)].join(',') : null;
};
const readFaqs = (v) => {
  if (v === null || v === '') return null;
  if (!Array.isArray(v) || v.length > 12) throw new ValidationError('Add at most 12 questions.');
  const faqs = v.filter((x) => x && (x.q || x.a)).map((x, i) => ({
    q: str(x.q, { field: `Question ${i + 1}`, min: 5, max: 200, required: true }),
    a: str(x.a, { field: `Answer ${i + 1}`, min: 2, max: 1000, required: true }),
  }));
  return faqs.length ? JSON.stringify(faqs) : null;
};

const readFields = (b, { partial }) => {
  const f = {
    name: b.name !== undefined || !partial ? str(b.name, { field: 'Name', min: 2, max: 150, required: true }) : undefined,
    brand: b.brand !== undefined || !partial ? str(b.brand, { field: 'Brand', min: 2, max: 60, required: true }) : undefined,
    technical: b.technical !== undefined ? str(b.technical, { field: 'Active ingredient', max: 150 }) : undefined,
    formulation: b.formulation !== undefined ? str(b.formulation, { field: 'Formulation', max: 20 }) : undefined,
    category: b.category !== undefined || !partial ? str(b.category, { field: 'Category', min: 2, max: 80, required: true }) : undefined,
    pack_size: b.packSize !== undefined || !partial ? str(b.packSize, { field: 'Pack size', min: 1, max: 40, required: true }) : undefined,
    pack_style: b.packStyle !== undefined ? (PACK_STYLES.includes(b.packStyle) ? b.packStyle : 'bottle') : undefined,
    mrp: money(b.mrp, 'MRP'),
    pco_price: money(b.pcoPrice, 'PCO price'),
    offer_price: money(b.offerPrice, 'offer price'),
    offer_label: b.offerLabel !== undefined ? str(b.offerLabel, { field: 'Offer label', max: 40 }) : undefined,
    offer_ends: b.offerEnds !== undefined ? dateValue(b.offerEnds) : undefined,
    mrp_note: b.mrpNote !== undefined ? str(b.mrpNote, { field: 'MRP note', max: 200 }) : undefined,
    mrp_verified: b.mrpVerified !== undefined ? (b.mrpVerified ? 1 : 0) : undefined,
    usage_info: b.usage !== undefined ? str(b.usage, { field: 'Usage', max: 1000 }) : undefined,
    description: b.description !== undefined ? str(b.description, { field: 'Description', max: 4000 }) : undefined,
    how_to_use: b.howToUse !== undefined ? str(b.howToUse, { field: 'How to use', max: 4000 }) : undefined,
    storage_info: b.storageInfo !== undefined ? str(b.storageInfo, { field: 'Storage', max: 1500 }) : undefined,
    faqs: b.faqs !== undefined ? readFaqs(b.faqs) : undefined,
    target_pests: b.targetPests !== undefined ? readPests(b.targetPests) : undefined,
    dose_per_litre: b.dosePerLitre !== undefined ? positive(b.dosePerLitre, 'Dose per litre', 1000) : undefined,
    solution_per_sqm: b.solutionPerSqm !== undefined ? positive(b.solutionPerSqm, 'Solution per m²', 50) : undefined,
    dose_note: b.doseNote !== undefined ? str(b.doseNote, { field: 'Dose note', max: 300 }) : undefined,
    is_active: b.isActive !== undefined ? (b.isActive ? 1 : 0) : undefined,
    sort: b.sort !== undefined ? Math.max(0, Math.min(100000, parseInt(b.sort, 10) || 0)) : undefined,
  };
  return Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined));
};

router.post('/', requirePermission('products.create'), ah(async (req, res) => {
  const f = readFields(req.body || {}, { partial: false });
  checkPrices(f);
  const stock = stockValue(req.body.stock);
  let slug = slugify(`${f.brand} ${f.name} ${f.pack_size}`);
  if (await db.get('SELECT 1 FROM products WHERE slug = ?', slug)) slug = `${slug}-${Date.now().toString(36)}`;
  const cols = { ...f, slug, stock: stock ?? null, price: f.mrp ?? null };
  const keys = Object.keys(cols);
  const row = await db.get(`INSERT INTO products (${keys.join(', ')}, updated_at) VALUES (${keys.map(() => '?').join(', ')}, ${NOW}) RETURNING id`, ...keys.map((k) => cols[k]));
  audit(req, 'product.create', 'product', row.id, { name: f.name, mrp: f.mrp });
  res.status(201).json(shape(await db.get(`${BASE_SQL} WHERE p.id = ?`, row.id), { staff: true, pco: true }));
}));

// Bulk price / offer / stock editor: all rows are saved together or none are.
router.patch('/bulk', requirePermission('products.edit', 'inventory.manage'), ah(async (req, res) => {
  const updates = Array.isArray(req.body?.updates) ? req.body.updates : [];
  if (!updates.length) throw new ValidationError('Nothing to update.');
  if (updates.length > 500) throw new ValidationError('Update at most 500 products at a time.');
  const ids = updates.map((u) => intId(u.id));
  await db.tx(async (t) => {
    for (let i = 0; i < updates.length; i += 1) await applyChanges(t, req, ids[i], updates[i]);
  });
  audit(req, 'product.bulk_update', 'product', null, { count: ids.length, fields: [...new Set(updates.flatMap((u) => Object.keys(u).filter((k) => k !== 'id')))] });
  const rows = await db.all(`${BASE_SQL} WHERE p.id IN (${ids.map(() => '?').join(', ')})`, ...ids);
  res.json(rows.map((p) => shape(p, { staff: true, pco: true })));
}));

// Rename a brand or category on every product at once (catalogue tidy-up).
router.patch('/rename', requirePermission('products.edit'), ah(async (req, res) => {
  const field = req.body?.field === 'category' ? 'category' : req.body?.field === 'brand' ? 'brand' : null;
  if (!field) throw new ValidationError('Choose brand or category.');
  const from = str(req.body.from, { field: 'Current name', min: 1, max: 80, required: true });
  const to = str(req.body.to, { field: 'New name', min: 2, max: 80, required: true });
  const rows = await db.all(`UPDATE products SET ${field} = ?, updated_at = ${NOW} WHERE ${field} = ? RETURNING id`, to, from);
  if (!rows.length) return res.status(404).json({ error: `No products use the ${field} "${from}".` });
  audit(req, `product.rename_${field}`, 'product', null, { from, to, count: rows.length });
  res.json({ updated: rows.length });
}));

// products.edit may change any field; inventory.manage may only change stock.
router.put('/:id', requirePermission('products.edit', 'inventory.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const changes = await db.tx((t) => applyChanges(t, req, id, req.body));
  if (!Object.keys(changes).length) return res.status(400).json({ error: 'Nothing to update.' });
  audit(req, 'product.update', 'product', id, changes);
  res.json(shape(await db.get(`${BASE_SQL} WHERE p.id = ?`, id), { staff: true, pco: true }));
}));

const readImageMeta = (b) => {
  const u = str(b.sourceUrl, { field: 'Photo source URL', max: 500 });
  if (u && !/^https?:\/\/\S+$/.test(u)) throw new ValidationError('Photo source must be a web address.');
  return { source_url: u, credit: str(b.credit, { field: 'Photo credit', max: 150 }), licence_note: str(b.licenceNote, { field: 'Usage permission', max: 300 }) };
};

// Edit where a photo came from without re-uploading it.
router.patch('/:id/image', requirePermission('products.edit'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const meta = readImageMeta(req.body || {});
  const row = await db.get('UPDATE product_images SET source_url = ?, credit = ?, licence_note = ? WHERE product_id = ? RETURNING product_id', meta.source_url, meta.credit, meta.licence_note, id);
  if (!row) return res.status(404).json({ error: 'This product has no photo yet.' });
  audit(req, 'product.image_meta', 'product', id);
  res.json(shape(await db.get(`${BASE_SQL} WHERE p.id = ?`, id), { staff: true, pco: true }));
}));

router.put('/:id/image', requirePermission('products.edit'), ah(async (req, res) => {
  const id = intId(req.params.id);
  if (!await db.get('SELECT 1 FROM products WHERE id = ?', id)) return res.status(404).json({ error: 'Product not found.' });
  // Type, size and real file content (magic bytes) are all checked.
  const { mime, data } = readDataUrl(req.body?.dataUrl, { types: IMAGE_TYPES, maxBytes: MAX_IMAGE_BYTES, label: 'photo' });
  const meta = readImageMeta(req.body || {});
  await db.run(`INSERT INTO product_images (product_id, mime, data, updated_at, source_url, credit, licence_note) VALUES (?, ?, ?, ${NOW}, ?, ?, ?)
    ON CONFLICT (product_id) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, updated_at = EXCLUDED.updated_at,
      source_url = EXCLUDED.source_url, credit = EXCLUDED.credit, licence_note = EXCLUDED.licence_note`, id, mime, data, meta.source_url, meta.credit, meta.licence_note);
  audit(req, 'product.image', 'product', id, { bytes: data.length });
  res.json(shape(await db.get(`${BASE_SQL} WHERE p.id = ?`, id), { staff: true, pco: true }));
}));

router.delete('/:id/image', requirePermission('products.edit'), ah(async (req, res) => {
  const id = intId(req.params.id);
  await db.run('DELETE FROM product_images WHERE product_id = ?', id);
  audit(req, 'product.image_removed', 'product', id);
  res.json(shape(await db.get(`${BASE_SQL} WHERE p.id = ?`, id), { staff: true, pco: true }));
}));

// Products that appear in past orders are hidden instead of deleted, so order history stays intact.
router.delete('/:id', requirePermission('products.delete'), ah(async (req, res) => {
  const id = intId(req.params.id);
  if (!await db.get('SELECT 1 FROM products WHERE id = ?', id)) return res.status(404).json({ error: 'Product not found.' });
  if (await db.get('SELECT 1 FROM order_items WHERE product_id = ?', id)) {
    await db.run(`UPDATE products SET is_active = 0, updated_at = ${NOW} WHERE id = ?`, id);
    audit(req, 'product.hide', 'product', id);
    return res.json({ message: 'This product has orders, so it was hidden from the shop instead of deleted.', hidden: true });
  }
  await db.run('DELETE FROM products WHERE id = ?', id);
  audit(req, 'product.delete', 'product', id);
  res.json({ message: 'Deleted.' });
}));

export default router;
