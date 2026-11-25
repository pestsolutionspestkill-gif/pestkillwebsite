import { Link } from 'react-router-dom';
import businessConfig from '../data/businessConfig';
import {
  Phone, ArrowRight, ShieldCheck, Clock, IndianRupee, Hammer, Layers, Ruler, Droplets,
  RefreshCw, FlaskConical, CheckCircle, XCircle, Home, Building2, Landmark, HardHat,
  Wrench, FileCheck2, BookOpen,
} from 'lucide-react';
import PipeDiagram from '../components/PipeDiagram';
import { RATES, GST_NOTE } from '../data/catalog';

const pipe = RATES.porousPipe;
const pre = RATES.termitePre;
const post = RATES.termitePost;
import { media, creditLine } from '../data/media';
import './ServiceDetail.css';
import './AntiTermitePiping.css';
import Credentials from '../components/Credentials';

const facts = [
  { icon: Clock, value: '10–15 yrs', label: 'Protection with refills' },
  { icon: IndianRupee, value: `₹${pipe.min}–${pipe.max}`, label: 'Per sq.ft.' },
  { icon: Hammer, value: 'Zero', label: 'Drilling for re-treatment' },
  { icon: Layers, value: 'Pre-floor', label: 'Installed before flooring' },
];

const steps = [
  { icon: Ruler, title: 'Soil preparation', text: 'The foundation soil is compacted and levelled, and large stones and debris are removed so the chemical spreads evenly.' },
  { icon: Layers, title: 'Pipe layout planning', text: 'Using your building drawings, we plan pipe runs along the foundation borders, under internal walls and around every room boundary.' },
  { icon: Wrench, title: 'Porous pipe installation', text: 'Porous pipes are laid at a depth of about 6–8 inches and joined into a continuous, leak-tested network.' },
  { icon: RefreshCw, title: 'External refill points', text: 'Access points are brought outside the building, so the system can be recharged later without breaking the floor.' },
  { icon: FlaskConical, title: 'Termiticide charging', text: 'A professional Fipronil- or Imidacloprid-based termiticide is pumped through the network, forming a uniform chemical barrier in the soil.' },
  { icon: FileCheck2, title: 'Certificate & handover', text: 'You receive a layout record and a treatment report for your property file; any warranty is written on your quotation.' },
];

const advantages = [
  { title: 'Long-term protection', text: 'A single installation protects the structure for 10–15 years with periodic refills.' },
  { title: 'Re-treatment without damage', text: 'Future doses go in through external refill points. No drilling, no broken tiles.' },
  { title: 'Uniform distribution', text: 'Chemical seeps evenly through the pipe walls instead of collecting at isolated drill points.' },
  { title: 'No structural impact', text: 'Installed during construction, so walls and floors are never hacked afterwards.' },
  { title: 'No repeat drilling', text: 'Costs more upfront than a drilling job, but every future re-treatment goes in from outside, with no drilling, sealing or tile repair.' },
  { title: 'Targeted chemical use', text: 'Termiticide goes exactly where termites enter, which avoids wasteful surface spraying.' },
];

const comparison = [
  { feature: 'Cost', pipe: `₹${pipe.min}–${pipe.max} / sq.ft. (one-time installation)`, drill: `₹${post.min}–${post.max} / sq.ft. (each treatment)` },
  { feature: 'Protection period', pipe: '10–15 years (with refills)', drill: '5–7 years' },
  { feature: 'Re-treatment', pipe: 'Easy, from outside', drill: 'Difficult, needs fresh drilling' },
  { feature: 'Damage to floor', pipe: 'None', drill: 'Drill holes in floor & skirting', bad: true },
  { feature: 'Chemical spread', pipe: 'Even, continuous barrier', drill: 'Concentrated at drill points', bad: true },
];

const audiences = [
  { icon: Home, title: 'Independent homes & villas', text: 'Best done when the plinth is ready and before flooring.' },
  { icon: Building2, title: 'Apartments & commercial', text: 'Planned with your architect for the whole ground-floor footprint.' },
  { icon: Landmark, title: 'Government & institutional', text: 'Documented installation records for tender and compliance files.' },
  { icon: HardHat, title: 'Major renovations', text: 'Possible when the old flooring is fully removed. Costlier than new builds.' },
];

const faqs = [
  { q: 'Is porous pipe treatment necessary for every new home?', a: 'It is highly recommended. Termites enter from the soil, and a pre-construction barrier is the most reliable and economical way to stop them.' },
  { q: 'How much does it cost in Rajasthan?', a: `₹${pipe.min}–${pipe.max} per sq.ft. The final quote depends on the plinth area and pipe layout, and is given after we review your drawings. For comparison, regular pre-construction soil treatment is ₹${pre.min}–${pre.max} per sq.ft.` },
  { q: 'Can it be installed after construction?', a: 'It is possible only when the flooring is being completely removed, and it is costlier and more difficult. For finished buildings we recommend our drill-fill post-construction treatment.' },
  { q: 'How long does the protection last?', a: 'Typically 10–15 years when the system is recharged through the refill points as advised during periodic inspections.' },
  { q: 'At what construction stage should I contact you?', a: 'Ideally when the foundation is being planned, and no later than when the plinth is complete and before the PCC or flooring is laid.' },
  { q: 'Which chemicals do you use?', a: 'Professional Fipronil- or Imidacloprid-based termiticides from reputed manufacturers such as ENVU and Heranba, handled only by trained technicians.' },
];

const AntiTermitePiping = () => {
  const { phoneNumber } = businessConfig;

  return (
    <div className="service-page atp-page">
      <section className="service-hero">
        <div className="container">
          <span className="service-badge"><ShieldCheck size={14} /> Pre-Construction Treatment</span>
          <h1>Anti-Termite Treatment using <span className="text-gradient">Porous Pipe System</span></h1>
          <p className="hero-desc">A permanent, refillable chemical barrier laid beneath your foundation. It protects your new home for 10–15 years, with no drilling and no floor breaking.</p>
          <div className="hero-buttons">
            <Link to="/contact" className="btn btn-primary btn-lg">Get Free Site Consultation <ArrowRight size={18} /></Link>
            <a href={`tel:${phoneNumber}`} className="btn btn-outline btn-lg"><Phone size={18} /> Call {phoneNumber}</a>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="atp-facts">
          {facts.map(({ icon: Icon, value, label }) => (
            <div key={label} className="atp-fact">
              <Icon size={20} />
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="section">
        <div className="container atp-split">
          <div>
            <span className="eyebrow">What is it</span>
            <h2>A protective network beneath your foundation</h2>
            <p>Termites work silently inside walls and wooden fittings, and by the time they are noticed the damage is usually done. That is why experts recommend treating the soil <strong>before</strong> the building is finished.</p>
            <p>The porous pipe system is a special piping network installed under the foundation and floor. The pipe walls carry micro-pores, so termiticide pumped into the network seeps slowly and evenly into the surrounding soil and forms a continuous chemical barrier.</p>
            <ul className="atp-points">
              <li><Droplets size={18} /> Micro-pores release chemical uniformly into the soil</li>
              <li><ShieldCheck size={18} /> Termites contacting the treated zone are stopped</li>
              <li><RefreshCw size={18} /> External refill points allow re-dosing for years</li>
            </ul>
          </div>
          <figure className="photo-frame atp-photo">
            <img src={media.foundation.src} alt={media.foundation.alt} />
            <figcaption className="photo-credit">{creditLine(media.foundation)}</figcaption>
            <span className="atp-photo-tag">Pipes are laid at this stage, before the floor</span>
          </figure>
        </div>
      </section>

      <section className="section atp-visual" id="how-it-works">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">तस्वीरों में समझें · See it in pictures</span>
            <h2 className="section-title">दीमक से घर की <span className="text-gradient">पक्की सुरक्षा</span></h2>
            <p className="section-subtitle">How the porous pipe system keeps termites out of your home. Green means protection, red means danger.</p>
          </div>
          <PipeDiagram />
          <p className="atp-note">Illustration only. The actual pipe layout is designed from your building drawings.</p>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Step-by-Step Procedure</span>
            <h2 className="section-title">How we install it <span className="text-gradient">on site</span></h2>
            <p className="section-subtitle">We coordinate with your builder or contractor so each stage fits the construction schedule.</p>
          </div>
          <div className="atp-steps">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="atp-step">
                <div className="atp-step-head">
                  <span className="atp-step-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="icon-tile"><Icon size={20} /></span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Advantages</span>
            <h2 className="section-title">Why porous pipe is best for <span className="text-gradient">new construction</span></h2>
          </div>
          <div className="atp-adv-grid">
            {advantages.map(({ title, text }) => (
              <div key={title} className="atp-adv">
                <CheckCircle size={22} />
                <div>
                  <h4>{title}</h4>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Comparison</span>
            <h2 className="section-title">Porous pipe vs <span className="text-gradient">traditional drilling</span></h2>
          </div>
          <div className="atp-compare">
            <div className="atp-compare-row atp-compare-head">
              <span>Feature</span>
              <span className="pipe">Porous Pipe System</span>
              <span>Traditional Drilling</span>
            </div>
            {comparison.map((row) => (
              <div key={row.feature} className="atp-compare-row">
                <span>{row.feature}</span>
                <span className="pipe"><CheckCircle size={16} /> {row.pipe}</span>
                <span className="drill">{row.bad && <XCircle size={16} />} {row.drill}</span>
              </div>
            ))}
          </div>
          <p className="atp-note">Your exact quotation is provided after we review the site and drawings.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Who it's for</span>
            <h2 className="section-title">Built for every kind of <span className="text-gradient">new project</span></h2>
          </div>
          <div className="atp-aud-grid">
            {audiences.map(({ icon: Icon, title, text }) => (
              <div key={title} className="atp-aud">
                <span className="icon-tile"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>

          <div className="atp-pricing">
            <div className="atp-price-card">
              <span className="eyebrow light">Pricing</span>
              <div className="atp-price">₹{pipe.min}–{pipe.max} <small>/ sq.ft. + GST</small></div>
              <p className="gst-note on-dark">{GST_NOTE} Final price is confirmed after the drawings or site are checked.</p>
              <ul>
                <li><CheckCircle size={16} /> Pipe layout design from drawings</li>
                <li><CheckCircle size={16} /> Porous pipes, joints & refill points</li>
                <li><CheckCircle size={16} /> Professional termiticide charging</li>
                <li><CheckCircle size={16} /> Layout record & treatment report</li>
              </ul>
              <Link to="/contact" className="btn btn-primary btn-block btn-lg">Request exact quote <ArrowRight size={18} /></Link>
            </div>
            <div className="atp-safety">
              <h3>Safety & chemicals</h3>
              <p>All work is carried out by trained technicians wearing protective equipment. We use professional-grade termiticides from reputed manufacturers such as ENVU and Heranba, applied at label-recommended doses.</p>
              <ul>
                <li><ShieldCheck size={18} /> Professional handling only, never DIY</li>
                <li><ShieldCheck size={18} /> Chemical confined to the soil below the slab</li>
                <li><ShieldCheck size={18} /> Products used are recorded in your treatment report</li>
              </ul>
              <Link to="/blog/anti-termite-piping-treatment" className="atp-read"><BookOpen size={16} /> Read our detailed guide on porous pipe treatment</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">FAQ</span>
            <h2 className="section-title">Frequently asked <span className="text-gradient">questions</span></h2>
          </div>
          <div className="faq-section atp-faq">
            {faqs.map(({ q, a }) => (
              <div key={q} className="faq-item">
                <h4>{q}</h4>
                <p>{a}</p>
              </div>
            ))}
          </div>
          <p className="atp-note">Already built? See our <Link to="/termite-control">post-construction termite treatment</Link>.</p>
        </div>
      </section>

      <Credentials only={['pco']} compact title="Licensed pest management service" intro="Treatment is carried out under our pest control licence by trained technicians." />

      <section className="cta-section">
        <div className="container">
          <h2>Building a new home? Protect it from day one.</h2>
          <p>Book a free consultation before your flooring stage and get a pipe layout plan for your project.</p>
          <div className="cta-buttons">
            <Link to="/contact" className="btn btn-primary btn-lg">Book Free Consultation</Link>
            <a href={`tel:${phoneNumber}`} className="btn btn-outline btn-lg"><Phone size={18} /> {phoneNumber}</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AntiTermitePiping;