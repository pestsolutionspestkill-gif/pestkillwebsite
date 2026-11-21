import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import businessConfig from '../data/businessConfig';
import { Phone, MessageCircle, Menu, X, ChevronDown, ShieldCheck, ArrowRight } from 'lucide-react';
import './Navbar.css';

const links = [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/services' },
  { name: 'About', path: '/about' },
  { name: 'Blog', path: '/blog' },
  { name: 'Contact', path: '/contact' },
];

const servicePages = [
  { name: 'Anti-Termite Piping', desc: 'Porous pipe system · New construction', path: '/services/anti-termite-piping' },
  { name: 'Termite Control', desc: 'Pre & post construction', path: '/services/termite-control' },
  { name: 'Cockroach Control', desc: 'Gel & spray treatment', path: '/services/cockroach-control' },
  { name: 'Rodent Control', desc: 'Proofing & baiting', path: '/services/rodent-control' },
  { name: 'Bed Bug Treatment', desc: 'Heat & chemical', path: '/services/bed-bugs' },
  { name: 'General Pest Control', desc: 'Annual contracts', path: '/services/general-pest-control' },
];

export const Logo = ({ light = false }) => (
  <Link to="/" className={`logo ${light ? 'logo-light' : ''}`} aria-label="PestKill home">
    <span className="logo-mark"><ShieldCheck size={20} strokeWidth={2.2} /></span>
    <span className="logo-words">
      <span className="logo-text">PestKill</span>
      <span className="logo-sub">Pest Solutions</span>
    </span>
  </Link>
);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { phoneNumber, whatsappNumber } = businessConfig;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <>
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Logo />

          <nav className={`nav-links ${mobileOpen ? 'mobile-open' : ''}`} data-lenis-prevent>
            {links.map(link => (
              link.name === 'Services' ? (
                <div key={link.name} className="service-item">
                  <Link to={link.path} className={`nav-link ${isActive(link.path) ? 'active' : ''}`}>
                    Services <ChevronDown size={14} className="chev" />
                  </Link>
                  <div className="service-menu">
                    {servicePages.map(page => (
                      <Link key={page.path} to={page.path} className="service-link">
                        <span className="service-link-name">{page.name}</span>
                        <span className="service-link-desc">{page.desc}</span>
                      </Link>
                    ))}
                    <Link to="/services" className="service-link-all">All services <ArrowRight size={14} /></Link>
                  </div>
                </div>
              ) : (
                <Link key={link.name} to={link.path} className={`nav-link ${isActive(link.path) ? 'active' : ''}`}>
                  {link.name}
                </Link>
              )
            ))}
            <div className="mobile-only">
              <Link to="/login" className="btn btn-outline btn-block">Login</Link>
              <Link to="/services" className="btn btn-primary btn-block">Get Free Quote</Link>
            </div>
          </nav>

          <div className="nav-actions">
            <a href={`tel:${phoneNumber}`} className="nav-phone">
              <span className="nav-phone-icon"><Phone size={15} /></span>
              <span className="nav-phone-text">
                <small>Call 24×7</small>
                {phoneNumber}
              </span>
            </a>
            <Link to="/login" className="login-btn">Login</Link>
            <Link to="/services" className="btn btn-primary btn-sm quote-btn">Get Free Quote</Link>
            <button className="menu-btn" aria-label="Toggle menu" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <div className="floating-actions">
        <a href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`} className="float-btn float-wa" aria-label="WhatsApp">
          <MessageCircle size={22} />
        </a>
        <a href={`tel:${phoneNumber}`} className="float-btn float-call" aria-label="Call">
          <Phone size={20} />
        </a>
      </div>
    </>
  );
};

export default Navbar;
