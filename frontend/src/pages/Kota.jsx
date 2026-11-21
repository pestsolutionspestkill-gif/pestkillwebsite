import { Link } from 'react-router-dom';
import { Phone, MapPin, Award, Star, Zap, Check, Bug, BedDouble } from 'lucide-react';
import './ServiceDetail.css';

const Kota = () => {
  return (
    <div className="service-page">
      <section className="service-hero">
        <div className="container">
          <span className="service-badge"><MapPin size={14} style={{marginRight:'4px',verticalAlign:'middle'}} />Kota</span>
          <h1>Best <span className="text-gradient">Pest Control Services</span> in Kota</h1>
          <p className="hero-desc">Professional pest control in Kota. Termite, cockroach, bed bug & rodent control.</p>
          <div className="hero-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call Now</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="service-content">
            <h2>Top Pest Control Company in Kota</h2>
            <p>Looking for the <strong>best pest control services in Kota</strong>? Pest Kill Solutions offers professional pest control treatment across Kota. We provide <strong>termite treatment in Kota</strong>, cockroach control, bed bug removal, and more.</p>
            
            <h3>Why Kota Residents Trust Us?</h3>
            <div className="benefits-grid">
              <div className="benefit-item">
                <span className="benefit-icon"><Award size={22} /></span>
                <div>
                  <h4>30+ Projects in Kota</h4>
                  <p>Successfully completed across Kota</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon"><Star size={22} /></span>
                <div>
                  <h4>4.8/5 Rating</h4>
                  <p>Highest rated in Kota</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon"><Zap size={22} /></span>
                <div>
                  <h4>Same-Day Service</h4>
                  <p>Quick response</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon"><Check size={22} /></span>
                <div>
                  <h4>100% Satisfaction</h4>
                  <p>Guaranteed results</p>
                </div>
              </div>
            </div>

            <h3>Our Services in Kota</h3>
            <div className="service-features">
              <div className="feature-card">
                <h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><Bug size={18} />Termite Control Kota</h4>
                <p>Pre & post construction treatment.</p>
                <Link to="/termite-control">Learn More →</Link>
              </div>
              <div className="feature-card">
                <h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><Zap size={18} />Cockroach Control Kota</h4>
                <p>Permanent elimination.</p>
                <Link to="/cockroach-control">Learn More →</Link>
              </div>
              <div className="feature-card">
                <h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><BedDouble size={18} />Bed Bug Treatment Kota</h4>
                <p>Heat & chemical treatment.</p>
                <Link to="/bed-bug-treatment">Learn More →</Link>
              </div>
            </div>

            <h3>Areas We Serve in Kota</h3>
            <div className="cities-grid">
              <div className="city-area">Civil Lines</div>
              <div className="city-area">Kota Industrial Area</div>
              <div className="city-area">Gumanpura</div>
              <div className="city-area">Rampura</div>
              <div className="city-area">Bhandari</div>
              <div className="city-area">Sangopura</div>
            </div>

            <h3>Pricing in Kota</h3>
            <div className="pricing-grid">
              <div className="pricing-card">
                <h4>General Pest Control</h4>
                <div className="price">₹449<span>/visit</span></div>
              </div>
              <div className="pricing-card popular">
                <span className="popular-badge">Most Popular</span>
                <h4>Cockroach Control</h4>
                <div className="price">₹599<span>/flat</span></div>
              </div>
              <div className="pricing-card">
                <h4>Termite Treatment</h4>
                <div className="price">₹10-15<span>/sq.ft.</span></div>
              </div>
            </div>

            <h3>Frequently Asked Questions</h3>
            <div className="faq-section">
              <div className="faq-item">
                <h4>How much does pest control cost in Kota?</h4>
                <p>Pest control in Kota starts from ₹449 for general pests.</p>
              </div>
              <div className="faq-item">
                <h4>Do you serve all of Kota?</h4>
                <p>Yes, we serve all areas including Civil Lines and Industrial Area.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Best Pest Control in Kota</h2>
          <p>Book your free inspection today!</p>
          <div className="cta-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call: +91-63753-38302</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Kota;