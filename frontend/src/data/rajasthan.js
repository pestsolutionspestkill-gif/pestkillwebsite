/* ------------------------------------------------------------------
   Rajasthan service areas: one entry per city page (/pest-control/<slug>).
   Each city carries its own local context so pages are genuinely useful,
   not copies with the name swapped. Region text is shared by nearby cities.
   To stop listing a city, delete its entry; links, sitemap and search update.
------------------------------------------------------------------- */

export const REGIONS = {
  dhundhar: {
    name: 'Dhundhar (Jaipur region)',
    climate: 'Hot, dry summers, a short July–September monsoon and cool winters.',
    peak: 'Termite swarms after the first monsoon rain; cockroaches and mosquitoes from June to October.',
    pests: [
      { slug: 'termites', why: 'Sandy-loam soil and new colonies around constructions keep termite pressure high all year.' },
      { slug: 'cockroaches', why: 'Shared drains in apartments and dense markets let cockroaches move between flats.' },
      { slug: 'mosquitoes', why: 'Desert coolers, water tanks and construction pits breed mosquitoes through the monsoon.' },
      { slug: 'rodents', why: 'Rodents follow grain and food stock in homes, godowns and shops.' },
    ],
  },
  marwar: {
    name: 'Marwar (Thar desert)',
    climate: 'Arid, with very hot summers, little rain and large day–night temperature swings.',
    peak: 'Termites are active all year in sandy soil; rodents rise after harvest; mosquitoes breed in stored water.',
    pests: [
      { slug: 'termites', why: 'Desert subterranean termites tunnel easily through sandy soil and attack wooden frames and furniture.' },
      { slug: 'rodents', why: 'Field rats and house mice move into homes and grain stores when fields dry out.' },
      { slug: 'mosquitoes', why: 'Underground water tanks (tankas), coolers and stored water are the main breeding sites.' },
      { slug: 'cockroaches', why: 'Kitchens and restaurants in the old city lanes see heavy cockroach activity in summer.' },
    ],
  },
  mewar: {
    name: 'Mewar (Aravalli hills and lakes)',
    climate: 'Milder summers, a good monsoon and humid lake-side areas.',
    peak: 'Mosquitoes from July to November; termites after the monsoon; bed bugs all year in guest houses.',
    pests: [
      { slug: 'mosquitoes', why: 'Lakes, ponds and monsoon run-off give mosquitoes plenty of standing water.' },
      { slug: 'termites', why: 'Humid soil after the monsoon and old woodwork in heritage buildings attract termites.' },
      { slug: 'bed-bugs', why: 'Hotels, homestays and hostels with a steady flow of travellers pick up bed bugs from luggage.' },
      { slug: 'cockroaches', why: 'Restaurant and hotel kitchens need regular cockroach programmes.' },
    ],
  },
  vagad: {
    name: 'Vagad (south Rajasthan)',
    climate: 'The wettest part of Rajasthan, with a long, humid monsoon.',
    peak: 'Mosquitoes, termites and cockroaches peak from June to October; termites stay active after the rains.',
    pests: [
      { slug: 'mosquitoes', why: 'Heavy monsoon rain and many water bodies keep mosquito breeding high.' },
      { slug: 'termites', why: 'Damp soil and humidity make termite attack on woodwork more likely.' },
      { slug: 'cockroaches', why: 'Humidity helps cockroaches breed faster in kitchens and drains.' },
      { slug: 'rodents', why: 'Rodents move into homes and stores during heavy rain.' },
    ],
  },
  hadoti: {
    name: 'Hadoti (Chambal region)',
    climate: 'More rain than most of Rajasthan, black cotton soil and a humid monsoon.',
    peak: 'Mosquitoes and cockroaches from June to October; termites after the monsoon; bed bugs all year in hostels.',
    pests: [
      { slug: 'mosquitoes', why: 'The Chambal, canals and monsoon water-logging create many breeding sites.' },
      { slug: 'bed-bugs', why: 'Hostels, PGs and shared rooms spread bed bugs from room to room.' },
      { slug: 'cockroaches', why: 'Mess kitchens and canteens need frequent cockroach control.' },
      { slug: 'termites', why: 'Moist black soil after the rains supports termite colonies under buildings.' },
    ],
  },
  shekhawati: {
    name: 'Shekhawati',
    climate: 'Semi-arid, with extreme summer heat and cold winters.',
    peak: 'Termites and wood borers all year in old woodwork; mosquitoes in the monsoon; rodents in winter.',
    pests: [
      { slug: 'termites', why: 'Old havelis with wooden beams, doors and jharokhas are at high risk of termite damage.' },
      { slug: 'rodents', why: 'Rodents shelter in old buildings and grain stores, especially in winter.' },
      { slug: 'cockroaches', why: 'Hostels, mess kitchens and shops see steady cockroach problems.' },
      { slug: 'mosquitoes', why: 'Water storage and coolers breed mosquitoes in the monsoon.' },
    ],
  },
  canal: {
    name: 'North-west canal belt',
    climate: 'Hot and dry, but canal irrigation brings farms, grain mandis and standing water.',
    peak: 'Rodents and stored-grain pests after each harvest; mosquitoes near canals from June to October.',
    pests: [
      { slug: 'rodents', why: 'Grain mandis, godowns and rice and wheat mills attract large rodent populations.' },
      { slug: 'mosquitoes', why: 'Canal seepage and irrigation channels create breeding sites close to homes.' },
      { slug: 'termites', why: 'Termites attack wooden frames and stored timber in sandy soil.' },
      { slug: 'flies', why: 'Dairies, mandis and food units need fly control.' },
    ],
  },
  braj: {
    name: 'Mewat and Braj (east Rajasthan)',
    climate: 'Hot summers, a moderate monsoon and foggy winters, close to Delhi NCR.',
    peak: 'Mosquitoes and flies from June to October; rodents and cockroaches in factories and godowns all year.',
    pests: [
      { slug: 'rodents', why: 'Factories, warehouses and grain stores need rodent bait-station programmes.' },
      { slug: 'mosquitoes', why: 'Wetlands, ponds and water-logging after rain breed mosquitoes.' },
      { slug: 'cockroaches', why: 'Canteens, hostels and homes see cockroaches through the warm months.' },
      { slug: 'termites', why: 'Termites damage woodwork and stored packaging in godowns.' },
    ],
  },
  ajmer: {
    name: 'Ajmer region',
    climate: 'Semi-arid, between the Aravalli hills, with hot summers and a short monsoon.',
    peak: 'Bed bugs all year in guest houses; termites after the monsoon; mosquitoes near lakes from July to October.',
    pests: [
      { slug: 'bed-bugs', why: 'Pilgrim guest houses, dharamshalas and hotels see bed bugs carried in by travellers.' },
      { slug: 'termites', why: 'Termites attack woodwork in older houses and new constructions alike.' },
      { slug: 'mosquitoes', why: 'Lakes and stored water breed mosquitoes in and after the monsoon.' },
      { slug: 'cockroaches', why: 'Food stalls, hotels and home kitchens need cockroach control.' },
    ],
  },
};

const c = (slug, name, hi, region, note, extra = {}) => ({ slug, name, hi, region, note, areas: [], nearby: [], ...extra });

export const CITIES = [
  c('jaipur', 'Jaipur', 'जयपुर', 'dhundhar', 'Our head office is in Vidhyadhar Nagar, Jaipur, so Jaipur homes and businesses get the quickest visit dates. Fast-growing colonies on the city edge mean new buildings need pre-construction termite treatment, while older walled-city homes and markets need regular cockroach and rodent control.', {
    areas: ['Vidhyadhar Nagar', 'Vaishali Nagar', 'Malviya Nagar', 'Mansarovar', 'Jagatpura', 'C-Scheme', 'Raja Park', 'Bani Park', 'Jhotwara', 'Sodala', 'Pratap Nagar', 'Sanganer', 'Tonk Road', 'Ajmer Road', 'Sitapura', 'Walled City'],
    nearby: ['dausa', 'tonk', 'sikar', 'ajmer'], hq: true,
  }),
  c('jodhpur', 'Jodhpur', 'जोधपुर', 'marwar', 'The Blue City sits on the edge of the Thar. Sandstone houses with wooden doors and frames, and sandy soil around new colonies, make termite treatment the most common job here, followed by mosquito control around stored water.', {
    areas: ['Sardarpura', 'Shastri Nagar', 'Ratanada', 'Paota', 'Chopasni Housing Board', 'Basni', 'Pal Road', 'Mandore'],
    nearby: ['pali', 'nagaur', 'barmer', 'jaisalmer'],
  }),
  c('udaipur', 'Udaipur', 'उदयपुर', 'mewar', 'The City of Lakes has hundreds of hotels, homestays and heritage properties. Lakeside humidity brings mosquitoes, heritage woodwork attracts termites, and a steady flow of tourists makes bed bug inspections important for hospitality.', {
    areas: ['Hiran Magri', 'Fatehpura', 'Sukher', 'Bhuwana', 'Pratap Nagar', 'Shobhagpura', 'Ambamata', 'Old City'],
    nearby: ['rajsamand', 'chittorgarh', 'dungarpur', 'pratapgarh'],
  }),
  c('kota', 'Kota', 'कोटा', 'hadoti', 'Kota\'s coaching hostels, PGs and mess kitchens house lakhs of students, so bed bugs and cockroaches move quickly between rooms. We run hostel programmes that treat whole floors at once and schedule follow-ups so problems do not return.', {
    areas: ['Talwandi', 'Vigyan Nagar', 'Mahaveer Nagar', 'Dadabari', 'Kunhari', 'Indra Vihar', 'Rajeev Gandhi Nagar', 'Landmark City'],
    nearby: ['bundi', 'baran', 'jhalawar', 'sawai-madhopur'],
  }),
  c('ajmer', 'Ajmer', 'अजमेर', 'ajmer', 'Ajmer and nearby Pushkar receive pilgrims and tourists all year, so guest houses, hotels and dharamshalas need regular bed bug and cockroach care. Homes around Ana Sagar also see mosquitoes after the monsoon.', {
    areas: ['Vaishali Nagar', 'Civil Lines', 'Adarsh Nagar', 'Pushkar Road', 'Madar', 'Dargah area'],
    nearby: ['kishangarh', 'beawar', 'jaipur', 'nagaur'],
  }),
  c('bikaner', 'Bikaner', 'बीकानेर', 'canal', 'Bikaner\'s bhujia, namkeen and papad units, grain godowns and wool stores need stored-product and rodent control that stands up to food-safety audits. Homes in the desert city deal mostly with termites and rodents.', {
    areas: ['Gangashahar', 'Jai Narayan Vyas Colony', 'Rani Bazar', 'Pawanpuri', 'Karni Nagar', 'Old City'],
    nearby: ['sri-ganganagar', 'churu', 'nagaur', 'hanumangarh'],
  }),
  c('alwar', 'Alwar', 'अलवर', 'braj', 'Alwar combines city homes with the industrial areas towards Delhi NCR. Factories and warehouses need rodent bait-station programmes and audit records, while homes near the Aravalli hills see mosquitoes and termites after the rains.', {
    nearby: ['bhiwadi', 'bharatpur', 'dausa', 'jaipur'],
  }),
  c('bharatpur', 'Bharatpur', 'भरतपुर', 'braj', 'Bharatpur\'s wetlands around Keoladeo make mosquito control a priority from the monsoon to winter. Mustard oil mills, grain stores and homes also need rodent and cockroach control.', {
    nearby: ['dholpur', 'karauli', 'alwar', 'dausa'],
  }),
  c('bhilwara', 'Bhilwara', 'भीलवाड़ा', 'mewar', 'Known as Rajasthan\'s textile city, Bhilwara has spinning mills, fabric warehouses and godowns where rodents and termites damage stock and packaging. Homes need termite and mosquito control after the monsoon.', {
    nearby: ['chittorgarh', 'ajmer', 'rajsamand', 'bundi'],
  }),
  c('sikar', 'Sikar', 'सीकर', 'shekhawati', 'Sikar has grown into a major coaching and education centre in Shekhawati, so hostels and PGs need bed bug and cockroach programmes, while older homes with wooden beams need termite protection.', {
    nearby: ['jhunjhunu', 'churu', 'jaipur', 'nagaur'],
  }),
  c('pali', 'Pali', 'पाली', 'marwar', 'Pali\'s textile dyeing and printing units store large amounts of fabric and cartons, which rodents and termites damage. Homes face desert termites and summer cockroaches.', {
    nearby: ['jodhpur', 'sirohi', 'jalore', 'rajsamand'],
  }),
  c('sri-ganganagar', 'Sri Ganganagar', 'श्रीगंगानगर', 'canal', 'Canal irrigation makes Sri Ganganagar one of Rajasthan\'s main grain and kinnow belts. Mandis, rice mills and cold stores need rodent and stored-grain pest control, and homes near canals need mosquito control.', {
    nearby: ['hanumangarh', 'bikaner'],
  }),
  c('hanumangarh', 'Hanumangarh', 'हनुमानगढ़', 'canal', 'Hanumangarh\'s farms, grain mandis and cotton godowns attract rodents after every harvest. Canal seepage near homes also brings mosquitoes in the monsoon.', {
    nearby: ['sri-ganganagar', 'churu', 'bikaner'],
  }),
  c('jhunjhunu', 'Jhunjhunu', 'झुंझुनूं', 'shekhawati', 'Jhunjhunu district is home to many of Shekhawati\'s painted havelis. Their carved wooden doors, beams and windows are easily damaged by termites and wood borers, so we treat woodwork carefully without harming old finishes.', {
    nearby: ['sikar', 'churu', 'alwar'],
  }),
  c('dungarpur', 'Dungarpur', 'डूंगरपुर', 'vagad', 'Dungarpur\'s humid monsoon and many lakes and ponds keep mosquito and termite activity high. Homes, schools and hostels benefit from treatment before the rains.', {
    nearby: ['banswara', 'udaipur'],
  }),
  c('banswara', 'Banswara', 'बांसवाड़ा', 'vagad', 'Banswara gets the most rain in Rajasthan, and the Mahi dam backwaters and islands keep the air humid. This makes mosquito, termite and cockroach control a regular need in homes and institutions.', {
    nearby: ['dungarpur', 'pratapgarh', 'udaipur'],
  }),
  c('chittorgarh', 'Chittorgarh', 'चित्तौड़गढ़', 'mewar', 'Chittorgarh has heritage sites, cement plants and growing residential colonies. Industrial sites need rodent and general pest programmes, and homes need termite and mosquito control after the monsoon.', {
    nearby: ['bhilwara', 'udaipur', 'pratapgarh', 'rajsamand'],
  }),
  c('rajsamand', 'Rajsamand', 'राजसमंद', 'mewar', 'Rajsamand and nearby Nathdwara see temple visitors, marble units and growing towns. Guest houses need bed bug care, and homes near Rajsamand lake see mosquitoes after the rains.', {
    nearby: ['udaipur', 'bhilwara', 'pali', 'chittorgarh'],
  }),
  c('nagaur', 'Nagaur', 'नागौर', 'marwar', 'Nagaur is a farming and cattle-trade district, with mandis and grain stores that attract rodents. Homes on sandy soil need termite protection.', {
    nearby: ['jodhpur', 'ajmer', 'bikaner', 'sikar'],
  }),
  c('churu', 'Churu', 'चूरू', 'shekhawati', 'Churu sees some of the hottest summers and coldest winters in India. Rodents move indoors in the cold months, and old havelis with wooden beams need termite care.', {
    nearby: ['jhunjhunu', 'sikar', 'bikaner', 'hanumangarh'],
  }),
  c('dausa', 'Dausa', 'दौसा', 'dhundhar', 'Dausa lies on the Jaipur–Agra highway, close to our Jaipur office. Homes, dhabas and highway hotels need cockroach, rodent and termite control.', {
    nearby: ['jaipur', 'alwar', 'karauli', 'sawai-madhopur'],
  }),
  c('karauli', 'Karauli', 'करौली', 'braj', 'Karauli is known for red sandstone and for pilgrims visiting Kaila Devi. Dharamshalas and guest houses need bed bug and cockroach care, and homes need termite protection.', {
    nearby: ['dholpur', 'sawai-madhopur', 'dausa', 'bharatpur'],
  }),
  c('dholpur', 'Dholpur', 'धौलपुर', 'braj', 'Dholpur sits on the Chambal, which brings humidity and mosquitoes after the monsoon. Homes and godowns need termite and rodent control.', {
    nearby: ['bharatpur', 'karauli'],
  }),
  c('bundi', 'Bundi', 'बूंदी', 'hadoti', 'Bundi\'s old town has stepwells, havelis and heritage stays. Stored water breeds mosquitoes, and old woodwork needs termite protection.', {
    nearby: ['kota', 'bhilwara', 'tonk'],
  }),
  c('jhalawar', 'Jhalawar', 'झालावाड़', 'hadoti', 'Jhalawar is one of the wettest parts of Hadoti, with orange orchards and rivers. Humid months bring mosquitoes, cockroaches and termites.', {
    nearby: ['kota', 'baran'],
  }),
  c('jalore', 'Jalore', 'जालौर', 'marwar', 'Jalore\'s granite industry and dry farming land mean homes and units face desert termites and rodents. Summer heat drives cockroaches into kitchens and drains.', {
    nearby: ['sirohi', 'barmer', 'pali'],
  }),
  c('sirohi', 'Sirohi', 'सिरोही', 'marwar', 'Sirohi district includes Mount Abu, Rajasthan\'s only hill station. Its hotels and homestays need bed bug and cockroach care, and the damp hill climate brings termites.', {
    nearby: ['jalore', 'pali', 'udaipur'],
  }),
  c('beawar', 'Beawar', 'ब्यावर', 'ajmer', 'Beawar is a trading and industrial town between Ajmer and Pali. Warehouses and shops need rodent and cockroach control, and homes need termite protection.', {
    nearby: ['ajmer', 'pali', 'kishangarh'],
  }),
  c('jaisalmer', 'Jaisalmer', 'जैसलमेर', 'marwar', 'The Golden City lives on tourism, with hotels, havelis and desert camps. Guest rooms need bed bug inspections, and sandstone buildings with wooden doors and frames need termite care.', {
    nearby: ['barmer', 'jodhpur'],
  }),
  c('barmer', 'Barmer', 'बाड़मेर', 'marwar', 'Barmer\'s oil and energy projects have brought new colonies, camps and offices. These need termite, rodent and general pest control in a hot desert climate.', {
    nearby: ['jaisalmer', 'jalore', 'jodhpur'],
  }),
  c('tonk', 'Tonk', 'टोंक', 'dhundhar', 'Tonk is close to Jaipur and the Bisalpur dam. Homes need termite and mosquito control, and old buildings in the city need rodent proofing.', {
    nearby: ['jaipur', 'sawai-madhopur', 'bundi', 'ajmer'],
  }),
  c('sawai-madhopur', 'Sawai Madhopur', 'सवाई माधोपुर', 'dhundhar', 'Resorts and hotels around Ranthambore need discreet pest programmes that do not disturb guests: bed bug checks, kitchen cockroach control and mosquito control in the gardens.', {
    nearby: ['tonk', 'karauli', 'kota', 'dausa'],
  }),
  c('baran', 'Baran', 'बारां', 'hadoti', 'Baran is a farming district with grain mandis and godowns that need rodent control. The humid Hadoti monsoon brings mosquitoes and termites to homes.', {
    nearby: ['kota', 'jhalawar'],
  }),
  c('pratapgarh', 'Pratapgarh', 'प्रतापगढ़', 'vagad', 'Pratapgarh\'s forests and humid monsoon bring mosquitoes, termites and other pests close to homes. Treatment before the rains works best.', {
    nearby: ['banswara', 'chittorgarh', 'udaipur'],
  }),
  c('bhiwadi', 'Bhiwadi', 'भिवाड़ी', 'braj', 'Bhiwadi\'s factories, warehouses and housing societies sit right next to Gurugram. Industrial units need audit-ready rodent and general pest programmes, and societies need mosquito and cockroach control.', {
    nearby: ['alwar'],
  }),
  c('kishangarh', 'Kishangarh', 'किशनगढ़', 'ajmer', 'Kishangarh is one of India\'s largest marble markets. Marble yards, warehouses and offices need rodent and general pest control, and homes need termite protection.', {
    nearby: ['ajmer', 'beawar', 'jaipur'],
  }),
];

export const getCity = (slug) => CITIES.find((x) => x.slug === slug);
export const cityPath = (slug) => `/pest-control/${slug}`;
// Old single-city URLs (/jaipur, /kota …) now redirect to /pest-control/<city>.
export const LEGACY_CITY_SLUGS = ['jaipur', 'jodhpur', 'udaipur', 'kota', 'ajmer', 'bikaner', 'alwar', 'bharatpur'];

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

// Questions shown on each city page. The same list feeds the FAQ structured data, so the
// markup always matches what visitors can read.
export const cityFaqs = (city, RATES) => {
  const home = `${inr(RATES.home['1BHK'])} for a 1BHK and ${inr(RATES.home['2BHK'])} for a 2BHK or 3BHK`;
  const where = city.areas.length ? `${city.areas.slice(0, 6).join(', ')} and every other part of ${city.name}` : `all of ${city.name}`;
  return [
    { q: `How much does pest control cost in ${city.name}?`,
      a: `Home pest control for cockroaches, bed bugs, ants, lizards and rodents starts at ${home}. Anti-termite treatment costs ₹${RATES.termitePost.min}–${RATES.termitePost.max} per sq.ft. for existing buildings and ₹${RATES.termitePre.min}–${RATES.termitePre.max} per sq.ft. before construction. The final price is confirmed after a free inspection.` },
    { q: `Do you provide termite (deemak) treatment in ${city.name}?`,
      a: `Yes. We offer pre-construction soil treatment, the porous pipe system for new buildings (₹${RATES.porousPipe.min}–${RATES.porousPipe.max} per sq.ft.) and drill-and-fill treatment for existing homes and offices in ${city.name}, with a written warranty.` },
    { q: `Which areas of ${city.name} do you cover?`,
      a: `We cover ${where}${city.nearby.length ? ', plus nearby cities' : ''}.` },
    { q: `How soon can a technician visit in ${city.name}?`,
      a: city.hq
        ? 'Our head office is in Vidhyadhar Nagar, Jaipur, so Jaipur visits are the quickest. Book online or call us and we confirm a date and time slot straight away.'
        : `Book online or call us and we confirm a visit date and time slot for ${city.name} when you book. Commercial sites can also request a scheduled annual programme.` },
    { q: 'Is the treatment safe for children and pets?',
      a: 'Yes, when the instructions are followed. Tell us about children, pets, elderly people or anyone with asthma when you book. You get a Safe Home plan with what to do before the visit and when it is safe to go back into treated rooms.' },
    { q: `Can pest control operators in ${city.name} buy chemicals from PestKill?`,
      a: `Yes. Licensed PCOs in ${city.name} can open a PCO account, upload their licence and order Envu, Syngenta, Heranba, Arbuda and Kalyani products online at MRP or trade price. Orders are dispatched from Jaipur, and any delivery charge is confirmed before dispatch.` },
  ];
};
