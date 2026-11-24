// Hinglish product guide, written by PestKill and built from each product's facts
// (brand, active ingredient, formulation, category, target pests). No dose figures are
// given here: dose always comes from the label printed on the pack.
import { PEST_OPTIONS } from './shop';

const FORMULATIONS = {
  EC: ['Emulsifiable Concentrate (EC)', 'Paani mein milane par doodhiya ghol (emulsion) banta hai, jise sprayer se lagaya jata hai. Deewaron, kono aur mitti ke treatment mein kaam aata hai.'],
  SC: ['Suspension Concentrate (SC)', 'Active ingredient ke bahut bareek kan liquid mein hote hain. Paani mein milakar spray karte hain; aam taur par smell kam hoti hai aur surface par asar lamba rehta hai.'],
  CS: ['Capsule Suspension (CS)', 'Chemical chhote micro-capsules mein band hota hai jo dheere-dheere nikalta hai, isliye residual asar lamba chalta hai aur smell kam rehti hai.'],
  WP: ['Wettable Powder (WP)', 'Powder ko paani mein gholkar spray kiya jata hai. Cement, eent aur khurdari (porous) deewaron par achha kaam karta hai.'],
  WG: ['Water Dispersible Granules (WG)', 'Granules paani mein ghul kar spray ka ghol banate hain. Powder ke mukable dhool kam udti hai aur naapna aasaan hota hai.'],
  EW: ['Emulsion in Water (EW)', 'Paani-based formulation hai, isliye solvent aur smell kam hoti hai. Space spray aur residual spray dono mein use hota hai.'],
  Gel: ['Gel bait', 'Spray ki zarurat nahi. Gel ke chhote dots cracks, hinges aur cabinets ke kono mein lagaye jate hain; keede khakar colony tak le jate hain.'],
  RB: ['Ready Bait (RB)', 'Seedha use hone wala bait. Bait stations ya chuhon ke raaston par rakha jata hai.'],
  Bait: ['Bait', 'Ready-to-use bait jo keedon ya chuhon ko aakarshit karke khatam karta hai. Bait stations mein rakhna sabse surakshit hai.'],
  CB: ['Concentrate for Bait (CB)', 'Isse anaaj ke saath milakar bait taiyaar kiya jata hai. Sirf trained operators ke liye.'],
  ULV: ['Ultra Low Volume (ULV)', 'Fogging machines (thermal ya ULV cold fogger) ke liye banaya gaya hai. Hawa mein udte machhar aur makkhiyon par turant asar.'],
  GR: ['Granules (GR)', 'Granules ko ruke hue paani, naaliyon aur tanks mein daala jata hai jahan machhar ke larvae palte hain.'],
  SG: ['Soluble Granules (SG)', 'Granules paani mein poori tarah ghul jaate hain. Larvae control ke liye paani ke sroton mein use hota hai.'],
  DP: ['Dusting Powder (DP)', 'Sookha powder jo cracks, voids, switch boards aur furniture ke peeche dusting se lagaya jata hai, jahan spray nahi pahunchta.'],
  RTU: ['Ready To Use (RTU)', 'Bina milaye seedha lagaya jata hai. Chhote spot treatment ke liye aasaan.'],
  Powder: ['Technical powder', 'Isse bait taiyaar kiya jata hai. Sirf trained aur licensed operators hi handle karein.'],
  Extract: ['Botanical extract', 'Natural pyrethrum par aadharit formulation, mukhya roop se fogging aur space spray ke liye.'],
  Adjuvant: ['Adjuvant (spreader)', 'Spray ke ghol mein milane se ghol patti aur surface par barabar failta hai, jisse coverage behtar hoti hai.'],
  Device: ['Electrical device', 'Chemical-free unit jo UV light se udte keedon ko aakarshit karke pakadta hai.'],
  Chalk: ['Insecticidal chalk', 'Cockroach aur keedon ke raaston par line kheenchkar lagaya jata hai.'],
  Herbal: ['Herbal formulation', 'Plant-based ingredients par aadharit product.'],
};
FORMULATIONS.WDG = FORMULATIONS.WG;

const CATEGORY_USE = {
  'Termite Control': 'deemak (termite) se building ko bachane ke liye: naye construction mein foundation aur plinth ki mitti ka treatment, aur purani building mein drill-and-fill treatment',
  'Cockroach Control': 'kitchen, drains, cabinets aur store rooms mein cockroach control ke liye',
  'Mosquito Control': 'machhar control ke liye: larvae (ruke paani mein) ya adult machhar (spray aur fogging se)',
  'Rodent Control': 'chuhon (rats aur mice) ke control ke liye, ghar, dukaan, godown aur factory mein',
  'General Pest Control': 'ghar aur commercial jagahon par cockroach, makkhi, machhar aur rengne wale keedon ke residual spray ke liye',
  'Fly Control': 'makkhi control ke liye: kitchens, dairies, kachra ghar aur food units mein',
  'Ant Control': 'cheentiyon ki colony khatam karne ke liye',
  'Equipment': 'pest control ke kaam mein',
  'Adjuvants': 'spray ke ghol ki coverage behtar karne ke liye',
};

const hiPest = (k) => PEST_OPTIONS.find((p) => p.key === k);

/** Returns { intro, formulation:[title, text], pests:[{label, hi}], uses:[], safety:[], faqs:[{q,a}] }. */
export const productGuide = (p) => {
  const form = FORMULATIONS[p.formulation] || null;
  const use = CATEGORY_USE[p.category] || 'professional pest control ke liye';
  const pests = (p.pests || []).map(hiPest).filter(Boolean);
  const isChemical = !['Device', 'Adjuvant'].includes(p.formulation);
  const name = `${p.brand} ${p.name}`;

  const intro = isChemical
    ? `${name} ek professional pest control product hai${p.technical ? ` jismein ${p.technical} hai` : ''}. Licensed pest control operators (PCO) ise ${use} use karte hain.`
    : `${name} ${use} kaam aata hai.`;

  const uses = [
    p.usage_info && `Kaam: ${p.usage_info}`,
    p.category === 'Termite Control' && 'Naye ghar ya building mein construction ke dauraan treatment sabse zyada lamba bachav deta hai.',
    p.category === 'Mosquito Control' && 'Machhar ke breeding sources (cooler, tank, naali) ko pehchaan kar treat karne se asar lamba rehta hai.',
    p.category === 'Rodent Control' && 'Bait hamesha tamper-proof bait stations mein rakhein taaki bachche aur paaltu jaanwar door rahein.',
    p.formulation === 'Gel' && 'Gel lagane ke baad us jagah spray na karein, warna keede gel se door bhagenge.',
    `Pack: ${p.pack_size}.`,
  ].filter(Boolean);

  const safety = isChemical ? [
    'Sirf label aur leaflet mein likhi dose aur tareeke se hi use karein.',
    'Lagate samay gloves, mask aur aankhon ki suraksha (PPE) pehnein.',
    'Khane-peene ki cheezein, bartan, bachche aur paaltu jaanwar treated jagah se door rakhein.',
    'Original pack mein, taale wali thandi aur sookhi jagah par rakhein.',
    'Khali dabbe dobara use na karein; niyam ke anusaar nasht karein.',
  ] : ['Bijli ke connection aur installation ke liye manufacturer ki guide follow karein.'];

  const faqs = [
    isChemical && { q: `${p.name} ki dose kitni rakhein?`, a: 'Dose hamesha pack par chhape label ke anusaar rakhein. Hamare dose calculator mein area daal kar zaroori ghol aur product ki matra dekh sakte hain (jin products ka label rate hamne joda hai).' },
    { q: 'Kya yeh original product hai?', a: `Haan. PestKill ${p.brand} ka authorised distributor hai. Har order sealed manufacturer pack mein jaata hai, jis par MRP, batch number aur expiry chhapi hoti hai, aur har order ka invoice milta hai.` },
    isChemical && { q: 'Kaun khareed sakta hai?', a: 'Professional pest control products sirf licensed pest control operators (PCO) ko beche jaate hain. Ek baar PCO account banakar apna licence verify karwaiye, phir online order kar sakte hain.' },
    { q: 'Bulk ya trade price kaise milega?', a: 'Product page ya shop se "Bulk order" button dabakar WhatsApp par quantity bhejiye. Approved PCOs ko account mein PCO price bhi dikhta hai.' },
    { q: 'Delivery kahan tak hoti hai?', a: 'Order Jaipur se dispatch hote hain. Rajasthan aur doosre rajyon mein delivery ke charges, agar koi ho, dispatch se pehle phone par confirm kiye jaate hain.' },
    pests.length > 0 && { q: `${p.name} kin keedon par kaam karta hai?`, a: `${pests.map((x) => `${x.label} (${x.hi})`).join(', ')}. Poori list ke liye pack ka label dekhein.` },
  ].filter(Boolean);

  return { intro, formulation: form, pests, uses, safety, faqs };
};
