import businessConfig from '../data/businessConfig';

export const rupees = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// What the buyer pays: the lowest of MRP (inclusive of taxes), a running offer, and the PCO price
// (sent by the server only to approved buyers).
export const priceInfo = (p) => {
  if (p.mrp == null) return { onRequest: true };
  const offer = p.offer && p.offer.price < p.mrp ? p.offer : null;
  const pco = p.pco_price != null && p.pco_price < p.mrp ? p.pco_price : null;
  const pay = Math.min(p.mrp, offer ? offer.price : Infinity, pco ?? Infinity);
  const kind = pay === p.mrp ? 'mrp' : pco != null && pco === pay ? 'pco' : 'offer';
  return { pay, mrp: p.mrp, off: pay < p.mrp ? Math.round((1 - pay / p.mrp) * 100) : 0, kind, offer, pcoPrice: kind === 'pco' };
};

export const fmtEnds = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');

export const quoteLink = (p) => {
  const text = `Hello PestKill, please share the price of ${p.brand} ${p.name} (${p.pack_size}).`;
  return `https://wa.me/${businessConfig.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
};

export const PAYMENT_LABELS = { cod: 'Cash on delivery', upi: 'UPI on confirmation', bank: 'Bank transfer (NEFT/IMPS)' };

// Pests used for shop filters and product tags (same keys as the server).
export const PEST_OPTIONS = [
  { key: 'termite', label: 'Termites', hi: 'दीमक' },
  { key: 'cockroach', label: 'Cockroaches', hi: 'कॉकरोच' },
  { key: 'mosquito', label: 'Mosquitoes', hi: 'मच्छर' },
  { key: 'rodent', label: 'Rats & mice', hi: 'चूहे' },
  { key: 'fly', label: 'Flies', hi: 'मक्खी' },
  { key: 'ant', label: 'Ants', hi: 'चींटी' },
  { key: 'bedbug', label: 'Bed bugs', hi: 'खटमल' },
];
export const pestLabel = (key) => PEST_OPTIONS.find((p) => p.key === key)?.label || key;
