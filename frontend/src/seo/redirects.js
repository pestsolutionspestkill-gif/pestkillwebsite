// Old or duplicate URLs and where they now live. Used by the app router (client) and by the
// server, which answers them with a permanent (301) redirect. Kept tiny so the main bundle stays small.
const OLD_CITY_PAGES = ['jaipur', 'jodhpur', 'udaipur', 'kota', 'ajmer', 'bikaner', 'alwar', 'bharatpur'];

export const REDIRECTS = {
  '/anti-termite-piping': '/services/anti-termite-piping',
  '/services/termite-control': '/termite-control',
  '/services/cockroach-control': '/cockroach-control',
  '/services/rodent-control': '/rodent-control',
  '/services/bed-bugs': '/bed-bug-treatment',
  ...Object.fromEntries(OLD_CITY_PAGES.map((s) => [`/${s}`, `/pest-control/${s}`])),
};
