// Reference starting points for the dosage calculator.
// Source: IS 6313 (Part 2) : 2001 and IS 6313 (Part 3) : 2001 (archived copies, see /technical-standards).
// Only figures written in those standards are used here. Everything else is left empty for the user to
// enter from the product label. The calculator always says that the pack label takes precedence.

export const IS_PART2 = 'IS 6313 (Part 2) : 2001';
export const IS_PART3 = 'IS 6313 (Part 3) : 2001';

/** Volumes of diluted emulsion per treated part, by activity. */
export const IS_RATES = {
  termite_pre: {
    rate_horizontal: { value: 5, source: `${IS_PART2}, cl. 7.2.1 and 7.4`, note: 'Foundation bottom and top of plinth filling: 5 L/m²' },
    rate_vertical: { value: 7.5, source: `${IS_PART2}, cl. 7.2.2 and 7.3.1`, note: 'Backfill against foundation sides: 7.5 L/m² of vertical surface' },
    rate_running: { value: 2.25, source: `${IS_PART2}, cl. 7.6`, note: 'External perimeter: 7.5 L/m² of vertical surface × 300 mm depth = 2.25 L per running metre' },
  },
  termite_post: {
    rate_running: { value: 2.25, source: `${IS_PART3}, cl. 5.3.1.1`, note: 'Along the outside of the foundation: 1.75 L/m in the channel + 0.5 L/m for the backfill = 2.25 L per running metre' },
    rate_per_hole: { value: 1, source: `${IS_PART3}, cl. 5.3.1.3`, note: 'Holes at about 300 mm along floor–wall junctions and joints: until refusal, up to 1 L per hole' },
  },
};

/** Active-ingredient strength in the finished emulsion, as listed in the standards (concentration by weight). */
const IS_CHEMICALS = [
  { re: /chlorpyri(f|ph)os/i, name: 'Chlorpyrifos', target: 1.0, source: `${IS_PART2}, cl. 5.3 / ${IS_PART3}, cl. 4.1` },
];

/** Percentage of active ingredient written in a product's technical name, e.g. "Chlorpyrifos 20% EC" → 20. */
export const strengthOf = (technical) => {
  const m = /(\d+(?:\.\d+)?)\s*%/.exec(technical || '');
  return m ? Number(m[1]) : null;
};

/** Solid formulations are measured in grams; the rest in millilitres. */
export const unitFor = (product) => (/^(WP|WG|SG|GR|DP|RB|Powder|Bait|Cake|Block|Chalk|Granules?)$/i.test(product?.formulation || '') ? 'g' : 'ml');

/**
 * Dilution from the standard for a concentrate the standard lists.
 * Product per litre of emulsion = target % ÷ product % × 1000 (the standard states weight; treated here as volume).
 */
export const isDilution = (activity, product) => {
  if (!['termite_pre', 'termite_post'].includes(activity) || !product) return null;
  if (!/^(EC|SC|EW|CS)$/i.test(product.formulation || '')) return null; // ready-to-use and solid products are not diluted this way
  const chem = IS_CHEMICALS.find((c) => c.re.test(product.technical || ''));
  const pct = strengthOf(product.technical);
  if (!chem || !pct || pct <= chem.target) return null;
  const value = Math.round((chem.target / pct) * 1000 * 10) / 10;
  return { value, source: chem.source, note: `${chem.name} ${chem.target}% a.i. emulsion from a ${pct}% concentrate: ${chem.target} ÷ ${pct} × 1000 = ${value} ml per litre (1 part product + ${Math.round((pct / chem.target - 1) * 10) / 10} parts water)` };
};

/** Starting figures for one product and activity: { fields: {key: value}, sources: {key: {source, note}} }. */
export const referenceDose = (activity, product) => {
  const fields = {};
  const sources = {};
  for (const [k, r] of Object.entries(IS_RATES[activity] || {})) { fields[k] = r.value; sources[k] = { source: r.source, note: r.note }; }
  const d = isDilution(activity, product);
  if (d) { fields.product_per_litre = d.value; sources.product_per_litre = { source: d.source, note: d.note }; }
  return { fields, sources };
};
