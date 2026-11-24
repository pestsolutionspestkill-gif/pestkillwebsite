import { useState } from 'react';
import { Link } from 'react-router-dom';
import businessConfig from '../data/businessConfig';
import {
  Phone, MessageCircle, MapPin, ArrowRight, ArrowUpRight, Star, CheckCircle,
  Bug, BedDouble, ShieldCheck, Zap, Shield, Users, Wrench, Leaf, Tag,
  ClipboardList, Search, BadgeCheck, Award, Building2, Layers, Plus, Minus,
  Home as HomeIcon, Hotel, Hospital, Warehouse, UtensilsCrossed, HardHat,
} from 'lucide-react';
import { pests, RATES, homeRateLine, homeFrom } from '../data/catalog';
import { FounderSection } from '../components/Founder';
import OnlyAtPestKill from '../components/OnlyAtPestKill';
import { submitLead } from '../lib/api';
import { media, pestMedia, sectorMedia } from '../data/media';
import './Home.css';
import { HOME_FAQS as faqs } from '../data/homeFaqs';
import { CITIES, cityPath } from '../data/rajasthan';

const services = [
  { name: 'Anti-Termite Piping System', slug: 'anti-termite-piping', icon: Layers, desc: 'For new construction: a porous pipe network laid under your foundation. It can be refilled from outside for 10–15 years, with no drilling and no broken floors.', tag: 'New · Pre-construction' },
  { name: 'Termite Treatment', slug: 'termite-control', icon: Bug, desc: 'Pre & post-construction anti-termite treatment with soil barrier and wood protection.', tag: 'Up to 10-year warranty' },
  { name: 'Cockroach Control', slug: 'cockroach-control', icon: Zap, desc: 'Odourless gel baiting and residual spray for kitchens, homes and restaurants.', tag: '90-day guarantee' },
  { name: 'Rodent Control', slug: 'rodent-control', icon: Shield, desc: 'Proofing, tamper-proof bait stations and monitoring for homes and godowns.', tag: '1-year warranty' },
  { name: 'Bed Bug Treatment', slug: 'bed-bugs', icon: BedDouble, desc: 'Combined heat, steam and chemical treatment that reaches every life stage.', tag: 'Two-visit protocol' },
  { name: 'General Pest Control', slug: 'general-pest-control', icon: ShieldCheck, desc: 'Annual maintenance contracts covering ants, spiders, flies and crawling insects.', tag: 'Annual contract' },
];

const whyChooseUs = [
  { title: 'Certified Technicians', text: 'Trained, background-verified staff in uniform on every visit.', icon: Users },
  { title: 'Professional Equipment', text: 'Industrial sprayers, drilling rigs and ULV foggers.', icon: Wrench },
  { title: 'Family-Safe Methods', text: 'Low-toxicity, government-approved formulations.', icon: Leaf },
  { title: 'Same-Day Response', text: 'Inspection slots available across Jaipur within hours.', icon: Zap },
  { title: 'Written Warranty', text: 'Every job documented with a warranty certificate.', icon: BadgeCheck },
  { title: 'Transparent Pricing', text: 'Fixed written quote after inspection. No surprises.', icon: Tag },
];

const process = [
  { icon: ClipboardList, title: 'Book', text: 'Call, WhatsApp or fill the form. We confirm a slot the same day.' },
  { icon: Search, title: 'Inspect', text: 'An expert surveys the site and identifies pest type and severity.' },
  { icon: Tag, title: 'Quote', text: 'You receive a fixed, itemised written quotation. No hidden costs.' },
  { icon: CheckCircle, title: 'Treat & Protect', text: 'Professional treatment, follow-up visits and warranty certificate.' },
];

const testimonials = [
  { name: 'Ramesh Jangid', location: 'Vidhyadhar Nagar, Jaipur', text: 'Had a termite problem in my kitchen cabinets. They came the same day, showed me the affected areas and gave a fair quote. Treatment was done properly.' },
  { name: 'Sunita Sharma', location: 'Sanganer, Jaipur', text: 'Cockroaches were a nightmare. Their gel treatment worked within a week and there have been no issues for three months. Price was reasonable.' },
  { name: 'Vijay Singh', location: 'Ajmer Road, Jaipur', text: 'Needed rodent control for our godown. The team was professional, set up bait stations and advised us on preventing future infestation.' },
];

const industries = [
  { icon: HomeIcon, title: 'Homes & Apartments' },
  { icon: HardHat, title: 'Builders & New Projects' },
  { icon: Hotel, title: 'Hotels & Resorts' },
  { icon: UtensilsCrossed, title: 'Restaurants & Food Units' },
  { icon: Hospital, title: 'Hospitals & Clinics' },
  { icon: Building2, title: 'Offices & IT Parks' },
  { icon: Warehouse, title: 'Warehouses & Godowns' },
  { icon: Award, title: 'Government Institutions' },
];


const cityLinks = Object.fromEntries(CITIES.map((c) => [c.name, cityPath(c.slug)]));

const Home = () => {
  const { phoneNumber, whatsappNumber, serviceCoverage, experience, brands } = businessConfig;
  const wa = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;
  const [formData, setFormData] = useState({ name: '', phone: '', service: '' });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const pricesFrom = homeFrom;

  const stats = [
    { value: '8+', label: 'Years of service' },
    { value: `${experience.governmentProjects}+`, label: 'Government projects' },
    { value: `${serviceCoverage.length}+`, label: 'Cities covered' },
    { value: '100%', label: 'Satisfaction guarantee' },
  ];

  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setFormError('');
    try {
      await submitLead(
        { type: 'inspection', name: formData.name, phone: formData.phone, service: formData.service || null, source: 'home-hero' },
        { whatsappNumber, whatsappText: `Hello PestKill, I'd like a free inspection.\nName: ${formData.name}\nPhone: ${formData.phone}\nService: ${formData.service || 'Not specified'}` },
      );
      setSubmitted(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="container hero-center">
          <h1 className="hero-kicker fade-up">PestKill · Pest control in Jaipur &amp; all Rajasthan</h1>
          <p className="hero-title fade-up d1">
            Pest-free.<br /><span className="text-gradient">Guaranteed.</span>
          </p>
          <p className="hero-subtitle fade-up d2">
            Termite, cockroach, rodent and bed bug control for homes and businesses — by trained specialists, with a written warranty.
          </p>
          <div className="hero-actions fade-up d3">
            <Link to="/book" className="btn btn-primary btn-lg">Book Online</Link>
            <a href="#inspect" className="link-more">Get a free inspection <ArrowRight size={17} /></a>
          </div>
          <div className="hero-proof fade-up d4">
            <span className="hero-stars">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</span>
            <span><strong>4.9/5</strong> from homeowners & businesses across Jaipur</span>
          </div>
        </div>
        <div className="container fade-up d4">
          <figure className="hero-media photo-frame">
            <img src={media.technician.src} alt={media.technician.alt} />
            <figcaption className="hero-media-caption">
              <strong>From {pricesFrom}</strong>
              <span>Inspection · Treatment · Written warranty</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="stat-item">
                <span className="stat-number">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSPECTION TILE */}
      <OnlyAtPestKill />

      <section className="section-sm" id="inspect">
        <div className="container">
          <div className="inspect-tile">
            <div className="inspect-copy">
              <span className="eyebrow light">Free inspection</span>
              <h2>A specialist at your door. <span className="text-gradient">Within hours.</span></h2>
              <p>Tell us what you're seeing. We'll call you back within 30 minutes to schedule a free, no-obligation inspection.</p>
              <a href={`tel:${phoneNumber}`} className="link-more light"><Phone size={16} /> Or call {phoneNumber}</a>
            </div>
          <div className="hero-card">
            <div className="hero-card-head">
              <span className="icon-tile"><ShieldCheck size={22} /></span>
              <div>
                <h3>Book a free inspection</h3>
                <p>We call you back within 30 minutes.</p>
              </div>
            </div>
            {submitted ? (
              <div className="success-message">
                <CheckCircle size={44} />
                <h3>Request received</h3>
                <p>Our team will contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="hero-form">
                <input type="text" placeholder="Full name" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                <input type="tel" placeholder="Phone number" className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                <select className="form-input" value={formData.service} onChange={e => setFormData({ ...formData, service: e.target.value })}>
                  <option value="">Select a service</option>
                  {services.map(s => <option key={s.slug} value={s.name}>{s.name}</option>)}
                </select>
                {formError && <p className="form-error" role="alert">{formError}</p>}
                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={sending}>{sending ? 'Sending…' : <>Request Inspection <ArrowRight size={18} /></>}</button>
                <p className="hero-form-note"><BadgeCheck size={14} /> No obligation. Free across Jaipur.</p>
              </form>
            )}
          </div>
          </div>
        </div>
      </section>

      {/* AUDIENCE SPLIT */}
      <section className="section-sm audience-section">
        <div className="container audience-grid">
          <Link to="/services" className="audience-card">
            <span className="icon-tile"><HomeIcon size={24} /></span>
            <div>
              <span className="audience-kicker">For your home</span>
              <h3>Residential pest control</h3>
              <p>Odourless, family-safe treatments with fixed starting prices and online booking.</p>
            </div>
            <span className="audience-cta">Explore home services <ArrowRight size={16} /></span>
          </Link>
          <Link to="/business" className="audience-card dark">
            <span className="icon-tile"><Building2 size={24} /></span>
            <div>
              <span className="audience-kicker">For your business</span>
              <h3>Commercial pest management</h3>
              <p>Audit-ready programmes for food, healthcare, hospitality, warehouses and offices.</p>
            </div>
            <span className="audience-cta">Explore business solutions <ArrowRight size={16} /></span>
          </Link>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Our Expertise</span>
            <h2 className="section-title">Complete pest management, <span className="text-gradient">done right</span></h2>
            <p className="section-subtitle">Targeted treatments for every pest, backed by proven chemistry and documented warranties.</p>
          </div>
          <div className="home-services">
            {services.map(({ icon: Icon, ...s }, i) => (
              <Link key={s.slug} to={`/services/${s.slug}`} className={`home-service ${i === 0 ? 'featured' : ''}`}>
                <div className="home-service-top">
                  <span className="icon-tile"><Icon size={24} /></span>
                  <ArrowUpRight size={20} className="home-service-arrow" />
                </div>
                <h3>{s.name}</h3>
                <p>{s.desc}</p>
                <span className="home-service-tag">{s.tag}</span>
              </Link>
            ))}
            <Link to="/services" className="home-service home-service-cta">
              <span className="eyebrow light">Not sure?</span>
              <h3>Talk to an expert</h3>
              <p>Describe the problem and we'll recommend the right treatment.</p>
              <span className="btn btn-white btn-sm">View all services <ArrowRight size={16} /></span>
            </Link>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="section bg-surface">
        <div className="container why-layout">
          <div className="why-visual">
            <img src={sectorMedia['food-processing'].src} alt={sectorMedia['food-processing'].alt} loading="lazy" />
            <div className="why-badge">
              <Award size={28} />
              <div>
                <strong>{experience.governmentProjects}+ Govt. projects</strong>
                <span>and multinational clients</span>
              </div>
            </div>
          </div>
          <div>
            <div className="section-head left">
              <span className="eyebrow">Why PestKill</span>
              <h2 className="section-title">The standard others are <span className="text-gradient">measured by</span></h2>
              <p className="section-subtitle">We combine industrial-grade equipment with genuine products from India's leading manufacturers — and stand behind every job in writing.</p>
            </div>
            <div className="why-grid">
              {whyChooseUs.map(({ icon: Icon, title, text }) => (
                <div key={title} className="why-card">
                  <span className="why-icon"><Icon size={20} /></span>
                  <div>
                    <h4>{title}</h4>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How It Works</span>
            <h2 className="section-title">Four steps to a <span className="text-gradient">pest-free</span> space</h2>
          </div>
          <div className="process-grid">
            {process.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="process-card">
                <div className="process-num">0{i + 1}</div>
                <span className="process-icon"><Icon size={24} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PIPING HIGHLIGHT */}
      <section className="section-sm">
        <div className="container">
          <Link to="/services/anti-termite-piping" className="piping-band">
            <div className="piping-band-copy">
              <span className="eyebrow light">Building a new home?</span>
              <h2>Anti-termite treatment using <span className="text-gradient">porous pipe system</span></h2>
              <p>A refillable chemical barrier installed under the foundation before flooring. It gives 10–15 years of protection, and future re-treatment never needs drilling.</p>
              <span className="btn btn-primary">Explore the system <ArrowRight size={16} /></span>
            </div>
            <ul className="piping-band-points">
              <li><strong>10–15 yrs</strong><span>Protection with refills</span></li>
              <li><strong>₹{RATES.porousPipe.min}–{RATES.porousPipe.max}</strong><span>Per sq.ft.</span></li>
              <li><strong>0</strong><span>Floor drilling ever</span></li>
            </ul>
          </Link>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="section bg-surface">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Industries We Serve</span>
            <h2 className="section-title">From family homes to <span className="text-gradient">government campuses</span></h2>
            <p className="section-subtitle">Each property gets a treatment plan built around its layout, occupancy and hygiene standards.</p>
          </div>
          <div className="industries-grid">
            {industries.map(({ icon: Icon, title }) => (
              <div key={title} className="industry-item">
                <span className="icon-tile"><Icon size={22} /></span>
                <span>{title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PEST LIBRARY */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Pest Library</span>
            <h2 className="section-title">Know what you're <span className="text-gradient">dealing with</span></h2>
            <p className="section-subtitle">Identify common pests, spot the warning signs early and learn how to prevent them.</p>
          </div>
          <div className="pest-strip">
            {pests.map((p) => (
              <Link key={p.slug} to={`/pests/${p.slug}`} className="pest-chip">
                <img className="pest-chip-photo" src={pestMedia[p.slug].src} alt={pestMedia[p.slug].alt} loading="lazy" />
                <strong>{p.name}</strong>
                <small>{p.tag}</small>
              </Link>
            ))}
          </div>
          <div className="center-cta"><Link to="/pests" className="btn btn-outline">Open the pest library <ArrowRight size={16} /></Link></div>
        </div>
      </section>

      <FounderSection />

      {/* TESTIMONIALS */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow light">Client Stories</span>
            <h2 className="section-title">Trusted by families <span className="text-gradient">and businesses</span></h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t) => (
              <figure key={t.name} className="testimonial-card">
                <div className="testimonial-stars">{[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" />)}</div>
                <blockquote>"{t.text}"</blockquote>
                <figcaption>
                  <span className="avatar">{t.name.split(' ').map(n => n[0]).join('')}</span>
                  <span>
                    <strong>{t.name}</strong>
                    <small>{t.location}</small>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section className="brands-strip">
        <div className="container">
          <p>We use only genuine, registered products from</p>
          <div className="brands-row">
            {brands.map(b => <span key={b}>{b}</span>)}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container faq-layout">
          <div className="section-head left">
            <span className="eyebrow">FAQ</span>
            <h2 className="section-title">Questions, <span className="text-gradient">answered</span></h2>
            <p className="section-subtitle">Can't find what you're looking for? Our specialists are a call away.</p>
            <a href={`tel:${phoneNumber}`} className="btn btn-navy"><Phone size={16} /> {phoneNumber}</a>
          </div>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <div key={f.q} className={`faq-row ${openFaq === i ? 'open' : ''}`}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}>
                  <span>{f.q}</span>
                  {openFaq === i ? <Minus size={18} /> : <Plus size={18} />}
                </button>
                <div className="faq-a"><p>{f.a}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COVERAGE */}
      <section className="section bg-surface">
        <div className="container coverage-layout">
          <div className="section-head left">
            <span className="eyebrow">Service Coverage</span>
            <h2 className="section-title">Across Rajasthan, <span className="text-gradient">Delhi NCR & UP</span></h2>
            <p className="section-subtitle">Local teams in major cities with rapid response and on-site inspection.</p>
            <Link to="/contact" className="btn btn-navy">Check your area <ArrowRight size={16} /></Link>
          </div>
          <div className="coverage-grid">
            {serviceCoverage.slice(0, 12).map((city) => {
              const path = cityLinks[city];
              const inner = <><MapPin size={15} /> {city}</>;
              return path
                ? <Link key={city} to={path} className="coverage-item linked">{inner}<ArrowUpRight size={14} className="cov-arrow" /></Link>
                : <div key={city} className="coverage-item">{inner}</div>;
            })}
            <div className="coverage-item more"><Building2 size={15} /> +{serviceCoverage.length - 12} more cities</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
