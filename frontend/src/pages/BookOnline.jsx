import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitLead } from '../lib/api';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Check, ChevronLeft, ArrowRight, Home, Building2, CalendarDays, Clock, MapPin, User,
  Phone, ShieldCheck, BadgeCheck, MessageCircle, CheckCircle,
} from 'lucide-react';
import businessConfig from '../data/businessConfig';
import { HOUSEHOLD_OPTIONS } from '../data/safeHome';
import { services, serviceGroups, getService } from '../data/catalog';
import './BookOnline.css';
import { LicenceLine } from '../components/Credentials';
import FormError from '../components/FormError';
import { STATES, validPin, assessArea } from '../lib/serviceArea';

const STEPS = ['Service', 'Property', 'Schedule', 'Your details', 'Review'];
const SIZES = ['1BHK', '2BHK', '3BHK', '4BHK+ / Villa'];
const SLOTS = [
  { id: 'morning', label: 'Morning', time: '9:00 AM – 12:00 PM' },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 PM – 3:00 PM' },
  { id: 'evening', label: 'Evening', time: '3:00 PM – 7:00 PM' },
];

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const upcomingDays = () => {
  const days = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (days.length < 12) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) days.push(new Date(d));
  }
  return days;
};

export const estimateFor = (service, property) => {
  if (!service) return null;
  if (property.type === 'business') return { text: 'Quote after site survey', note: 'Commercial pricing depends on area and risk level.' };
  const p = service.pricing;
  if (!p) return { text: 'Quote after inspection', note: 'Our specialist confirms the price on the inspection call.' };
  if (p.unit === 'bhk') {
    const price = p.tiers[property.size];
    return price
      ? { text: `From ${inr(price)} + GST`, note: 'Starting price, exclusive of GST. Final price is confirmed after inspection.' }
      : { text: 'Quote after inspection', note: 'Larger homes are priced after inspection.' };
  }
  if (p.unit === 'flat') return { text: `From ${inr(p.from)} + GST`, note: 'Starting price per visit, exclusive of GST. Final price is confirmed after inspection.' };
  if (p.unit === 'sqft') {
    const area = Number(property.area);
    return area > 0
      ? { text: `${inr(area * p.min)} – ${inr(area * p.max)}`, note: `Indicative, at ${p.label}, exclusive of GST. Final quote after site visit.` }
      : { text: p.label, note: 'Enter your built-up area for an estimate.' };
  }
  return null;
};

const BookOnline = () => {
  const [params] = useSearchParams();
  const preset = getService(params.get('service'));
  const { whatsappNumber, phoneNumber } = businessConfig;

  const [step, setStep] = useState(preset ? 1 : 0);
  const [serviceSlug, setServiceSlug] = useState(preset?.slug || '');
  const [property, setProperty] = useState({ type: 'home', size: '2BHK', area: '' });
  const [schedule, setSchedule] = useState({ date: null, slot: '' });
  const [details, setDetails] = useState({ name: '', phone: '', email: '', address: '', city: 'Jaipur', state: 'Rajasthan', pincode: '', notes: '' });
  const [household, setHousehold] = useState({});
  const [errors, setErrors] = useState({});
  const [bookingRef, setBookingRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) setDetails((d) => ({ ...d, name: d.name || user.name, phone: d.phone || user.phone || '', email: d.email || user.email, address: d.address || user.address || '', city: user.city || d.city }));
  }, [user]);

  const days = useMemo(upcomingDays, []);
  const service = getService(serviceSlug);
  const estimate = estimateFor(service, property);

  const canContinue = [
    Boolean(service),
    property.type === 'business' || service?.pricing?.unit !== 'sqft' || Number(property.area) > 0,
    Boolean(schedule.date && schedule.slot),
    true,
    true,
  ][step];

  const validateDetails = () => {
    const e = {};
    if (details.name.trim().length < 2) e.name = 'Please enter your name';
    if (!/^[6-9]\d{9}$/.test(details.phone.replace(/\D/g, '').slice(-10))) e.phone = 'Enter a valid 10-digit mobile number';
    if (details.email && !/^\S+@\S+\.\S+$/.test(details.email)) e.email = 'Enter a valid email address';
    if (details.address.trim().length < 6) e.address = 'Please enter your full address';
    if (details.city.trim().length < 2) e.city = 'Enter your city or town';
    if (!validPin(details.pincode)) e.pincode = 'Enter a valid 6-digit PIN code';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 3 && !validateDetails()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const slotLabel = SLOTS.find((s) => s.id === schedule.slot);
  const area = assessArea(details);
  const dateLabel = schedule.date?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const propertyLabel = property.type === 'business'
    ? 'Business premises'
    : service?.pricing?.unit === 'sqft' ? `Home · ${property.area || '—'} sq.ft.` : `Home · ${property.size}`;

  const confirm = async () => {
    setSubmitting(true);
    setSubmitError('');
    const msg = [
      'New booking request',
      `Service: ${service.name}`,
      `Property: ${propertyLabel}`,
      `Preferred: ${dateLabel}, ${slotLabel.label} (${slotLabel.time})`,
      `Estimate: ${estimate.text}`,
      `Name: ${details.name}`,
      `Phone: ${details.phone}`,
      details.email && `Email: ${details.email}`,
      `Address: ${details.address}, ${details.city}, ${details.state} ${details.pincode}`,
      area && `Service area: ${area.title}`,
      details.notes && `Notes: ${details.notes}`,
    ].filter(Boolean).join('\n');
    try {
      const result = await submitLead({
        type: 'booking',
        service: service.name,
        property: propertyLabel,
        // Local calendar date; toISOString() would shift Indian dates back one day (UTC).
        preferredDate: `${schedule.date.getFullYear()}-${String(schedule.date.getMonth() + 1).padStart(2, '0')}-${String(schedule.date.getDate()).padStart(2, '0')}`,
        preferredSlot: `${slotLabel.label} (${slotLabel.time})`,
        estimate: estimate.text,
        name: details.name,
        phone: details.phone,
        email: details.email,
        address: `${details.address}, PIN ${details.pincode}`,
        city: `${details.city.trim()}, ${details.state}`.slice(0, 60),
        message: details.notes,
        household,
        source: 'book-online',
      }, { whatsappNumber, whatsappText: msg });
      setBookingRef(result.ref);
    } catch (e) {
      setSubmitError(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingRef) {
    return (
      <div className="book-page">
        <div className="container book-done">
          <span className="book-done-icon"><CheckCircle size={40} /></span>
          <span className="eyebrow">Request received</span>
          <h1>Thank you, {details.name.split(' ')[0]}.</h1>
          <p>
            Your request reference is <strong>{bookingRef}</strong>. Our team will call you on <strong>{details.phone}</strong> to check availability for {details.city} and confirm the appointment. Your preferred slot ({slotLabel.label.toLowerCase()}, {dateLabel}) is not confirmed until that call.
          </p>
          <div className="book-done-card">
            <div><span>Service</span><strong>{service.name}</strong></div>
            <div><span>Property</span><strong>{propertyLabel}</strong></div>
            <div><span>Estimate</span><strong>{estimate.text}</strong></div>
          </div>
          <div className="book-done-actions">
            {user ? <Link to="/dashboard" className="btn btn-navy">View my bookings</Link> : <Link to="/register" className="btn btn-navy">Create account to track</Link>}
            <a href={`tel:${phoneNumber}`} className="btn btn-outline"><Phone size={16} /> Call us</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="book-page">
      <section className="book-hero">
        <div className="container">
          <span className="eyebrow light">Book Online</span>
          <h1>Book your pest control <span className="text-gradient">in two minutes</span></h1>
          <p>Choose a service and a preferred slot. Our teams are dispatched from Jaipur; we call you to confirm availability for your location before anything is booked. No payment needed now.</p>
        </div>
      </section>

      <div className="container book-layout">
        <div className="book-card">
          <ol className="book-progress" aria-label="Booking steps">
            {STEPS.map((label, i) => (
              <li key={label} className={i < step ? 'done' : i === step ? 'current' : ''}>
                <button type="button" disabled={i > step} onClick={() => setStep(i)}>
                  <span className="dot">{i < step ? <Check size={14} /> : i + 1}</span>
                  <span className="label">{label}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="book-body">
            {step === 0 && (
              <>
                <h2>What do you need help with?</h2>
                {serviceGroups.map((g) => (
                  <div key={g.id} className="book-group">
                    <h3>{g.label}</h3>
                    <div className="book-options">
                      {services.filter((s) => s.group === g.id).map(({ icon: Icon, ...s }) => (
                        <button type="button" key={s.slug} className={`book-option ${serviceSlug === s.slug ? 'selected' : ''}`} onClick={() => setServiceSlug(s.slug)}>
                          <span className="book-option-icon"><Icon size={20} /></span>
                          <span className="book-option-text">
                            <strong>{s.name}</strong>
                            <small>{s.summary}</small>
                          </span>
                          <span className="book-check"><Check size={14} /></span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {step === 1 && (
              <>
                <h2>Tell us about your property</h2>
                <div className="book-segment">
                  <button type="button" className={property.type === 'home' ? 'active' : ''} onClick={() => setProperty({ ...property, type: 'home' })}><Home size={18} /> Home</button>
                  <button type="button" className={property.type === 'business' ? 'active' : ''} onClick={() => setProperty({ ...property, type: 'business' })}><Building2 size={18} /> Business</button>
                </div>
                {property.type === 'home' && service?.pricing?.unit === 'sqft' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="area">Built-up / plinth area (sq.ft.)</label>
                    <input id="area" type="number" min="100" inputMode="numeric" className="form-input" placeholder="e.g. 1500" value={property.area} onChange={(e) => setProperty({ ...property, area: e.target.value })} />
                  </div>
                )}
                {property.type === 'home' && service?.pricing?.unit !== 'sqft' && (
                  <div className="book-sizes">
                    {SIZES.map((size) => (
                      <button type="button" key={size} className={`book-size ${property.size === size ? 'selected' : ''}`} onClick={() => setProperty({ ...property, size })}>
                        <strong>{size}</strong>
                        <small>{service?.pricing?.unit === 'bhk' && service.pricing.tiers[size] ? `From ${inr(service.pricing.tiers[size])}` : 'Quote on visit'}</small>
                      </button>
                    ))}
                  </div>
                )}
                {property.type === 'business' && (
                  <p className="book-hint"><Building2 size={18} /> For offices, restaurants, hotels and factories, our specialist visits for a free site survey and shares a written proposal.</p>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <h2>Choose a preferred date & time</h2>
                <h3 className="book-sub"><CalendarDays size={16} /> Date</h3>
                <div className="book-dates">
                  {days.map((d) => {
                    const active = schedule.date?.toDateString() === d.toDateString();
                    return (
                      <button type="button" key={d.toISOString()} className={`book-date ${active ? 'selected' : ''}`} onClick={() => setSchedule({ ...schedule, date: d })}>
                        <small>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</small>
                        <strong>{d.getDate()}</strong>
                        <small>{d.toLocaleDateString('en-IN', { month: 'short' })}</small>
                      </button>
                    );
                  })}
                </div>
                <h3 className="book-sub"><Clock size={16} /> Time slot</h3>
                <div className="book-slots">
                  {SLOTS.map((s) => (
                    <button type="button" key={s.id} className={`book-slot ${schedule.slot === s.id ? 'selected' : ''}`} onClick={() => setSchedule({ ...schedule, slot: s.id })}>
                      <strong>{s.label}</strong>
                      <small>{s.time}</small>
                    </button>
                  ))}
                </div>
                <p className="book-hint"><ShieldCheck size={18} /> Sundays are closed. Our team confirms the exact time by phone.</p>
              </>
            )}

            {step === 3 && (
              <>
                <h2>Your contact details</h2>
                <div className="book-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="b-name">Full name</label>
                    <input id="b-name" className={`form-input ${errors.name ? 'invalid' : ''}`} value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} autoComplete="name" />
                    {errors.name && <span className="field-error">{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="b-phone">Mobile number</label>
                    <input id="b-phone" type="tel" inputMode="numeric" className={`form-input ${errors.phone ? 'invalid' : ''}`} placeholder="10-digit mobile" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} autoComplete="tel" />
                    {errors.phone && <span className="field-error">{errors.phone}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="b-email">Email <span className="optional">(optional)</span></label>
                    <input id="b-email" type="email" className={`form-input ${errors.email ? 'invalid' : ''}`} value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} autoComplete="email" />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="b-state">State</label>
                    <select id="b-state" className="form-input" value={details.state} onChange={(e) => setDetails({ ...details, state: e.target.value })} autoComplete="address-level1">
                      {STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="b-city">City / town</label>
                    <input id="b-city" className={`form-input ${errors.city ? 'invalid' : ''}`} value={details.city} onChange={(e) => setDetails({ ...details, city: e.target.value })} autoComplete="address-level2" />
                    {errors.city && <span className="field-error">{errors.city}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="b-pin">PIN code</label>
                    <input id="b-pin" inputMode="numeric" maxLength={6} className={`form-input ${errors.pincode ? 'invalid' : ''}`} value={details.pincode} onChange={(e) => setDetails({ ...details, pincode: e.target.value.replace(/\D/g, '') })} autoComplete="postal-code" />
                    {errors.pincode && <span className="field-error">{errors.pincode}</span>}
                  </div>
                  {area && (
                    <div className={`form-group span-2 book-area is-${area.tier}`} aria-live="polite">
                      <strong><MapPin size={15} /> {area.title}</strong>
                      <span>{area.note}</span>
                    </div>
                  )}
                  <div className="form-group span-2">
                    <label className="form-label" htmlFor="b-address">Address</label>
                    <input id="b-address" className={`form-input ${errors.address ? 'invalid' : ''}`} placeholder="House no., street, area / landmark" value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} autoComplete="street-address" />
                    {errors.address && <span className="field-error">{errors.address}</span>}
                  </div>
                  <div className="form-group span-2">
                    <span className="form-label">Safe Home plan <span className="optional">(optional — who lives at home?)</span></span>
                    <div className="household-chips">
                      {HOUSEHOLD_OPTIONS.map(({ key, label, icon: Icon }) => (
                        <button type="button" key={key} className={household[key] ? 'on' : ''} aria-pressed={Boolean(household[key])} onClick={() => setHousehold({ ...household, [key]: !household[key] })}>
                          <Icon size={15} /> {label}
                        </button>
                      ))}
                    </div>
                    <p className="household-note">We'll tailor the treatment and send you a personalised preparation & safe re-entry plan.</p>
                  </div>
                  <div className="form-group span-2">
                    <label className="form-label" htmlFor="b-notes">Anything we should know? <span className="optional">(optional)</span></label>
                    <textarea id="b-notes" className="form-input" rows="3" placeholder="Where you see the pests, and since when…" value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2>Review your booking</h2>
                <dl className="book-review">
                  <div><dt>Service</dt><dd>{service.name}</dd></div>
                  <div><dt>Property</dt><dd>{propertyLabel}</dd></div>
                  <div><dt>Preferred slot</dt><dd>{dateLabel} · {slotLabel.label} ({slotLabel.time})</dd></div>
                  <div><dt>Contact</dt><dd>{details.name} · {details.phone}{details.email && ` · ${details.email}`}</dd></div>
                  <div><dt>Address</dt><dd>{details.address}, {details.city}, {details.state} {details.pincode}</dd></div>
                  {area && <div><dt>Service area</dt><dd>{area.title}</dd></div>}
                  {details.notes && <div><dt>Notes</dt><dd>{details.notes}</dd></div>}
                  <div className="total"><dt>Estimate</dt><dd>{estimate.text}</dd></div>
                </dl>
                <FormError error={submitError} className="book-error" />
                <p className="book-hint"><MessageCircle size={18} /> This is a booking request. Our team calls you to check availability for your location and confirm the date and time; the appointment is confirmed only on that call. You get a reference number right away.</p>
              </>
            )}
          </div>

          <div className="book-nav">
            {step > 0 ? (
              <button type="button" className="btn btn-outline" onClick={() => setStep(step - 1)}><ChevronLeft size={16} /> Back</button>
            ) : <span />}
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary" disabled={!canContinue} onClick={next}>Continue <ArrowRight size={16} /></button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={confirm} disabled={submitting}>{submitting ? 'Sending…' : <>Send booking request <Check size={16} /></>}</button>
            )}
          </div>
          <LicenceLine kind="pco" />
        </div>

        <aside className="book-summary">
          <h3>Booking summary</h3>
          <ul>
            <li><span className="ic"><ShieldCheck size={16} /></span><div><small>Service</small><strong>{service?.name || 'Not selected'}</strong></div></li>
            <li><span className="ic"><Home size={16} /></span><div><small>Property</small><strong>{service ? propertyLabel : '—'}</strong></div></li>
            <li><span className="ic"><CalendarDays size={16} /></span><div><small>Date & time</small><strong>{dateLabel ? `${dateLabel} · ${slotLabel?.label || ''}` : '—'}</strong></div></li>
            <li><span className="ic"><MapPin size={16} /></span><div><small>City</small><strong>{details.city}</strong></div></li>
            <li><span className="ic"><User size={16} /></span><div><small>Contact</small><strong>{details.name || '—'}</strong></div></li>
          </ul>
          {estimate && (
            <div className="book-estimate">
              <small>Estimated price</small>
              <strong>{estimate.text}</strong>
              <p>{estimate.note}</p>
            </div>
          )}
          <ul className="book-assure">
            <li><BadgeCheck size={16} /> Free inspection, no obligation</li>
            <li><BadgeCheck size={16} /> No advance payment</li>
            <li><BadgeCheck size={16} /> Written warranty on treatment</li>
          </ul>
        </aside>
      </div>
    </div>
  );
};

export default BookOnline;
