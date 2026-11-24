import { Link } from 'react-router-dom';
import { Phone, AlertCircle, Scissors, Volume2, AlertTriangle } from 'lucide-react';
import RateCards from '../components/RateCards';
import './ServiceDetail.css';
import CityLinks from '../components/CityLinks';
import Credentials from '../components/Credentials';

const RodentControl = () => {
  return (
    <div className="service-page">
      <section className="service-hero">
        <div className="container">
          <span className="service-badge">Professional Service</span>
          <h1>Professional <span className="text-gradient">Rodent Control</span> Services in Rajasthan</h1>
          <p className="hero-desc">Get rid of rats & mice permanently. Safe & professional rodent control.</p>
          <div className="hero-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call Now</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="service-content">
            <h2>Professional Rodent Control in Rajasthan</h2>
            <p>Rats and mice can cause serious damage to your property and spread diseases. Our <strong>professional rodent control services in Rajasthan</strong> provide safe and effective solutions.</p>
            
            <h3>Signs of Rodent Infestation</h3>
            <div className="symptoms-grid">
              <div className="symptom-card">
                <span className="symptom-icon"><AlertCircle size={28} /></span>
                <h4>Droppings</h4>
                <p>Rodent droppings in cabinets</p>
              </div>
              <div className="symptom-card">
                <span className="symptom-icon"><Scissors size={28} /></span>
                <h4>Gnaw Marks</h4>
                <p>Damage to wires, wood</p>
              </div>
              <div className="symptom-card">
                <span className="symptom-icon"><Volume2 size={28} /></span>
                <h4>Scratching</h4>
                <p>Sounds in walls</p>
              </div>
              <div className="symptom-card">
                <span className="symptom-icon"><AlertTriangle size={28} /></span>
                <h4>Sightings</h4>
                <p>Live rodents seen</p>
              </div>
            </div>

            <h3>Our Rodent Control Solutions</h3>
            <div className="service-features">
              <div className="feature-card">
                <div className="feature-header">
                  <span className="feature-number">01</span>
                  <h4>Rodent Proofing</h4>
                </div>
                <p>Seal entry points and gaps to prevent rodents from entering.</p>
                <ul>
                  <li>Gap sealing</li>
                  <li>Vent mesh installation</li>
                  <li>Door sweeps</li>
                </ul>
              </div>
              <div className="feature-card">
                <div className="feature-header">
                  <span className="feature-number">02</span>
                  <h4>Trapping</h4>
                </div>
                <p>Strategic placement of professional traps for capture.</p>
                <ul>
                  <li>Glue boards</li>
                  <li>Snap traps</li>
                  <li>Live catch traps</li>
                </ul>
              </div>
              <div className="feature-card">
                <div className="feature-header">
                  <span className="feature-number">03</span>
                  <h4>Baiting</h4>
                </div>
                <p>Safe rodenticides for effective population control.</p>
                <ul>
                  <li>Professional baits</li>
                  <li>Safe placement</li>
                  <li>1-year warranty</li>
                </ul>
              </div>
            </div>

            <h3>Rodent Control Pricing</h3>
            <RateCards includes={['Inspection & proofing', 'Bait stations', 'Follow-up visit']} />

            <h3>Frequently Asked Questions</h3>
            <div className="faq-section">
              <div className="faq-item">
                <h4>Are rodenticides safe for children?</h4>
                <p>We use professional-grade products placed in secure locations inaccessible to children and pets.</p>
              </div>
              <div className="faq-item">
                <h4>How long does treatment take?</h4>
                <p>Most treatments complete within 2-3 hours. Complete eradication may take 1-2 weeks.</p>
              </div>
              <div className="faq-item">
                <h4>Do you offer warranty?</h4>
                <p>Yes, we offer 1-year warranty on all rodent control treatments.</p>
              </div>
            </div>

            <h3>Cities We Serve</h3>
            <CityLinks />
          </div>
        </div>
      </section>

      <Credentials only={['pco']} compact title="Licensed pest management service" intro="Treatment is carried out under our pest control licence by trained technicians." />

      <section className="cta-section">
        <div className="container">
          <h2>Get Rid of Rodents Forever</h2>
          <p>Professional rodent control with guaranteed results!</p>
          <div className="cta-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call: +91-63753-38302</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RodentControl;