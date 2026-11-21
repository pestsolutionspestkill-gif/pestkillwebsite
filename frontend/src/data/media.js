// Every photo used on the site, with its source and licence.
// Unsplash photos: Unsplash License (free commercial use, no attribution required — credited anyway).
// CDC / USDA photos: U.S. Government works, public domain.

const unsplash = (by) => ({ credit: by, source: 'Unsplash', license: 'Unsplash License' });
const publicDomain = (by, source) => ({ credit: by, source, license: 'Public domain (U.S. Government)' });

export const media = {
  technician: { src: '/images/technician.jpg', alt: 'Professional pressure sprayer applying treatment', ...unsplash('MESTO Sprayers') },
  constructionSite: { src: '/images/construction-site.jpg', alt: 'Aerial view of a new house being built on open soil', ...unsplash('Iain') },
  foundation: { src: '/images/foundation.jpg', alt: 'Concrete foundation and plinth of a building under construction', ...unsplash('d c') },
};

export const pestMedia = {
  termites: { src: '/images/pests/termites.jpg', alt: 'Subterranean termite workers and soldiers', ...publicDomain('Scott Bauer', 'USDA Agricultural Research Service') },
  cockroaches: { src: '/images/pests/cockroaches.jpg', alt: 'American cockroach on a floor', ...unsplash('Cecep Rahmat') },
  rodents: { src: '/images/pests/rodents.jpg', alt: 'Roof rat peeking over a wooden beam', ...unsplash('Joshua J. Cotten') },
  'bed-bugs': { src: '/images/pests/bed-bugs.jpg', alt: 'Adult bed bug (Cimex lectularius) on human skin', ...publicDomain('Piotr Naskrecki', 'CDC Public Health Image Library') },
  mosquitoes: { src: '/images/pests/mosquitoes.jpg', alt: 'Aedes mosquito biting human skin', ...unsplash('NIAID') },
  flies: { src: '/images/pests/flies.jpg', alt: 'House flies on a white surface', ...unsplash('Nikoletta Bódis') },
  ants: { src: '/images/pests/ants.jpg', alt: 'Worker ant close-up', ...unsplash('Peter F. Wolf') },
  lizards: { src: '/images/pests/lizards.jpg', alt: 'House gecko resting on a window ledge', ...unsplash('Rishu Bhosale') },
  spiders: { src: '/images/pests/spiders.jpg', alt: 'Spider on its web near a window', ...unsplash('Julia Fiander') },
  pigeons: { src: '/images/pests/pigeons.jpg', alt: 'Pigeons perched on a balcony ledge', ...unsplash('Sojhal Mehtab') },
};

export const sectorMedia = {
  'food-processing': { src: '/images/sectors/food-processing.jpg', alt: 'Stainless steel commercial kitchen', ...unsplash('Ricardo Gomez Angel') },
  hospitality: { src: '/images/sectors/hospitality.jpg', alt: 'Hotel bedroom with garden view', ...unsplash('visualsofdana') },
  healthcare: { src: '/images/sectors/healthcare.jpg', alt: 'Clean hospital corridor', ...unsplash('Tasha Kostyuk') },
  pharmaceuticals: { src: '/images/sectors/pharmaceuticals.jpg', alt: 'Laboratory technician in protective gear', ...unsplash('CDC') },
  warehousing: { src: '/images/sectors/warehousing.jpg', alt: 'Warehouse aisle with high racking', ...unsplash('Lance Chang') },
  offices: { src: '/images/sectors/offices.jpg', alt: 'Modern office lounge', ...unsplash('insung yoon') },
  education: { src: '/images/sectors/education.jpg', alt: 'Empty classroom with desks and chalkboard', ...unsplash('Ivan Aleksic') },
  builders: { src: '/images/sectors/builders.jpg', alt: 'Residential apartment complex in India', ...unsplash('TSI') },
};

// Service slug → photo
export const serviceMedia = {
  'termite-control': pestMedia.termites,
  'cockroach-control': pestMedia.cockroaches,
  'rodent-control': pestMedia.rodents,
  'bed-bugs': pestMedia['bed-bugs'],
  'general-pest-control': pestMedia.ants,
  'mosquito-control': pestMedia.mosquitoes,
  'fly-control': pestMedia.flies,
  'lizard-control': pestMedia.lizards,
  'bird-control': pestMedia.pigeons,
  disinfection: media.technician,
  fumigation: sectorMedia.warehousing,
};

export const creditLine = (m) => `Photo: ${m.credit} / ${m.source}`;
