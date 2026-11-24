import { Link } from 'react-router-dom';
import { Phone, AlertCircle, Check } from 'lucide-react';
import RateCards from '../components/RateCards';
import './ServiceDetail.css';
import CityLinks from '../components/CityLinks';
import Credentials from '../components/Credentials';

const CockroachControl = () => {
  return (
    <div className="service-page">
      <section className="service-hero">
        <div className="container">
          <span className="service-badge">Professional Service</span>
          <h1>Professional <span className="text-gradient">Cockroach Control</span> Services in Rajasthan</h1>
          <p className="hero-desc">Get rid of cockroaches permanently. Professional cockroach extermination for homes & businesses.</p>
          <div className="hero-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call Now</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="service-content">
            <h2>Best Cockroach Control Services in Rajasthan</h2>
            <p>Cockroaches are not just unsightly - they can spread diseases and trigger allergies. Our <strong>professional cockroach control services in Rajasthan</strong> provide permanent solutions for your home or business.</p>
            
            <h3>Types of Cockroaches We Treat</h3>
            <div className="symptoms-grid">
              <div className="symptom-card">
                <span className="symptom-icon"><AlertCircle size={28} /></span>
                <h4>German Cockroach</h4>
                <p>Small, light brown. Common in kitchens</p>
              </div>
              <div className="symptom-card">
                <span className="symptom-icon"><AlertCircle size={28} /></span>
                <h4>American Cockroach</h4>
                <p>Large, reddish-brown. Found in drains</p>
              </div>
              <div className="symptom-card">
                <span className="symptom-icon"><AlertCircle size={28} /></span>
                <h4>Brown-Banded Cockroach</h4>
                <p>Small, prefers warm places</p>
              </div>
              <div className="symptom-card">
                <span className="symptom-icon"><AlertCircle size={28} /></span>
                <h4>Oriental Cockroach</h4>
                <p>Dark brown, prefers damp areas</p>
              </div>
            </div>

            <h3>Our Cockroach Control Solutions</h3>
            <div className="service-features">
              <div className="feature-card">
                <div className="feature-header">
                  <span className="feature-number">01</span>
                  <h4>Gel Treatment</h4>
                </div>
                <p>Professional-grade cockroach gel applied in cracks and crevices. Safe for homes with children and pets.</p>
                <ul>
                  <li>Targeted application</li>
                  <li>Domino effect</li>
                  <li>Long-lasting results</li>
                  <li>Safe & odorless</li>
                </ul>
              </div>
              <div className="feature-card">
                <div className="feature-header">
                  <span className="feature-number">02</span>
                  <h4>Spray Treatment</h4>
                </div>
                <p>Residual spray treatment for immediate knockdown and long-term prevention.</p>
                <ul>
                  <li>Fast knockdown</li>
                  <li>Residual protection</li>
                  <li>Indoor & outdoor</li>
                  <li>Surface treatment</li>
                </ul>
              </div>
              <div className="feature-card">
                <div className="feature-header">
                  <span className="feature-number">03</span>
                  <h4>Complete Exclusion</h4>
                </div>
                <p>Seal entry points and provide preventive treatment to stop re-infestation.</p>
                <ul>
                  <li>Entry point sealing</li>
                  <li>Prevention tips</li>
                  <li>Maintenance plan</li>
                  <li>Guaranteed results</li>
                </ul>
              </div>
            </div>

            <h3>Products We Use</h3>
            <div className="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Technical Name</th>
                    <th>Application</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Arbuda Roach Away Gel</td>
                    <td>Fipronil 0.05% Gel</td>
                    <td>Cracks & crevices</td>
                  </tr>
                  <tr>
                    <td>Maxforce Forte</td>
                    <td>Fipronil 0.03% Gel</td>
                    <td>Bait stations</td>
                  </tr>
                  <tr>
                    <td>Heranba Heranil Gel</td>
                    <td>Fipronil Gel</td>
                    <td>Heavy infestation</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>Cockroach Control Pricing</h3>
            <RateCards includes={['Gel + spray treatment', 'Kitchen & bathrooms', 'Follow-up visit']} />

            <h3>Why Choose Our Cockroach Control?</h3>
            <div className="benefits-grid">
              <div className="benefit-item">
                <span className="benefit-icon"><Check size={18} /></span>
                <div>
                  <h4>100% Satisfaction</h4>
                  <p>Free re-treatment if cockroaches return within warranty period</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon"><Check size={18} /></span>
                <div>
                  <h4>Certified Experts</h4>
                  <p>Trained technicians with 15+ years experience</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon"><Check size={18} /></span>
                <div>
                  <h4>Safe Products</h4>
                  <p>Low-toxicity, pet & child-friendly solutions</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon"><Check size={18} /></span>
                <div>
                  <h4>Same-Day Service</h4>
                  <p>Quick response across Rajasthan</p>
                </div>
              </div>
            </div>

            <h3>Frequently Asked Questions</h3>
            <div className="faq-section">
              <div className="faq-item">
                <h4>How long does cockroach treatment take?</h4>
                <p>Treatment typically takes 1-2 hours depending on the size of the property. You can resume normal activities immediately after.</p>
              </div>
              <div className="faq-item">
                <h4>Is cockroach treatment safe for pets?</h4>
                <p>Yes, our gel treatments are completely safe for pets once dry. We use low-toxicity products that are pet-friendly.</p>
              </div>
              <div className="faq-item">
                <h4>How do cockroaches enter my home?</h4>
                <p>Cockroaches can enter through cracks, drains, vents, gaps in doors, and even on clothing. We provide exclusion services to prevent re-entry.</p>
              </div>
              <div className="faq-item">
                <h4>Do you offer annual maintenance contracts?</h4>
                <p>Yes, we offer annual maintenance contracts with quarterly treatments. Contact us for a quote for your home or business.</p>
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
          <h2>Get Rid of Cockroaches Forever</h2>
          <p>Professional cockroach control with guaranteed results. Book today!</p>
          <div className="cta-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call: +91-63753-38302</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CockroachControl;