import { Link } from 'react-router-dom';
import { ScanSearch, ShieldCheck, Camera, QrCode, HeartHandshake, ArrowRight } from 'lucide-react';
import './OnlyAtPestKill.css';

// Homepage showcase of the customer features no other pest control website offers together.
const FEATURES = [
  { icon: ShieldCheck, title: 'Warranty Wallet', text: 'See exactly how many warranty days you have left — and request a free re-treatment in one tap. No calls, no arguments.', to: '/dashboard', cta: 'Open my account' },
  { icon: Camera, title: 'Photo proof of every visit', text: 'Your technician uploads before & after photos and a visit report. You see what was treated, with which product.', to: '/dashboard', cta: 'See my service proof' },
  { icon: QrCode, title: 'QR-verified certificate', text: 'Every treatment certificate carries a QR code. Landlords, buyers and food-safety auditors can verify it instantly.', to: '/verify', cta: 'Verify a certificate' },
  { icon: HeartHandshake, title: 'Safe Home plan', text: 'Kids, pets, elders or asthma at home? Get a personal prep checklist and a re-entry timer after treatment.', to: '/book', cta: 'Book with Safe Home' },
];

const OnlyAtPestKill = () => (
  <section className="section only-section">
    <div className="container">
      <div className="only-head">
        <span className="eyebrow">Only at PestKill</span>
        <h2>Pest control you can <span className="text-gradient">see, track and trust.</span></h2>
        <p>Built around the problems customers face most — warranties that are hard to claim, no proof of work, and no clear safety advice.</p>
      </div>

      <Link to="/pest-identifier" className="only-hero">
        <span className="only-hero-icon"><ScanSearch size={30} /></span>
        <div>
          <strong>Kaunsa keeda hai? Find out in 30 seconds.</strong>
          <span>Answer five quick questions — get the likely pest, how serious it is, and the price to treat it.</span>
        </div>
        <span className="only-hero-cta">Try the Pest Identifier <ArrowRight size={16} /></span>
      </Link>

      <div className="only-grid">
        {FEATURES.map(({ icon: Icon, title, text, to, cta }) => (
          <Link key={title} to={to} className="only-card">
            <span className="only-icon"><Icon size={22} /></span>
            <h3>{title}</h3>
            <p>{text}</p>
            <span className="link-more">{cta} <ArrowRight size={14} /></span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default OnlyAtPestKill;
