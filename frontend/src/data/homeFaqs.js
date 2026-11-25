import { RATES, homeRateLine } from './catalog';

// Home page questions. Also used for the home page FAQ structured data.
export const HOME_FAQS = [
  { q: 'How much does pest control cost in Jaipur?', a: `Pest control for cockroaches, bed bugs, rodents and other pests is ${homeRateLine}. Anti-termite treatment is ₹${RATES.termitePost.min}–${RATES.termitePost.max} per sq.ft. for existing buildings, ₹${RATES.termitePre.min}–${RATES.termitePre.max} per sq.ft. before construction, and ₹${RATES.porousPipe.min}–${RATES.porousPipe.max} per sq.ft. for the porous pipe system. You always receive a written quotation before work begins.` },
  { q: 'Are your chemicals safe for children and pets?', a: 'We use registered products applied by trained technicians as the label directs. For gel treatments you can usually stay at home. For sprays we tell you which rooms to keep closed and for how long, based on the product used. Tell us about children, pets or anyone with asthma when you book.' },
  { q: 'I am building a new house. What should I do for termites?', a: 'Choose pre-construction treatment, ideally our porous pipe system. It is installed before flooring and can be recharged from outside later without drilling.' },
  { q: 'How long does termite treatment last?', a: 'It depends on the product, soil, construction and later disturbance of the treated soil. Any warranty we give is written on your quotation with its period and conditions. The porous pipe system can be recharged later without drilling.' },
  { q: 'Do you offer annual maintenance contracts?', a: 'Yes. Homes, offices, hotels and restaurants can choose scheduled AMC visits with free re-treatment within the contract period.' },
  { q: 'How quickly can you visit?', a: 'Our teams are dispatched from Jaipur. Visits in and around Jaipur are the easiest to schedule; other locations are planned by distance and team availability. We confirm the date with you on a call before anything is booked.' },
];
