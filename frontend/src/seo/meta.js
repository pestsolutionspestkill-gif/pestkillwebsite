/* ------------------------------------------------------------------
   Search metadata for every public page: title, description, canonical
   path, robots and structured data (JSON-LD).
   Used in three places, so they always agree:
     • RouteSeo (browser) updates <head> on every navigation,
     • scripts/prerender.mjs writes it into the pre-rendered HTML,
     • the sitemap lists every path in PRERENDER_PATHS.
   Canonical URLs are written with the placeholder SITE_URL_TOKEN; the
   server swaps in the real domain (SITE_URL) when it sends the page.
------------------------------------------------------------------- */
import businessConfig from '../data/businessConfig';
import { services, pests, sectors, getService, getPest, getSector, RATES } from '../data/catalog';
import { extraServices } from '../data/extraServices';
import { CITIES, REGIONS, getCity, cityPath, cityFaqs } from '../data/rajasthan';
import { BLOG_INDEX, getBlogMeta } from '../data/blogIndex';
import { HOME_FAQS } from '../data/homeFaqs';
import { PEST_LANDING, BRAND_LANDING, landingApiPath, SHOP_LANDING_PATHS } from '../data/shopLanding';
import { pestMedia, serviceMedia, sectorMedia, media } from '../data/media';

export const SITE_URL_TOKEN = '__PK_SITE_URL__';
export const SITE_NAME = 'PestKill Pest Solutions';
const abs = (p) => `${SITE_URL_TOKEN}${p}`;
const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
const homeFrom = inr(RATES.home['1BHK']);
const termiteFrom = `₹${RATES.termitePost.min}/sq.ft`;
const DEFAULT_IMAGE = media.technician.src;

const clip = (s, n = 158) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(' ', n - 1))}…`);

/* ---------- Structured data ---------- */
const BUSINESS_ID = abs('/#business');
const phoneE164 = businessConfig.phoneNumber.replace(/[^0-9+]/g, '');

const business = () => ({
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'HomeAndConstructionBusiness'],
  '@id': BUSINESS_ID,
  name: businessConfig.businessName,
  alternateName: ['PestKill', 'Pest Kill Solutions'],
  description: 'Licensed pest control company in Jaipur serving all of Rajasthan: termite treatment, cockroach, bed bug, rodent and mosquito control for homes and businesses.',
  url: abs('/'),
  logo: abs('/images/brand/pestkill-emblem.png'),
  image: abs(DEFAULT_IMAGE),
  telephone: phoneE164,
  email: businessConfig.email,
  priceRange: `${homeFrom}+`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'F-52 Balaji Tower 1st, Vidhyadhar Nagar',
    addressLocality: 'Jaipur',
    addressRegion: 'Rajasthan',
    addressCountry: 'IN',
  },
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '09:00', closes: '19:00',
  }],
  areaServed: [{ '@type': 'State', name: 'Rajasthan' }, ...CITIES.map((c) => ({ '@type': 'City', name: c.name }))],
  founder: { '@type': 'Person', name: 'Prerit Mudgal' },
  knowsAbout: ['Termite control', 'Anti-termite treatment', 'Cockroach control', 'Bed bug treatment', 'Rodent control', 'Mosquito control', 'Fumigation', 'Integrated pest management'],
  ...(businessConfig.socialProfiles?.length ? { sameAs: businessConfig.socialProfiles } : {}),
});

const website = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': abs('/#website'),
  name: SITE_NAME,
  url: abs('/'),
  inLanguage: 'en-IN',
  publisher: { '@id': BUSINESS_ID },
});

const breadcrumb = (trail) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: 'Home', path: '/' }, ...trail].map((t, i) => ({
    '@type': 'ListItem', position: i + 1, name: t.name, item: abs(t.path),
  })),
});

const faqPage = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

const offerFor = (svc) => {
  const p = svc?.pricing;
  if (!p) return undefined;
  if (p.unit === 'bhk') {
    const v = Object.values(p.tiers);
    return { '@type': 'AggregateOffer', priceCurrency: 'INR', lowPrice: Math.min(...v), highPrice: Math.max(...v) };
  }
  return {
    '@type': 'Offer', priceCurrency: 'INR',
    priceSpecification: { '@type': 'UnitPriceSpecification', priceCurrency: 'INR', minPrice: p.min, maxPrice: p.max, unitText: 'per sq.ft.' },
  };
};

const serviceSchema = ({ name, description, path, svc, area }) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name,
  serviceType: svc?.name || name,
  description,
  url: abs(path),
  provider: { '@id': BUSINESS_ID },
  areaServed: area || { '@type': 'State', name: 'Rajasthan' },
  ...(offerFor(svc) ? { offers: offerFor(svc) } : {}),
});

/* ---------- Page table ---------- */
const svcPage = (slug, path, title, description) => {
  const svc = getService(slug);
  return {
    title, description, image: serviceMedia[slug]?.src,
    schema: [serviceSchema({ name: svc?.name || title, description, path, svc }), breadcrumb([{ name: 'Services', path: '/services' }, { name: svc?.short || title, path }])],
  };
};

const STATIC = {
  '/': {
    title: 'Pest Control in Jaipur & All Rajasthan | PestKill Pest Solutions',
    description: `Licensed pest control in Jaipur and all Rajasthan. Homes from ${homeFrom}, termite treatment from ${termiteFrom}. Free inspection, written warranty, photo proof.`,
    schema: [business(), website(), faqPage(HOME_FAQS)],
  },
  '/services': {
    title: 'Pest Control Services & Prices in Rajasthan | PestKill',
    description: `All pest control services with published prices: termite, porous pipe, cockroach, bed bug, rodent, mosquito, bird netting and fumigation. Homes from ${homeFrom}.`,
    crumbs: [{ name: 'Services', path: '/services' }],
  },
  '/services/anti-termite-piping': svcPage('anti-termite-piping', '/services/anti-termite-piping',
    'Anti-Termite Piping (Porous Pipe System) in Jaipur | PestKill',
    `Pre-construction porous pipe anti-termite system at ₹${RATES.porousPipe.min}–${RATES.porousPipe.max}/sq.ft. Pipes laid under the floor and refilled from outside, without drilling. Jaipur and all Rajasthan.`),
  '/termite-control': svcPage('termite-control', '/termite-control',
    'Termite Control & Deemak Treatment in Jaipur, Rajasthan | PestKill',
    `Anti-termite treatment for existing homes from ₹${RATES.termitePost.min}–${RATES.termitePost.max}/sq.ft. and pre-construction from ₹${RATES.termitePre.min}/sq.ft., with a written warranty. Free inspection across Rajasthan.`),
  '/cockroach-control': svcPage('cockroach-control', '/cockroach-control',
    'Cockroach Control in Jaipur & Rajasthan from ₹1,200 | PestKill',
    `Odourless gel and spray cockroach treatment for kitchens, homes, hotels and restaurants. 1BHK ${homeFrom}, 2BHK/3BHK ${inr(RATES.home['2BHK'])}, with warranty and photo proof.`),
  '/bed-bug-treatment': svcPage('bed-bugs', '/bed-bug-treatment',
    'Bed Bug Treatment in Jaipur & Rajasthan | Khatmal Control | PestKill',
    `Bed bug (khatmal) treatment for homes, hostels, PGs and hotels with a follow-up visit. Homes from ${homeFrom}. Free inspection, written warranty, Safe Home plan.`),
  '/rodent-control': svcPage('rodent-control', '/rodent-control',
    'Rodent & Rat Control in Jaipur & Rajasthan | PestKill',
    'Rat and mouse control with bait stations, trapping and proofing for homes, shops, godowns and factories. Audit-ready reports for food and pharma units.'),
  '/book': {
    title: 'Book Pest Control Online in Rajasthan | Instant Price | PestKill',
    description: `Book pest control in 60 seconds. Choose a service, see the starting price, pick a date and time slot. Homes from ${homeFrom}. Free inspection and written warranty.`,
    crumbs: [{ name: 'Book online', path: '/book' }],
  },
  '/pests': {
    title: 'Pest Library: Identify Common Pests in India | PestKill',
    description: 'How to identify termites, cockroaches, bed bugs, rodents, mosquitoes, flies, ants and more. Signs, health risks, prevention tips and the right treatment.',
    crumbs: [{ name: 'Pest library', path: '/pests' }],
  },
  '/pest-identifier': {
    title: 'Pest Identifier: Which Pest Is It? Free 30-Second Check | PestKill',
    description: 'Kaunsa keeda hai? Answer five quick questions to find out which pest you have, how serious it is and what it costs to treat. Free, no sign-up.',
    crumbs: [{ name: 'Pest identifier', path: '/pest-identifier' }],
    schema: [{
      '@context': 'https://schema.org', '@type': 'WebApplication', name: 'PestKill Pest Identifier',
      applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', url: abs('/pest-identifier'),
      offers: { '@type': 'Offer', price: 0, priceCurrency: 'INR' }, provider: { '@id': BUSINESS_ID },
    }],
  },
  '/business': {
    title: 'Commercial Pest Control in Rajasthan for Businesses | PestKill',
    description: 'Audit-ready pest control for food plants, hotels, hospitals, pharma, warehouses, offices, schools and builders. Annual contracts, service reports and certificates.',
    crumbs: [{ name: 'For business', path: '/business' }],
  },
  '/integrated-pest-management': {
    title: 'Integrated Pest Management (IPM) Programmes | PestKill',
    description: 'Integrated pest management for commercial sites: inspection, monitoring, proofing, targeted treatment and reporting that stands up to audits.',
    crumbs: [{ name: 'Integrated pest management', path: '/integrated-pest-management' }],
  },
  '/locations': {
    title: `Pest Control Across Rajasthan: ${CITIES.length} Cities | PestKill`,
    description: `Pest control in ${CITIES.slice(0, 6).map((c) => c.name).join(', ')} and every district of Rajasthan. Head office in Jaipur. Free inspection.`,
    crumbs: [{ name: 'Rajasthan', path: '/locations' }],
  },
  '/careers': {
    title: 'Careers: Pest Control Technician Jobs in Jaipur | PestKill',
    description: 'Join PestKill as a pest control technician, supervisor or sales executive in Jaipur and Rajasthan. Training, safety equipment and growth.',
    crumbs: [{ name: 'Careers', path: '/careers' }],
  },
  '/about': {
    title: 'About PestKill Pest Solutions, Jaipur | Founder Prerit Mudgal',
    description: 'PestKill Pest Solutions is a licensed pest control company in Jaipur, founded by Prerit Mudgal, serving homes, businesses and government projects across Rajasthan.',
    crumbs: [{ name: 'About', path: '/about' }],
  },
  '/contact': {
    title: 'Contact PestKill: Pest Control in Jaipur | Call or WhatsApp',
    description: `Call or WhatsApp ${businessConfig.phoneNumber} for pest control in Jaipur and Rajasthan. Office: Vidhyadhar Nagar, Jaipur. ${businessConfig.workingHours}.`,
    crumbs: [{ name: 'Contact', path: '/contact' }],
    schema: [business()],
  },
  '/blog': {
    title: 'Pest Control Tips & Guides for Indian Homes | PestKill Blog',
    description: 'Practical guides on termites, cockroaches, bed bugs, rodents and monsoon pests, plus pest control costs and prevention tips for homes and businesses.',
    crumbs: [{ name: 'Blog', path: '/blog' }],
  },
  '/shop': {
    title: 'PCO Shop: Professional Pest Control Products at MRP | PestKill',
    description: 'Licensed pest control operators can buy ENVU, Syngenta, Heranba, Arbuda and Kalyani professional products at MRP from our Jaipur distributor shop.',
    crumbs: [{ name: 'PCO shop', path: '/shop' }],
  },
  '/shop/dose-calculator': {
    title: 'Pesticide Dose Calculator for PCOs | PestKill Shop',
    description: 'Enter the area to treat and get the diluted solution and product quantity, worked out from the rate printed on each product label.',
    crumbs: [{ name: 'PCO shop', path: '/shop' }, { name: 'Dose calculator', path: '/shop/dose-calculator' }],
  },
  '/shop/library': {
    title: 'Datasheets, MSDS & Labels for Pest Control Products | PestKill',
    description: 'Download technical datasheets (TDS), safety data sheets (MSDS) and labels for Envu, Syngenta, Heranba, Arbuda and Kalyani products.',
    crumbs: [{ name: 'PCO shop', path: '/shop' }, { name: 'Downloads library', path: '/shop/library' }],
  },
  '/pco-account': {
    title: 'Open a PCO Buyer Account | PestKill Shop',
    description: 'Pest control operators can open a buyer account to order professional pest control products from PestKill, Jaipur.',
    crumbs: [{ name: 'PCO shop', path: '/shop' }, { name: 'Buyer account', path: '/pco-account' }],
  },
  '/verify': {
    title: 'Verify a PestKill Treatment Certificate',
    description: 'Check whether a PestKill pest control certificate is genuine. Enter the certificate number or scan the QR code on the certificate.',
    crumbs: [{ name: 'Verify a certificate', path: '/verify' }],
  },
};

// Pages that must not appear in search results (accounts, cart, staff tools, documents).
const PRIVATE = [/^\/login$/, /^\/register$/, /^\/forgot-password$/, /^\/cart$/, /^\/dashboard(\/|$)/, /^\/admin(\/|$)/, /^\/print\//, /^\/verify\/.+/];
const PRIVATE_TITLES = { '/login': 'Log in', '/register': 'Create an account', '/forgot-password': 'Reset your password', '/cart': 'Your cart' };

// Alternate URLs that show the same page as a canonical one.
export { REDIRECTS } from './redirects';

const dynamicPage = (path) => {
  let m;
  if ((m = /^\/pest-control\/([a-z-]+)$/.exec(path))) {
    const city = getCity(m[1]);
    if (!city) return null;
    const region = REGIONS[city.region];
    const top = region.pests.slice(0, 3).map((p) => getPest(p.slug)?.name.toLowerCase()).filter(Boolean);
    const description = `Pest control in ${city.name} for ${top.slice(0, 2).join(' and ')}. Homes from ${homeFrom}, termites from ${termiteFrom}. Free inspection and warranty. Call ${businessConfig.phoneNumber.replace('+91-', '')}.`;
    return {
      title: `Pest Control in ${city.name} | Termite & Cockroach | PestKill`,
      description,
      image: pestMedia[region.pests[0].slug]?.src,
      schema: [
        serviceSchema({ name: `Pest control in ${city.name}`, description, path, area: { '@type': 'City', name: city.name, containedInPlace: { '@type': 'State', name: 'Rajasthan' } } }),
        faqPage(cityFaqs(city, RATES)),
        breadcrumb([{ name: 'Rajasthan', path: '/locations' }, { name: city.name, path }]),
      ],
    };
  }
  if ((m = /^\/services\/([a-z-]+)$/.exec(path))) {
    const slug = m[1];
    const svc = getService(slug);
    if (!svc || svc.path !== path) return null;
    const extra = extraServices[slug];
    return svcPage(slug, path, `${extra?.name || svc.name} in Jaipur & Rajasthan | PestKill`, clip(`${extra?.desc || svc.summary} Free inspection and written service report across Rajasthan.`));
  }
  if ((m = /^\/pests\/([a-z-]+)$/.exec(path))) {
    const pest = getPest(m[1]);
    if (!pest) return null;
    return {
      title: `${pest.name}: Signs, Risks & How to Get Rid of Them | PestKill`,
      description: clip(`${pest.intro} Learn the signs, health risks and prevention tips.`),
      image: pestMedia[pest.slug]?.src,
      crumbs: [{ name: 'Pest library', path: '/pests' }, { name: pest.name, path }],
    };
  }
  if ((m = /^\/business\/([a-z-]+)$/.exec(path))) {
    const sector = getSector(m[1]);
    if (!sector) return null;
    return {
      title: `Pest Control for ${sector.name} in Rajasthan | PestKill`,
      description: clip(`${sector.intro} ${sector.compliance || ''}`.trim()),
      image: sectorMedia[sector.slug]?.src,
      crumbs: [{ name: 'For business', path: '/business' }, { name: sector.name, path }],
    };
  }
  if ((m = /^\/blog\/([a-z0-9-]+)$/.exec(path))) {
    const post = getBlogMeta(m[1]);
    if (!post) return null;
    const article = {
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: post.title, description: post.excerpt, datePublished: post.date, dateModified: post.date,
      articleSection: post.category, inLanguage: 'en-IN', mainEntityOfPage: abs(path),
      image: abs(DEFAULT_IMAGE),
      author: { '@type': 'Organization', name: 'PestKill Expert Team', url: abs('/about') },
      publisher: { '@id': BUSINESS_ID },
    };
    return {
      title: post.title.length > 50 ? post.title : `${post.title} | PestKill Blog`,
      description: clip(`${post.excerpt} Practical advice from PestKill's licensed pest control team in Jaipur.`), type: 'article',
      schema: [article, breadcrumb([{ name: 'Blog', path: '/blog' }, { name: post.title, path }])],
    };
  }
  if ((m = /^\/shop\/(pest|brand)\/([a-z]+)$/.exec(path))) {
    const [, kind, key] = m;
    const info = kind === 'pest' ? PEST_LANDING[key] : BRAND_LANDING[key];
    if (!info) return null;
    const label = kind === 'pest' ? info.name : `${info.name} Pest Control Products`;
    const schema = [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: label, url: abs(path), isPartOf: { '@id': abs('/#website') }, about: kind === 'pest' ? info.short : info.name, provider: { '@id': BUSINESS_ID } },
      breadcrumb([{ name: 'PCO shop', path: '/shop' }, { name: kind === 'pest' ? info.short : info.name, path }]),
    ];
    if (kind === 'pest' && info.faqs.length) schema.push(faqPage(info.faqs));
    return {
      title: kind === 'pest' ? `${info.name} Price List | Buy Online | PestKill` : `${info.name} Products Price List | PCO Shop | PestKill`,
      description: kind === 'pest'
        ? `${info.short} for licensed PCOs: ${info.ingredients.slice(0, 3).join(', ')} and more. MRP, pack sizes, TDS/MSDS and bulk price. Dispatched from Jaipur.`
        : `${info.name} professional pest control products with MRP and pack sizes. Genuine sealed packs for licensed PCOs, dispatched from Jaipur.`,
      schema, dynamic: 'shop-list', apiPath: landingApiPath(kind, key),
    };
  }
  if ((m = /^\/shop\/([a-z0-9-]+)$/.exec(path))) {
    // Product details come from the database; the server fills them in when it sends the page.
    return { title: 'Product | PestKill PCO Shop', description: STATIC['/shop'].description, dynamic: 'product', apiPath: `/products/${m[1]}` };
  }
  return null;
};

const normalise = (pathname) => {
  const p = (pathname || '/').split(/[?#]/)[0].replace(/\/{2,}/g, '/');
  return p.length > 1 ? p.replace(/\/+$/, '') : '/';
};

/**
 * Metadata for a path. Always returns an object; unknown paths get status 404 and noindex.
 * { path, title, description, image, type, noindex, status, schema[] }
 */
export const seoFor = (pathname) => {
  const path = normalise(pathname);
  if (PRIVATE.some((r) => r.test(path))) {
    const name = PRIVATE_TITLES[path] || (path.startsWith('/verify/') ? 'Certificate check' : path.startsWith('/admin') ? 'Staff console' : path.startsWith('/print') ? 'Document' : 'My account');
    return { path, title: `${name} | PestKill`, description: STATIC['/'].description, noindex: true, status: 200, schema: [] };
  }
  const page = STATIC[path] || dynamicPage(path);
  if (!page) {
    return { path, title: 'Page not found | PestKill', description: STATIC['/'].description, noindex: true, status: 404, schema: [] };
  }
  const schema = [...(page.schema || [])];
  if (page.crumbs && !schema.some((s) => s['@type'] === 'BreadcrumbList')) schema.push(breadcrumb(page.crumbs));
  return {
    path,
    // Keep titles short enough to show in full on Google; the brand suffix goes first.
    title: page.title.length > 65 ? page.title.replace(/ \| PestKill( Blog)?$/, '') : page.title,
    description: clip(page.description, 160),
    image: page.image || DEFAULT_IMAGE,
    type: page.type || 'website',
    noindex: false,
    status: 200,
    dynamic: page.dynamic,
    apiPath: page.apiPath,
    schema,
  };
};

/** Every indexable page that is pre-rendered at build time and listed in the sitemap. */
export const PRERENDER_PATHS = [
  ...Object.keys(STATIC),
  ...CITIES.map((c) => cityPath(c.slug)),
  ...services.filter((s) => s.path === `/services/${s.slug}` && !STATIC[s.path]).map((s) => s.path),
  ...pests.map((p) => `/pests/${p.slug}`),
  ...sectors.map((s) => `/business/${s.slug}`),
  ...BLOG_INDEX.map((p) => `/blog/${p.slug}`),
];

/** Database-backed pages rendered by the server on request (listed in the sitemap too). */
export const SERVER_RENDERED_PATHS = SHOP_LANDING_PATHS;

/** Pages the sitemap should rank higher. */
export const sitemapPriority = (path) => {
  if (path === '/') return '1.0';
  if (path.startsWith('/pest-control/') || ['/termite-control', '/cockroach-control', '/bed-bug-treatment', '/rodent-control', '/services/anti-termite-piping', '/book', '/locations'].includes(path)) return '0.9';
  if (path.startsWith('/services') || path.startsWith('/business') || path.startsWith('/shop/pest/') || path.startsWith('/shop/brand/')) return '0.8';
  return '0.6';
};

export const lastModFor = (path) => {
  const post = path.startsWith('/blog/') && getBlogMeta(path.slice(6));
  return post ? post.date : null;
};

