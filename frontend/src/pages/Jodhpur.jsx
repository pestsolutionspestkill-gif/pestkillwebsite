import { Link } from 'react-router-dom';
import { Phone, MapPin, Award, Star, Zap, Check, Bug, BedDouble } from 'lucide-react';
import './ServiceDetail.css';

const Jodhpur = () => {
  return (
    <div className="service-page">
      <section className="service-hero">
        <div className="container">
          <span className="service-badge"><MapPin size={14} style={{marginRight:'4px',verticalAlign:'middle'}} />Jodhpur</span>
          <h1>Best <span className="text-gradient">Pest Control Services</span> in Jodhpur</h1>
          <p className="hero-desc">Professional pest control in Jodhpur. Termite, cockroach, bed bug & rodent control.</p>
          <div className="hero-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call Now</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="service-content">
            <h2>Top Pest Control Company in Jodhpur</h2>
            <p>Looking for the <strong>best pest control services in Jodhpur</strong>? Pest Kill Solutions offers professional pest control treatment across Jodhpur. We provide <strong>termite treatment in Jodhpur</strong>, cockroach control, bed bug removal, and more.</p>
            
            <h3>Why Jodhpur Residents Trust Us?</h3>
            <div className="benefits-grid">
              <div className="benefit-item">
                <span className="benefit-icon"><Award size={22} /></span>
                <div>
                  <h4>50+ Projects in Jodhpur</h4>
                  <p>Successfully completed across Jodhpur</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon"><Star size={22} /></span>
                <div>
                  <h4>4.8/5 Rating</h4>
                  <p>Highest rated in Jodhpur</p>
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

            <h3>Our Services in Jodhpur</h3>
            <div className="service-features">
              <div className="feature-card">
                <h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><Bug size={18} />Termite Control Jodhpur</h4>
                <p>Pre & post construction treatment.</p>
                <Link to="/termite-control">Learn More →</Link>
              </div>
              <div className="feature-card">
                <h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><Zap size={18} />Cockroach Control Jodhpur</h4>
                <p>Permanent elimination.</p>
                <Link to="/cockroach-control">Learn More →</Link>
              </div>
              <div className="feature-card">
                <h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><BedDouble size={18} />Bed Bug Treatment Jodhpur</h4>
                <p>Heat & chemical treatment.</p>
                <Link to="/bed-bug-treatment">Learn More →</Link>
              </div>
            </div>

            <h3>Areas We Serve in Jodhpur</h3>
            <div className="cities-grid">
              <div className="city-area">Sardarpura</div>
              <div className="city-area">Ratanada</div>
              <div className="city-area">Jodhpur Industrial Area</div>
              <div className="city-area">Pal Village</div>
              <div className="city-area">Jaswant Thada</div>
              <div className="city-area">Umaid Colony</div>
            </div>

            <h3>Jodhpur Customer Reviews</h3>
            <div className="testimonials-grid">
              <div className="testimonial-card">
                <div className="stars">{[...Array(5)].map((_,i)=><Star key={i} size={14} fill="currentColor" />)}</div>
                <p>"Best pest control in Jodhpur! Professional termite treatment for my new home."</p>
                <h4>- Raj Singh, Sardarpura</h4>
              </div>
              <div className="testimonial-card">
                <div className="stars">{[...Array(5)].map((_,i)=><Star key={i} size={14} fill="currentColor" />)}</div>
                <p>"Excellent cockroach control service. My kitchen is finally pest-free!"</p>
                <h4>- Priya Rathore, Ratanada</h4>
              </div>
            </div>

            <h3>Pricing in Jodhpur</h3>
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
                <h4>How much does pest control cost in Jodhpur?</h4>
                <p>Pest control in Jodhpur starts from ₹449 for general pests.</p>
              </div>
              <div className="faq-item">
                <h4>Do you serve all of Jodhpur?</h4>
                <p>Yes, we serve all areas including Sardarpura, Ratanada, and surrounding regions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Best Pest Control in Jodhpur</h2>
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

export default Jodhpur;