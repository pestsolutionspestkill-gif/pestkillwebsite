// Safe Home plan: a personalised preparation and after-care checklist for a booking, based on the
// type of treatment and who lives at home. General guidance only — the technician confirms exact
// timings for the products actually used, and the product label always takes priority.
import { Baby, PawPrint, HeartPulse, Users, Wind, Fish } from 'lucide-react';

export const HOUSEHOLD_OPTIONS = [
  { key: 'kids', label: 'Children under 5', icon: Baby },
  { key: 'pets', label: 'Pets (dog, cat, bird)', icon: PawPrint },
  { key: 'elderly', label: 'Elderly family member', icon: Users },
  { key: 'pregnant', label: 'Someone pregnant', icon: HeartPulse },
  { key: 'asthma', label: 'Asthma or allergies', icon: Wind },
  { key: 'aquarium', label: 'Aquarium / fish', icon: Fish },
];

// Treatment style by service name.
const kindOf = (service = '') => {
  const s = service.toLowerCase();
  if (/termite|pipe|piping/.test(s)) return 'termite';
  if (/rodent|rat/.test(s)) return 'rodent';
  if (/bed ?bug/.test(s)) return 'bedbug';
  if (/mosquito|fly|fogg/.test(s)) return 'space';
  if (/fumigat/.test(s)) return 'fumigation';
  if (/cockroach/.test(s)) return 'gel';
  return 'spray';
};

/**
 * Returns { kind, waitHours, before: [], after: [] } for a service and household flags.
 * waitHours = suggested time to stay out of treated rooms (0 = no need to leave).
 */
export const safeHomePlan = (service, household) => {
  const h = household || {};
  const vulnerable = h.kids || h.pregnant || h.asthma || h.elderly;
  const kind = kindOf(service);
  const base = { gel: 0, rodent: 0, termite: 2, spray: 2, bedbug: 3, space: 2, fumigation: null }[kind];
  const waitHours = base == null ? null : base === 0 ? 0 : base + (vulnerable || h.pets ? 1 : 0);

  const before = [
    'Clear kitchen counters and store food, utensils and toothbrushes in closed cupboards.',
    'Keep the areas where you see pests easy to reach — the technician needs the corners and gaps.',
  ];
  const after = [];

  if (kind === 'gel') {
    before.push('No need to leave home: gel is placed as small dots inside cracks and hinges, away from reach.');
    after.push('Do not wipe or spray cleaners on the gel dots for at least 2 weeks.', 'Avoid using any cockroach spray at home — it repels them away from the gel.');
  }
  if (kind === 'spray' || kind === 'bedbug' || kind === 'space') {
    before.push('Plan to stay out of the rooms being treated for the suggested time below.', 'Open windows of the rooms to be treated if possible.');
    after.push('Ventilate the treated rooms well before going back in.', 'Wipe kitchen platforms and dining tables with a damp cloth before cooking or eating.');
  }
  if (kind === 'bedbug') {
    before.push('Remove bedsheets, pillow covers and curtains; wash them in hot water if possible.', 'Keep mattresses and sofas accessible — seams and joints are treated.');
    after.push('Use fresh, washed linen. A follow-up visit is usually needed to catch newly hatched bugs.');
  }
  if (kind === 'termite') {
    before.push('Clear the wall edges and floor joints where drilling will be done.', 'Expect drilling noise and some dust for a few hours.');
    after.push('Keep children and pets away from drill holes until they are sealed.', 'Do not wash the treated floor edges with heavy water for a few days.');
  }
  if (kind === 'rodent') {
    before.push('Note where you hear or see rats — ceilings, store rooms, kitchen.');
    after.push('Never move or open bait stations. Keep them out of reach of children and pets.', 'Tell us if you notice a smell — we remove dead rodents on request.');
  }
  if (kind === 'fumigation') {
    before.push('Fumigation needs the area to be sealed and vacated; our team will give you a written timing plan.');
    after.push('Re-enter only after our team confirms the area has been aired and cleared.');
  }

  if (h.kids) {
    before.push('Plan where the children will stay during the treatment, away from the treated rooms.');
    after.push('Keep toys off the floor of treated rooms until they are wiped and dry; mop floors before crawling play.');
  }
  if (h.pets) {
    before.push('Move pets, their bowls, beds and food to an untreated room or outside during the visit.');
    after.push('Let pets back only after surfaces are dry; keep them away from gel dots and bait stations.');
  }
  if (h.aquarium) before.push('Cover the aquarium with a cloth or cling wrap and switch off the air pump during spraying.');
  if (h.pregnant || h.asthma || h.elderly) {
    before.push('Tell the technician on arrival — we use lower-odour options and spot treatment where possible.');
    after.push('Ventilate longer than usual before the family member returns to the treated rooms.');
  }
  after.push('Keep your treatment certificate safe — it carries your warranty and a QR code for verification.');

  return { kind, waitHours, before, after };
};

export const kindLabel = {
  gel: 'Gel baiting — no need to vacate',
  rodent: 'Bait stations — no need to vacate',
  termite: 'Drill & fill anti-termite',
  spray: 'Residual spray',
  bedbug: 'Bed bug treatment',
  space: 'Space spray / fogging',
  fumigation: 'Fumigation',
};
