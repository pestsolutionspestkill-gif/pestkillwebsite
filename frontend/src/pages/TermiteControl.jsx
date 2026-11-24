import { Link } from 'react-router-dom';
import { Phone, Layers, TreeDeciduous, Bug, AlertTriangle } from 'lucide-react';
import { RATES } from '../data/catalog';
import './ServiceDetail.css';
import CityLinks from '../components/CityLinks';

const TermiteControl = () => {
  return (
    <div className="service-page">
      <section className="service-hero">
        <div className="container">
          <span className="service-badge">Professional Service</span>
          <h1>Professional <span className="text-gradient">Termite Control</span> Treatment in Rajasthan</h1>
          <p className="hero-desc">Protect your home from silent destroyers. Get professional termite treatment with 5-10 years warranty.</p>
          <div className="hero-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call Now</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="service-content">
            <h2>Best Termite Control Treatment in Rajasthan</h2>
            <p>Termites are silent destroyers that can cause crores worth of damage to your property. At Pest Kill Solutions, we provide <strong>professional termite control treatment across Rajasthan</strong> with guaranteed results.</p>
            
            <h3>Signs of Termite Infestation</h3>
            <div className="symptoms-grid">
              <div className="symptom-card">
                <span className="symptom-icon"><Layers size={28} /></span>
                <h4>Mud Tubes</h4>
                <p>On walls or foundations</p>
              </div>
              <div className="symptom-card">
                <span className="symptom-icon"><TreeDeciduous size={28} /></span>
                <h4>Hollow Wood</h4>
                <p>Wood sounds hollow when tapped</p>
              </div>
              <div className="symptom-card">
                <span className="symptom-icon"><Bug size={28} /></span>
                <h4>Swarmers</h4>
                <p>Flying termites in spring</p>
              </div>
              <div className="symptom-card">
                <span className="symptom-icon"><AlertTriangle size={28} /></span>
                <h4>Wood Damage</h4>
                <p>Visible galleries or tunnels</p>
              </div>
            </div>

            <h3>Our Termite Control Services</h3>
            <div className="service-features">
              <div className="feature-card">
                <div className="feature-header">
                  <span className="feature-number">01</span>
                  <h4>Pre-Construction Treatment</h4>
                </div>
                <p>Chemical soil treatment done before foundation is laid. Creates a protective barrier around your foundation.</p>
                <ul>
                  <li>Soil treatment with Fipronil</li>
                  <li>Foundation barrier</li>
                  <li>Under-floor treatment</li>
                  <li>10 Years Warranty</li>
                </ul>
              </div>
              <div className="feature-card">
                <div className="feature-header">
                  <span className="feature-number">02</span>
                  <h4>Post-Construction Treatment</h4>
                </div>
                <p>For existing buildings with termite problems. No digging required.</p>
                <ul>
                  <li>Drilling & injection</li>
                  <li>Soil drenching</li>
                  <li>Wood treatment</li>
                  <li>5 Years Warranty</li>
                </ul>
              </div>
              <div className="feature-card">
                <div className="feature-header">
                  <span className="feature-number">03</span>
                  <h4>Furniture Treatment</h4>
                </div>
                <p>Specialized treatment for wooden furniture and antiques.</p>
                <ul>
                  <li>Injected treatment</li>
                  <li>Fumigation available</li>
                  <li>Surface coating</li>
                  <li>Safe for antiques</li>
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
                    <td>ENVU Agenda</td>
                    <td>Fipronil 2.92% EC</td>
                    <td>Soil treatment</td>
                  </tr>
                  <tr>
                    <td>Heranba Heranil Plus</td>
                    <td>Fipronil 5% SC</td>
                    <td>Wood treatment</td>
                  </tr>
                  <tr>
                    <td>Arbuda Termiticide</td>
                    <td>Chlorpyrifos 20% EC</td>
                    <td>Perimeter</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>Termite Treatment Pricing in Rajasthan</h3>
            <div className="pricing-grid">
              <div className="pricing-card popular">
                <span className="popular-badge">Existing buildings</span>
                <h4>Post-Construction</h4>
                <div className="price">₹{RATES.termitePost.min}–{RATES.termitePost.max}<span>/sq.ft.</span></div>
                <ul>
                  <li>Drilling & injection</li>
                  <li>Wood treatment</li>
                  <li>5 years warranty</li>
                </ul>
              </div>
              <div className="pricing-card">
                <h4>Pre-Construction</h4>
                <div className="price">₹{RATES.termitePre.min}–{RATES.termitePre.max}<span>/sq.ft.</span></div>
                <ul>
                  <li>Foundation treatment</li>
                  <li>Soil drenching</li>
                  <li>10 years warranty</li>
                </ul>
              </div>
              <div className="pricing-card">
                <h4>Porous Pipe System</h4>
                <div className="price">₹{RATES.porousPipe.min}–{RATES.porousPipe.max}<span>/sq.ft.</span></div>
                <ul>
                  <li>Pipes laid before flooring</li>
                  <li>Refill from outside, no drilling</li>
                  <li><Link to="/services/anti-termite-piping">How it works →</Link></li>
                </ul>
              </div>
            </div>

            <h3>Frequently Asked Questions</h3>
            <div className="faq-section">
              <div className="faq-item">
                <h4>How long does termite treatment take?</h4>
                <p>Post-construction treatment takes 1-3 days depending on area size. Pre-construction is done during building phase.</p>
              </div>
              <div className="faq-item">
                <h4>Is termite treatment safe for children?</h4>
                <p>Yes, after 24-48 hours of drying, it's completely safe. We use low-toxicity chemicals like Fipronil.</p>
              </div>
              <div className="faq-item">
                <h4>How long does the treatment last?</h4>
                <p>Our warranty is 5 years for post-construction and 10 years for pre-construction treatment.</p>
              </div>
              <div className="faq-item">
                <h4>Do you provide free inspection?</h4>
                <p>Yes, we offer free on-site inspection in all major cities of Rajasthan.</p>
              </div>
              <div className="faq-item">
                <h4>What causes termites in homes?</h4>
                <p>Termites are attracted to moisture, wood contact with soil, foundation cracks, and wooden furniture.</p>
              </div>
            </div>

            <h3>Cities We Serve</h3>
            <CityLinks />
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Protect Your Home from Termites</h2>
          <p>Get professional termite treatment with guaranteed results. Free inspection!</p>
          <div className="cta-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call: +91-63753-38302</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermiteControl;