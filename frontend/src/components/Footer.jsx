import { Link } from 'react-router-dom';
import businessConfig from '../data/businessConfig';
import { LicenceLine } from './Credentials';
import { Phone, MessageCircle, Mail, MapPin, Clock, ArrowRight, ShieldCheck, Award, Leaf } from 'lucide-react';
import { Logo } from './Navbar';
import { services as catalogServices } from '../data/catalog';
import './Footer.css';
import { CITIES, cityPath } from '../data/rajasthan';

const quickLinks = [
  { label: 'Book Online', path: '/book' },
  { label: 'For Business', path: '/business' },
  { label: 'Pest Library', path: '/pests' },
  { label: 'Knowledge Centre', path: '/knowledge' },
  { label: 'Technical standards', path: '/technical-standards' },
  { label: 'Dosage calculator', path: '/shop/dose-calculator' },
  { label: 'Integrated Pest Management', path: '/integrated-pest-management' },
  { label: 'About Us', path: '/about' },
  { label: 'Locations', path: '/locations' },
  { label: 'Careers', path: '/careers' },
  { label: 'Blog', path: '/blog' },
  { label: 'Contact', path: '/contact' },
];

const cities = CITIES.slice(0, 8).map((c) => ({ label: c.name, path: cityPath(c.slug) })).concat({ label: 'All Rajasthan cities', path: '/locations' });

// Developer credit: the name opens WhatsApp chat with the developer.
const DEV_WA = 'https://wa.me/916375338302';
export const LEGAL = [
  { label: 'Privacy policy', path: '/privacy-policy' },
  { label: 'Terms & conditions', path: '/terms' },
  { label: 'Shipping & delivery', path: '/shipping-delivery' },
  { label: 'Product replacement', path: '/replacement-policy' },
  { label: 'Disclaimer', path: '/disclaimer' },
];

const Footer = () => {
  const year = new Date().getFullYear();
  const { businessName, tagline, phoneNumber, whatsappNumber, email, officeAddress, workingHours, googleMapLink, brands } = businessConfig;
  const wa = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-cta">
          <div>
            <span className="eyebrow light">Free Site Inspection</span>
            <h2>Protect what matters. <span className="text-gradient">Book today.</span></h2>
            <p>Trained technicians, registered products used as the label directs, and a written treatment report.</p>
          </div>
          <div className="footer-cta-actions">
            <Link to="/services" className="btn btn-primary btn-lg">Get Free Quote <ArrowRight size={18} /></Link>
            <a href={`tel:${phoneNumber}`} className="btn btn-ghost btn-lg"><Phone size={18} /> {phoneNumber}</a>
          </div>
        </div>

        <div className="footer-grid">
          <div className="footer-about">
            <Logo />
            <p className="footer-tagline">{tagline}. Pest control services across India, with teams dispatched from our Jaipur office. Professional products delivered across India.</p>
            <ul className="footer-trust">
              <li><LicenceLine kind="pco" /></li>
              <li><LicenceLine kind="sale" /></li>
              <li><ShieldCheck size={16} /> GSTIN {businessConfig.gstin}</li>
              <li><Award size={16} /> Udyam {businessConfig.udyam}</li>
              {businessConfig.pmarMember && <li><Leaf size={16} /> Member, PMAR{businessConfig.pmarNumber ? ` (${businessConfig.pmarNumber})` : ''}</li>}
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Explore</h4>
            <ul>
              {quickLinks.map(item => <li key={item.path}><Link to={item.path}>{item.label}</Link></li>)}
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Services</h4>
            <ul>
              {catalogServices.slice(0, 9).map(s => <li key={s.slug}><Link to={s.path}>{s.short}</Link></li>)}
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Cities</h4>
            <ul>
              {cities.map(c => <li key={c.path}><Link to={c.path}>{c.label}</Link></li>)}
            </ul>
          </div>

          <div className="footer-col footer-contact">
            <h4 className="footer-heading">Get in touch</h4>
            <a href={`tel:${phoneNumber}`} className="contact-row"><Phone size={16} /><span>{phoneNumber}</span></a>
            <a href={wa} className="contact-row"><MessageCircle size={16} /><span>WhatsApp us</span></a>
            <a href={`mailto:${email}`} className="contact-row"><Mail size={16} /><span>{email}</span></a>
            <a href={googleMapLink} target="_blank" rel="noopener noreferrer" className="contact-row"><MapPin size={16} /><span>{officeAddress}</span></a>
            <div className="contact-row"><Clock size={16} /><span>{workingHours}</span></div>
          </div>
        </div>

        <div className="footer-brands">
          <span>Authorised products from</span>
          <div>{brands.map(b => <strong key={b}>{b}</strong>)}</div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <nav className="footer-legal" aria-label="Policies">
            {LEGAL.map((l) => <Link key={l.path} to={l.path}>{l.label}</Link>)}
            <Link to="/login">Staff login</Link>
          </nav>
          <div className="footer-copy">
            <p>&copy; {year} {businessName}. All Rights Reserved.</p>
            <p className="footer-credit">
              Designed &amp; Created By{' '}
              <a href={DEV_WA} target="_blank" rel="noopener noreferrer" aria-label="Prerit Mudgal, designer and developer: chat on WhatsApp (opens in a new tab)">Prerit Mudgal</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
