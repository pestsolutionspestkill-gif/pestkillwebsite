import { Link } from 'react-router-dom';
import { Phone, MapPin, Bug, Zap, Shield } from 'lucide-react';
import RateCards from '../components/RateCards';
import './ServiceDetail.css';

const Alwar = () => {
  return (
    <div className="service-page">
      <section className="service-hero">
        <div className="container">
          <span className="service-badge"><MapPin size={14} style={{marginRight:'4px',verticalAlign:'middle'}} />Alwar</span>
          <h1>Best <span className="text-gradient">Pest Control Services</span> in Alwar</h1>
          <p className="hero-desc">Professional pest control in Alwar. Termite & cockroach treatment.</p>
          <div className="hero-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call Now</a>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="service-content">
            <h2>Top Pest Control in Alwar</h2>
            <p>Professional <strong>pest control in Alwar</strong>. Trusted services for homes & businesses.</p>
            <h3>Services in Alwar</h3>
            <div className="service-features">
              <div className="feature-card"><h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><Bug size={18} />Termite Control</h4><p>10-year warranty</p></div>
              <div className="feature-card"><h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><Zap size={18} />Cockroach Control</h4><p>Permanent solution</p></div>
              <div className="feature-card"><h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><Shield size={18} />Rodent Control</h4><p>Safe removal</p></div>
            </div>
            <RateCards withTermite />
          </div>
        </div>
      </section>
      <section className="cta-section">
        <div className="container">
          <h2>Best Pest Control in Alwar</h2>
          <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
        </div>
      </section>
    </div>
  );
};

export default Alwar;