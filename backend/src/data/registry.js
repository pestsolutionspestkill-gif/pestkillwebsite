// Seed data for the licence, standards and reference-price registers.
// Loaded once (new rows only); everything is editable in the admin console afterwards.

/* ---------- Business licences (numbers exactly as supplied by the owner) ----------
   Issuing authority and validity are left empty: they are added in the admin console
   together with the licence copy, and shown on the website only once verified. */
export const LICENCES = [
  { key: 'pco', title: 'Pest Control Licence', number: 'PCO/Jaipur/DD/2025-26/68', activity: 'Pest management services', sort: 1 },
  { key: 'sale', title: 'Pesticide Sale Licence', number: 'SL/Jaipur/DD/2025-26/63', activity: 'Sale of pesticides', sort: 2 },
];

/* ---------- Technical standards ----------
   Checked on 2026-11-24. The official BIS portals (standards.bis.gov.in) did not return standard
   details to automated access, so the facts below come from scanned copies of the standards
   (archive.org, mirrored by public.resource.org). Current status, reaffirmation and amendments
   are NOT confirmed and must be checked on the BIS portal. */
const CHECKED = '2026-11-24';
export const STANDARDS = [
  {
    code: 'IS 6313 (Part 1) : 1981', title: 'Code of practice for anti-termite measures in buildings — Part 1: Constructional measures',
    edition: 'First Revision (1981)', amendment_status: 'Not confirmed. The foreword refers to Amendment No. 1 of the earlier version.',
    scope: 'Covers anti-termite constructional measures for the control of subterranean termites in buildings.',
    source_url: 'https://archive.org/details/gov.in.is.6313.1.1981',
    source_note: 'Scanned copy of the standard (archive.org / public.resource.org). Current status not confirmed on the BIS portal.',
    verification_status: 'archived_copy', verified_on: CHECKED, applies_to: 'Building design and construction details (not chemical treatment).', display: 1, sort: 1,
  },
  {
    code: 'IS 6313 (Part 2) : 2001', title: 'Code of practice for anti-termite measures in buildings — Part 2: Pre-constructional chemical treatment measures',
    edition: 'Second Revision (December 2001)', amendment_status: 'None listed in the copy checked; later amendments or revisions not confirmed.',
    scope: 'Gives recommendations for the chemical treatment of soils for the protection of buildings from attack by subterranean termites.',
    source_url: 'https://archive.org/details/gov.in.is.6313.2.2001',
    source_note: 'Scanned copy of the standard (archive.org / public.resource.org). Whether a newer edition supersedes it has not been confirmed.',
    verification_status: 'archived_copy', verified_on: CHECKED, applies_to: 'Termite pre-construction soil treatment.', display: 1, sort: 2,
  },
  {
    code: 'IS 6313 (Part 3) : 2001', title: 'Code of practice for anti-termite measures in buildings — Part 3: Treatment for existing buildings',
    edition: 'Second Revision (December 2001)', amendment_status: 'None listed in the copy checked; later amendments or revisions not confirmed.',
    scope: 'Covers measures for the eradication and control of subterranean termites in existing buildings using chemicals.',
    source_url: 'https://archive.org/details/gov.in.is.6313.3.2001',
    source_note: 'Scanned copy of the standard (archive.org / public.resource.org). Whether a newer edition supersedes it has not been confirmed.',
    verification_status: 'archived_copy', verified_on: CHECKED, applies_to: 'Termite treatment of existing buildings.', display: 1, sort: 3,
  },
  {
    code: 'IS 6313 (Part 2) : 2022', title: 'Pre-constructional chemical treatment measures (2022 edition, as referred to in the owner brief)',
    edition: '2022 (not confirmed)', amendment_status: 'Not confirmed',
    scope: 'Not confirmed. No accessible official or archived source was found for a 2022 edition.',
    source_url: 'https://standards.bis.gov.in/', source_note: 'Check on the BIS standards portal before relying on this edition.',
    verification_status: 'not_confirmed', verified_on: CHECKED, applies_to: 'Termite pre-construction soil treatment.', display: 0, sort: 4,
  },
  {
    code: 'IS 6313 (Part 3) : 2022', title: 'Treatment for existing buildings (2022 edition, as referred to in the owner brief)',
    edition: '2022 (not confirmed)', amendment_status: 'Not confirmed',
    scope: 'Not confirmed. No accessible official or archived source was found for a 2022 edition.',
    source_url: 'https://standards.bis.gov.in/', source_note: 'Check on the BIS standards portal before relying on this edition.',
    verification_status: 'not_confirmed', verified_on: CHECKED, applies_to: 'Termite treatment of existing buildings.', display: 0, sort: 5,
  },
];

/* ---------- Reference prices from bharatpest.in (checked 2026-11-24) ----------
   price = selling price displayed; mrp = struck-through MRP displayed. For the second batch only the
   MRP was recorded. "match" names our product and pack; a row is "matched" only when brand, name and
   pack size agree exactly, otherwise it goes to manual review. */
const BP = 'https://bharatpest.in/product/';
const r = (brand, name, pack, mrp, price, slug, match, note) => ({ brand, name, pack, mrp, price, url: BP + slug, match, note });
const ENQ = 'Price on enquiry on the reference site';
const NOT_SHOWN = 'No price shown on the reference site';
const MRP_ONLY = 'Only the MRP was recorded; the sale price was not recorded at the check';

export const REFERENCE_PRICES = [
  r('Envu', 'Agenda 25 EC', '100 ml', null, 320, 'envu-agenda-25-ec', ['Agenda 25 EC', '100 ml'], 'Price shown for the 100 ml pack; MRP not shown'),
  r('Envu', 'Premise SC', '1 L', 4630, 3900, 'envu-premise-sc', ['Premise SC', '1 L']),
  r('Envu', 'Biflex TC', '1 L', 780, 750, 'envu-biflex-tc', ['Biflex TC', '1 L']),
  r('Envu', 'Durmet TC', '1 L', 555, 500, 'envu-durmet-tc', ['Durmet TC', '1 L']),
  r('Envu', 'Transportex', '1 L', 1680, 1650, 'envu-transportex', null, 'Name differs from our "Transport EX" and the MRP differs from ours — check the pack'),
  r('Envu', 'Coveze WG', '6 g', 210, 200, 'envu-coveze-wg', ['Coveze', '6 g sachet']),
  r('Syngenta', 'Evactri 2.5 EC', null, null, null, 'syngenta-evactri-2-5-ec', null, ENQ),
  r('Syngenta', 'Demand 2.5 CS', '1 L', 1200, 1150, 'syngenta-demand-2-5-cs', ['Demand 2.5 CS', '1 L']),
  r('Syngenta', 'Icon 10 CS', '500 ml', 2100, 2000, 'syngenta-icon-10-cs', ['Icon 10 CS', '500 ml']),
  r('Syngenta', 'Icon 10 WP', '62.5 g', null, 260, 'syngenta-icon-10-wp', null, 'Our pack is listed as "Pack" — confirm the pack size'),
  r('Syngenta', 'Acugard 10 EC', null, null, null, 'syngenta-acugard-10-ec', null, ENQ),
  r('Syngenta', 'Acrenzel WDG', '6 g', 210, 195, 'syngenta-acrenzel-wdg', ['Acrenzel WDG', '6 g']),
  r('Syngenta', 'Exsectra 3 EC', '100 ml', null, 285, 'syngenta-exsectra-3-ec', ['Exsectra 3 EC', '100 ml'], 'Price shown for 100 ml; MRP not shown'),
  r('Syngenta', 'Zevictra TC', '1 L', 4410, 3500, 'syngenta-zevictra-tc', ['Zevictra TC', '1 L']),
  r('Syngenta', 'Klerat Waxblock', '100 g', null, 270, 'syngenta-klerat-waxblock', ['Klerat Waxblock', '100 g'], 'MRP not shown'),
  ...[['Rat Bait', 'arbuda-rat-bait'], ['Termiquit', 'arbuda-termiquit'], ['Termi-Secure', 'arbuda-termisecure'], ['Armiphos', 'arbuda-armiphos'],
    ['Roachbait Gel', 'arbuda-roachbait'], ['Mosquil', 'arbuda-mosquil'], ['Fly Bait', 'arbuda-flybait'], ['Fly Jack', 'arbuda-flyjack'],
    ['Deltafog', 'arbuda-deltafog'], ['Flyquit', 'arbuda-flyquit'], ['Roachnil', 'arbuda-roachnil'], ['Armala', 'arbuda-armala']]
    .map(([n, s]) => r('Arbuda', n, null, null, null, s, null, ENQ)),
  r('Heranba', 'Deltaflow', '1 L', 1900, 1750, 'heranba-deltaflow', ['Deltaflow', '1 L']),
  r('Heranba', 'Spectra', '1 L', 1050, 1000, 'heranba-spectra', ['Spectra', '1 L']),
  r('Heranba', 'Control X', '1 L', 1750, 1650, 'heranba-control-x', ['Control X', '1 L']),
  r('Heranba', 'Baxstorm', '1 L', 1000, null, 'heranba-beta-cyfluthrin-sc-name-to-confirm', ['Baxstorm', '1 L'], MRP_ONLY),
  r('Heranba', 'Stormguard', '500 ml', 2550, null, 'heranba-stormguard', ['Stormguard', '500 ml'], MRP_ONLY),
  r('Heranba', 'Flumetrix', null, null, null, 'heranba-flumetrix', null, NOT_SHOWN),
  r('Heranba', 'FLIGON', '1 L', 3800, null, 'heranba-diflubenzuron-deltamethrin-name-to-confirm', null, 'Name differs from our "Fligon Plus" — confirm it is the same product. ' + MRP_ONLY),
  r('Heranba', 'Bloom', '6 g', null, null, 'heranba-bloom', null, NOT_SHOWN),
  r('Heranba', 'Protex', '1 L', 2100, null, 'heranba-protex', ['Protex', '1 L'], MRP_ONLY),
  r('Heranba', 'Roachgone Gel', '35 g', 420, null, 'heranba-roachgone-gel', ['Roachgone', '35 g'], 'Reference MRP ₹420 differs from our MRP ₹390 — check the pack. ' + MRP_ONLY),
  r('Heranba', 'Mantra Gel', '35 g', 430, null, 'heranba-mantra-gel', ['Mantra Gel', '35 g'], MRP_ONLY),
  r('Heranba', 'Aquaflow', '1 L', 5400, null, 'heranba-aquaflow', ['Aquaflow', '1 L'], MRP_ONLY),
  r('Heranba', 'DELFOG', '1 L', 2350, null, 'heranba-deltamethrin-ulv-name-to-confirm', ['Delfog', '1 L'], MRP_ONLY),
  r('Heranba', 'Strikon', '1 L', 3850, null, 'heranba-strikon', null, 'Name differs from our "Strikon 10 CS" — confirm it is the same product. ' + MRP_ONLY),
  r('Heranba', 'Proton', '62.5 g', 360, null, 'heranba-proton', null, 'Our pack is "62.5 g × 160 sachets" (a case) — not the same pack. ' + MRP_ONLY),
  r('Heranba', 'Reprove', '500 ml', 925, null, 'heranba-reprove', ['Reprove', '500 ml'], MRP_ONLY),
  r('Heranba', 'Mantra TC', '1 L', 3200, null, 'heranba-mantra-tc', ['Mantra TC', '1 L'], MRP_ONLY),
  r('Heranba', 'Termifinn-TC', '1 L', 850, null, 'heranba-termifinn-tc', ['Termifinn-TC', '1 L'], MRP_ONLY),
  r('Heranba', 'Heraban-TC', '1 L', 800, null, 'heranba-heraban-tc', ['Heraban-TC', '1 L'], MRP_ONLY),
  r('Heranba', 'Temper EC', '1 L', 2500, null, 'heranba-temper-ec', ['Temper EC', '1 L'], MRP_ONLY),
  ...[['Fluron', 'heranba-fluron'], ['Fluron GR', 'heranba-fluron-gr'], ['Temper SG', 'heranba-temper-sg'], ['Rat Kill', 'heranba-rat-kill'],
    ['Cypra', 'heranba-cypra'], ['Cypra Plus', 'heranba-cypra-plus'], ['Jayam', 'heranba-jayam'], ['Jayam Plus', 'heranba-jayam-plus']]
    .map(([n, s]) => r('Heranba', n, null, null, null, s, null, NOT_SHOWN)),
  ...[['Armoss', 'armoss'], ['Delphier', 'delphier'], ['Aesther+', 'aesther'], ['Lamier 10', 'lamier-10'], ['Remover', 'remover'], ['Riddle', 'riddle'],
    ['Aesther', 'aesther-2'], ['Bithrin 100', 'bithrin-100'], ['Saphaer', 'saphaer'], ['Saphaer Bait', 'saphaer-bait'], ['Rapier', 'rapier'],
    ['Alphier', 'alphier'], ['Falcon Gel', 'falcon-gel'], ['Ridoff Dust', 'ridoff-dust'], ['Mathier', 'mathier'], ['Smoker', 'smoker'],
    ['WhiteOff 50', 'whiteoff-50'], ['Ozier', 'ozier'], ['Bithrin 25', 'bithrin-25'], ['Pexter', 'pexter'], ['WhiteOff', 'whiteoff'],
    ['Novakal', 'novakal'], ['Tamier GR', 'tamier-gr'], ['Haxer', 'haxer'], ['Tamier', 'tamier'], ['Zinphos', 'zinphos'], ['Zinphos RB', 'zinphos-rb'],
    ['Kalrat CB', 'kalrat-cb'], ['Kalrat RB', 'kalrat-rb'], ['WhiteOff RTU', 'whiteoff-rtu'], ['XFOG', 'xfog'], ['Negate+', 'negate'], ['Kalder', 'kalder']]
    .map(([n, s]) => r('Kalyani', n, null, null, null, `kalyani-${s}`, null, NOT_SHOWN)),
];
export const REFERENCE_CHECKED_ON = CHECKED;
export const REGISTRY_VERSION = 1;
