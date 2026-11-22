import { Link } from 'react-router-dom';
import { ArrowRight, Phone, Quote } from 'lucide-react';
import businessConfig from '../data/businessConfig';
import './Founder.css';

export const founder = {
  name: 'Prerit Mudgal',
  title: 'Founder & CEO',
  company: 'PestKill Pest Solutions',
  full: '/images/founder/prerit-mudgal-full.png',
  portrait: '/images/founder/prerit-mudgal-portrait.png',
  promise: 'Every home we treat, I treat like my own.',
  message: [
    'I started PestKill with a simple belief: families and businesses deserve pest control they can trust completely. That means an honest inspection, genuine products from manufacturers like ENVU, Syngenta and Heranba, and a written warranty on every job.',
    'Our technicians are trained to explain what they find, use the least chemical that works, and come back if the problem does. If you are ever not satisfied, I want to hear about it personally.',
  ],
};

/** Large founder section — Home and About pages. */
export const FounderSection = () => (
  <section className="founder-section">
    <div className="container founder-grid">
      <figure className="founder-figure">
        <img src={founder.full} alt={`${founder.name}, ${founder.title} of ${founder.company}`} loading="lazy" />
      </figure>
      <div className="founder-copy">
        <span className="eyebrow">A message from our {founder.title}</span>
        <h2>“{founder.promise}”</h2>
        {founder.message.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}
        <div className="founder-sign">
          <strong>{founder.name}</strong>
          <span>{founder.title}, {founder.company}</span>
        </div>
        <div className="founder-actions">
          <Link to="/book" className="btn btn-primary">Book a free inspection</Link>
          <a href={`tel:${businessConfig.phoneNumber}`} className="link-more"><Phone size={16} /> Talk to us</a>
        </div>
      </div>
    </div>
  </section>
);

/** Compact founder strip — shown above the footer on every other page. */
export const FounderStrip = () => (
  <section className="founder-strip">
    <div className="container founder-strip-inner">
      <img className="founder-strip-photo" src={founder.portrait} alt={`${founder.name}, ${founder.title}`} loading="lazy" />
      <div className="founder-strip-copy">
        <Quote size={22} className="founder-strip-quote" />
        <p className="founder-strip-promise">{founder.promise} Honest inspections, genuine products and a written warranty — that is my personal promise to you.</p>
        <div className="founder-sign">
          <strong>{founder.name}</strong>
          <span>{founder.title}, {founder.company}</span>
        </div>
      </div>
      <Link to="/about" className="link-more founder-strip-link">Our story <ArrowRight size={16} /></Link>
    </div>
  </section>
);
