import { Link } from 'react-router-dom';
import { Phone, MapPin, Award, Star, Zap, Check, Bug, BedDouble } from 'lucide-react';
import RateCards from '../components/RateCards';
import { RATES, homeRateLine } from '../data/catalog';
import './ServiceDetail.css';

const Jaipur = () => {
  return (
    <div className="service-page">
      <section className="service-hero">
        <div className="container">
          <span className="service-badge"><MapPin size={14} style={{marginRight:'4px',verticalAlign:'middle'}} />Jaipur</span>
          <h1>Best <span className="text-gradient">Pest Control Services</span> in Jaipur</h1>
          <p className="hero-desc">Professional pest control in Jaipur. Termite, cockroach, bed bug & rodent control. 15+ years experience.</p>
          <div className="hero-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call Now</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="service-content">
            <h2>Top Pest Control Company in Jaipur</h2>
            <p>Looking for the <strong>best pest control services in Jaipur</strong>? Pest Kill Solutions offers professional pest control treatment across all areas of Jaipur. Whether you need <strong>termite treatment in Jaipur</strong>, cockroach control, or bed bug removal - we've got you covered.</p>
            
            <h3>Why Jaipur Residents Trust Us?</h3>
            <div className="benefits-grid">
              <div className="benefit-item">
                <span className="benefit-icon"><Award size={22} /></span>
                <div>
                  <h4>100+ Projects in Jaipur</h4>
                  <p>Successfully completed pest control projects across Jaipur</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon"><Star size={22} /></span>
                <div>
                  <h4>4.9/5 Rating</h4>
                  <p>Highest rated pest control in Jaipur</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon"><Zap size={22} /></span>
                <div>
                  <h4>Same-Day Service</h4>
                  <p>Quick response across Jaipur</p>
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

            <h3>Our Services in Jaipur</h3>
            <div className="service-features">
              <div className="feature-card">
                <h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><Bug size={18} />Termite Control Jaipur</h4>
                <p>Pre & post construction treatment. 5-10 years warranty.</p>
                <Link to="/termite-control">Learn More →</Link>
              </div>
              <div className="feature-card">
                <h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><Zap size={18} />Cockroach Control Jaipur</h4>
                <p>Permanent cockroach elimination. Gel & spray treatment.</p>
                <Link to="/cockroach-control">Learn More →</Link>
              </div>
              <div className="feature-card">
                <h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><BedDouble size={18} />Bed Bug Treatment Jaipur</h4>
                <p>Heat & chemical treatment. Complete eradication.</p>
                <Link to="/bed-bug-treatment">Learn More →</Link>
              </div>
              <div className="feature-card">
                <h4 style={{display:'flex',alignItems:'center',gap:'8px'}}><MapPin size={18} />Rodent Control Jaipur</h4>
                <p>Rat & mouse control. Safe removal services.</p>
                <Link to="/services">Learn More →</Link>
              </div>
            </div>

            <h3>Areas We Serve in Jaipur</h3>
            <div className="cities-grid">
              <div className="city-area">Vaishali Nagar</div>
              <div className="city-area">MI Road</div>
              <div className="city-area">C Scheme</div>
              <div className="city-area">JLN Marg</div>
              <div className="city-area">Rajapark</div>
              <div className="city-area">Bani Park</div>
              <div className="city-area">Sanganer</div>
              <div className="city-area">Pratap Nagar</div>
              <div className="city-area">Tonk Road</div>
              <div className="city-area">Ajmer Road</div>
              <div className="city-area">Vidyadhar Nagar</div>
              <div className="city-area">Gangapur</div>
            </div>

            <h3>Jaipur Customer Reviews</h3>
            <div className="testimonials-grid">
              <div className="testimonial-card">
                <div className="stars">{[...Array(5)].map((_,i)=><Star key={i} size={14} fill="currentColor" />)}</div>
                <p>"Best termite treatment in Jaipur! They saved my villa furniture in Vaishali Nagar. Very professional team."</p>
                <h4>- Vikram Singh, Vaishali Nagar</h4>
              </div>
              <div className="testimonial-card">
                <div className="stars">{[...Array(5)].map((_,i)=><Star key={i} size={14} fill="currentColor" />)}</div>
                <p>"Got cockroach control done from Pest Kill. No more roaches in my kitchen on MI Road. Highly recommended!"</p>
                <h4>- Anita Sharma, MI Road</h4>
              </div>
              <div className="testimonial-card">
                <div className="stars">{[...Array(5)].map((_,i)=><Star key={i} size={14} fill="currentColor" />)}</div>
                <p>"Excellent bed bug treatment in Jaipur. They used heat treatment and it worked perfectly. Great service!"</p>
                <h4>- Mohammad Khan, C Scheme</h4>
              </div>
            </div>

            <h3>Our Process in Jaipur</h3>
            <div className="process-steps">
              <div className="process-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Free Inspection</h4>
                  <p>Our expert visits your Jaipur property</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Diagnosis</h4>
                  <p>Identify pest type & severity</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Treatment</h4>
                  <p>Professional treatment</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Follow-up</h4>
                  <p>Ensure complete eradication</p>
                </div>
              </div>
            </div>

            <h3>Pricing in Jaipur</h3>
            <RateCards withTermite />

            <h3>Frequently Asked Questions</h3>
            <div className="faq-section">
              <div className="faq-item">
                <h4>How much does pest control cost in Jaipur?</h4>
                <p>Pest control in Jaipur is {homeRateLine}. Anti-termite treatment is ₹{RATES.termitePost.min}–{RATES.termitePost.max} per sq.ft. for existing buildings and ₹{RATES.termitePre.min}–{RATES.termitePre.max} per sq.ft. before construction.</p>
              </div>
              <div className="faq-item">
                <h4>Do you provide free inspection in Jaipur?</h4>
                <p>Yes, we offer free on-site inspection across all areas of Jaipur.</p>
              </div>
              <div className="faq-item">
                <h4>How long does treatment take in Jaipur?</h4>
                <p>Most treatments complete within 1-3 hours. Termite treatment may take 1-3 days.</p>
              </div>
              <div className="faq-item">
                <h4>Which areas of Jaipur do you serve?</h4>
                <p>We serve all areas including Vaishali Nagar, MI Road, C Scheme, JLN Marg, Sanganer, Tonk Road, and more.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Best Pest Control in Jaipur</h2>
          <p>Book your free inspection today! Professional service across all Jaipur areas.</p>
          <div className="cta-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call: +91-63753-38302</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Jaipur;