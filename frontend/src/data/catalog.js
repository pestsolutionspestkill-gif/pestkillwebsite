import {
  Bug, Zap, Shield, BedDouble, ShieldCheck, Layers, Droplets, Wind, SprayCan, Bird, Rat,
  UtensilsCrossed, Hotel, Hospital, FlaskConical, Warehouse, Building2, GraduationCap, HardHat,
} from 'lucide-react';

/* ------------------------------------------------------------------
   Services — single source for menus, booking, search and cards.
   `path` is the page that describes the service in detail.
   `pricing` is used by the booking wizard ("starting from", final after inspection).
------------------------------------------------------------------- */
/* ------------------------------------------------------------------
   Official rates. Change a price here and every page, the booking
   wizard and the FAQs pick it up.
------------------------------------------------------------------- */
// Official service prices live in ./pricing.js (shared with the server and PestKill AI).
import { RATES, GST_NOTE } from './pricing';
export { RATES, GST_NOTE };

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
export const sqftLabel = (r) => `₹${r.min}–${r.max} per sq.ft.`;
export const homeFrom = inr(RATES.home['1BHK']);
export const homeRateLine = `${inr(RATES.home['1BHK'])} (1BHK) · ${inr(RATES.home['2BHK'])} (2BHK) · ${inr(RATES.home['3BHK'])} (3BHK), plus GST`;

const homePricing = { unit: 'bhk', tiers: RATES.home };
const sqftPricing = (r) => ({ unit: 'sqft', min: r.min, max: r.max, label: sqftLabel(r) });

export const services = [
  {
    slug: 'anti-termite-piping', name: 'Porous Pipe Anti-Termite System', short: 'Porous Pipe System',
    group: 'termite', segment: ['home', 'business'], icon: Layers, path: '/services/anti-termite-piping',
    summary: 'Refillable pipe network laid under the foundation before flooring.',
    pricing: sqftPricing(RATES.porousPipe),
  },
  {
    slug: 'pre-construction-termite', name: 'Pre-Construction Anti-Termite (Soil Treatment)', short: 'Pre-Construction',
    group: 'termite', segment: ['home', 'business'], icon: Shield, path: '/termite-control',
    summary: 'Chemical soil barrier laid while the building is being constructed.',
    pricing: sqftPricing(RATES.termitePre),
  },
  {
    slug: 'termite-control', name: 'Post-Construction Anti-Termite (Drill & Fill)', short: 'Post-Construction',
    group: 'termite', segment: ['home', 'business'], icon: Bug, path: '/termite-control',
    summary: 'Drill-fill injection for existing homes and buildings.',
    pricing: sqftPricing(RATES.termitePost),
  },
  {
    slug: 'cockroach-control', name: 'Cockroach Control', short: 'Cockroach Control',
    group: 'general', segment: ['home', 'business'], icon: Zap, path: '/cockroach-control',
    summary: 'Odourless gel baiting and residual spray.',
    pricing: homePricing,
  },
  {
    slug: 'bed-bugs', name: 'Bed Bug Treatment', short: 'Bed Bug Treatment',
    group: 'general', segment: ['home', 'business'], icon: BedDouble, path: '/bed-bug-treatment',
    summary: 'Heat, steam and chemical protocol for every life stage.',
    pricing: homePricing,
  },
  {
    slug: 'rodent-control', name: 'Rodent Control', short: 'Rodent Control',
    group: 'general', segment: ['home', 'business'], icon: Rat, path: '/rodent-control',
    summary: 'Proofing, tamper-resistant bait stations and monitoring.',
    pricing: homePricing,
  },
  {
    slug: 'mosquito-control', name: 'Mosquito Control', short: 'Mosquito Control',
    group: 'general', segment: ['home', 'business'], icon: Droplets, path: '/services/mosquito-control',
    summary: 'Larviciding, fogging and ULV space spraying.',
    pricing: homePricing,
  },
  {
    slug: 'general-pest-control', name: 'General Pest Control', short: 'General Pest Control',
    group: 'general', segment: ['home', 'business'], icon: ShieldCheck, path: '/services/general-pest-control',
    summary: 'Ants, spiders, silverfish and crawling insects.',
    pricing: homePricing,
  },
  {
    slug: 'fly-control', name: 'Fly Control', short: 'Fly Control',
    group: 'general', segment: ['home', 'business'], icon: Wind, path: '/services/fly-control',
    summary: 'Source reduction, baits and residual treatment.',
    pricing: homePricing,
  },
  {
    slug: 'lizard-control', name: 'Lizard Control', short: 'Lizard Control',
    group: 'general', segment: ['home'], icon: Shield, path: '/services/lizard-control',
    summary: 'Targeted treatment of resting and entry points.',
    pricing: homePricing,
  },
  {
    slug: 'bird-control', name: 'Bird Control & Netting', short: 'Bird Control',
    group: 'specialist', segment: ['home', 'business'], icon: Bird, path: '/services/bird-control',
    summary: 'Bird netting and spikes for balconies, ducts and facades.',
  },
  {
    slug: 'disinfection', name: 'Disinfection & Sanitisation', short: 'Disinfection',
    group: 'specialist', segment: ['home', 'business'], icon: SprayCan, path: '/services/disinfection',
    summary: 'Surface and space disinfection for homes and workplaces.',
  },
  {
    slug: 'fumigation', name: 'Fumigation', short: 'Fumigation',
    group: 'specialist', segment: ['business'], icon: FlaskConical, path: '/services/fumigation',
    summary: 'Stored-commodity, warehouse and container fumigation.',
  },
];

export const serviceGroups = [
  { id: 'termite', label: 'Anti-Termite' },
  { id: 'general', label: 'Pest Control' },
  { id: 'specialist', label: 'Specialist Services' },
];

export const getService = (slug) => services.find((s) => s.slug === slug);

/* ------------------------------------------------------------------
   Pest library
------------------------------------------------------------------- */
export const pests = [
  {
    slug: 'termites', name: 'Termites', service: 'termite-control', icon: Bug, tag: 'Structural pest',
    intro: 'Subterranean termites live in soil colonies and travel through mud tubes to feed on cellulose: wood, paper, cardboard and even the backing of wallpaper. They are the most expensive structural pest in Indian homes.',
    identify: ['Creamy-white workers, 3–5 mm long', 'Soldiers with darker, enlarged heads', 'Winged reproductives (swarmers) after the first monsoon rains'],
    signs: ['Pencil-thin mud tubes on walls, foundations and door frames', 'Hollow-sounding or blistered wood', 'Discarded wings near windows and lights', 'Damaged books, cartons and plywood furniture'],
    risks: ['Structural damage to door frames, cupboards and beams', 'Weakening of wooden fixtures and flooring', 'Costly replacement of furniture and woodwork'],
    prevention: ['Fix leaking pipes and damp walls', 'Keep wood and cardboard off the floor', 'Leave a gap between furniture and walls', 'Choose pre-construction treatment for new buildings'],
  },
  {
    slug: 'cockroaches', name: 'Cockroaches', service: 'cockroach-control', icon: Zap, tag: 'Hygiene pest',
    intro: 'German and American cockroaches are the two species most common in Indian homes and kitchens. They hide by day in warm cracks and come out at night to feed on food residue.',
    identify: ['German: 12–15 mm, light brown with two dark stripes', 'American: up to 40 mm, reddish-brown, often in drains', 'Egg capsules (oothecae) carried or glued in cracks'],
    signs: ['Live cockroaches when lights are switched on at night', 'Pepper-like droppings in drawers and cabinets', 'An oily, musty odour in heavy infestations', 'Egg cases behind appliances and sinks'],
    risks: ['Contamination of food and utensils', 'Spread of bacteria such as Salmonella and E. coli', 'Triggers for asthma and allergies'],
    prevention: ['Store food in sealed containers', 'Do not leave dishes in the sink overnight', 'Seal cracks around plumbing and cabinets', 'Keep drains covered and clean'],
  },
  {
    slug: 'rodents', name: 'Rats & Mice', service: 'rodent-control', icon: Rat, tag: 'Health & damage',
    intro: 'House mice, roof rats and bandicoots enter buildings looking for food and shelter. They breed quickly and gnaw constantly, which makes them a serious risk to wiring, stock and health.',
    identify: ['House mouse: small, large ears, 15–20 cm with tail', 'Roof rat: slender, long tail, excellent climber', 'Bandicoot: large, heavy-bodied, burrows near drains'],
    signs: ['Droppings along walls and in cupboards', 'Gnawed wires, packaging and wood', 'Scratching sounds in false ceilings at night', 'Grease marks along regular runways'],
    risks: ['Fire hazard from chewed electrical cables', 'Contamination of food and stock', 'Spread of leptospirosis and other diseases'],
    prevention: ['Seal gaps larger than 6 mm around pipes and doors', 'Keep garbage in lidded bins', 'Fit mesh on drains and ventilators', 'Remove clutter from storerooms'],
  },
  {
    slug: 'bed-bugs', name: 'Bed Bugs', service: 'bed-bugs', icon: BedDouble, tag: 'Biting pest',
    intro: 'Bed bugs are small, flat, blood-feeding insects that hide in mattress seams, bed frames and furniture joints. They travel in luggage and used furniture, so even very clean homes and hotels can be affected.',
    identify: ['Adults are reddish-brown, flat and about 5 mm long', 'Nymphs are smaller and pale before feeding', 'Tiny white eggs glued in crevices'],
    signs: ['Itchy bites in lines or clusters on waking', 'Small blood spots on sheets and pillow covers', 'Dark faecal spots along mattress seams', 'Shed skins near the bed'],
    risks: ['Sleep loss and skin irritation', 'Rapid spread between rooms and apartments', 'Reputation damage for hotels and hostels'],
    prevention: ['Inspect hotel beds and luggage racks while travelling', 'Wash travel clothes in hot water', 'Check second-hand furniture before bringing it home', 'Use zippered mattress encasements'],
  },
  {
    slug: 'mosquitoes', name: 'Mosquitoes', service: 'mosquito-control', icon: Droplets, tag: 'Disease vector',
    intro: 'Aedes, Anopheles and Culex mosquitoes breed in standing water. Aedes mosquitoes, which spread dengue and chikungunya, breed in clean water in coolers, flower pots and tyres, often inside the home.',
    identify: ['Aedes: black with white stripes, bites during the day', 'Anopheles: rests at an angle, bites at night', 'Culex: brownish, common near drains'],
    signs: ['Larvae (wrigglers) in coolers, tanks and pots', 'Frequent bites in the early morning or evening', 'Swarms near drains, gardens and construction sites'],
    risks: ['Dengue, malaria and chikungunya transmission', 'Higher risk during and after the monsoon', 'Health and safety liability for workplaces'],
    prevention: ['Empty and scrub coolers and pots weekly', 'Cover overhead tanks and water drums', 'Fit window screens and use nets', 'Clear blocked drains and gutters'],
  },
  {
    slug: 'flies', name: 'House Flies', service: 'fly-control', icon: Wind, tag: 'Hygiene pest',
    intro: 'House flies breed in garbage, drains and organic waste and land on food within minutes. They are a major concern in kitchens, food factories, dairies and hospitals.',
    identify: ['Grey body about 6–7 mm with four dark stripes on the thorax', 'Larvae (maggots) in decaying organic matter'],
    signs: ['Flies gathering on food and waste areas', 'Small dark spots (fly specks) on walls and lights', 'Maggots in bins and drains'],
    risks: ['Spread of typhoid, cholera and diarrhoeal infections', 'Food-safety audit failures', 'Customer complaints in hospitality'],
    prevention: ['Empty and wash bins daily', 'Seal food and cover waste', 'Fit fly screens and air curtains', 'Keep drains free of organic build-up'],
  },
  {
    slug: 'ants', name: 'Ants', service: 'general-pest-control', icon: ShieldCheck, tag: 'Nuisance pest',
    intro: 'Black, red and sugar ants follow scent trails from outdoor nests into kitchens and pantries. Some species also nest inside walls and electrical boards.',
    identify: ['Black house ants: small and fast-moving', 'Red ants: painful sting, nest in soil', 'Carpenter ants: large, nest in damp wood'],
    signs: ['Trails along skirting boards and counters', 'Small soil heaps near cracks and tiles', 'Ants inside switchboards or appliances'],
    risks: ['Food contamination', 'Painful stings from red ants', 'Damage to electrical equipment'],
    prevention: ['Wipe up sugary spills immediately', 'Store sweets and sugar in airtight jars', 'Seal cracks in tiles and skirting'],
  },
  {
    slug: 'lizards', name: 'House Lizards', service: 'lizard-control', icon: Shield, tag: 'Nuisance pest',
    intro: 'House geckos are attracted by warm walls and the insects that gather around lights. Controlling the insect population and entry points is the key to keeping them away.',
    identify: ['Pale, translucent body 8–12 cm long', 'Active around lights at night'],
    signs: ['Lizards near tube lights and windows', 'Small black-and-white droppings on walls and floors'],
    risks: ['Contamination of food and utensils by droppings', 'Distress for residents and guests'],
    prevention: ['Reduce insects around outdoor lights', 'Seal gaps around doors and windows', 'Remove clutter behind furniture'],
  },
  {
    slug: 'spiders', name: 'Spiders', service: 'general-pest-control', icon: Bug, tag: 'Nuisance pest',
    intro: 'Most household spiders are harmless, but webs in corners, ceilings and storerooms make spaces look neglected and signal an underlying insect problem.',
    identify: ['Cellar spiders with long thin legs', 'Wall spiders with flat bodies', 'Webs in corners and under furniture'],
    signs: ['Webs in ceiling corners and windows', 'Egg sacs in undisturbed areas'],
    risks: ['Unhygienic appearance in homes and offices', 'Occasional bites causing irritation'],
    prevention: ['Dust and vacuum corners regularly', 'Reduce insects that spiders feed on', 'Declutter storerooms'],
  },
  {
    slug: 'pigeons', name: 'Pigeons & Pest Birds', service: 'bird-control', icon: Bird, tag: 'Building pest',
    intro: 'Pigeons nest on balconies, AC ledges and ducts. Their droppings are acidic and their nests block drains and attract mites and other insects.',
    identify: ['Feral pigeons roosting on ledges and AC units', 'Nests in ducts, balconies and window sills'],
    signs: ['Droppings on balconies, cars and ledges', 'Nesting material in AC units and pipes', 'Cooing and wing noise early in the morning'],
    risks: ['Respiratory illnesses linked to dried droppings', 'Corrosion of paint and metal surfaces', 'Blocked drains and gutters'],
    prevention: ['Do not feed pigeons near the building', 'Install bird netting or spikes on ledges', 'Clean droppings with protective gear'],
  },
];

export const getPest = (slug) => pests.find((p) => p.slug === slug);

/* ------------------------------------------------------------------
   Business sectors
------------------------------------------------------------------- */
export const sectors = [
  {
    slug: 'food-processing', name: 'Food Processing & Manufacturing', icon: UtensilsCrossed,
    intro: 'Food plants and kitchens need zero-tolerance pest programmes that stand up to customer and regulatory audits.',
    challenges: ['Stored-product insects in raw material', 'Rodents in godowns and loading bays', 'Flies around waste and processing lines', 'Audit documentation requirements'],
    approach: ['Site survey and risk mapping', 'Numbered rodent bait stations with trend reports', 'Food-safe treatments around production areas', 'Service reports and pest sighting logs for audits'],
    pests: ['rodents', 'cockroaches', 'flies'],
    compliance: 'Documentation to support FSSAI and customer hygiene audits.',
  },
  {
    slug: 'hospitality', name: 'Hotels & Restaurants', icon: Hotel,
    intro: 'Guests notice everything. Our hospitality programmes keep pests out of sight and rooms in service.',
    challenges: ['Bed bugs travelling in with guests', 'Cockroaches in kitchens and service areas', 'Flies in dining and garbage areas', 'Treatments without disturbing guests'],
    approach: ['Discreet, scheduled visits outside peak hours', 'Room-by-room bed bug inspections', 'Kitchen gel programmes with monthly follow-ups', 'Staff awareness on early signs'],
    pests: ['bed-bugs', 'cockroaches', 'flies'],
    compliance: 'Kitchen service records for hygiene inspections and brand audits.',
  },
  {
    slug: 'healthcare', name: 'Hospitals & Clinics', icon: Hospital,
    intro: 'Healthcare facilities need strict pest control that protects vulnerable patients and sterile areas.',
    challenges: ['Infection risk from cockroaches and flies', 'Rodents in basements and stores', 'Treatments around patients and OTs', 'Strict chemical selection'],
    approach: ['Low-toxicity, odourless formulations', 'Zone-based schedule around wards and OTs', 'Monitoring devices in critical areas', 'Detailed service reports for quality teams'],
    pests: ['cockroaches', 'rodents', 'mosquitoes'],
    compliance: 'Records that support NABH and internal infection-control audits.',
  },
  {
    slug: 'pharmaceuticals', name: 'Pharmaceuticals', icon: FlaskConical,
    intro: 'Pharma sites need documented, validated pest management that fits GMP requirements.',
    challenges: ['Insects entering clean rooms', 'Rodents near raw-material stores', 'Documented trend analysis', 'Change-controlled treatment methods'],
    approach: ['Site maps with numbered monitoring points', 'Insect light traps and rodent stations', 'Trend reports and corrective action notes', 'Approved chemical list with MSDS on file'],
    pests: ['rodents', 'flies', 'cockroaches'],
    compliance: 'Documentation designed around GMP (Schedule M) audit expectations.',
  },
  {
    slug: 'warehousing', name: 'Warehouses & Logistics', icon: Warehouse,
    intro: 'Large storage spaces and constant movement of goods make warehouses an easy entry point for pests.',
    challenges: ['Rodents damaging stock and packaging', 'Stored-grain insects', 'Birds nesting in high roofs', 'Large areas with limited downtime'],
    approach: ['Perimeter and internal rodent stations', 'Commodity and container fumigation', 'Bird netting for roof trusses', 'Monthly inspection reports'],
    pests: ['rodents', 'pigeons', 'termites'],
    compliance: 'Fumigation certificates and service logs for client audits.',
  },
  {
    slug: 'offices', name: 'Offices & IT Parks', icon: Building2,
    intro: 'Pest-free workplaces protect your people, your equipment and your brand.',
    challenges: ['Cockroaches in pantries and cafeterias', 'Rodents in false ceilings and server rooms', 'Mosquitoes around landscaped areas', 'Work-hour disruption'],
    approach: ['After-hours and weekend treatments', 'Odourless gel in pantries', 'Rodent proofing of cable shafts', 'Quarterly AMC with a single point of contact'],
    pests: ['cockroaches', 'rodents', 'mosquitoes'],
    compliance: 'AMC reports for facility and admin teams.',
  },
  {
    slug: 'education', name: 'Schools & Institutions', icon: GraduationCap,
    intro: 'Campuses need safe, well-timed treatments that never put students at risk.',
    challenges: ['Mosquito breeding on large campuses', 'Termites in furniture and libraries', 'Cockroaches in canteens and hostels', 'Treatments only during holidays'],
    approach: ['Holiday-schedule treatments', 'Anti-termite protection for libraries and furniture', 'Campus-wide mosquito programmes', 'Low-toxicity chemistry only'],
    pests: ['mosquitoes', 'termites', 'cockroaches'],
    compliance: 'Service certificates for institutional and government records.',
  },
  {
    slug: 'builders', name: 'Builders & Housing Societies', icon: HardHat,
    intro: 'Protect new projects from day one and keep entire societies pest-free with a single contract.',
    challenges: ['Termite protection before possession', 'Common-area cockroaches and rodents', 'Mosquitoes in basements and sumps', 'Pigeons on balconies and ducts'],
    approach: ['Pre-construction treatment and porous pipe systems', 'Society AMCs covering common areas', 'Bird netting for towers', 'Treatment certificates for every block'],
    pests: ['termites', 'mosquitoes', 'pigeons'],
    compliance: 'Anti-termite completion certificates for project handover files.',
  },
];

export const getSector = (slug) => sectors.find((s) => s.slug === slug);

/* ------------------------------------------------------------------
   Careers
------------------------------------------------------------------- */
export const roles = [
  { title: 'Pest Control Technician', type: 'Full-time', location: 'Jaipur', summary: 'Carry out residential and commercial treatments safely and to standard.', needs: ['10th / 12th pass', 'Willing to travel within the city', 'Two-wheeler preferred', 'Training provided'] },
  { title: 'Field Supervisor', type: 'Full-time', location: 'Jaipur', summary: 'Lead technician teams, plan schedules and check service quality on site.', needs: ['2+ years in pest control or facility services', 'Team handling experience', 'Basic computer and reporting skills'] },
  { title: 'Sales Executive (B2B)', type: 'Full-time', location: 'Jaipur / Rajasthan', summary: 'Win and manage commercial AMC accounts across industries.', needs: ['Graduate', '1+ years in B2B or service sales', 'Good communication in Hindi and English'] },
  { title: 'Customer Support Executive', type: 'Full-time', location: 'Jaipur', summary: 'Handle enquiries, bookings and follow-ups over phone and WhatsApp.', needs: ['Graduate', 'Clear spoken Hindi and English', 'Comfortable with computers'] },
];
