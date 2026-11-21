import { useState } from 'react';
import { Briefcase, MapPin, GraduationCap, ShieldCheck, TrendingUp, Users, CheckCircle, ArrowRight, Send } from 'lucide-react';
import businessConfig from '../data/businessConfig';
import { roles } from '../data/catalog';
import { scrollToId } from '../components/SmoothScroll';
import { api, waLink } from '../lib/api';
import './Hub.css';

const perks = [
  { icon: GraduationCap, title: 'Paid training', text: 'Hands-on training in safe chemical handling, equipment and customer service.' },
  { icon: ShieldCheck, title: 'Safety first', text: 'Protective equipment and clear safety procedures on every job.' },
  { icon: TrendingUp, title: 'Room to grow', text: 'Technicians grow into supervisors and account managers.' },
  { icon: Users, title: 'Respectful team', text: 'A close-knit team that values honest, careful work.' },
];

const Careers = () => {
  const [form, setForm] = useState({ name: '', phone: '', role: roles[0].title, experience: '', city: 'Jaipur', message: '' });
  const [sent, setSent] = useState(false);

  const apply = (title) => {
    setForm((f) => ({ ...f, role: title }));
    scrollToId('apply');
  };

  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setFormError('');
    try {
      await api('/careers/apply', { method: 'POST', body: form });
      setSent(true);
    } catch (err) {
      if (err.status === 0) {
        const msg = `Job application\nRole: ${form.role}\nName: ${form.name}\nPhone: ${form.phone}\nExperience: ${form.experience || 'Fresher'}\nCity: ${form.city}\n${form.message}`;
        window.open(waLink(businessConfig.whatsappNumber, msg), '_blank', 'noopener');
        setSent(true);
      } else {
        setFormError(err.message);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="hub-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow light">Careers</span>
          <h1>Build a career that <span className="text-gradient">protects people</span></h1>
          <p>Join a growing team keeping homes, hospitals and businesses safe across North India.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="pillar-grid four">
            {perks.map(({ icon: Icon, title, text }) => (
              <div key={title} className="pillar">
                <span className="pillar-icon"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Open Positions</span>
            <h2 className="section-title">Current <span className="text-gradient">openings</span></h2>
          </div>
          <div className="role-list">
            {roles.map((r) => (
              <article key={r.title} className="role-card">
                <div className="role-main">
                  <h3>{r.title}</h3>
                  <div className="role-meta"><span><Briefcase size={14} /> {r.type}</span><span><MapPin size={14} /> {r.location}</span></div>
                  <p>{r.summary}</p>
                  <ul>{r.needs.map((n) => <li key={n}><CheckCircle size={14} /> {n}</li>)}</ul>
                </div>
                <button type="button" className="btn btn-navy" onClick={() => apply(r.title)}>Apply <ArrowRight size={16} /></button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="apply">
        <div className="container">
          <div className="apply-card">
            <div className="apply-copy">
              <span className="eyebrow light">Apply Now</span>
              <h2>Send your application</h2>
              <p>Fill in your details and we'll contact you for an interview. You can share your CV on WhatsApp when we call.</p>
            </div>
            <div className="apply-form">
              {sent ? (
                <div className="success-message"><CheckCircle size={44} /><h3>Application received</h3><p>Thank you. Our team will call you if your profile matches the role.</p></div>
              ) : (
                <form onSubmit={submit}>
                  <input className="form-input" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  <input className="form-input" type="tel" placeholder="Mobile number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                  <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {roles.map((r) => <option key={r.title}>{r.title}</option>)}
                  </select>
                  <div className="apply-row">
                    <input className="form-input" placeholder="Experience (years)" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
                    <input className="form-input" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <textarea className="form-input" rows="3" placeholder="Tell us briefly about yourself" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  {formError && <p className="form-error" role="alert">{formError}</p>}
                  <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={sending}><Send size={18} /> {sending ? 'Submitting…' : 'Submit application'}</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Careers;
