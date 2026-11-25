import { Link } from 'react-router-dom';
import businessConfig from '../data/businessConfig';
import { Phone, Mail, MapPin, ShieldCheck, Leaf, Award, Users, ArrowRight } from 'lucide-react';
import { media } from '../data/media';
import { FounderSection } from '../components/Founder';
import './About.css';
import Credentials from '../components/Credentials';

const values = [
  { icon: ShieldCheck, title: 'Integrity', text: 'Honest inspections, written quotations and no unnecessary treatments.' },
  { icon: Leaf, title: 'Safety first', text: 'Registered products applied by trained hands, exactly as the label directs.' },
  { icon: Award, title: 'Proven results', text: 'Documented warranties of up to 10 years on termite treatment.' },
  { icon: Users, title: 'Long relationships', text: 'Homes, hotels and institutions that have trusted us for years.' },
];

const About = () => {
  const { businessName, phoneNumber, email, officeAddress, googleMapLink, brands, formulations } = businessConfig;

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <span className="eyebrow light">About Us</span>
          <h1>Professional pest control, <span className="text-gradient">built on integrity</span></h1>
          <p>A Jaipur-based team protecting homes, businesses and public institutions across North India.</p>
        </div>
      </section>

      <section className="section">
        <div className="container about-grid">
          <div className="about-image">
            <img src={media.technician.src} alt={media.technician.alt} className="about-hero-img" />
            <div className="about-image-card">
              <span>Years of service</span>
              <strong>8+</strong>
            </div>
          </div>
          <div className="about-text">
            <span className="eyebrow">Our Story</span>
            <h2>Welcome to {businessName}</h2>
            <p>We are a pest management company committed to safe, effective and environmentally responsible solutions. For residential, commercial and industrial clients, we understand that a pest-free environment is about health, hygiene and peace of mind.</p>
            <p>Our trained team uses proven techniques and genuine, registered products, and documents every job with a written treatment report. We provide pest control services across India, with teams dispatched from our Jaipur office, and deliver professional products across India.</p>
            <div className="about-stats">
              <div className="stat-box"><span className="stat-number">2</span><span className="stat-label">Licences: pest control & pesticide sale</span></div>
              <div className="stat-box"><span className="stat-number">Pan-India</span><span className="stat-label">Service from Jaipur, product delivery</span></div>
              <div className="stat-box"><span className="stat-number">{formulations.length}</span><span className="stat-label">Formulation types handled</span></div>
            </div>
          </div>
        </div>
      </section>

      <FounderSection />

      <Credentials id="credentials" />

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">What We Stand For</span>
            <h2 className="section-title">Values behind <span className="text-gradient">every visit</span></h2>
          </div>
          <div className="values-grid">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title} className="value-card">
                <span className="icon-tile"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="about-brands">
            <span>Products we trust</span>
            <div>{brands.map(b => <strong key={b}>{b}</strong>)}</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Visit Us</span>
            <h2 className="section-title">Our <span className="text-gradient">location</span></h2>
          </div>
          <div className="about-map">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.567974718769!2d75.924789!3d26.924789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db00c2e53ffff%3A0x5e4c4c4c4c4c4c4c!2sVidhyadhar%20Nagar%2C%20Jaipur%2C%20Rajasthan!5e0!3m2!1sen!2sin!4v1600000000000"
              width="100%" height="440" style={{ border: 0 }} allowFullScreen="" loading="lazy"
              referrerPolicy="no-referrer-when-downgrade" title="Our Location"
            />
          </div>
          <div className="about-contact-grid">
            <a href={`tel:${phoneNumber}`} className="about-contact"><span className="icon-tile"><Phone size={20} /></span><div><h4>Phone</h4><p>{phoneNumber}</p></div></a>
            <a href={`mailto:${email}`} className="about-contact"><span className="icon-tile"><Mail size={20} /></span><div><h4>Email</h4><p>{email}</p></div></a>
            <a href={googleMapLink} target="_blank" rel="noopener noreferrer" className="about-contact"><span className="icon-tile"><MapPin size={20} /></span><div><h4>Office</h4><p>{officeAddress}</p></div></a>
          </div>
          <div className="about-cta">
            <Link to="/contact" className="btn btn-primary btn-lg">Talk to our team <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
