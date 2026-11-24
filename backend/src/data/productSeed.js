// PCO shop catalogue. Loaded into the database on start-up whenever CATALOG_VERSION increases:
// new products are added, and products the owner has never edited are refreshed.
// Names, active ingredients and pack sizes come from the brands' official India pages
// (in.envu.com, heranba.com, arbudaagrochemicals.com); Syngenta from retail listings.
// Version 5 adds products seen on other Indian PCO distributor listings (names, active ingredients,
// pack sizes and labelled MRPs only). Packs not listed there show as "Standard pack" until the owner edits them.
// MRPs: only figures found on public listings are filled in, each marked unverified so the owner
// checks it against the printed pack in Admin → Products. null = "Price on request".
// `img` names a pack photo in ./product-images/<img>.webp (official brand images).
export const CATALOG_VERSION = 5;

// Seeded products that were replaced by corrected entries; hidden if never edited.
export const RETIRED_SLUGS = ['arbuda-lambdar-10-wp-625-g'];

const ENVU = 'Envu';
const SYN = 'Syngenta';
const HER = 'Heranba';
const ARB = 'Arbuda';
const KAL = 'Kalyani';

// [brand, name, technical, formulation, category, packStyle, usage, img, packs: [[size, mrp?, mrpNote?], …]]
const LINES = [
  // ---------------- Envu ----------------
  [ENVU, 'Premise SC', 'Imidacloprid 30.5% SC', 'SC', 'Termite Control', 'bottle', 'Pre- and post-construction anti-termite treatment.', 'envu-premise-sc',
    [['250 ml', 1245, 'PestoBazaar product page (labelled MRP)'], ['1 L', 4630, 'PestoBazaar product page (labelled MRP)'], ['5 L']]],
  [ENVU, 'Agenda 25 EC', 'Fipronil 2.5% EC', 'EC', 'Termite Control', 'bottle', 'Pre- and post-construction treatment against subterranean termites.', 'envu-agenda-25-ec',
    [['100 ml', 320, 'PestoBazaar product page (labelled MRP)'], ['500 ml'], ['5 L']]],
  [ENVU, 'Maxforce Forte', 'Fipronil 0.05% Gel', 'Gel', 'Cockroach Control', 'gel', 'German, American and brown-banded cockroaches.', 'envu-maxforce-forte', [['30 g']]],
  [ENVU, 'Maxforce Fusion', 'Cockroach gel bait', 'Gel', 'Cockroach Control', 'gel', 'American and German cockroaches.', 'envu-maxforce-fusion', [['30 g']]],
  [ENVU, 'Maxforce Quantum', 'Imidacloprid 0.03% Gel', 'Gel', 'Ant Control', 'gel', 'Ant bait for black, house, meat and white-footed ants.', 'envu-maxforce-quantum', [['30 g']]],
  [ENVU, 'Temprid SC', 'Dual-action residual SC', 'SC', 'General Pest Control', 'bottle', 'Bed bugs, cockroaches and houseflies.', 'envu-temprid-sc',
    [['50 ml', 380, 'PestoBazaar product page (labelled MRP)'], ['500 ml']]],
  [ENVU, 'Responsar SC', 'Beta-cyfluthrin 2.45% SC', 'SC', 'General Pest Control', 'bottle', 'Houseflies, cockroaches and mosquitoes.', 'envu-responsar-sc', [['1 L']]],
  [ENVU, 'Solfac EW', 'Cyfluthrin 5% EW', 'EW', 'General Pest Control', 'bottle', 'Cockroaches, houseflies and Aedes, Culex, Anopheles mosquitoes.', 'envu-solfac-ew', [['100 ml'], ['1 L', 2920, 'PestoBazaar product page (labelled MRP; size per SKU)']]],
  [ENVU, 'Solfac WP', 'Cyfluthrin 10% WP', 'WP', 'Mosquito Control', 'sachet', 'Indoor residual spray for mosquitoes, houseflies and cockroaches.', 'envu-solfac-wp', [['20 g'], ['5 kg']]],
  [ENVU, 'K-Othrine Flow', 'Deltamethrin 2.5% SC', 'SC', 'General Pest Control', 'bottle', 'Cockroaches, houseflies and mosquitoes; bed-net treatment.', 'envu-k-othrine-flow', [['1 L']]],
  [ENVU, 'K-Othrine WG', 'Deltamethrin WG', 'WG', 'General Pest Control', 'sachet', 'Mosquitoes and cockroaches.', 'envu-k-othrine-wg', [['2 g sachet']]],
  [ENVU, 'Brigata SC', 'Residual SC', 'SC', 'General Pest Control', 'bottle', 'Cockroaches, houseflies and mosquitoes.', null, [['1 L']]],
  [ENVU, 'Brigata RTU', 'Deltamethrin 0.05% + Allethrin 0.04% RTU', 'RTU', 'General Pest Control', 'jerrycan', 'Ready-to-use spray for mosquitoes, houseflies and cockroaches.', null, [['5 L']]],
  [ENVU, 'Transport EX', 'Propoxur 20% EC', 'EC', 'General Pest Control', 'bottle', 'Bed bugs, cockroaches and houseflies.', null, [['100 ml'], ['1 L', 1930, 'PestoBazaar product page (labelled MRP)'], ['5 L']]],
  [ENVU, 'Coveze', 'Clothianidin 50% WG', 'WG', 'General Pest Control', 'sachet', 'Cockroaches, bed bugs and houseflies.', null, [['6 g sachet', 210, 'bharatpest.in product page (reference MRP)']]],
  [ENVU, 'Aqua K-Othrine', 'Water-based fogging concentrate', 'EW', 'Mosquito Control', 'bottle', 'Space spray (thermal, ULV, cold fogging) for adult mosquitoes.', null, [['1 L']]],
  [ENVU, 'Kingfog ULV', 'Deltamethrin 1.25% ULV', 'ULV', 'Mosquito Control', 'bottle', 'Thermal and ULV fogging for Anopheles, Culex and Aedes mosquitoes.', 'envu-kingfog-ulv', [['Pack']]],
  [ENVU, 'Bistar WP', 'Wettable powder for IRS', 'WP', 'Mosquito Control', 'sachet', 'Indoor residual spray against adult Aedes, Anopheles and Culex.', null, [['63 g']]],
  [ENVU, 'Baraki', 'Pyriproxyfen granules (IGR)', 'GR', 'Mosquito Control', 'tub', 'Mosquito larvae.', 'envu-baraki', [['500 g']]],
  [ENVU, 'Bi-Larv 25 WP', 'Diflubenzuron 25% WP', 'WP', 'Mosquito Control', 'sachet', 'Mosquito larvae and housefly maggots.', 'envu-bi-larv-25-wp', [['Pack']]],
  [ENVU, 'Quick Bayt', 'Fly bait 0.5%', 'Bait', 'Fly Control', 'tub', 'Paint-on bait for houseflies.', 'envu-quick-bayt', [['Pack']]],
  [ENVU, 'Racumin Sure', 'Bromadiolone 0.005% wax block', 'Block', 'Rodent Control', 'box', 'Ready-to-use wax blocks for rats and mice.', 'envu-racumin-sure', [['Pack']]],
  [ENVU, 'K-Obiol', 'Wettable powder for stored grain', 'WP', 'Stored Product Pests', 'box', 'Beetles, weevils and moths in stored grain.', 'envu-k-obiol', [['1 kg']]],

  // ---------------- Syngenta ----------------
  [SYN, 'Icon 10 CS', 'Lambda-cyhalothrin 10% CS', 'CS', 'General Pest Control', 'bottle', 'Indoor residual spray for mosquitoes, flies and crawling insects.', null,
    [['100 ml', 510, 'Amazon.in listing (labelled M.R.P.)'], ['500 ml', 2100, 'Amazon.in and PestoBazaar (labelled MRP)']]],
  [SYN, 'Icon 10 WP', 'Lambda-cyhalothrin 10% WP', 'WP', 'General Pest Control', 'sachet', 'Mosquitoes, cockroaches and houseflies.', null, [['Pack']]],
  [SYN, 'Demand 2.5 CS', 'Lambda-cyhalothrin 2.5% CS', 'CS', 'General Pest Control', 'bottle', 'Residual spray for crawling and flying insects.', null, [['100 ml', 270, 'Amazon.in listing (labelled M.R.P.)'], ['1 L', 1260, 'PestoBazaar product page (labelled MRP)']]],
  [SYN, 'Actellic 50 EC', 'Pirimiphos-methyl 50% EC', 'EC', 'Stored Product Pests', 'bottle', 'Stored-product and public health pests.', null, [['1 L']]],

  // ---------------- Heranba ----------------
  [HER, 'Deltaflow', 'Deltamethrin 2.5% SC', 'SC', 'General Pest Control', 'bottle', 'Mosquitoes, cockroaches, houseflies and spiders; bed-net treatment.', 'heranba-deltaflow', [['100 ml'], ['250 ml'], ['1 L', 1900, 'bharatpest.in product page (reference MRP)']]],
  [HER, 'Protex', 'Propoxur 20% EC', 'EC', 'General Pest Control', 'bottle', 'Bed bugs, cockroaches, fleas, ticks, ants, mosquitoes and flies.', 'heranba-protex', [['100 ml'], ['1 L'], ['5 L']]],
  [HER, 'Spectra', 'Alphacypermethrin 10% SC', 'SC', 'General Pest Control', 'bottle', 'Mosquitoes, houseflies and cockroaches.', 'heranba-spectra', [['100 ml'], ['1 L', 1050, 'bharatpest.in product page (reference MRP)']]],
  [HER, 'Baxstorm', 'Beta-cyfluthrin 2.45% SC', 'SC', 'General Pest Control', 'bottle', 'Houseflies, cockroaches and mosquitoes.', 'heranba-baxstorm', [['100 ml'], ['1 L']]],
  [HER, 'Bloom', 'Clothianidin 50% WG', 'WG', 'General Pest Control', 'sachet', 'Cockroaches, flies and bed bugs.', 'heranba-bloom', [['6 g pouch']]],
  [HER, 'Control X', 'Lambda-cyhalothrin 2.43% CS', 'CS', 'General Pest Control', 'bottle', 'Cockroaches, mosquitoes and flies.', 'heranba-control-x', [['100 ml'], ['1 L', 1750, 'bharatpest.in product page (reference MRP)']]],
  [HER, 'Fligon Plus', 'Diflubenzuron 20% + Deltamethrin 2% SC', 'SC', 'Fly Control', 'bottle', 'Housefly larvae and adults.', 'heranba-fligon-plus', [['500 ml'], ['1 L']]],
  [HER, 'Flumetrix', 'Cyfluthrin 5% EW', 'EW', 'General Pest Control', 'bottle', 'Cockroaches, houseflies and mosquitoes.', 'heranba-flumetrix', [['100 ml'], ['1 L']]],
  [HER, 'Stormguard', 'Imidacloprid 21% + Beta-cyfluthrin 10.5% SC', 'SC', 'General Pest Control', 'bottle', 'Bed bugs, cockroaches and houseflies.', 'heranba-stormguard', [['50 ml'], ['500 ml'], ['1 L']]],
  [HER, 'Heranil Gel', 'Fipronil 0.05% Gel', 'Gel', 'Cockroach Control', 'gel', 'American and German cockroaches.', 'heranba-heranil-gel', [['35 g']]],
  [HER, 'Mantra Gel', 'Imidacloprid 2.15% Gel', 'Gel', 'Cockroach Control', 'gel', 'German and American cockroaches.', 'heranba-mantra-gel', [['35 g']]],
  [HER, 'Roachgone', 'Fipronil 0.05% Gel', 'Gel', 'Cockroach Control', 'gel', 'German and American cockroaches.', 'heranba-roachgone', [['35 g', 390, 'Amazon.in listing (labelled M.R.P.)']]],
  [HER, 'Fluron', 'Diflubenzuron 25% WP', 'WP', 'Mosquito Control', 'sachet', 'Mosquito larvae and housefly maggots.', null, [['500 g']]],
  [HER, 'Fluron GR', 'Diflubenzuron 2% GR', 'GR', 'Mosquito Control', 'tub', 'Mosquito larvae in drains, wells and pools.', 'heranba-fluron', [['1 kg']]],
  [HER, 'Temper EC', 'Temephos 50% EC', 'EC', 'Mosquito Control', 'bottle', 'Mosquito larvicide.', 'heranba-temper-ec', [['1 L'], ['5 L']]],
  [HER, 'Temper SG', 'Temephos 1% SG', 'SG', 'Mosquito Control', 'tub', 'Mosquito larvicide for clean to polluted water.', 'heranba-temper-sg', [['1 kg']]],
  [HER, 'Larvox', 'Pyriproxyfen 0.5% GR', 'GR', 'Mosquito Control', 'tub', 'Mosquito larvae (insect growth regulator).', 'heranba-larvox', [['500 g']]],
  [HER, 'Newron', 'Novaluron 10% EC', 'EC', 'Mosquito Control', 'bottle', 'Mosquito larvae (Aedes, Anopheles, Culex).', 'heranba-newron', [['1 L']]],
  [HER, 'Delfog', 'Deltamethrin 1.25% ULV', 'ULV', 'Mosquito Control', 'bottle', 'Thermal fogging / ULV space spray for adult mosquitoes.', 'heranba-delfog', [['50 ml'], ['1 L']]],
  [HER, 'Aquaflow', 'Deltamethrin 2% EW', 'EW', 'Mosquito Control', 'bottle', 'Space spray concentrate for adult mosquitoes.', 'heranba-aquaflow', [['1 L']]],
  [HER, 'Delthrin', 'Deltamethrin 2.5% WP', 'WP', 'Mosquito Control', 'box', 'Indoor residual spray for mosquitoes, flies and cockroaches.', 'heranba-delthrin', [['1 kg']]],
  [HER, 'Proton', 'Lambda-cyhalothrin 10% WP', 'WP', 'Mosquito Control', 'jerrycan', 'Indoor residual spray; water-soluble sachets.', 'heranba-proton', [['62.5 g × 160 sachets']]],
  [HER, 'Alpha Shakti', 'Alpha-cypermethrin 5% WP', 'WP', 'Mosquito Control', 'box', 'Indoor residual spray for adult mosquitoes.', 'heranba-alpha-shakti', [['1 kg']]],
  [HER, 'Strikon 10 CS', 'Lambda-cyhalothrin 9.7% CS', 'CS', 'Mosquito Control', 'bottle', 'Indoor residual spray for mosquitoes and household pests.', 'heranba-strikon-10-cs', [['500 ml'], ['1 L']]],
  [HER, 'Heraban-TC', 'Chlorpyriphos 20% EC', 'EC', 'Termite Control', 'bottle', 'Pre- and post-construction termiticide.', 'heranba-heraban-tc', [['250 ml'], ['1 L'], ['5 L']]],
  [HER, 'Mantra TC', 'Imidacloprid 30.5% SC', 'SC', 'Termite Control', 'bottle', 'Pre- and post-construction termiticide.', 'heranba-mantra-tc', [['250 ml'], ['1 L'], ['5 L']]],
  [HER, 'Termifinn-TC', 'Bifenthrin 2.5% EC', 'EC', 'Termite Control', 'bottle', 'Termites and wood borers.', 'heranba-termifinn-tc', [['1 L'], ['5 L']]],
  [HER, 'Reprove', 'Fipronil 2.92% EC', 'EC', 'Termite Control', 'bottle', 'Termites and soil-dwelling insects.', 'heranba-reprove', [['100 ml'], ['500 ml'], ['1 L'], ['5 L']]],
  [HER, 'Rat Kill', 'Bromadiolone 0.005% cake', 'Cake', 'Rodent Control', 'box', 'Single-dose anticoagulant for field and house rats.', 'heranba-rat-kill', [['25 g'], ['100 g']]],

  // ---------------- Arbuda ----------------
  [ARB, 'Termiquit', 'Imidacloprid 30.5% SC', 'SC', 'Termite Control', 'bottle', 'Pre- and post-construction termite treatment.', 'arbuda-termiquit',
    [['250 ml', 900, 'PestoBazaar product page (labelled MRP)'], ['1 L', 3200, 'PestoBazaar product page (labelled MRP)'], ['5 L', 15500, 'PestoBazaar product page (labelled MRP)']]],
  [ARB, 'Termi-Secure', 'Bifenthrin 2.5% EC', 'EC', 'Termite Control', 'bottle', 'Termites and wood borers.', 'arbuda-termi-secure', [['100 ml'], ['1 L'], ['5 L']]],
  [ARB, 'Termaout', 'Fipronil 2.92% EC', 'EC', 'Termite Control', 'bottle', 'Termites and wood borers.', 'arbuda-termaout', [['100 ml'], ['500 ml'], ['5 L']]],
  [ARB, 'Arban TC', 'Chlorpyriphos 20% EC', 'EC', 'Termite Control', 'bottle', 'Termites in buildings and wood borers in wood.', 'arbuda-arban-tc',
    [['100 ml'], ['1 L', 650, 'PestoBazaar product page (labelled MRP)'], ['5 L']]],
  [ARB, 'Arban RTU', 'Chlorpyriphos 2% RTU', 'RTU', 'Termite Control', 'bottle', 'Ready-to-use wood guard against termites and borers.', 'arbuda-arban-rtu', [['250 ml'], ['1 L'], ['5 L']]],
  [ARB, 'Agressa', 'Imidacloprid 21% + Beta-cyfluthrin 10.5% SC', 'SC', 'General Pest Control', 'bottle', 'Bed bugs, cockroaches and houseflies.', 'arbuda-agressa', [['100 ml'], ['250 ml'], ['1 L', 4900, 'PestoBazaar product page (labelled MRP; SKU 1 L)']]],
  [ARB, 'Barricade', 'Lambda-cyhalothrin 2.43% CS', 'CS', 'General Pest Control', 'bottle', 'Mosquitoes, cockroaches and houseflies.', 'arbuda-barricade', [['1 L']]],
  [ARB, 'Invader', 'Beta-cyfluthrin 2.45% SC', 'SC', 'General Pest Control', 'bottle', 'Mosquitoes, cockroaches and houseflies.', 'arbuda-invader', [['1 L']]],
  [ARB, 'Mosquil', 'Deltamethrin 2.5% SC', 'SC', 'General Pest Control', 'bottle', 'Mosquitoes, cockroaches and houseflies; bed-net treatment.', 'arbuda-mosquil', [['100 ml'], ['250 ml'], ['1 L']]],
  [ARB, 'Roachnil', 'Alphacypermethrin 10% SC', 'SC', 'General Pest Control', 'bottle', 'Cockroaches, mosquitoes and flies.', 'arbuda-roachnil',
    [['100 ml'], ['250 ml'], ['1 L', 1050, 'PestoBazaar product page (labelled MRP)']]],
  [ARB, 'Flyquit', 'Propoxur 20% EC', 'EC', 'General Pest Control', 'bottle', 'Flies, mosquitoes, cockroaches, ants and bed bugs.', 'arbuda-flyquit',
    [['100 ml'], ['1 L', 2800, 'PestoBazaar product page (labelled MRP)'], ['5 L']]],
  [ARB, 'Pyrethra', 'Pyrethrins 2% EC (botanical)', 'EC', 'General Pest Control', 'bottle', 'Mosquitoes, cockroaches, bed bugs, flies, ants and silverfish.', 'arbuda-pyrethra', [['1 L'], ['5 L']]],
  [ARB, 'Lambdar-10 WP', 'Lambda-cyhalothrin 10% WP', 'WP', 'General Pest Control', 'sachet', 'Water-soluble pouch for residual spraying against cockroaches, mosquitoes and flies.', 'arbuda-lambdar-10-wp',
    [['62.5 g', 225, 'PestoBazaar product page (labelled MRP)']]],
  [ARB, 'Rid-O-Pest', 'Herbal insect spray', 'Herbal', 'General Pest Control', 'bottle', 'Ants, cockroaches, bed bugs, mosquitoes, lizards and flies.', 'arbuda-rid-o-pest', [['250 ml'], ['1 L'], ['5 L']]],
  [ARB, 'Roachbait Gel', 'Fipronil 0.05% Gel', 'Gel', 'Cockroach Control', 'gel', 'American and German cockroaches.', 'arbuda-roachbait-gel', [['35 g', 1050, 'PestoBazaar product page (labelled MRP)']]],
  [ARB, 'Bait-O-Roach Gel', 'Imidacloprid 2.15% Gel', 'Gel', 'Cockroach Control', 'gel', 'American and German cockroaches.', 'arbuda-bait-o-roach-gel',
    [['35 g', 650, 'PestoBazaar product page (labelled MRP)']]],
  [ARB, 'Roach Away', 'Fipronil 0.05% Gel', 'Gel', 'Cockroach Control', 'gel', 'Cockroaches.', 'arbuda-roach-away', [['20 g'], ['40 g'], ['80 g']]],
  [ARB, 'Roach Jail', 'Fipronil 0.05% Gel', 'Gel', 'Cockroach Control', 'gel', 'Cockroaches.', 'arbuda-roach-jail', [['20 g']]],
  [ARB, 'Roach Tech', 'Fipronil 0.05% Gel', 'Gel', 'Cockroach Control', 'gel', 'American and German cockroaches.', null, [['35 g']]],
  [ARB, 'Cockroach Chalk', 'Cypermethrin 1% chalk', 'Chalk', 'Cockroach Control', 'box', 'Cockroaches.', 'arbuda-cockroach-chalk', [['12 pcs dangler']]],
  [ARB, 'Dustx', 'Cypermethrin 0.25% DP', 'DP', 'Cockroach Control', 'tub', 'Dusting powder for cockroaches, ants, bed bugs and crawling insects.', 'arbuda-dustx',
    [['100 g'], ['1 kg × 2', 200, 'PestoBazaar product page (labelled MRP)']]],
  [ARB, 'Fly Bait', 'Propoxur 2% bait', 'Bait', 'Fly Control', 'tub', 'Flies and cockroaches.', null, [['1 kg', 1000, 'PestoBazaar product page (labelled MRP)']]],
  [ARB, 'Armiphos', 'Temephos 50% EC', 'EC', 'Mosquito Control', 'bottle', 'Mosquito larvae in stagnant water.', 'arbuda-armiphos', [['1 L'], ['5 L']]],
  [ARB, 'Deltafog', 'Deltamethrin 1.25% ULV', 'ULV', 'Mosquito Control', 'bottle', 'Thermal or ULV fogging for adult mosquitoes.', 'arbuda-deltafog', [['1 L']]],
  [ARB, 'Rat Bait', 'Zinc phosphide 2% RB', 'RB', 'Rodent Control', 'box', 'Rats, mice and field rodents.', 'arbuda-rat-bait',
    [['1 kg', 1000, 'PestoBazaar product page (labelled MRP)']]],
  [ARB, 'Run Rat', 'Bromadiolone 0.005% RB', 'RB', 'Rodent Control', 'box', 'Anticoagulant bait for rats and mice.', 'arbuda-run-rat', [['25 g'], ['100 g']]],
  [ARB, 'Run Rat Plus', 'Zinc phosphide 1% RB', 'RB', 'Rodent Control', 'sachet', 'Powder bait for rats and mice.', 'arbuda-run-rat-plus', [['15 g'], ['35 g']]],
  [ARB, 'Rodol', 'Herbal rodenticide cake', 'Herbal', 'Rodent Control', 'box', 'Rats and mice.', 'arbuda-rodol', [['100 g']]],
  [ARB, 'Armala', 'Malathion 50% EC', 'EC', 'Mosquito Control', 'bottle', 'Adult mosquitoes and flies; public health spraying.', null, [['1 L'], ['5 L'], ['20 L']]],
  [ARB, 'Fly Jack', 'UV light insect trap (electric)', 'Device', 'Equipment', 'box', 'Flying insects such as houseflies and mosquitoes indoors.', null, [['1 unit']]],

  // ---------------- Additions (version 5) ----------------
  [ENVU, 'Biflex TC', 'Bifenthrin 2.5% EC', 'EC', 'Termite Control', 'bottle', 'Pre- and post-construction anti-termite treatment.', null, [['1 L', 780, 'bharatpest.in product page (reference MRP)'], ['5 L'], ['20 L']]],
  [ENVU, 'Durmet TC', 'Chlorpyrifos 20% EC', 'EC', 'Termite Control', 'bottle', 'Pre- and post-construction anti-termite treatment.', null, [['1 L', 555, 'bharatpest.in product page (reference MRP)'], ['5 L'], ['20 L'], ['200 L']]],
  [SYN, 'Evactri 2.5 EC', 'Bifenthrin 2.5% EC', 'EC', 'Termite Control', 'jerrycan', 'Anti-termite soil treatment for buildings.', null, [['20 L'], ['200 L']]],
  [SYN, 'Zevictra TC', 'Imidacloprid 30.5% SC', 'SC', 'Termite Control', 'bottle', 'Pre- and post-construction anti-termite treatment.', null, [['250 ml'], ['1 L', 4410, 'bharatpest.in product page (reference MRP)'], ['5 L']]],
  [SYN, 'Exsectra 3 EC', 'Fipronil 2.92% EC', 'EC', 'Termite Control', 'bottle', 'Termite control in buildings and wood.', null, [['100 ml'], ['1 L']]],
  [SYN, 'Acrenzel WDG', 'Clothianidin 50% WG', 'WG', 'General Pest Control', 'sachet', 'Cockroaches, flies and bed bugs.', null, [['6 g', 210, 'bharatpest.in product page (reference MRP)']]],
  [SYN, 'Acugard 10 EC', 'Novaluron 10% EC (IGR)', 'EC', 'Mosquito Control', 'bottle', 'Insect growth regulator for mosquito larvae.', null, [['Standard pack']]],
  [SYN, 'Klerat Waxblock', 'Brodifacoum 0.005% wax block', 'Bait', 'Rodent Control', 'box', 'Rats and mice; weather-resistant bait blocks.', null, [['100 g']]],
  [HER, 'Cypra', 'Cypermethrin 10% EC', 'EC', 'General Pest Control', 'bottle', 'Cockroaches, flies, mosquitoes and crawling insects.', null, [['Standard pack']]],
  [HER, 'Cypra Plus', 'Cypermethrin 25% EC', 'EC', 'General Pest Control', 'bottle', 'Cockroaches, flies, mosquitoes and crawling insects.', null, [['Standard pack']]],
  [HER, 'Jayam', 'Lambda-cyhalothrin 5% EC', 'EC', 'General Pest Control', 'bottle', 'Mosquitoes and general crawling and flying insects.', null, [['Standard pack']]],
  [HER, 'Jayam Plus', 'Lambda-cyhalothrin 4.9% CS', 'CS', 'General Pest Control', 'bottle', 'Mosquitoes and general crawling and flying insects.', null, [['Standard pack']]],

  // ---------------- Kalyani ----------------
  [KAL, 'Armoss', 'Deltamethrin 2.5% + d-trans Allethrin 2% EC', 'EC', 'General Pest Control', 'bottle', 'Flies, bed bugs and general insects.', null, [['Standard pack']]],
  [KAL, 'Delphier', 'Deltamethrin 2.5% WP', 'WP', 'Mosquito Control', 'sachet', 'Indoor residual spray for mosquitoes and bed bugs.', null, [['Standard pack']]],
  [KAL, 'Aesther+', 'Lambda-cyhalothrin 9.7% CS', 'CS', 'General Pest Control', 'bottle', 'Mosquitoes and general insects.', null, [['Standard pack']]],
  [KAL, 'Aesther', 'Lambda-cyhalothrin 2.43% CS', 'CS', 'General Pest Control', 'bottle', 'General crawling and flying insects.', null, [['Standard pack']]],
  [KAL, 'Lamier 10', 'Lambda-cyhalothrin 10% WP', 'WP', 'Mosquito Control', 'sachet', 'Indoor residual spray for mosquitoes.', null, [['Standard pack']]],
  [KAL, 'Remover', 'Alphacypermethrin 10% SC', 'SC', 'General Pest Control', 'bottle', 'Cockroaches, bed bugs and general insects.', null, [['Standard pack']]],
  [KAL, 'Riddle', 'Malathion 50% EC', 'EC', 'Mosquito Control', 'bottle', 'Mosquitoes and general insects.', null, [['Standard pack']]],
  [KAL, 'Bithrin 100', 'Bifenthrin 10% WP', 'WP', 'Mosquito Control', 'sachet', 'Indoor residual spray for mosquitoes.', null, [['Standard pack']]],
  [KAL, 'Saphaer', 'Propoxur 20% EC', 'EC', 'Cockroach Control', 'bottle', 'Cockroaches and general insects.', null, [['Standard pack']]],
  [KAL, 'Saphaer Bait', 'Propoxur 2% bait', 'Bait', 'Cockroach Control', 'tub', 'Cockroach bait for homes and kitchens.', null, [['Standard pack']]],
  [KAL, 'Rapier', 'Deltamethrin 2.5% SC (flow)', 'SC', 'General Pest Control', 'bottle', 'Mosquitoes, bed bugs and general insects.', null, [['Standard pack']]],
  [KAL, 'Alphier', 'Alphacypermethrin 5% WP', 'WP', 'Mosquito Control', 'sachet', 'Indoor residual spray for mosquitoes and bed bugs.', null, [['Standard pack']]],
  [KAL, 'Falcon Gel', 'Fipronil 0.05% Gel', 'Gel', 'Cockroach Control', 'gel', 'Cockroaches in kitchens and homes.', null, [['Standard pack']]],
  [KAL, 'Negate+', 'Fipronil 0.05% Gel', 'Gel', 'Cockroach Control', 'gel', 'Cockroaches in kitchens and homes.', null, [['Standard pack']]],
  [KAL, 'Ridoff Dust', 'Cypermethrin 1% DP', 'DP', 'Cockroach Control', 'tub', 'Dusting powder for cockroaches and crawling insects.', null, [['Standard pack']]],
  [KAL, 'Mathier', 'Deltamethrin 2% EW', 'EW', 'Mosquito Control', 'bottle', 'Space spraying for mosquitoes; bed bugs.', null, [['Standard pack']]],
  [KAL, 'Smoker', 'Deltamethrin 1.25% ULV', 'ULV', 'Mosquito Control', 'bottle', 'Thermal or ULV fogging for adult mosquitoes.', null, [['Standard pack']]],
  [KAL, 'XFOG', 'Pyrethrum 2% extract', 'Extract', 'Mosquito Control', 'bottle', 'Fogging for mosquitoes and flying insects.', null, [['Standard pack']]],
  [KAL, 'WhiteOff 50', 'Chlorpyrifos 50% EC', 'EC', 'Termite Control', 'bottle', 'Anti-termite treatment.', null, [['Standard pack']]],
  [KAL, 'WhiteOff', 'Chlorpyriphos 20% EC', 'EC', 'Termite Control', 'bottle', 'Pre- and post-construction anti-termite treatment.', null, [['Standard pack']]],
  [KAL, 'WhiteOff RTU', 'Chlorpyriphos 2% RTU', 'RTU', 'Termite Control', 'bottle', 'Ready-to-use spot treatment for termites in homes.', null, [['Standard pack']]],
  [KAL, 'Ozier', 'Imidacloprid 30.5% SC', 'SC', 'Termite Control', 'bottle', 'Pre- and post-construction anti-termite treatment.', null, [['Standard pack']]],
  [KAL, 'Bithrin 25', 'Bifenthrin 2.5% EC', 'EC', 'Termite Control', 'bottle', 'Anti-termite treatment.', null, [['Standard pack']]],
  [KAL, 'Pexter', 'Fipronil 2.92% EC', 'EC', 'Termite Control', 'bottle', 'Anti-termite treatment.', null, [['Standard pack']]],
  [KAL, 'Novakal', 'Novaluron 10% EC (IGR)', 'EC', 'Mosquito Control', 'bottle', 'Insect growth regulator for mosquito larvae.', null, [['Standard pack']]],
  [KAL, 'Tamier', 'Temephos 50% EC', 'EC', 'Mosquito Control', 'bottle', 'Mosquito larvae in stagnant water.', null, [['Standard pack']]],
  [KAL, 'Tamier GR', 'Temephos 1% GR', 'GR', 'Mosquito Control', 'tub', 'Granules for mosquito larvae in stagnant water.', null, [['Standard pack']]],
  [KAL, 'Haxer', 'Pyriproxyfen 0.5% GR (IGR)', 'GR', 'Mosquito Control', 'tub', 'Insect growth regulator granules for mosquito larvae.', null, [['Standard pack']]],
  [KAL, 'Zinphos', 'Zinc phosphide 80% powder', 'Powder', 'Rodent Control', 'tub', 'Rats and field rodents (bait preparation by trained operators).', null, [['Standard pack']]],
  [KAL, 'Zinphos RB', 'Zinc phosphide 2% RB', 'RB', 'Rodent Control', 'box', 'Ready bait for rats and mice.', null, [['Standard pack']]],
  [KAL, 'Kalrat CB', 'Bromadiolone 0.25% CB', 'CB', 'Rodent Control', 'bottle', 'Concentrate for preparing anticoagulant rat bait.', null, [['Standard pack']]],
  [KAL, 'Kalrat RB', 'Bromadiolone 0.005% RB', 'RB', 'Rodent Control', 'box', 'Ready anticoagulant bait for rats and mice.', null, [['Standard pack']]],
  [KAL, 'Kalder', 'Silicone super-spreader (adjuvant)', 'Adjuvant', 'Adjuvants', 'bottle', 'Improves spreading and coverage of spray solutions.', null, [['Standard pack']]],
];

// Labelled MRPs from another distributor listing, used only where we have no MRP yet.
const REFERENCE_MRP = {
  'Heranba|Protex|1 L': 2100, 'Heranba|Baxstorm|1 L': 1000, 'Heranba|Fligon Plus|1 L': 3800, 'Heranba|Stormguard|500 ml': 2550,
  'Heranba|Mantra Gel|35 g': 430, 'Heranba|Temper EC|1 L': 2500, 'Heranba|Delfog|1 L': 2350, 'Heranba|Aquaflow|1 L': 5400,
  'Heranba|Strikon 10 CS|1 L': 3850, 'Heranba|Heraban-TC|1 L': 800, 'Heranba|Mantra TC|1 L': 3200, 'Heranba|Termifinn-TC|1 L': 850,
  'Heranba|Reprove|500 ml': 925,
};

export const PRODUCT_SEED = LINES.flatMap(([brand, name, technical, formulation, category, packStyle, usage, img, packs]) => packs.map(([packSize, mrp = null, mrpNote = null]) => {
  const ref = mrp == null ? REFERENCE_MRP[`${brand}|${name}|${packSize}`] : undefined;
  return {
    brand, name, technical, formulation, category, packStyle, usage, img, packSize,
    mrp: ref ?? mrp, mrpNote: ref ? 'bharatpest.in product page (reference MRP)' : mrpNote,
  };
}));
