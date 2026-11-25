import { Link } from 'react-router-dom';
import { RATES, GST_NOTE } from '../data/catalog';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

/**
 * Home pest-control rate cards (1BHK / 2BHK / 3BHK), optionally with an
 * anti-termite card. All figures come from RATES in data/catalog.js.
 */
const RateCards = ({ includes = ['Inspection', 'Complete treatment', 'Follow-up support'], withTermite = false }) => (
  <>
    <div className="pricing-grid">
      <div className="pricing-card">
        <h4>1 BHK</h4>
        <div className="price">{inr(RATES.home['1BHK'])}<span>/home</span></div>
        <ul>{includes.map((i) => <li key={i}>{i}</li>)}</ul>
      </div>
      <div className="pricing-card popular">
        <span className="popular-badge">Most booked</span>
        <h4>2 BHK</h4>
        <div className="price">{inr(RATES.home['2BHK'])}<span>/home</span></div>
        <ul>{includes.map((i) => <li key={i}>{i}</li>)}</ul>
      </div>
      {withTermite ? (
        <div className="pricing-card">
          <h4>Anti-Termite</h4>
          <div className="price">₹{RATES.termitePost.min}–{RATES.termitePost.max}<span>/sq.ft.</span></div>
          <ul>
            <li>Existing buildings</li>
            <li>Pre-construction ₹{RATES.termitePre.min}–{RATES.termitePre.max}/sq.ft.</li>
            <li><Link to="/termite-control">Termite details →</Link></li>
          </ul>
        </div>
      ) : (
        <div className="pricing-card">
          <h4>3 BHK</h4>
          <div className="price">{inr(RATES.home['3BHK'])}<span>/home</span></div>
          <ul>{includes.map((i) => <li key={i}>{i}</li>)}</ul>
        </div>
      )}
    </div>
    <p className="rate-note">
      {withTermite ? `3 BHK homes are also ${inr(RATES.home['3BHK'])}. ` : ''}
      Larger homes, villas and commercial sites are quoted after inspection. {GST_NOTE}
    </p>
  </>
);

export default RateCards;
