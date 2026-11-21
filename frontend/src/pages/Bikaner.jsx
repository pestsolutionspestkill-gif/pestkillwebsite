import { Link } from 'react-router-dom';
import { Phone, MapPin, Bug, Zap } from 'lucide-react';
import './ServiceDetail.css';

const Bikaner = () => {
  return (
    <div className="service-page">
      <section className="service-hero">
        <div className="container">
          <span className="service-badge"><MapPin size={14} style={{marginRight:'4px',verticalAlign:'middle'}} />Bikaner</span>
          <h1>Best <span className="text-gradient">Pest Control Services</span> in Bikaner</h1>
          <p className="hero-desc">Professional pest control in Bikaner. Termite & cockroach treatment.</p>
          <div className="hero-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call Now</a>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="service-content">
            <h2>Top Pest Control in Bikaner</h2>
            <p>Professional <strong>pest control in Bikaner</strong>. Trusted services for homes & businesses.</p>
            <h3>Services</h3>
            <div className="service-features">
              <div className="feature-card"><h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><Bug size={18} />Termite Control</h4><p>10-year warranty</p></div>
              <div className="feature-card"><h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><Zap size={18} />Cockroach Control</h4><p>Guaranteed</p></div>
            </div>
            <div className="pricing-grid">
              <div className="pricing-card"><h4>General</h4><div className="price">₹449</div></div>
              <div className="pricing-card popular"><span className="popular-badge">Popular</span><h4>Cockroach</h4><div className="price">₹599</div></div>
            </div>
          </div>
        </div>
      </section>
      <section className="cta-section">
        <div className="container">
          <h2>Best Pest Control in Bikaner</h2>
          <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
        </div>
      </section>
    </div>
  );
};

export default Bikaner;