import businessConfig from '../data/businessConfig';

export const rupees = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// What the buyer pays: the lowest of the shop MRP (inclusive of taxes), the shop price from the
// reference price register, a running offer, and the PCO price (sent only to approved buyers).
// The server works out the order total the same way (bestPrice in productRoutes.js).
export const priceInfo = (p) => {
  const mrp = p.shop_mrp !== undefined ? p.shop_mrp : p.mrp;
  const below = (v) => v != null && (mrp == null || v < mrp);
  const options = [
    mrp != null && ['mrp', mrp],
    below(p.sale_price) && ['sale', p.sale_price],
    p.offer && below(p.offer.price) && ['offer', p.offer.price],
    below(p.pco_price) && ['pco', p.pco_price],
  ].filter(Boolean);
  if (!options.length) return { onRequest: true };
  // Lowest price wins; on a tie the earlier kind in the list is kept.
  const [kind, pay] = options.reduce((best, o) => (o[1] < best[1] ? o : best));
  return { pay, mrp, off: mrp != null && pay < mrp ? Math.round((1 - pay / mrp) * 100) : 0, kind, offer: kind === 'offer' ? p.offer : null, pcoPrice: kind === 'pco' };
};

// Wording beside a price.
export const priceNote = (info) => ({ pco: 'Your PCO price · ', offer: 'Offer price · ', sale: info.mrp != null ? 'Shop price · ' : 'Price · ', mrp: 'MRP · ' }[info.kind]);

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
