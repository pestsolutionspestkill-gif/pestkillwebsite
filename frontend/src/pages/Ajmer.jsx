import { Link } from 'react-router-dom';
import { Phone, MapPin, Bug, Zap, Shield } from 'lucide-react';
import RateCards from '../components/RateCards';
import './ServiceDetail.css';

const Ajmer = () => {
  return (
    <div className="service-page">
      <section className="service-hero">
        <div className="container">
          <span className="service-badge"><MapPin size={14} style={{marginRight:'4px',verticalAlign:'middle'}} />Ajmer</span>
          <h1>Best <span className="text-gradient">Pest Control Services</span> in Ajmer</h1>
          <p className="hero-desc">Professional pest control in Ajmer. Termite, cockroach & rodent control.</p>
          <div className="hero-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call Now</a>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="service-content">
            <h2>Top Pest Control in Ajmer</h2>
            <p>Pest Kill Solutions offers professional <strong>pest control in Ajmer</strong>. Trusted for termite treatment, cockroach control & more.</p>
            <h3>Services in Ajmer</h3>
            <div className="service-features">
              <div className="feature-card"><h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><Bug size={18} />Termite Control</h4><p>5-10 years warranty</p></div>
              <div className="feature-card"><h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><Zap size={18} />Cockroach Control</h4><p>Permanent solution</p></div>
              <div className="feature-card"><h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><Shield size={18} />Rodent Control</h4><p>Safe removal</p></div>
            </div>
            <h3>Areas We Serve</h3>
            <div className="cities-grid">
              <div className="city-area">Civil Lines</div>
              <div className="city-area">Kama Chowk</div>
              <div className="city-area">Dargah Bazar</div>
              <div className="city-area">Nasirabad</div>
            </div>
            <h3>Pricing</h3>
            <RateCards withTermite />
          </div>
        </div>
      </section>
      <section className="cta-section">
        <div className="container">
          <h2>Best Pest Control in Ajmer</h2>
          <p>Book your free inspection!</p>
          <div className="cta-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call Now</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Ajmer;