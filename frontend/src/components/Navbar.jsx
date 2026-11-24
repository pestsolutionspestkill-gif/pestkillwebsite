import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Phone, MessageCircle, Menu, X, ChevronDown, ArrowRight, Search, Clock, BadgeCheck, CalendarCheck, ShoppingCart, Store,
} from 'lucide-react';
import businessConfig from '../data/businessConfig';
import { services, serviceGroups, sectors, pests } from '../data/catalog';
import SearchPalette from './SearchPalette';
import { useAuth, homeFor } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export const Logo = ({ light = false }) => (
  <Link to="/" className={`logo ${light ? 'logo-light' : ''}`} aria-label="PestKill home">
    <img className="logo-mark" src="/images/brand/pestkill-emblem-192.png" alt="" width="44" height="44" />
    <span className="logo-words">
      <span className="logo-text">Pest Kill</span>
      <span className="logo-sub">Pest Solutions</span>
    </span>
  </Link>
);

const companyLinks = [
  { name: 'About Us', desc: 'Our story and values', path: '/about' },
  { name: 'Locations', desc: 'Cities we serve', path: '/locations' },
  { name: 'Careers', desc: 'Join our team', path: '/careers' },
  { name: 'Blog & Guides', desc: 'Expert pest advice', path: '/blog' },
  { name: 'Contact', desc: 'Talk to a specialist', path: '/contact' },
];

const MENUS = [
  { id: 'services', label: 'Services', match: ['/services', '/termite-control', '/cockroach-control', '/bed-bug-treatment', '/rodent-control'] },
  { id: 'business', label: 'For Business', match: ['/business', '/integrated-pest-management'] },
  { id: 'pests', label: 'Pest Library', match: ['/pests', '/pest-identifier', '/knowledge'] },
  { id: 'company', label: 'Company', match: ['/about', '/locations', '/careers', '/blog', '/contact'] },
];

const ServicesPanel = () => (
  <div className="mega-grid mega-services">
    {serviceGroups.map((g) => (
      <div key={g.id} className="mega-col">
        <p className="mega-heading">{g.label}</p>
        {services.filter((s) => s.group === g.id).map(({ icon: Icon, ...s }) => (
          <Link key={s.slug} to={s.path} className="mega-link">
            <span className="mega-icon"><Icon size={17} /></span>
            <span><strong>{s.short}</strong><small>{s.summary}</small></span>
          </Link>
        ))}
      </div>
    ))}
    <div className="mega-feature">
      <span className="eyebrow light">Book Online</span>
      <h4>Schedule a treatment in two minutes</h4>
      <p>See starting prices, pick a slot and get a confirmation call.</p>
      <Link to="/book" className="btn btn-primary btn-sm">Book now <ArrowRight size={14} /></Link>
      <Link to="/services" className="mega-more">All services & AMC plans <ArrowRight size={14} /></Link>
    </div>
  </div>
);

const BusinessPanel = () => (
  <div className="mega-grid mega-business">
    <div className="mega-col span-2">
      <p className="mega-heading">Industries</p>
      <div className="mega-two">
        {sectors.map(({ icon: Icon, ...s }) => (
          <Link key={s.slug} to={`/business/${s.slug}`} className="mega-link">
            <span className="mega-icon"><Icon size={17} /></span>
            <span><strong>{s.name}</strong></span>
          </Link>
        ))}
      </div>
    </div>
    <div className="mega-col">
      <p className="mega-heading">Approach</p>
      <Link to="/integrated-pest-management" className="mega-link plain"><span><strong>Integrated Pest Management</strong><small>Prevention-first programmes</small></span></Link>
      <Link to="/business" className="mega-link plain"><span><strong>Commercial solutions</strong><small>Audit-ready service plans</small></span></Link>
      <Link to="/services/fumigation" className="mega-link plain"><span><strong>Fumigation</strong><small>Warehouses & commodities</small></span></Link>
    </div>
    <div className="mega-feature">
      <span className="eyebrow light">Free site survey</span>
      <h4>Get a written proposal for your premises</h4>
      <p>A specialist inspects your site and recommends a programme.</p>
      <Link to="/contact" className="btn btn-primary btn-sm">Request survey <ArrowRight size={14} /></Link>
    </div>
  </div>
);

const PestsPanel = () => (
  <div className="mega-grid mega-pests">
    <div className="mega-col span-3">
      <p className="mega-heading">Identify your pest</p>
      <div className="mega-pest-grid">
        {pests.map(({ icon: Icon, ...p }) => (
          <Link key={p.slug} to={`/pests/${p.slug}`} className="mega-pest">
            <span className="mega-icon"><Icon size={18} /></span>
            <strong>{p.name}</strong>
            <small>{p.tag}</small>
          </Link>
        ))}
      </div>
    </div>
    <div className="mega-feature">
      <span className="eyebrow light">Not sure what it is?</span>
      <h4>Pest Identifier</h4>
      <p>Answer five quick questions — get the likely pest, how serious it is and the price to treat it.</p>
      <Link to="/pest-identifier" className="btn btn-primary btn-sm">Identify my pest <ArrowRight size={14} /></Link>
      <Link to="/knowledge" className="mega-kc-link">Knowledge Centre: species guides in English &amp; हिन्दी <ArrowRight size={14} /></Link>
    </div>
  </div>
);

const CompanyPanel = () => (
  <div className="mega-grid mega-company">
    <div className="mega-col span-2">
      <p className="mega-heading">Company</p>
      <div className="mega-two">
        {companyLinks.map((c) => (
          <Link key={c.path} to={c.path} className="mega-link plain">
            <span><strong>{c.name}</strong><small>{c.desc}</small></span>
          </Link>
        ))}
      </div>
    </div>
    <div className="mega-feature">
      <span className="eyebrow light">Head Office</span>
      <h4>Jaipur, Rajasthan</h4>
      <p>{businessConfig.officeAddress}</p>
      <Link to="/locations" className="btn btn-primary btn-sm">All locations <ArrowRight size={14} /></Link>
    </div>
  </div>
);

const PANELS = { services: ServicesPanel, business: BusinessPanel, pests: PestsPanel, company: CompanyPanel };

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileSection, setMobileSection] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeTimer = useRef(null);
  const { user } = useAuth();
  const { count: cartCount, bump } = useCart();
  const accountLabel = user ? (user.role === 'client' ? 'My account' : 'Console') : 'Login';
  const accountPath = user ? homeFor(user) : '/login';
  const location = useLocation();
  const { phoneNumber, whatsappNumber, workingHours } = businessConfig;
  const wa = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') setOpenMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { setMobileOpen(false); setOpenMenu(null); }, [location.pathname]);

  const enter = (id) => { clearTimeout(closeTimer.current); setOpenMenu(id); };
  const leave = () => { closeTimer.current = setTimeout(() => setOpenMenu(null), 140); };
  const isActive = (m) => m.match.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`));
  const isBusiness = location.pathname.startsWith('/business') || location.pathname.startsWith('/integrated-pest-management');
  const Panel = openMenu ? PANELS[openMenu] : null;

  return (
    <>
      <header className={`navbar ${scrolled ? 'scrolled' : ''} ${openMenu ? 'menu-open' : ''}`}>
        <div className="nav-utility">
          <div className="nav-utility-inner">
            <nav className="segment-tabs" aria-label="Audience">
              <Link to="/" className={!isBusiness ? 'active' : ''} aria-current={!isBusiness ? 'page' : undefined}>For Home</Link>
              <Link to="/business" className={isBusiness ? 'active' : ''} aria-current={isBusiness ? 'page' : undefined}>For Business</Link>
            </nav>
            <div className="utility-meta">
              <span><BadgeCheck size={14} /> Licensed pest control operator</span>
              <span><Clock size={14} /> {workingHours}</span>
              <a href={wa}><MessageCircle size={14} /> WhatsApp</a>
              <a href={`tel:${phoneNumber}`} className="utility-phone"><Phone size={14} /> {phoneNumber}</a>
            </div>
          </div>
        </div>

        <div className="nav-container" onMouseLeave={leave}>
          <Logo />

          <nav className="nav-menus" aria-label="Main">
            {MENUS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`nav-link ${isActive(m) ? 'active' : ''} ${openMenu === m.id ? 'open' : ''}`}
                aria-expanded={openMenu === m.id}
                onMouseEnter={() => enter(m.id)}
                onFocus={() => enter(m.id)}
                onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
              >
                {m.label} <ChevronDown size={14} className="chev" />
              </button>
            ))}
            <Link to="/shop" className={`nav-link ${location.pathname.startsWith('/shop') || location.pathname === '/pco-account' ? 'active' : ''}`} onMouseEnter={() => setOpenMenu(null)}>PCO Shop</Link>
          </nav>

          <div className="nav-actions">
            <button type="button" className="nav-search" onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search size={17} /><span>Search</span><kbd>Ctrl K</kbd>
            </button>
            <Link to={accountPath} className="login-btn">{accountLabel}</Link>
            <Link to="/cart" className="nav-cart" aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}>
              <ShoppingCart size={19} />
              {cartCount > 0 && <span key={bump} className="nav-cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
            </Link>
            <Link to="/book" className="btn btn-primary btn-sm quote-btn"><CalendarCheck size={16} /> Book Online</Link>
            <button type="button" className="menu-btn" aria-label="Toggle menu" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {Panel && (
            <div className="mega" onMouseEnter={() => enter(openMenu)}>
              <div className="mega-inner"><Panel /></div>
            </div>
          )}
        </div>
      </header>
      {openMenu && <div className="mega-scrim" onMouseEnter={leave} onClick={() => setOpenMenu(null)} />}

      <div className={`mobile-drawer ${mobileOpen ? 'open' : ''}`} data-lenis-prevent>
        <div className="mobile-segment">
          <Link to="/" className={!isBusiness ? 'active' : ''}>For Home</Link>
          <Link to="/business" className={isBusiness ? 'active' : ''}>For Business</Link>
        </div>
        <Link to="/shop" className="mobile-shop"><Store size={20} /><span><strong>PCO Shop</strong><small>Envu, Syngenta, Heranba, Arbuda, Kalyani</small></span><ArrowRight size={18} /></Link>
        <button type="button" className="mobile-search" onClick={() => { setMobileOpen(false); setSearchOpen(true); }}><Search size={18} /> Search services, pests, cities</button>
        {[
          { id: 'services', label: 'Services', items: services.map((s) => ({ name: s.name, path: s.path })) },
          { id: 'business', label: 'For Business', items: [{ name: 'Commercial solutions', path: '/business' }, { name: 'Integrated Pest Management', path: '/integrated-pest-management' }, ...sectors.map((s) => ({ name: s.name, path: `/business/${s.slug}` }))] },
          { id: 'pests', label: 'Pest Library', items: [{ name: 'Pest Identifier — what is it?', path: '/pest-identifier' }, { name: 'Knowledge Centre (English / हिन्दी)', path: '/knowledge' }, { name: 'All pests', path: '/pests' }, ...pests.map((p) => ({ name: p.name, path: `/pests/${p.slug}` }))] },
          { id: 'company', label: 'Company', items: companyLinks },
        ].map((sec) => (
          <div key={sec.id} className={`mobile-sec ${mobileSection === sec.id ? 'open' : ''}`}>
            <button type="button" onClick={() => setMobileSection(mobileSection === sec.id ? null : sec.id)}>
              {sec.label} <ChevronDown size={18} />
            </button>
            <div className="mobile-sec-items">
              {sec.items.map((it) => <Link key={it.path + it.name} to={it.path}>{it.name}</Link>)}
            </div>
          </div>
        ))}
        <div className="mobile-cta">
          <Link to="/book" className="btn btn-primary btn-block">Book Online</Link>
          <div className="mobile-cta-row">
            <a href={`tel:${phoneNumber}`} className="btn btn-outline"><Phone size={16} /> Call</a>
            <Link to={accountPath} className="btn btn-outline">{accountLabel}</Link>
          </div>
        </div>
      </div>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className="floating-actions">
        <a href={wa} className="float-btn float-wa" aria-label="WhatsApp"><MessageCircle size={22} /></a>
        <a href={`tel:${phoneNumber}`} className="float-btn float-call" aria-label="Call"><Phone size={20} /></a>
      </div>
    </>
  );
};

export default Navbar;
