import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Tag, Bug, Briefcase, ArrowRight, HardHat, Ruler, Building2, Wrench, ChevronLeft } from 'lucide-react';
import { api } from '../lib/api';
import { PEST_OPTIONS } from '../lib/shop';
import { BRAND_LANDING } from '../data/shopLanding';
import businessConfig from '../data/businessConfig';
import './ExploreDrawer.css';

/*
  Floating "Select by" controls: brand, pest and professional role.
  Desktop: vertical tabs on the left edge. Phones: opened from the bottom bar (event "pk:explore").
  Brands and pest counts come from the live product catalogue.
*/
export const openExplore = (tab = 'brand') => window.dispatchEvent(new CustomEvent('pk:explore', { detail: tab }));

const TABS = [
  { key: 'brand', label: 'Select by brand', short: 'Brand', icon: Tag },
  { key: 'pest', label: 'Select by pest', short: 'Pest', icon: Bug },
  { key: 'role', label: 'I am a professional', short: 'Professional', icon: Briefcase },
];

const wa = (text) => `https://wa.me/${businessConfig.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;

const ROLES = [
  { key: 'pco', title: 'Pest Control Operator', icon: Wrench, intro: 'Buy professional products, calculate doses from verified label data and download SDS.',
    links: [['PCO shop: all products', '/shop'], ['Open or check your PCO account', '/pco-account'], ['Dosage calculator', '/shop/dose-calculator'], ['SDS, labels and datasheets', '/shop/library'], ['Pest knowledge centre', '/knowledge'], ['Technical standards (IS 6313)', '/technical-standards'], ['PestKill AI: ask about products and documents', '/pestkill-ai']] },
  { key: 'architect', title: 'Architect', icon: Ruler, intro: 'Specify anti-termite protection at design stage and get technical documents for your drawings.',
    links: [['Porous pipe anti-termite system', '/services/anti-termite-piping'], ['Pre-construction termite treatment', '/termite-control'], ['Technical documents', '/shop/library'], ['Send a project enquiry', '/contact?subject=Architect%20project%20enquiry']] },
  { key: 'builder', title: 'Builder / Developer', icon: Building2, intro: 'Pre-construction treatment with certificates your buyers can verify, for every project size.',
    links: [['Pre-construction termite treatment', '/termite-control'], ['Porous pipe system (refillable)', '/services/anti-termite-piping'], ['Pest control for builders', '/business/builders'], ['Verify a treatment certificate', '/verify'], ['Send a project enquiry', '/contact?subject=Builder%20project%20enquiry']] },
  { key: 'contractor', title: 'Contractor', icon: HardHat, intro: 'Materials and technical support for treatment work on site.',
    links: [['Termiticides price list', '/shop/pest/termite'], ['Dosage calculator', '/shop/dose-calculator'], ['SDS, labels and datasheets', '/shop/library'], ['Bulk order on WhatsApp', wa('Hi PestKill, I am a contractor and need a bulk quote for: '), true]] },
];

const brandPath = (name) => {
  const key = Object.keys(BRAND_LANDING).find((k) => BRAND_LANDING[k].name.toLowerCase() === name.toLowerCase());
  return key ? `/shop/brand/${key}` : `/shop?brand=${encodeURIComponent(name)}`;
};

const ExploreDrawer = () => {
  const [tab, setTab] = useState(null); // null = closed
  const [role, setRole] = useState(null);
  const [facets, setFacets] = useState(null);
  const [error, setError] = useState('');
  const panel = useRef(null);
  const opener = useRef(null);
  const { pathname } = useLocation();

  const close = useCallback(() => { setTab(null); setRole(null); opener.current?.focus?.(); }, []);
  const open = useCallback((key) => { opener.current = document.activeElement; setTab(key); setRole(null); }, []);

  useEffect(() => {
    const onOpen = (e) => open(e.detail || 'brand');
    window.addEventListener('pk:explore', onOpen);
    return () => window.removeEventListener('pk:explore', onOpen);
  }, [open]);

  useEffect(() => { setTab(null); setRole(null); }, [pathname]); // close after navigating

  // Live brand and pest counts, loaded the first time the drawer opens.
  useEffect(() => {
    if (!tab || facets) return;
    api('/products').then((d) => setFacets({ brands: d.brands, pests: d.pests })).catch((e) => setError(e.message));
  }, [tab, facets]);

  // Escape closes; focus moves into the panel; page behind does not scroll.
  useEffect(() => {
    if (!tab) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll('a[href], button:not([disabled])');
        if (!f.length) return;
        const first = f[0]; const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => panel.current?.querySelector('[data-autofocus]')?.focus(), 30);
    return () => { document.removeEventListener('keydown', onKey); document.documentElement.style.overflow = prev; };
  }, [tab, close]);

  const counts = Object.fromEntries((facets?.pests || []).map((p) => [p.key, p.n]));
  const current = TABS.find((t) => t.key === tab);

  return (
    <>
      <nav className="side-explore" aria-label="Explore products">
        {TABS.map(({ key, short, icon: Icon }) => (
          <button key={key} type="button" className={tab === key ? 'on' : ''} onClick={() => (tab === key ? close() : open(key))} aria-expanded={tab === key} aria-controls="explore-panel">
            <Icon size={16} /><span>{short}</span>
          </button>
        ))}
      </nav>

      {tab && (
        <div className="ex-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <aside id="explore-panel" ref={panel} className="ex-panel" role="dialog" aria-modal="true" aria-labelledby="ex-title" data-lenis-prevent>
            <header className="ex-head">
              <h2 id="ex-title">{current.label}</h2>
              <button type="button" className="ex-close" onClick={close} aria-label="Close" data-autofocus><X size={20} /></button>
            </header>
            <div className="ex-tabs" role="tablist" aria-label="Explore by">
              {TABS.map(({ key, short, icon: Icon }) => (
                <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'on' : ''} onClick={() => { setTab(key); setRole(null); }}>
                  <Icon size={15} /> {short}
                </button>
              ))}
            </div>

            <div className="ex-body">
              {error && <p className="form-error">{error}</p>}

              {tab === 'brand' && (
                <ul className="ex-list">
                  {!facets && !error && <li className="ex-muted">Loading brands…</li>}
                  {facets?.brands.map((b) => (
                    <li key={b.name}><Link to={brandPath(b.name)}><strong>{b.name}</strong><span>{b.n} products</span><ArrowRight size={16} /></Link></li>
                  ))}
                </ul>
              )}

              {tab === 'pest' && (
                <ul className="ex-list">
                  {PEST_OPTIONS.map((p) => (
                    <li key={p.key}><Link to={`/shop/pest/${p.key}`}><strong>{p.label}<em lang="hi"> {p.hi}</em></strong><span>{counts[p.key] != null ? `${counts[p.key]} products` : ''}</span><ArrowRight size={16} /></Link></li>
                  ))}
                  <li><Link to="/shop?category=General%20Pest%20Control"><strong>General pests<em lang="hi"> सामान्य कीट</em></strong><span>Residual sprays and more</span><ArrowRight size={16} /></Link></li>
                  <li><Link to="/book"><strong>Home use<em lang="hi"> घर के लिए</em></strong><span>Professional products are for licensed PCOs; homes can book a treatment</span><ArrowRight size={16} /></Link></li>
                </ul>
              )}

              {tab === 'role' && !role && (
                <ul className="ex-roles">
                  {ROLES.map(({ key, title, icon: Icon, intro }) => (
                    <li key={key}><button type="button" onClick={() => setRole(key)}><Icon size={22} /><span><strong>{title}</strong><small>{intro}</small></span><ArrowRight size={16} /></button></li>
                  ))}
                </ul>
              )}
              {tab === 'role' && role && (() => {
                const r = ROLES.find((x) => x.key === role);
                return (
                  <div className="ex-role">
                    <button type="button" className="ex-back" onClick={() => setRole(null)}><ChevronLeft size={16} /> All roles</button>
                    <h3><r.icon size={20} /> {r.title}</h3>
                    <p>{r.intro}</p>
                    <ul className="ex-list">
                      {r.links.map(([label, to, external]) => (
                        <li key={label}>{external
                          ? <a href={to} target="_blank" rel="noopener noreferrer"><strong>{label}</strong><ArrowRight size={16} /></a>
                          : <Link to={to}><strong>{label}</strong><ArrowRight size={16} /></Link>}</li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default ExploreDrawer;
