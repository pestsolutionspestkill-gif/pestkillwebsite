// Single source of truth for PestKill service prices, used across the
// website (rate cards, service and city pages, FAQs and structured data).
// All prices EXCLUDE GST; applicable GST is charged separately.

export const RATES = {
  termitePost: { min: 7, max: 9 },
  termitePre: { min: 12, max: 15 },
  porousPipe: { min: 22, max: 27 },
  home: { '1BHK': 1200, '2BHK': 1500, '3BHK': 1800 },
};

export const GST_NOTE = 'Prices are exclusive of GST. Applicable GST will be charged separately.';
