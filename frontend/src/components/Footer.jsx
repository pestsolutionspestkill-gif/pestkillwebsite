import { Link } from 'react-router-dom';
import businessConfig from '../data/businessConfig';
import { Phone, MessageCircle, Mail, MapPin, Clock, ArrowRight, ShieldCheck, Award, Leaf, BadgeCheck } from 'lucide-react';
import { Logo } from './Navbar';
import { services as catalogServices } from '../data/catalog';
import './Footer.css';
import { CITIES, cityPath } from '../data/rajasthan';

const quickLinks = [
  { label: 'Book Online', path: '/book' },
  { label: 'For Business', path: '/business' },
  { label: 'Pest Library', path: '/pests' },
  { label: 'Integrated Pest Management', path: '/integrated-pest-management' },
  { label: 'About Us', path: '/about' },
  { label: 'Locations', path: '/locations' },
  { label: 'Careers', path: '/careers' },
  { label: 'Blog', path: '/blog' },
  { label: 'Contact', path: '/contact' },
];

const cities = CITIES.slice(0, 8).map((c) => ({ label: c.name, path: cityPath(c.slug) })).concat({ label: 'All Rajasthan cities', path: '/locations' });

const Footer = () => {
  const { businessName, tagline, phoneNumber, whatsappNumber, email, officeAddress, workingHours, googleMapLink, brands, licenceNumber } = businessConfig;
  const wa = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-cta">
          <div>
            <span className="eyebrow light">Free Site Inspection</span>
            <h2>Protect what matters. <span className="text-gradient">Book today.</span></h2>
            <p>Certified technicians, government-approved chemicals and written warranty on every treatment.</p>
          </div>
          <div className="footer-cta-actions">
            <Link to="/services" className="btn btn-primary btn-lg">Get Free Quote <ArrowRight size={18} /></Link>
            <a href={`tel:${phoneNumber}`} className="btn btn-ghost btn-lg"><Phone size={18} /> {phoneNumber}</a>
          </div>
        </div>

        <div className="footer-grid">
          <div className="footer-about">
            <Logo />
            <p className="footer-tagline">{tagline}. Serving homes, hotels, hospitals and industries across Rajasthan, Delhi NCR and Uttar Pradesh.</p>
            <ul className="footer-trust">
              <li><BadgeCheck size={16} /> Licensed pest control operator{licenceNumber ? ` · Lic. ${licenceNumber}` : ''}</li>
              <li><ShieldCheck size={16} /> Govt. approved chemicals</li>
              <li><Award size={16} /> Up to 10-year warranty</li>
              <li><Leaf size={16} /> Family & pet safe methods</li>
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
          <p>&copy; {new Date().getFullYear()} {businessName}. All rights reserved.</p>
          <p><Link to="/login">Staff Login</Link></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
