import { Link } from 'react-router-dom';
import { Phone, MapPin, AlertCircle, Droplets, BedDouble, Search, Trash2, Luggage, Bug } from 'lucide-react';
import RateCards from '../components/RateCards';
import './ServiceDetail.css';

const BedBugTreatment = () => {
  return (
    <div className="service-page">
      <section className="service-hero">
        <div className="container">
          <span className="service-badge">Professional Service</span>
          <h1>Professional <span className="text-gradient">Bed Bug Treatment</span> in Rajasthan</h1>
          <p className="hero-desc">Say goodbye to bed bugs. Advanced heat & chemical treatment for complete eradication.</p>
          <div className="hero-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call Now</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="service-content">
            <h2>Best Bed Bug Treatment Services in Rajasthan</h2>
            <p>Bed bugs can turn your peaceful sleep into a nightmare. These nocturnal pests hide in mattresses, furniture, and cracks, feeding on your blood. Our <strong>professional bed bug treatment in Rajasthan</strong> provides complete eradication.</p>
            
            <h3>Signs of Bed Bug Infestation</h3>
            <div className="symptoms-grid">
              <div className="symptom-card">
                <span className="symptom-icon"><AlertCircle size={28} /></span>
                <h4>Bite Marks</h4>
                <p>Red itchy bites in a line</p>
              </div>
              <div className="symptom-card">
                <span className="symptom-icon"><Droplets size={28} /></span>
                <h4>Blood Stains</h4>
                <p>On sheets, pillows</p>
              </div>
              <div className="symptom-card">
                <span className="symptom-icon"><AlertCircle size={28} /></span>
                <h4>Dark Spots</h4>
                <p>Fecal spots on mattress</p>
              </div>
              <div className="symptom-card">
                <span className="symptom-icon"><Bug size={28} /></span>
                <h4>Live Insects</h4>
                <p>Seeing bugs or shed skins</p>
              </div>
            </div>

            <h3>Our Bed Bug Treatment Methods</h3>
            <div className="service-features">
              <div className="feature-card">
                <div className="feature-header">
                  <span className="feature-number">01</span>
                  <h4>Heat Treatment</h4>
                </div>
                <p>Advanced thermal remediation that raises room temperature to 50°C+ to kill bed bugs at all stages.</p>
                <ul>
                  <li>Chemical-free solution</li>
                  <li>Kills all life stages</li>
                  <li>Penetrates deep hiding areas</li>
                  <li>Safe for furniture</li>
                </ul>
              </div>
              <div className="feature-card">
                <div className="feature-header">
                  <span className="feature-number">02</span>
                  <h4>Chemical Treatment</h4>
                </div>
                <p>Professional-grade insecticides applied to cracks, crevices, and hiding spots.</p>
                <ul>
                  <li>Residual protection</li>
                  <li>Long-lasting results</li>
                  <li>Complete coverage</li>
                  <li>Follow-up treatment</li>
                </ul>
              </div>
              <div className="feature-card">
                <div className="feature-header">
                  <span className="feature-number">03</span>
                  <h4>Fumigation</h4>
                </div>
                <p>For severe infestations, we offer tent fumigation for complete property treatment.</p>
                <ul>
                  <li>Complete eradication</li>
                  <li>Deep penetration</li>
                  <li>Whole room treatment</li>
                  <li>Professional service</li>
                </ul>
              </div>
            </div>

            <h3>Our Treatment Process</h3>
            <div className="process-steps">
              <div className="process-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Inspection</h4>
                  <p>Free on-site inspection to identify infestation level and hiding spots</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Preparation</h4>
                  <p>We guide you on preparing the area for treatment</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Treatment</h4>
                  <p>Professional treatment using heat or chemical methods</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Follow-up</h4>
                  <p>Free re-treatment if needed within warranty period</p>
                </div>
              </div>
            </div>

            <h3>Bed Bug Treatment Pricing</h3>
            <RateCards includes={['Heat & chemical treatment', 'Mattress & furniture', 'Follow-up visit']} />

            <h3>Prevention Tips</h3>
            <div className="tips-list">
              <div className="tip-item">
                <span className="tip-icon"><BedDouble size={24} /></span>
                <div>
                  <h4>Regular Mattress Care</h4>
                  <p>Use mattress encasements and wash bedding weekly in hot water</p>
                </div>
              </div>
              <div className="tip-item">
                <span className="tip-icon"><Search size={24} /></span>
                <div>
                  <h4>Regular Inspection</h4>
                  <p>Check mattresses, furniture, and cracks regularly for signs</p>
                </div>
              </div>
              <div className="tip-item">
                <span className="tip-icon"><Trash2 size={24} /></span>
                <div>
                  <h4>Reduce Clutter</h4>
                  <p>Keep your home clean and reduce hiding spots for bed bugs</p>
                </div>
              </div>
              <div className="tip-item">
                <span className="tip-icon"><Luggage size={24} /></span>
                <div>
                  <h4>Careful Travel</h4>
                  <p>Check hotel rooms and wash clothes after traveling</p>
                </div>
              </div>
            </div>

            <h3>Frequently Asked Questions</h3>
            <div className="faq-section">
              <div className="faq-item">
                <h4>How long does bed bug treatment take?</h4>
                <p>Heat treatment takes 4-8 hours depending on room size. Chemical treatment takes 2-3 hours.</p>
              </div>
              <div className="faq-item">
                <h4>Do I need to throw away my mattress?</h4>
                <p>No! Our heat treatment kills bed bugs in mattresses without throwing them away. Only severely infested items may need disposal.</p>
              </div>
              <div className="faq-item">
                <h4>Are bed bugs visible to naked eye?</h4>
                <p>Adult bed bugs are visible (about 5mm). They're reddish-brown and hide in tiny cracks during the day.</p>
              </div>
              <div className="faq-item">
                <h4>Can I treat bed bugs myself?</h4>
                <p>DIY methods often fail. Professional treatment ensures complete eradication and warranty.</p>
              </div>
            </div>

            <h3>Cities We Serve</h3>
            <div className="cities-grid">
              <Link to="/jaipur" className="city-link"><MapPin size={14} style={{marginRight:'4px',verticalAlign:'middle'}} />Jaipur</Link>
              <Link to="/jodhpur" className="city-link"><MapPin size={14} style={{marginRight:'4px',verticalAlign:'middle'}} />Jodhpur</Link>
              <Link to="/udaipur" className="city-link"><MapPin size={14} style={{marginRight:'4px',verticalAlign:'middle'}} />Udaipur</Link>
              <Link to="/contact" className="city-link"><MapPin size={14} style={{marginRight:'4px',verticalAlign:'middle'}} />Kota</Link>
              <Link to="/contact" className="city-link"><MapPin size={14} style={{marginRight:'4px',verticalAlign:'middle'}} />Ajmer</Link>
              <Link to="/contact" className="city-link"><MapPin size={14} style={{marginRight:'4px',verticalAlign:'middle'}} />Bikaner</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Get Rid of Bed Bugs Completely</h2>
          <p>Professional bed bug treatment with heat & chemical solutions. Book today!</p>
          <div className="cta-buttons">
            <Link to="/contact" className="btn btn-primary">Get Free Quote</Link>
            <a href="tel:+916375338302" className="btn btn-outline"><Phone size={16} style={{marginRight:'6px',verticalAlign:'middle'}} />Call: +91-63753-38302</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BedBugTreatment;