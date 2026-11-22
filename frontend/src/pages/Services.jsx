import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import businessConfig from '../data/businessConfig';
import { Bug, Zap, Shield, BedDouble, ShieldCheck, Tag, Clock, CheckCircle, Layers, ArrowRight, Home as HomeIcon, Hotel, Hospital, Building2, Warehouse, GraduationCap, HardHat, UtensilsCrossed } from 'lucide-react';
import { scrollToId } from '../components/SmoothScroll';
import { submitLead } from '../lib/api';
import { RATES, sqftLabel, homeFrom } from '../data/catalog';
import './Services.css';

const Services = () => {
  const { phoneNumber, serviceCoverage } = businessConfig;
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get('service');

  const [formData, setFormData] = useState({ 
    name: '', phone: '', message: preselectedService ? `I need ${preselectedService} service` : '' 
  });
  const [success, setSuccess] = useState(false);

  const services = [
    {
      slug: 'anti-termite-piping', name: 'Anti-Termite Piping (Porous Pipe)', icon: <Layers size={32} />, link: '/services/anti-termite-piping', isNew: true,
      price: sqftLabel(RATES.porousPipe), duration: 'At foundation stage',
      description: 'Pre-construction porous pipe network laid under the foundation and floor. Termiticide can be refilled from outside for years — no drilling, no floor breaking.',
      features: ['Porous pipe layout under plinth', 'External refill points', 'Re-treatment without drilling', '10–15 year protection', 'Ideal for new homes & projects'],
    },
    {
      slug: 'termite-control', name: 'Termite Treatment', icon: <Bug size={32} />,
      price: `Post ₹${RATES.termitePost.min}–${RATES.termitePost.max} · Pre ₹${RATES.termitePre.min}–${RATES.termitePre.max} / sq.ft.`, duration: '2-4 hours',
      description: 'Complete termite treatment using advanced techniques. We offer both pre-construction and post-construction treatment with up to 10-year warranty.',
      features: ['Pre-construction treatment', 'Post-construction treatment', 'Soil treatment', 'Wood treatment', '10-year warranty'],
      signs: ['Mud tubes on walls', 'Hollow sound in wood', 'Discarded wings', 'Blisters on wood surface'],
      process: ['Inspection → Soil treatment → Wood treatment → Barrier creation → Final inspection']
    },
    { 
      slug: 'cockroach-control', name: 'Cockroach Control', icon: <Zap size={32} />,
      price: `From ${homeFrom} (1BHK)`, duration: '1-2 hours',
      description: 'Professional cockroach elimination using gel baiting and spray treatment. Safe for children and pets.',
      features: ['Gel treatment', 'Spray application', 'Crack & crevice treatment', 'Follow-up visit'],
      signs: ['Droppings', 'Egg cases', 'Foul odor', 'Live insects'],
      process: ['Inspection → Identification → Gel application → Spray treatment → Follow-up']
    },
    { 
      slug: 'rodent-control', name: 'Rodent Control', icon: <Shield size={32} />,
      price: `From ${homeFrom} (1BHK)`, duration: '1-3 hours',
      description: 'Complete rat and mouse control with permanent proofing solutions. We use both chemical and non-chemical methods.',
      features: ['Rat control', 'Mouse control', 'Proofing', 'Monitoring stations'],
      signs: ['Droppings', 'Gnaw marks', 'Urine stains', 'Scratching sounds'],
      process: ['Inspection → Rodent identification → Baiting → Proofing → Monitoring']
    },
    { 
      slug: 'bed-bugs', name: 'Bed Bug Treatment', icon: <BedDouble size={32} />,
      price: `From ${homeFrom} (1BHK)`, duration: '3-5 hours',
      description: 'Heat treatment combined with chemical application for complete bed bug elimination. Safe and effective.',
      features: ['Heat treatment', 'Chemical treatment', 'Steam treatment', 'Furniture treatment'],
      signs: ['Bite marks', 'Blood stains', 'Egg casings', 'Musty odor'],
      process: ['Inspection → Heat treatment → Chemical spray → Steam → Follow-up']
    },
    { 
      slug: 'general-pest-control', name: 'General Pest Control', icon: <ShieldCheck size={32} />,
      price: `From ${homeFrom} (1BHK)`, duration: '1-2 hours',
      description: 'Annual pest control contract covering all common pests. Regular maintenance and emergency support.',
      features: ['Cockroach control', 'Ant control', 'Spider control', 'Annual contract', 'Emergency support'],
      signs: ['Various insects', 'Droppings', 'Live insects', 'Damage'],
      process: ['Inspection → Treatment plan → Implementation → Monitoring']
    }
  ];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleServiceClick = (serviceName) => {
    setFormData({ ...formData, message: `I need ${serviceName} service` });
    scrollToId('book');
  };

  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setFormError('');
    try {
      await submitLead(
        { type: 'inspection', name: formData.name, phone: formData.phone, message: formData.message, source: 'services-page' },
        { whatsappNumber: businessConfig.whatsappNumber, whatsappText: `Hello PestKill, I'd like a free inspection.\nName: ${formData.name}\nPhone: ${formData.phone}\nDetails: ${formData.message}` },
      );
      setSuccess(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="services-page">
      {/* Hero */}
      <section className="services-hero">
        <div className="container">
          <span className="eyebrow light">Our Services</span>
          <h1>Professional <span className="text-gradient">Pest Control</span> Services</h1>
          <p>Termite, cockroach, rodent & bed bug control in Jaipur & Rajasthan. Get a free quote today!</p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section">
        <div className="container">
          <div className="services-grid">
            {services.map((service, index) => (
              <div key={index} id={service.slug} className="service-card">
                <div className="service-icon">{service.icon}</div>
                {service.isNew && <span className="service-new">New</span>}
                <h2>{service.name}</h2>
                <p className="service-desc">{service.description}</p>
                <div className="service-meta">
                  <span><Tag size={14} style={{marginRight:'4px',verticalAlign:'middle'}} />{service.price}</span>
                  <span><Clock size={14} style={{marginRight:'4px',verticalAlign:'middle'}} />{service.duration}</span>
                </div>
                <ul className="service-features">
                  {service.features.map((f, i) => <li key={i}><CheckCircle size={14} style={{marginRight:'6px',verticalAlign:'middle',color:'#0E9F6E'}} />{f}</li>)}
                </ul>
                <div className="service-actions">
                  <button className="btn btn-primary" onClick={() => handleServiceClick(service.name)}>Book Now</button>
                  <Link to={service.link || `/services/${service.slug}`} className="btn btn-outline">Details <ArrowRight size={16} /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="section bg-surface">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Who We Serve</span>
            <h2 className="section-title">Solutions for every <span className="text-gradient">property type</span></h2>
            <p className="section-subtitle">Every site gets a treatment plan matched to its layout, occupancy and hygiene requirements.</p>
          </div>
          <div className="industries-grid">
            {[
              { icon: HomeIcon, title: 'Homes & Apartments', text: 'Odourless gel and low-toxicity treatments safe for children and pets.' },
              { icon: HardHat, title: 'Builders & New Projects', text: 'Pre-construction soil treatment and porous pipe systems with completion certificates.' },
              { icon: Hotel, title: 'Hotels & Resorts', text: 'Discreet scheduled visits and bed bug protocols that keep rooms in service.' },
              { icon: UtensilsCrossed, title: 'Restaurants & Kitchens', text: 'Food-safe cockroach and rodent programmes with audit-ready service reports.' },
              { icon: Hospital, title: 'Hospitals & Clinics', text: 'Strict-hygiene treatments planned around patient areas and operation theatres.' },
              { icon: Building2, title: 'Offices & IT Parks', text: 'After-hours treatment and quarterly AMCs with minimal disruption to work.' },
              { icon: Warehouse, title: 'Warehouses & Godowns', text: 'Rodent bait stations, stored-grain pest control and fumigation support.' },
              { icon: GraduationCap, title: 'Schools & Institutions', text: 'Holiday-schedule treatments and government-approved chemistry only.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="industry-card">
                <span className="icon-tile"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AMC */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Annual Maintenance</span>
            <h2 className="section-title">Year-round protection with an <span className="text-gradient">AMC</span></h2>
            <p className="section-subtitle">Scheduled visits, priority call-outs and free re-treatment within the contract period. Final pricing depends on area and inspection.</p>
          </div>
          <div className="amc-grid">
            {[
              { name: 'Home Care', visits: '3 visits / year', items: ['Cockroach & ant control', 'Spider & crawling insects', 'Free re-treatment', 'Phone support'] },
              { name: 'Home Care Plus', visits: '4 visits / year', popular: true, items: ['Everything in Home Care', 'Rodent monitoring', 'Mosquito spray', 'Priority same-day visits'] },
              { name: 'Commercial', visits: 'Monthly / custom', items: ['Customised pest programme', 'Service logs & audit reports', 'Dedicated supervisor', 'Emergency response'] },
            ].map(plan => (
              <div key={plan.name} className={`amc-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <span className="amc-badge">Most chosen</span>}
                <h3>{plan.name}</h3>
                <p className="amc-visits">{plan.visits}</p>
                <ul>{plan.items.map(i => <li key={i}><CheckCircle size={16} />{i}</li>)}</ul>
                <button className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} btn-block`} onClick={() => handleServiceClick(`${plan.name} AMC`)}>Request quote</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="form-section section">
        <div className="container">
          <div className="form-card" id="book">
            <h2>Book Free Inspection</h2>
            <p>Fill the form and we'll call you within 30 minutes!</p>
            
            {success ? (
              <div className="success-message">
                <CheckCircle size={48} style={{color:'#0E9F6E'}} />
                <h3>Request Submitted!</h3>
                <p>We'll call you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <input type="text" name="name" placeholder="Your Name *" className="form-input" value={formData.name} onChange={handleChange} required />
                  <input type="tel" name="phone" placeholder="Phone Number *" className="form-input" value={formData.phone} onChange={handleChange} required />
                </div>
                <textarea name="message" placeholder="Tell us about your pest problem..." className="form-input" rows="3" value={formData.message} onChange={handleChange} />
                {formError && <p className="form-error" role="alert">{formError}</p>}
                <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? 'Sending…' : 'Get Free Quote'}</button>
                <p style={{fontSize: '0.85rem', color: '#666', marginTop: '12px', textAlign: 'center'}}>We respond within 15 minutes</p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">FAQ</span>
            <h2 className="section-title">Frequently asked <span className="text-gradient">questions</span></h2>
          </div>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>Are the chemicals safe?</h3>
              <p>Yes! We use government-approved, child and pet safe chemicals. All our technicians are certified.</p>
            </div>
            <div className="faq-item">
              <h3>How long does treatment take?</h3>
              <p>Most treatments complete within 1-4 hours depending on the area and infestation level.</p>
            </div>
            <div className="faq-item">
              <h3>Do you provide warranty?</h3>
              <p>Yes! We provide up to 10 years warranty on termite treatment and 1 year on general pest control.</p>
            </div>
            <div className="faq-item">
              <h3>What areas do you serve?</h3>
              <p>We serve {serviceCoverage.length}+ cities across Rajasthan, Delhi NCR, and UP.</p>
            </div>
            <div className="faq-item">
              <h3>What is the porous pipe anti-termite system?</h3>
              <p>A network of porous pipes laid under the foundation before flooring. Termiticide is pumped in through external refill points, so the chemical barrier can be renewed for years without drilling the floor.</p>
            </div>
            <div className="faq-item">
              <h3>Do I need to leave the house during treatment?</h3>
              <p>For gel treatments, no. For spray, termite drilling or bed bug treatment we usually advise keeping the treated rooms closed for 2–4 hours.</p>
            </div>
            <div className="faq-item">
              <h3>Will I get a written warranty?</h3>
              <p>Yes. Every job comes with a service report and a warranty card stating the treatment, chemicals used and warranty period.</p>
            </div>
            <div className="faq-item">
              <h3>Do you offer GST invoices for businesses?</h3>
              <p>Yes. Commercial and institutional clients receive GST invoices and, on request, service logs for audits.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;