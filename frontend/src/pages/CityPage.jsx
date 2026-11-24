import { Link, Navigate, useParams } from 'react-router-dom';
import { Phone, MapPin, ArrowRight, CalendarCheck, MessageCircle, ShieldCheck, Camera, QrCode, HeartHandshake, CloudSun, ChevronDown, Store } from 'lucide-react';
import { PEST_LANDING } from '../data/shopLanding';
import { CITIES, REGIONS, getCity, cityPath, cityFaqs } from '../data/rajasthan';
import { RATES, getPest, getService, sqftLabel } from '../data/catalog';
import { pestMedia } from '../data/media';
import businessConfig from '../data/businessConfig';
import './CityPage.css';
import Credentials from '../components/Credentials';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
const HINDI_PESTS = 'दीमक, कॉकरोच, खटमल, चूहे और मच्छर';

const CityPage = () => {
  const { city: slug } = useParams();
  const city = getCity(slug);
  if (!city) return <Navigate to="/locations" replace />;

  const region = REGIONS[city.region];
  const { phoneNumber, whatsappNumber } = businessConfig;
  const wa = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi PestKill, I need pest control in ${city.name}.`)}`;
  const faqs = cityFaqs(city, RATES);
  const nearby = city.nearby.map(getCity).filter(Boolean);
  const sameRegion = CITIES.filter((x) => x.region === city.region && x.slug !== city.slug && !city.nearby.includes(x.slug));

  const prices = [
    { label: 'Home pest control · 1BHK', value: inr(RATES.home['1BHK']) },
    { label: 'Home pest control · 2BHK / 3BHK', value: inr(RATES.home['2BHK']) },
    { label: 'Anti-termite · existing building', value: sqftLabel(RATES.termitePost) },
    { label: 'Anti-termite · pre-construction', value: sqftLabel(RATES.termitePre) },
    { label: 'Porous pipe anti-termite system', value: sqftLabel(RATES.porousPipe) },
  ];

  return (
    <div className="city-page">
      <section className="city-hero">
        <div className="container">
          <nav className="city-crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span>/</span><Link to="/locations">Rajasthan</Link><span>/</span><span aria-current="page">{city.name}</span>
          </nav>
          <span className="city-pill"><MapPin size={14} /> {city.name}, Rajasthan</span>
          <h1>Pest control in {city.name}</h1>
          <p className="city-hi" lang="hi">{city.hi} में पेस्ट कंट्रोल: {HINDI_PESTS} से छुटकारा</p>
          <p className="city-lead">{city.note}</p>
          <div className="city-actions">
            <Link to="/book" className="btn btn-primary"><CalendarCheck size={18} /> Book online</Link>
            <a href={`tel:${phoneNumber}`} className="btn btn-white"><Phone size={18} /> {phoneNumber}</a>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><MessageCircle size={18} /> WhatsApp</a>
          </div>
          <p className="city-note">Free inspection · Written warranty · Licensed pest control operator</p>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="city-head">
            <span className="eyebrow">Common pests in {city.name}</span>
            <h2>What we treat most in {city.name}</h2>
            <p>{city.name} is in the {region.name} area. {region.climate}</p>
          </div>
          <div className="city-pests">
            {region.pests.map(({ slug: pestSlug, why }) => {
              const pest = getPest(pestSlug);
              if (!pest) return null;
              const service = getService(pest.service);
              const photo = pestMedia[pestSlug];
              return (
                <article key={pestSlug} className="city-pest">
                  {photo && <img src={photo.src} alt={photo.alt} loading="lazy" width="480" height="300" />}
                  <div>
                    <h3>{pest.name} in {city.name}</h3>
                    <p>{why}</p>
                    <div className="city-pest-links">
                      {service && <Link to={service.path}>{service.group === 'termite' ? 'Termite Control' : service.short} <ArrowRight size={14} /></Link>}
                      <Link to={`/pests/${pestSlug}`}>How to spot {pest.name.toLowerCase()}</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="city-season"><CloudSun size={20} /><p><strong>Peak season:</strong> {region.peak}</p></div>
        </div>
      </section>

      <section className="section-sm bg-surface">
        <div className="container city-two">
          <div>
            <span className="eyebrow">Prices in {city.name}</span>
            <h2>Clear starting prices</h2>
            <p className="city-muted">The same published rates apply across Rajasthan. The final price is confirmed after a free inspection, before any work starts.</p>
            <table className="city-prices">
              <tbody>
                {prices.map((p) => <tr key={p.label}><th scope="row">{p.label}</th><td>{p.value}</td></tr>)}
              </tbody>
            </table>
            <Link to="/book" className="btn btn-primary">Get my exact price <ArrowRight size={16} /></Link>
          </div>
          <div>
            <span className="eyebrow">Only at PestKill</span>
            <h2>What you get with every visit</h2>
            <ul className="city-perks">
              <li><ShieldCheck size={20} /><div><strong>Warranty Wallet</strong><span>See the days left on your warranty and request a free re-treatment in one tap.</span></div></li>
              <li><Camera size={20} /><div><strong>Photo proof</strong><span>Before and after photos and a visit report in your account.</span></div></li>
              <li><QrCode size={20} /><div><strong>QR-verified certificate</strong><span>Landlords, buyers and auditors can check it instantly.</span></div></li>
              <li><HeartHandshake size={20} /><div><strong>Safe Home plan</strong><span>Prep checklist and re-entry time for kids, pets and elders.</span></div></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="city-block city-supply">
            <span className="eyebrow"><Store size={15} /> For pest control operators in {city.name}</span>
            <h2>Pest control chemicals supply in {city.name}</h2>
            <p className="city-muted">
              Licensed PCOs in {city.name} can order genuine Envu, Syngenta, Heranba, Arbuda and Kalyani products online, with MRP,
              pack sizes, datasheets and an invoice for every order. {city.hi} के PCO के लिए दीमक, कॉकरोच, मच्छर और चूहे की दवाइयाँ।
            </p>
            <div className="city-links">
              {Object.entries(PEST_LANDING).map(([k, v]) => <Link key={k} to={`/shop/pest/${k}`}>{v.short}</Link>)}
              <Link to="/pco-account" className="all">Open a PCO account <ArrowRight size={14} /></Link>
            </div>
          </div>
          {city.areas.length > 0 && (
            <div className="city-block">
              <h2>Areas we cover in {city.name}</h2>
              <ul className="city-areas">{city.areas.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
          )}
          {(nearby.length > 0 || sameRegion.length > 0) && (
            <div className="city-block">
              <h2>Pest control near {city.name}</h2>
              <div className="city-links">
                {[...nearby, ...sameRegion].map((n) => <Link key={n.slug} to={cityPath(n.slug)}>Pest control in {n.name}</Link>)}
                <Link to="/locations" className="all">All Rajasthan cities <ArrowRight size={14} /></Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <Credentials />

      <section className="section-sm bg-surface">
        <div className="container city-faq-wrap">
          <h2>Pest control in {city.name}: questions</h2>
          <div className="city-faq">
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}<ChevronDown size={18} /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <div className="city-hindi" lang="hi">
            <h2>{city.hi} में पेस्ट कंट्रोल सेवा</h2>
            <p>
              {city.hi} में घर, दुकान, होटल, हॉस्टल और फैक्ट्री के लिए {HINDI_PESTS} का पक्का इलाज। घर का पेस्ट कंट्रोल
              1BHK {inr(RATES.home['1BHK'])} और 2BHK/3BHK {inr(RATES.home['2BHK'])} से शुरू। दीमक उपचार
              ₹{RATES.termitePost.min}–{RATES.termitePost.max} प्रति वर्ग फुट से। मुफ़्त निरीक्षण के बाद अंतिम कीमत तय होती है।
              बुकिंग के लिए कॉल या WhatsApp करें: {phoneNumber}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CityPage;
