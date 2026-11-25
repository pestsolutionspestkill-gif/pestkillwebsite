import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import businessConfig from '../data/businessConfig';
import { AlertTriangle, CheckCircle, Phone, MessageCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { extraServices } from '../data/extraServices';
import { getService } from '../data/catalog';
import { serviceMedia, creditLine } from '../data/media';
import { submitLead } from '../lib/api';
import './ServiceDetail.css';
import Credentials, { LicenceLine } from '../components/Credentials';
import FormError from '../components/FormError';

const baseServices = {
  'termite-control': {
    name: 'Termite Treatment',
    title: 'Complete Termite Control & Prevention',
    desc: 'Protect your home with professional pre- and post-construction termite treatment. Warranty terms are written on your quotation.',
    problemTitle: 'What is Termite Problem?',
    problemDesc: 'Termites are silent destroyers that can cause massive damage to your property. They feed on wood, paper, and cellulose materials, weakening the structural integrity of your home. In India, subterranean termites are the most common species causing damage to residential and commercial buildings.',
    diseasesTitle: 'Health & Property Risks',
    diseases: [
      'Structural damage to wooden beams and furniture',
      'Weakened foundation causing safety hazards',
      'Costly repairs running into lakhs of rupees',
      'Reduced property value',
      'Can destroy wooden furniture worth lakhs',
      'Electrical wiring damage risk'
    ],
    treatmentTitle: 'Our Treatment Process',
    treatments: [
      'Free inspection and soil analysis',
      'Drilling and chemical soil treatment',
      'Wood treatment for affected areas',
      'Chemical barrier creation around foundation',
      'Ventilation improvement recommendations',
      'Annual monitoring visits on request'
    ],
    preventionTitle: 'How to Prevent Termites',
    prevention: [
      'Fix water leakage immediately',
      'Keep firewood away from house',
      'Ensure proper ventilation in basements',
      'Seal cracks in foundation',
      'Avoid wood-to-soil contact',
      'Annual professional inspection'
    ],
    features: ['Pre-construction treatment', 'Post-construction treatment', 'Soil treatment', 'Wood treatment', 'Written treatment report', 'Annual inspection on request']
  },
  'cockroach-control': {
    name: 'Cockroach Control',
    title: 'Professional Cockroach Elimination',
    desc: 'Complete cockroach control using gel baiting and spray treatment. Safe for children and pets.',
    problemTitle: 'What is Cockroach Problem?',
    problemDesc: 'Cockroaches are one of the most common household pests in India. They thrive in warm, humid environments and can be found in kitchens, bathrooms, and sewers. German cockroaches and American cockroaches are the most prevalent species in Indian homes.',
    diseasesTitle: 'Health Risks - Diseases Caused',
    diseases: [
      'Salmonella - causes food poisoning',
      'E. coli - stomach infections',
      'Dysentery - severe diarrhea',
      'Typhoid fever',
      'Allergies and asthma attacks',
      'Skin infections and rashes',
      'Giardia - intestinal parasite'
    ],
    treatmentTitle: 'Our Treatment Process',
    treatments: [
      'Detailed inspection of infested areas',
      'Gel baiting in cracks and crevices',
      'Spray treatment on hiding spots',
      'Dust application in wall voids',
      'Crack and crevice treatment',
      'Follow-up visit within 15 days'
    ],
    preventionTitle: 'How to Prevent Cockroaches',
    prevention: [
      'Keep kitchen clean and dry',
      'Store food in airtight containers',
      'Fix water leaks immediately',
      'Take out garbage daily',
      'Seal cracks and gaps',
      'Don\'t leave pet food overnight'
    ],
    features: ['Gel treatment', 'Spray application', 'Crack & crevice treatment', 'Follow-up visit', 'Written treatment report']
  },
  'rodent-control': {
    name: 'Rodent Control',
    title: 'Rat & Mouse Control Solutions',
    desc: 'Rat and mouse control with proofing, bait stations and monitoring.',
    problemTitle: 'What is Rodent Problem?',
    problemDesc: 'Rats and mice are harmful pests that can infest homes, offices, and warehouses. They breed rapidly and can cause extensive damage to property and health. The most common rodents in India are house mouse, roof rat, and Norway rat.',
    diseasesTitle: 'Health Risks - Diseases from Rodents',
    diseases: [
      'Hantavirus - severe lung infection',
      'Leptospirosis - kidney infection',
      'Salmonellosis - food poisoning',
      'Plague - if untreated can be fatal',
      'Rat-bite fever',
      'Typhus through fleas',
      'Trichinosis from contaminated food',
      'Asthma and allergies from droppings'
    ],
    treatmentTitle: 'Our Treatment Process',
    treatments: [
      'Complete inspection for entry points',
      'Rodent proofing - sealing gaps',
      'Placement of tamper-resistant bait stations',
      'Snap traps and glue boards deployment',
      'Tracking dust for hidden nests',
      'Regular monitoring and maintenance'
    ],
    preventionTitle: 'How to Prevent Rodents',
    prevention: [
      'Seal all entry points larger than 6mm',
      'Store food in metal containers',
      'Keep surroundings clean',
      'Remove clutter and debris',
      'Trim trees and bushes away from building',
      'Secure garbage bins'
    ],
    features: ['Rat control', 'Mouse control', 'Proofing solutions', 'Monitoring stations', 'Written treatment report']
  },
  'bed-bugs': {
    name: 'Bed Bug Treatment',
    title: 'Bed Bug Extermination Service',
    desc: 'Heat treatment combined with chemical application. Complete elimination with follow-up.',
    problemTitle: 'What is Bed Bug Problem?',
    problemDesc: 'Bed bugs are small, flat, reddish-brown insects that feed on human blood. They hide in mattresses, furniture, and cracks during the day and come out at night to feed. Bed bug infestations have increased dramatically in recent years due to increased travel.',
    diseasesTitle: 'Health Risks - Problems Caused',
    diseases: [
      'Itchy red bite marks',
      'Allergic reactions to bites',
      'Secondary skin infections from scratching',
      'Insomnia and anxiety',
      'Anemia in severe cases',
      'Psychological distress',
      'Restlessness and disturbed sleep'
    ],
    treatmentTitle: 'Our Treatment Process',
    treatments: [
      'Detailed inspection of all hiding spots',
      'Heat treatment (45-50°C) for mattresses',
      'Chemical spray treatment',
      'Steam treatment for furniture',
      'Mattress and pillow encasement',
      'Follow-up treatment after 15 days'
    ],
    preventionTitle: 'How to Prevent Bed Bugs',
    prevention: [
      'Inspect hotel rooms while traveling',
      'Keep luggage away from beds',
      'Wash bedding in hot water regularly',
      'Vacuum mattresses frequently',
      'Avoid buying second-hand furniture',
      'Seal cracks in bedroom walls'
    ],
    features: ['Heat treatment', 'Chemical treatment', 'Steam treatment', 'Furniture treatment', 'Follow-up']
  },
  'general-pest-control': {
    name: 'General Pest Control',
    title: 'Annual Pest Control Contract',
    desc: 'Complete annual protection for all common pests. Regular maintenance and emergency support.',
    problemTitle: 'What is General Pest Problem?',
    problemDesc: 'General pest control covers multiple pests including ants, spiders, flies, silverfish, and other insects that invade homes and offices. These pests can contaminate food, damage property, and spread diseases. Each pest has different behavior and requires specific treatment.',
    diseasesTitle: 'Health Risks from Common Pests',
    diseases: [
      'Ants - food contamination',
      'Flies - 100+ disease-causing bacteria',
      'Spiders - venomous bites in some cases',
      'Silverfish - damage to books and clothes',
      'Mosquitoes - dengue, malaria, chikungunya',
      'Ticks - Lyme disease',
      'Lice - skin irritation'
    ],
    treatmentTitle: 'Our Treatment Process',
    treatments: [
      'Quarterly spray treatment',
      'Gel baiting for cockroaches and ants',
      'Mosquito fogging (as needed)',
      'Rodent monitoring stations',
      'Emergency call-out service',
      'Detailed inspection reports'
    ],
    preventionTitle: 'How to Prevent Pests',
    prevention: [
      'Maintain clean surroundings',
      'Fix water leaks promptly',
      'Store food properly',
      'Remove standing water',
      'Seal entry points',
      'Regular pest control service'
    ],
    features: ['Cockroach control', 'Ant control', 'Spider control', 'Fly control', 'Annual contract', 'Emergency support']
  }
};


const services = Object.fromEntries(
  Object.entries({ ...baseServices, ...extraServices }).map(([slug, s]) => [slug, { ...s, photo: serviceMedia[slug] }]),
);

const ServiceDetail = () => {
  const { slug } = useParams();
  const { phoneNumber } = businessConfig;
  const service = services[slug];
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const wa = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`;
  const HeroIcon = getService(slug)?.icon;

  if (!service) {
    return (
      <div className="sd-page sd-notfound">
        <div className="container">
          <h1>Service not found</h1>
          <p>The service you're looking for doesn't exist.</p>
          <Link to="/services" className="btn btn-primary">View all services <ArrowRight size={16} /></Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setFormError('');
    try {
      await submitLead(
        { type: 'quote', service: service.name, name: form.name, phone: form.phone, message: form.message, source: `service:${slug}` },
        { whatsappNumber: phoneNumber, whatsappText: `Hello PestKill, I'm interested in ${service.name}. Name: ${form.name}, Phone: ${form.phone}, Message: ${form.message}` },
      );
      setSent(true);
    } catch (err) {
      setFormError(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="sd-page">
      <section className="sd-hero">
        <div className="container sd-hero-inner">
          <div>
            <Link to="/services" className="sd-back"><ArrowLeft size={16} /> All services</Link>
            <span className="eyebrow light">{service.name}</span>
            <h1>{service.title}</h1>
            <p>{service.desc}</p>
            <div className="sd-hero-actions">
              <a href="#quote" className="btn btn-primary btn-lg">Get Free Quote <ArrowRight size={18} /></a>
              <a href={`tel:${phoneNumber}`} className="btn btn-ghost btn-lg"><Phone size={18} /> {phoneNumber}</a>
            </div>
          </div>
          {service.photo ? (
            <figure className="sd-hero-media">
              <img src={service.photo.src} alt={service.photo.alt} />
              <figcaption>{creditLine(service.photo)}</figcaption>
            </figure>
          ) : (
            <div className="sd-hero-panel">
              <span className="icon-tile">{HeroIcon ? <HeroIcon size={26} /> : <CheckCircle size={26} />}</span>
              <h3>What's included</h3>
              <ul>
                {service.features.slice(0, 5).map((f) => <li key={f}><CheckCircle size={16} />{f}</li>)}
              </ul>
              <Link to={`/book?service=${slug}`} className="btn btn-primary btn-block">Book online <ArrowRight size={16} /></Link>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container sd-narrow">
          <span className="eyebrow">The Problem</span>
          <h2>{service.problemTitle}</h2>
          <p className="sd-lead">{service.problemDesc}</p>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Risks</span>
            <h2 className="section-title">{service.diseasesTitle}</h2>
          </div>
          <div className="sd-risk-grid">
            {service.diseases.map((d) => (
              <div key={d} className="sd-risk"><AlertTriangle size={18} /><span>{d}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Our Method</span>
            <h2 className="section-title">{service.treatmentTitle}</h2>
          </div>
          <div className="sd-steps">
            {service.treatments.map((t, i) => (
              <div key={t} className="sd-step"><span>{String(i + 1).padStart(2, '0')}</span><p>{t}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container sd-split">
          <div>
            <span className="eyebrow">Prevention</span>
            <h2>{service.preventionTitle}</h2>
            <ul className="sd-checklist">
              {service.prevention.map((tip) => <li key={tip}><CheckCircle size={18} />{tip}</li>)}
            </ul>
          </div>
          <div className="sd-features">
            <h3>What's included</h3>
            <div className="sd-chips">
              {service.features.map((f) => <span key={f}><CheckCircle size={14} />{f}</span>)}
            </div>
          </div>
        </div>
      </section>

      <Credentials only={['pco']} compact title="Licensed pest management service" intro="Every treatment is carried out under our pest control licence by trained technicians." />

      <section className="section" id="quote">
        <div className="container">
          <div className="sd-quote">
            <div className="sd-quote-copy">
              <span className="eyebrow light">Free Inspection</span>
              <h2>Get a quote for {service.name.toLowerCase()}</h2>
              <p>Share a few details and our specialist will call you back during working hours.</p>
              <div className="sd-quote-links">
                <a href={`tel:${phoneNumber}`}><Phone size={16} /> Call now</a>
                <a href={wa}><MessageCircle size={16} /> WhatsApp</a>
              </div>
            </div>
            <div className="sd-quote-form">
              {sent ? (
                <div className="success-message">
                  <CheckCircle size={44} />
                  <h3>Thank you</h3>
                  <p>Our team will contact you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <input className="form-input" type="text" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  <input className="form-input" type="tel" placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                  <textarea className="form-input" rows="3" placeholder="Describe your pest problem" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                  <FormError error={formError} />
                  <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={sending}>{sending ? 'Sending…' : <>Get Free Quote <ArrowRight size={18} /></>}</button>
                  <LicenceLine kind="pco" />
                </form>
              )}
            </div>
          </div>
          <p className="sd-author">Written by the <strong>PestKill Expert Team</strong> — licensed pest control specialists serving customers across India from Jaipur.</p>
        </div>
      </section>
    </div>
  );
};

export default ServiceDetail;
