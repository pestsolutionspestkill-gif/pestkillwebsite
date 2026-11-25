// Verified knowledge that PestKill AI may answer from, and BM25 keyword retrieval over it.
// Sources: business facts, policies, official prices, the Knowledge Centre guides (EN + HI), the
// live product catalogue, published technical documents (titles and metadata), verified label dose
// records and technical standards. Nothing here is generated; every chunk points back to a page.
import db from '../db.js';
import { mrpIsVerified } from '../routes/productRoutes.js';
import businessConfig from '../../../frontend/src/data/businessConfig.js';
import { RATES, GST_NOTE, SERVICE_GST_RATE } from '../../../frontend/src/data/pricing.js';
import { GUIDES } from '../../../frontend/src/data/knowledge.js';
import { POLICIES } from '../../../frontend/src/data/policies.js';

const SERVICE_PAGES = [
  ['Termite control (pre- and post-construction anti-termite)', '/termite-control', 'termite deemak dimak anti-termite soil drill fill'],
  ['Porous pipe anti-termite system', '/services/anti-termite-piping', 'termite piping pipe pre-construction refill'],
  ['Cockroach control', '/cockroach-control', 'cockroach cockroaches gel kitchen'],
  ['Rodent control', '/rodent-control', 'rat rats mice rodent bait station proofing chuha'],
  ['Bed bug treatment', '/bed-bugs', 'bed bug bedbug khatmal mattress'],
  ['General pest control', '/services/general-pest-control', 'ants spiders general annual'],
  ['Mosquito control', '/services/mosquito-control', 'mosquito machhar dengue fogging larvicide'],
  ['Fly control', '/services/fly-control', 'fly flies makkhi'],
  ['Lizard control', '/services/lizard-control', 'lizard chipkali'],
  ['Book a service online', '/book', 'book booking appointment schedule visit'],
  ['PCO buyer account (licensed operators)', '/pco-account', 'pco licence buyer verification trade price'],
  ['Dose calculator for PCOs', '/shop/dose-calculator', 'dose dosage calculator dilution'],
  ['Technical documents library (SDS, labels, TDS)', '/shop/library', 'sds msds label tds datasheet'],
];

const STOP = new Set(('a an the and or of to in on for is are be with my your our we you it this that what how can do does i me at by from as about which who ' +
  'hai hain ka ki ke ko se me mein aur kya kaise का की के को से में और क्या कैसे है हैं यह वह पर भी तो').split(' '));
export const tokenize = (text) => (String(text || '').toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || []).filter((t) => t.length > 1 && !STOP.has(t));

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

/** Static chunks (code-defined facts). */
const staticChunks = () => {
  const b = businessConfig;
  const out = [
    { id: 'business', kind: 'business', title: 'About PestKill Pest Solutions', url: '/about', text:
      `${b.businessName}. Founder & CEO ${b.founder}. Office: ${b.officeAddress}. Phone/WhatsApp ${b.phoneNumber}. Email ${b.email}. Hours ${b.workingHours}. ` +
      `GSTIN ${b.gstin}. Udyam ${b.udyam}. Pest Control Licence ${b.licenceNumber}. Pesticide Sale Licence ${b.saleLicenceNumber}. ` +
      `${b.dispatchNote} There are no local offices or stationed teams outside Jaipur. Professional products are delivered across India. ` +
      `Product brands: ${b.brands.join(', ')}.` },
    { id: 'pricing', kind: 'pricing', title: 'Official service prices', url: '/services', text:
      `General residential pest control: 1BHK ${inr(RATES.home['1BHK'])}, 2BHK ${inr(RATES.home['2BHK'])}, 3BHK ${inr(RATES.home['3BHK'])}. Larger homes, villas, commercial, industrial and complex sites: inspection and quotation. ` +
      `Anti-termite post-construction ₹${RATES.termitePost.min}–${RATES.termitePost.max} per sq.ft.; pre-construction ₹${RATES.termitePre.min}–${RATES.termitePre.max} per sq.ft.; porous piping ₹${RATES.porousPipe.min}–${RATES.porousPipe.max} per sq.ft. ` +
      `${GST_NOTE} Our service invoices apply GST at ${SERVICE_GST_RATE}% by default. Final price is confirmed after inspection.` },
    ...SERVICE_PAGES.map(([title, url, kw], i) => ({ id: `svc-${i}`, kind: 'service', title, url, text: `${title}. ${kw}.` })),
  ];
  for (const [slug, p] of Object.entries(POLICIES)) {
    out.push({ id: `policy-${slug}`, kind: 'policy', title: p.title, url: `/${slug}`,
      text: `${p.intro} ${p.sections.map(([h, items]) => `${h}: ${items.join(' ')}`).join(' ')}` });
  }
  for (const g of GUIDES) {
    for (const lang of ['en', 'hi']) {
      const c = g[lang];
      if (!c) continue;
      const text = Object.entries(c).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('; ') : v}`).join(' ');
      out.push({ id: `guide-${g.slug}-${lang}`, kind: 'guide', title: `${c.name} (${lang === 'hi' ? 'हिन्दी' : 'English'})`, url: `/knowledge/${g.slug}${lang === 'hi' ? '?lang=hi' : ''}`, text });
    }
  }
  return out;
};

/** Chunks read from the database (catalogue, documents, verified doses, standards). */
const dbChunks = async () => {
  const out = [];
  const products = await db.all(`SELECT slug, brand, name, technical, formulation, category, pack_size, mrp, mrp_verified, mrp_source_url, mrp_checked_on, usage_info, target_pests
    FROM products WHERE is_active = 1 ORDER BY brand, name, id`);
  const byName = new Map();
  for (const p of products) {
    const k = `${p.brand}|${p.name}`;
    if (!byName.has(k)) byName.set(k, { ...p, packs: [] });
    byName.get(k).packs.push(`${p.pack_size}: ${mrpIsVerified(p) ? `MRP ${inr(p.mrp)}` : 'price on request'}`);
  }
  for (const p of byName.values()) {
    out.push({ id: `product-${p.slug}`, kind: 'product', title: `${p.brand} ${p.name}`, url: `/shop/${p.slug}`, text:
      `${p.brand} ${p.name}. Active ingredient: ${p.technical || 'not listed'}. Formulation: ${p.formulation || 'not listed'}. Category: ${p.category}. ` +
      `Packs: ${p.packs.join('; ')}. ${p.usage_info ? `Used for: ${p.usage_info}.` : ''} ${p.target_pests ? `Pests: ${p.target_pests}.` : ''} Sold only to verified licensed PCOs.` });
  }
  const docs = await db.all(`SELECT d.id, d.kind, d.title, d.version, d.revision_date, d.manufacturer, p.brand, p.name
    FROM product_documents d JOIN products p ON p.id = d.product_id WHERE d.visibility = 'public' AND p.is_active = 1`);
  for (const d of docs) {
    out.push({ id: `doc-${d.id}`, kind: 'document', title: `${d.title} (${d.brand} ${d.name})`, url: `/api/documents/${d.id}/file`, text:
      `${d.kind.toUpperCase()} document "${d.title}" for ${d.brand} ${d.name}${d.version ? `, version ${d.version}` : ''}${d.revision_date ? `, revised ${d.revision_date}` : ''}${d.manufacturer ? `, manufacturer ${d.manufacturer}` : ''}. Read the document for its contents.` });
  }
  const doses = await db.all(`SELECT r.*, p.brand, p.name, p.slug, d.title AS doc_title FROM dose_records r JOIN products p ON p.id = r.product_id
    LEFT JOIN product_documents d ON d.id = r.source_document_id WHERE r.status = 'verified' AND p.is_active = 1`);
  for (const r of doses) {
    const nums = ['product_per_litre', 'rate_horizontal', 'rate_vertical', 'rate_running', 'product_per_1000l', 'bait_per_point']
      .filter((k) => r[k] != null).map((k) => `${k.replace(/_/g, ' ')} ${r[k]}`).join(', ');
    out.push({ id: `dose-${r.id}`, kind: 'verified-label', title: `Verified label data: ${r.brand} ${r.name} (${r.activity.replace(/_/g, ' ')})`, url: `/shop/dose-calculator?activity=${r.activity}`, text:
      `VERIFIED LABEL DATA for ${r.brand} ${r.name}, activity ${r.activity.replace(/_/g, ' ')}, method ${r.method}. Figures (product unit ${r.amount_unit}): ${nums}. ` +
      `Source: ${r.doc_title || r.source_note}. Verified by PestKill staff against the label.` });
  }
  const stds = await db.all('SELECT id, code, title, scope, verification_status, source_note FROM technical_references WHERE display = 1');
  for (const s of stds) {
    out.push({ id: `std-${s.id}`, kind: 'standard', title: s.code, url: '/technical-standards', text:
      `${s.code}: ${s.title}. ${s.scope || ''} Status: ${s.verification_status.replace(/_/g, ' ')}. ${s.source_note || ''} Listing is not a claim of BIS certification.` });
  }
  return out;
};

// IS 6313 starting figures used by the website's calculator (same figures as frontend/src/lib/doseReference.js).
const IS_CHUNK = { id: 'is6313-rates', kind: 'standard', title: 'IS 6313 application volumes (dose calculator)', url: '/shop/dose-calculator', text:
  'IS 6313 (Part 2) : 2001 pre-construction: 5 litres of emulsion per m² on horizontal surfaces (foundation bottom, top of plinth filling), 7.5 litres per m² on vertical surfaces (backfill against foundations), external perimeter 7.5 L/m² to 300 mm depth (2.25 L per running metre). ' +
  'IS 6313 (Part 3) : 2001 existing buildings: 2.25 L per running metre along the foundation; holes about 300 mm apart at floor–wall junctions, until refusal or up to 1 litre per hole. ' +
  'The standards list chlorpyrifos 20 EC at 1.0% active ingredient. For any other chemical the dilution must come from the product label.' };

let cache = { at: 0, index: null };
const TTL = 10 * 60 * 1000;

const build = (chunks) => {
  const docs = chunks.map((c) => {
    const tokens = tokenize(`${c.title} ${c.title} ${c.text}`);
    const tf = new Map();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    return { ...c, tf, len: tokens.length };
  });
  const df = new Map();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
  const avg = docs.reduce((s, d) => s + d.len, 0) / Math.max(1, docs.length);
  return { docs, df, avg, n: docs.length };
};

export const getIndex = async ({ refresh = false } = {}) => {
  if (!refresh && cache.index && Date.now() - cache.at < TTL) return cache.index;
  const index = build([...staticChunks(), IS_CHUNK, ...await dbChunks()]);
  cache = { at: Date.now(), index };
  return index;
};
export const invalidateKnowledge = () => { cache = { at: 0, index: null }; };

/** BM25 search. Returns [{ id, kind, title, url, text, score }]. */
export const search = async (query, { k = 8, kinds } = {}) => {
  const idx = await getIndex();
  const q = [...new Set(tokenize(query))];
  if (!q.length) return [];
  const K1 = 1.4;
  const B = 0.75;
  const scored = [];
  for (const d of idx.docs) {
    if (kinds && !kinds.includes(d.kind)) continue;
    let score = 0;
    for (const t of q) {
      const f = d.tf.get(t);
      if (!f) continue;
      const idf = Math.log(1 + (idx.n - idx.df.get(t) + 0.5) / (idx.df.get(t) + 0.5));
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / idx.avg)));
    }
    if (score > 0) scored.push({ id: d.id, kind: d.kind, title: d.title, url: d.url, text: d.text, score: Math.round(score * 100) / 100 });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, k);
};

/** Always-relevant facts added to every answer's sources. */
export const coreSources = async () => {
  const idx = await getIndex();
  return idx.docs.filter((d) => d.id === 'business' || d.id === 'pricing').map(({ id, kind, title, url, text }) => ({ id, kind, title, url, text }));
};
