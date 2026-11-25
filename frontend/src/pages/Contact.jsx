import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import businessConfig from '../data/businessConfig';
import { Phone, MessageCircle, Mail, MapPin, Clock, CheckCircle, Send } from 'lucide-react';
import { submitLead } from '../lib/api';
import './Contact.css';
import Credentials, { LicenceLine } from '../components/Credentials';
import FormError from '../components/FormError';

const Contact = () => {
  const { phoneNumber, whatsappNumber, email, officeAddress, workingHours } = businessConfig;
  // Links such as the home slider's bee hive and wildlife cards pre-fill the subject (?subject=...).
  const [params] = useSearchParams();
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', subject: (params.get('subject') || '').slice(0, 120), message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setFormError('');
    try {
      await submitLead(
        { type: 'contact', name: formData.name, phone: formData.phone, email: formData.email, service: formData.subject, message: formData.message, source: 'contact-page' },
        { whatsappNumber, whatsappText: `Hello PestKill,\n\nName: ${formData.name}\nPhone: ${formData.phone}\nEmail: ${formData.email}\nSubject: ${formData.subject}\nMessage: ${formData.message}` },
      );
      setSubmitted(true);
    } catch (err) {
      setFormError(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="container">
          <span className="eyebrow light">Contact</span>
          <h1 className="page-title">Let's make your space <span className="text-gradient">pest-free</span></h1>
          <p className="page-subtitle">Speak with a specialist, request an inspection or get a written quotation.</p>
        </div>
      </section>
      
      <section className="contact-section section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2>Get In Touch</h2>
              <p>Have questions? We'd love to hear from you.</p>
              <div className="contact-methods">
                <div className="contact-method">
                  <span><Phone size={20} /></span>
                  <div>
                    <h4>Phone</h4>
                    <a href={`tel:${phoneNumber}`}>{phoneNumber}</a>
                  </div>
                </div>
                <div className="contact-method">
                  <span><MessageCircle size={20} /></span>
                  <div>
                    <h4>WhatsApp</h4>
                    <a href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}>{whatsappNumber}</a>
                  </div>
                </div>
                <div className="contact-method">
                  <span><Mail size={20} /></span>
                  <div>
                    <h4>Email</h4>
                    <a href={`mailto:${email}`}>{email}</a>
                  </div>
                </div>
                <div className="contact-method">
                  <span><MapPin size={20} /></span>
                  <div>
                    <h4>Address</h4>
                    <p>{officeAddress}</p>
                  </div>
                </div>
                <div className="contact-method">
                  <span><Clock size={20} /></span>
                  <div>
                    <h4>Hours</h4>
                    <p>{workingHours}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="contact-form-container">
              {submitted ? (
                <div className="success-message">
                  <CheckCircle size={56} style={{color:'#0E9F6E'}} />
                  <h3>Thank You!</h3>
                  <p>We've received your message. Our team will contact you shortly.</p>
                  <button className="btn btn-primary" onClick={() => setSubmitted(false)}>Send Another</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <h3>Send us a Message</h3>
                  <div className="form-group">
                    <label className="form-label" htmlFor="c-name">Name *</label>
                    <input type="text" name="name" id="c-name" className="form-input" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="c-phone">Phone *</label>
                    <input type="tel" name="phone" id="c-phone" className="form-input" value={formData.phone} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="c-email">Email</label>
                    <input type="email" name="email" id="c-email" className="form-input" value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="c-subject">Subject *</label>
                    <input type="text" name="subject" id="c-subject" className="form-input" value={formData.subject} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="c-message">Message *</label>
                    <textarea name="message" id="c-message" className="form-input" rows="5" value={formData.message} onChange={handleChange} required />
                  </div>
                  <FormError error={formError} />
                  <button type="submit" className="btn btn-primary" disabled={sending}><Send size={16} />{sending ? 'Sending…' : 'Send message'}</button>
                  <LicenceLine kind="pco" />
                  <LicenceLine kind="sale" />
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
      
      <Credentials compact />

      {/* Google Map */}
      <section style={{padding: '60px 0', background: '#fafafa'}}>
        <div className="container">
          <h2 style={{textAlign: 'center', marginBottom: '32px', fontSize: '2rem'}}>Our Location</h2>
          <div style={{borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}}>
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.567974718769!2d75.924789!3d26.924789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db00c2e53ffff%3A0x5e4c4c4c4c4c4c4c!2sVidhyadhar%20Nagar%2C%20Jaipur%2C%20Rajasthan!5e0!3m2!1sen!2sin!4v1600000000000"
              width="100%" 
              height="450" 
              style={{border: 0}} 
              allowFullScreen="" 
              loading="lazy"
              title="Our Location"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;