// Single source of truth for PestKill service prices. Plain data and pure functions only, so the
// website, the booking wizard, the server and PestKill AI all read the same figures.
// All prices EXCLUDE GST; applicable GST is charged separately.

export const RATES = {
  termitePost: { min: 7, max: 9 },
  termitePre: { min: 12, max: 15 },
  porousPipe: { min: 22, max: 27 },
  home: { '1BHK': 1200, '2BHK': 1500, '3BHK': 1800 },
};

export const GST_NOTE = 'Prices are exclusive of GST. Applicable GST will be charged separately.';
// Rate our service invoices apply by default; the invoice is the final word.
export const SERVICE_GST_RATE = 18;

/** Services that can be estimated online, and how. Everything else is quoted after inspection. */
export const QUOTE_SERVICES = {
  general: { label: 'General residential pest control', unit: 'bhk' },
  termite_post: { label: 'Anti-termite: post-construction', unit: 'sqft', rate: RATES.termitePost },
  termite_pre: { label: 'Anti-termite: pre-construction', unit: 'sqft', rate: RATES.termitePre },
  porous_pipe: { label: 'Anti-termite: porous piping', unit: 'sqft', rate: RATES.porousPipe },
};

const round = (n) => Math.round(n);

/**
 * Indicative estimate. Returns { ok, service, lines, subtotal{min,max}, gst{rate,min,max}, total{min,max}, note }
 * or { ok: false, reason } when the job needs an inspection-based quotation.
 */
export const estimate = ({ service, size, areaSqft, propertyType = 'home' } = {}) => {
  const s = QUOTE_SERVICES[service];
  if (!s) return { ok: false, reason: 'This service is quoted after inspection.' };
  if (propertyType !== 'home' && service === 'general') {
    return { ok: false, reason: 'Commercial, industrial and institutional sites are quoted after inspection.' };
  }
  let min;
  let max;
  let basis;
  if (s.unit === 'bhk') {
    const price = RATES.home[size];
    if (!price) return { ok: false, reason: 'Homes larger than 3BHK, villas and bungalows are quoted after inspection.' };
    min = price; max = price; basis = `${size} home`;
  } else {
    const area = Number(areaSqft);
    if (!Number.isFinite(area) || area <= 0) return { ok: false, reason: 'Enter the area in square feet.' };
    if (area > 200000) return { ok: false, reason: 'Very large sites are quoted after inspection.' };
    min = round(area * s.rate.min); max = round(area * s.rate.max);
    basis = `${area.toLocaleString('en-IN')} sq.ft. × ₹${s.rate.min}–${s.rate.max}`;
  }
  const gstMin = round((min * SERVICE_GST_RATE) / 100);
  const gstMax = round((max * SERVICE_GST_RATE) / 100);
  return {
    ok: true, service, label: s.label, basis,
    subtotal: { min, max },
    gst: { rate: SERVICE_GST_RATE, min: gstMin, max: gstMax },
    total: { min: min + gstMin, max: max + gstMax },
    note: `${GST_NOTE} Indicative only; the final price is confirmed after inspection.`,
  };
};
