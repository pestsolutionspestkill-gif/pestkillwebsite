/* ------------------------------------------------------------------
   Shop landing pages: one per pest (/shop/pest/<key>) and per brand
   (/shop/brand/<key>). Written for PCO buyers searching things like
   "termite chemical price" or "Envu products list". Product lists come
   from the live catalogue; active ingredients named here are ones we stock.
------------------------------------------------------------------- */

export const PEST_LANDING = {
  termite: {
    name: 'Termite Control Chemicals', short: 'Termiticides', hi: 'दीमक की दवा',
    intro: 'Professional termiticides for pre-construction soil treatment, post-construction drill-and-fill and wood treatment. Choose by active ingredient, formulation and pack size, and order online as a verified PCO.',
    hinglish: 'Deemak (termite) ke liye professional chemicals: naye construction mein foundation aur plinth ki mitti ka treatment, purani building mein drill-fill, aur plywood/lakdi ka treatment. Har product ki MRP, pack size aur active ingredient yahan saaf likhe hain.',
    ingredients: ['Imidacloprid 30.5% SC', 'Bifenthrin 2.5% EC', 'Chlorpyrifos 20% EC', 'Fipronil 2.92% EC'],
    faqs: [
      { q: 'Which termite chemical is best for pre-construction treatment?', a: 'Imidacloprid 30.5% SC, Bifenthrin 2.5% EC and Chlorpyrifos 20% EC are the most used soil termiticides. The right choice depends on the site, the soil and the warranty you give; always apply at the label rate.' },
      { q: 'Can I buy termite chemicals online without a licence?', a: 'No. Professional termiticides are sold only to licensed pest control operators. Open a PCO account, upload your licence, and you can order once it is verified.' },
      { q: 'Do you supply large packs for builders and projects?', a: 'Yes. 5 L, 20 L and larger packs are available for many termiticides. Use the bulk order button for a trade price on WhatsApp.' },
    ],
  },
  cockroach: {
    name: 'Cockroach Gel & Sprays', short: 'Cockroach control', hi: 'कॉकरोच की दवा',
    intro: 'Cockroach gel baits, residual sprays, dusts and baits from leading brands for kitchens, restaurants, hotels and homes.',
    hinglish: 'Kitchen aur restaurant ke cockroach ke liye gel bait sabse kaam ka hai: bina smell ke, cracks aur hinges mein chhote dots. Saath mein residual spray aur dusting powder bhi milte hain.',
    ingredients: ['Fipronil 0.05% Gel', 'Imidacloprid 2.15% Gel', 'Propoxur 20% EC', 'Alphacypermethrin 10% SC', 'Clothianidin 50% WG'],
    faqs: [
      { q: 'Which cockroach gel works best?', a: 'Fipronil 0.05% and Imidacloprid 2.15% gels are the most widely used. Rotating between active ingredients every few months helps avoid bait aversion.' },
      { q: 'Can gel and spray be used together?', a: 'Avoid spraying directly over gel placements, as it can stop cockroaches feeding on the bait. Use sprays in other areas, as directed on the labels.' },
      { q: 'Do you have small packs for home service jobs?', a: 'Yes. Gels come in syringes and small packs suitable for 1BHK to 3BHK jobs, and larger packs for commercial contracts.' },
    ],
  },
  mosquito: {
    name: 'Mosquito Larvicides & Fogging Chemicals', short: 'Mosquito control', hi: 'मच्छर की दवा',
    intro: 'Larvicides for breeding sites, residual sprays for walls, and ULV / thermal fogging solutions for adult mosquito control in societies, campuses and public health programmes.',
    hinglish: 'Machhar control mein larvae (ruka paani, naali, tank) aur adult machhar (fogging, residual spray) dono ka treatment zaroori hai. Larvicide, IGR, WP aur ULV fogging chemicals sab yahan milte hain.',
    ingredients: ['Temephos 50% EC', 'Deltamethrin 1.25% ULV', 'Lambda-cyhalothrin 10% WP', 'Novaluron 10% EC', 'Diflubenzuron 25% WP'],
    faqs: [
      { q: 'What is the difference between a larvicide and an adulticide?', a: 'A larvicide (e.g. Temephos, Novaluron, Diflubenzuron) treats water where larvae grow. An adulticide (e.g. Deltamethrin ULV for fogging, Lambda-cyhalothrin WP for walls) kills flying mosquitoes. Lasting control uses both.' },
      { q: 'Which chemical is used for fogging?', a: 'ULV formulations such as Deltamethrin 1.25% ULV are made for thermal and cold fogging machines. Follow the label for dilution and machine settings.' },
      { q: 'Do you supply municipal and society contracts?', a: 'Yes. Larger packs and regular supply can be arranged; ask for a trade price on WhatsApp.' },
    ],
  },
  rodent: {
    name: 'Rodenticides & Rat Baits', short: 'Rodent control', hi: 'चूहे मारने की दवा',
    intro: 'Ready baits, wax blocks and concentrates for professional rodent control in homes, godowns, food plants and warehouses.',
    hinglish: 'Chuhon ke liye ready bait, wax block aur concentrate. Godown aur factory ke liye tamper-proof bait stations ke saath use karein, taaki bachche aur jaanwar safe rahein.',
    ingredients: ['Bromadiolone 0.005% RB', 'Brodifacoum 0.005% wax block', 'Zinc phosphide 2% RB'],
    faqs: [
      { q: 'Which rat bait is best for godowns and warehouses?', a: 'Anticoagulant baits such as Bromadiolone and Brodifacoum blocks, placed in numbered bait stations, are standard for audit-ready programmes.' },
      { q: 'Are rodenticides safe around children and pets?', a: 'Only when used in tamper-resistant bait stations and placed as the label directs. Keep records of every station for audits.' },
      { q: 'Do you sell bait stations?', a: 'Ask us on WhatsApp for bait stations and monitoring supplies along with your bait order.' },
    ],
  },
  fly: {
    name: 'Fly Control Chemicals & Baits', short: 'Fly control', hi: 'मक्खी की दवा',
    intro: 'Fly baits, residual sprays and growth regulators for kitchens, dairies, poultry, food units and waste areas.',
    hinglish: 'Makkhi ke liye bait, residual spray aur maggot control (IGR). Dairy, kitchen aur kachra ghar ke aas-paas sabse zyada kaam aate hain.',
    ingredients: ['Propoxur 2% Bait', 'Diflubenzuron 20% + Deltamethrin 2% SC', 'Clothianidin 50% WG'],
    faqs: [
      { q: 'How do I control flies at a dairy or food unit?', a: 'Combine sanitation with baits near breeding and resting spots, residual sprays on resting surfaces and a larvicide or IGR where maggots develop.' },
      { q: 'Do you have products for maggots?', a: 'Yes. Diflubenzuron-based products act as insect growth regulators against fly larvae. Use as directed on the label.' },
    ],
  },
  ant: {
    name: 'Ant Gel & Ant Control Products', short: 'Ant control', hi: 'चींटी की दवा',
    intro: 'Ant gel baits and residual treatments that reach the colony, for homes, hotels and food areas.',
    hinglish: 'Cheentiyon ke liye gel bait sabse achha hai: worker cheentiyan gel ko colony tak le jaati hain aur poori colony khatam hoti hai.',
    ingredients: ['Imidacloprid 0.03% Gel', 'Fipronil 2.92% EC'],
    faqs: [
      { q: 'Why use ant gel instead of spray?', a: 'Spray kills only the ants you see. Gel bait is carried back to the nest and controls the colony.' },
    ],
  },
  bedbug: {
    name: 'Bed Bug Treatment Chemicals', short: 'Bed bug control', hi: 'खटमल की दवा',
    intro: 'Residual sprays and combination products for bed bug treatment in homes, hostels, PGs and hotels.',
    hinglish: 'Khatmal ke liye residual spray: bed ke joints, mattress ki silaai, sofa aur cracks mein. Do visit (follow-up ke saath) se sabse achha result milta hai.',
    ingredients: ['Beta-cyfluthrin 2.45% SC', 'Cyfluthrin 5% EW', 'Imidacloprid 21% + Beta-cyfluthrin 10.5% SC'],
    faqs: [
      { q: 'How many treatments do bed bugs need?', a: 'Usually two: the first treatment and a follow-up after about two weeks to catch newly hatched bugs, as guided by the product label.' },
      { q: 'Which products suit hostels and hotels?', a: 'Low-odour SC and EW formulations are popular for occupied rooms. Rotate active ingredients if you see resistance.' },
    ],
  },
};

export const BRAND_LANDING = {
  envu: { name: 'Envu', blurb: 'Envu is the environmental science company formed from Bayer\'s Environmental Science business. Its public health range includes Premise, Agenda, Maxforce, K-Othrine and Solfac.' },
  syngenta: { name: 'Syngenta', blurb: 'Syngenta\'s professional pest management range includes Demand, Icon and other products for termites, mosquitoes and general pests.' },
  heranba: { name: 'Heranba', blurb: 'Heranba Industries is an Indian manufacturer with a wide public health range: termiticides, cockroach gels, fogging and mosquito control products.' },
  arbuda: { name: 'Arbuda', blurb: 'Arbuda\'s professional range covers termiticides, cockroach gels and baits, mosquito control and rodenticides.' },
  kalyani: { name: 'Kalyani', blurb: 'Kalyani\'s public health range covers termiticides, mosquito larvicides and adulticides, cockroach gels and rodenticides.' },
};

export const landingApiPath = (kind, key) => (kind === 'pest'
  ? `/products?pest=${key}`
  : `/products?brand=${encodeURIComponent(BRAND_LANDING[key]?.name || key)}`);

export const SHOP_LANDING_PATHS = [
  ...Object.keys(PEST_LANDING).map((k) => `/shop/pest/${k}`),
  ...Object.keys(BRAND_LANDING).map((k) => `/shop/brand/${k}`),
];
