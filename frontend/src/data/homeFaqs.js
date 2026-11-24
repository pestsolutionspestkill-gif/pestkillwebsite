import { RATES, homeRateLine } from './catalog';

// Home page questions. Also used for the home page FAQ structured data.
export const HOME_FAQS = [
  { q: 'How much does pest control cost in Jaipur?', a: `Pest control for cockroaches, bed bugs, rodents and other pests is ${homeRateLine}. Anti-termite treatment is ₹${RATES.termitePost.min}–${RATES.termitePost.max} per sq.ft. for existing buildings, ₹${RATES.termitePre.min}–${RATES.termitePre.max} per sq.ft. before construction, and ₹${RATES.porousPipe.min}–${RATES.porousPipe.max} per sq.ft. for the porous pipe system. You always receive a written quotation before work begins.` },
  { q: 'Are your chemicals safe for children and pets?', a: 'We use government-approved, low-toxicity formulations applied by trained technicians. For gel treatments you can stay at home. For sprays we advise keeping rooms closed for a few hours.' },
  { q: 'I am building a new house. What should I do for termites?', a: 'Choose pre-construction treatment, ideally our porous pipe system. It is installed before flooring and can be refilled from outside for 10–15 years without drilling.' },
  { q: 'How long does termite treatment last?', a: 'Post-construction treatment carries up to a 5-year warranty and pre-construction treatment up to 10 years. The porous pipe system extends protection further with periodic refills.' },
  { q: 'Do you offer annual maintenance contracts?', a: 'Yes. Homes, offices, hotels and restaurants can choose scheduled AMC visits with free re-treatment within the contract period.' },
  { q: 'How quickly can you visit?', a: 'In Jaipur we usually offer same-day or next-day inspection. Other cities are scheduled within a few days.' },
];
