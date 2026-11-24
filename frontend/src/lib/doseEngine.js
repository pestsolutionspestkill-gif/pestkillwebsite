/*
  Dosage calculator engine (pure functions, no UI).
  It only does arithmetic: measurements × label rates that staff entered and verified for a
  product (see backend/src/routes/doseRoutes.js). It never supplies or guesses a dose. A component
  whose label rate is missing is skipped and reported, never filled in.
*/

const FT = 0.3048; // metres per foot
const SQFT = 0.09290304; // m² per sq ft

export const UNITS = {
  metric: { length: 'm', area: 'm²' },
  imperial: { length: 'ft', area: 'sq ft' },
};

const pos = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };
export const toMetres = (v, system) => { const n = pos(v); return n == null ? null : system === 'imperial' ? n * FT : n; };
export const toSqm = (v, system) => { const n = pos(v); return n == null ? null : system === 'imperial' ? n * SQFT : n; };
export const round = (n, d = 2) => (n == null ? null : Math.round(n * 10 ** d) / 10 ** d);

/** "1 L" → {amount:1000, unit:'ml'}; "62.5 g" → {62.5,'g'}; "1 kg × 2" → {2000,'g'}; unknown → null. */
export const parsePack = (text) => {
  const s = String(text || '').toLowerCase().replace(/,/g, '');
  const m = /(\d+(?:\.\d+)?)\s*(ml|l|ltr|litre|liter|g|gm|gram|kg)\b/.exec(s);
  if (!m) return null;
  const qty = Number(m[1]);
  const unit = m[2];
  const times = /[×x]\s*(\d+)/.exec(s.slice(m.index + m[0].length));
  const mult = times ? Number(times[1]) : 1;
  if (['l', 'ltr', 'litre', 'liter'].includes(unit)) return { amount: qty * 1000 * mult, unit: 'ml' };
  if (unit === 'ml') return { amount: qty * mult, unit: 'ml' };
  if (unit === 'kg') return { amount: qty * 1000 * mult, unit: 'g' };
  return { amount: qty * mult, unit: 'g' };
};

/**
 * Pre-construction measurements. Plinth area and perimeter are derived from length × width
 * unless entered directly. Foundation: strip trench (length × width × depth) or isolated pits.
 * All results are metric (m, m²).
 */
export const termitePreGeometry = ({ system = 'metric', length, width, plinthArea, perimeter, foundation = {} }) => {
  const L = toMetres(length, system);
  const W = toMetres(width, system);
  const derived = [];
  let plinth = toSqm(plinthArea, system);
  if (plinth == null && L && W) { plinth = L * W; derived.push('Plinth area = length × width'); }
  let perim = toMetres(perimeter, system);
  if (perim == null && L && W) { perim = 2 * (L + W); derived.push('Perimeter = 2 × (length + width)'); }

  let bottom = null;
  let sides = null;
  if (foundation.type === 'strip') {
    const tl = toMetres(foundation.trenchLength, system) ?? perim;
    if (foundation.trenchLength == null && perim) derived.push('Trench length taken as the building perimeter');
    const tw = toMetres(foundation.trenchWidth, system);
    const td = toMetres(foundation.trenchDepth, system);
    if (tl && tw) bottom = tl * tw;
    if (tl && td) sides = 2 * tl * td;
  } else if (foundation.type === 'pits') {
    const n = pos(foundation.count);
    const pl = toMetres(foundation.pitLength, system);
    const pw = toMetres(foundation.pitWidth, system);
    const pd = toMetres(foundation.pitDepth, system);
    if (n && pl && pw) bottom = n * pl * pw;
    if (n && pl && pw && pd) sides = n * 2 * (pl + pw) * pd;
  }
  return { plinthSqm: plinth, perimeterM: perim, foundationBottomSqm: bottom, foundationSidesSqm: sides, derived };
};

const RATE_UNIT = { rate_horizontal: 'L/m²', rate_vertical: 'L/m²', rate_running: 'L/m', rate_per_hole: 'L per hole (max)' };

/**
 * Applies a verified label record to measurements.
 * measures (metric): { plinthSqm, foundationBottomSqm, foundationSidesSqm, perimeterM, floorSqm, surfaceSqm, waterLitres, baitPoints }
 * Returns { components[], skipped[], solutionL, product: {amount, unit}, waterL } — or { error } when nothing can be calculated.
 */
export const calculate = ({ activity, record, measures }) => {
  // 'verified' = label data checked by our team; 'manual' = figures the user sees and can edit on screen.
  if (!record || !['verified', 'manual'].includes(record.status)) return { error: 'No verified label data for this product and activity.' };
  const unit = record.amount_unit || 'ml';
  const parts = {
    termite_pre: [
      ['plinth', 'Plinth / under-floor soil', measures.plinthSqm, 'm²', 'rate_horizontal'],
      ['foundation_bottom', 'Foundation bottom', measures.foundationBottomSqm, 'm²', 'rate_horizontal'],
      ['foundation_sides', 'Foundation sides', measures.foundationSidesSqm, 'm²', 'rate_vertical'],
      ['perimeter', 'External perimeter', measures.perimeterM, 'm', 'rate_running'],
    ],
    termite_post: [
      ['perimeter', 'Along walls and perimeter', measures.perimeterM, 'm', 'rate_running'],
      ['floor', 'Floor area', measures.floorSqm, 'm²', 'rate_horizontal'],
      ['holes', 'Drill holes at floor–wall junctions', measures.holes, 'holes', 'rate_per_hole'],
    ],
    cockroach: [['surface', 'Treated surface', measures.surfaceSqm, 'm²', 'rate_horizontal']],
    bedbug: [['surface', 'Treated surface', measures.surfaceSqm, 'm²', 'rate_horizontal']],
    general: [['surface', 'Treated surface', measures.surfaceSqm, 'm²', 'rate_horizontal']],
    mosquito_residual: [['surface', 'Sprayed wall and ceiling area', measures.surfaceSqm, 'm²', 'rate_horizontal']],
  }[activity];

  if (activity === 'larvicide') {
    const w = pos(measures.waterLitres);
    if (!w) return { error: 'Enter the volume of water to treat.' };
    if (!record.product_per_1000l) return { error: 'The label rate per 1000 L of water has not been entered for this product.' };
    return { components: [{ key: 'water', label: 'Water to treat', quantity: w, unit: 'L', rate: record.product_per_1000l, rateUnit: `${unit} per 1000 L`, solutionL: null }],
      skipped: [], solutionL: null, product: { amount: (w * record.product_per_1000l) / 1000, unit }, waterL: null };
  }
  if (activity === 'rodent') {
    const n = pos(measures.baitPoints);
    if (!n) return { error: 'Enter the number of bait points.' };
    if (!record.bait_per_point) return { error: 'The bait quantity per point has not been entered for this product.' };
    return { components: [{ key: 'points', label: 'Bait points', quantity: n, unit: 'points', rate: record.bait_per_point, rateUnit: 'g per point', solutionL: null }],
      skipped: [], solutionL: null, product: { amount: n * record.bait_per_point, unit: 'g' }, waterL: null };
  }
  if (!parts) return { error: 'This activity is not supported.' };
  if (!record.product_per_litre) return { error: 'The label dilution has not been entered for this product.' };

  const components = [];
  const skipped = [];
  for (const [key, label, qty, qUnit, rateKey] of parts) {
    if (!pos(qty)) continue; // not measured / not applicable
    const rate = record[rateKey];
    if (!rate) { skipped.push({ key, label, reason: 'The label does not give a rate for this part (not entered), so it is not calculated.' }); continue; }
    components.push({ key, label, quantity: qty, unit: qUnit, rate, rateUnit: RATE_UNIT[rateKey], solutionL: qty * rate });
  }
  if (!components.length) return { error: 'Enter the measurements for at least one part that the label covers.', skipped };
  const solutionL = components.reduce((s, c) => s + c.solutionL, 0);
  const amount = solutionL * record.product_per_litre;
  // Water to add: total solution less the product's own volume (liquids only).
  const waterL = unit === 'ml' ? solutionL - amount / 1000 : solutionL;
  return { components, skipped, solutionL, product: { amount, unit }, waterL };
};

/** How many packs cover `amount` (same unit family). Returns null if units differ or the pack size is unknown. */
export const packPlan = (amount, unit, packText) => {
  const p = parsePack(packText);
  if (!p || p.unit !== unit || !(amount > 0)) return null;
  const packs = Math.ceil(amount / p.amount - 1e-9);
  return { packs, packAmount: p.amount, total: packs * p.amount, leftover: packs * p.amount - amount };
};

export const costOf = (packs, price) => (packs != null && price != null ? packs * price : null);
