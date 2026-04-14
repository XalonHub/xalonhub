'use client';

import { useState } from 'react';
import '../globals.css';

export default function PartnerPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessDetails: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const message = `Hi Xalon Team! I'm ${formData.name}. I'd like to join as a partner.
Business Details: ${formData.businessDetails}
Contact number: ${formData.phone}`;
    const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const benefits = [
    { title: 'Global Exposure', desc: 'Reach a broad audience of premium clients actively looking for beauty professionals.' , icon: '🌍'},
    { title: 'Seamless Management', desc: 'Powerful dashboard to manage your bookings, stylists, and payments in one place.', icon: '⚡' },
    { title: 'Secure Payments', desc: 'Transparent and instant payouts. Focus on your art, while we handle the rest.', icon: '🛡️' }
  ];

  return (
    <main className="premium-partner-layout">
      {/* Dynamic Hero Section */}
      <section className="partner-luxury-hero">
        <div className="hero-background" style={{ backgroundImage: "url('/images/partner-bg.png')" }}></div>
        <div className="hero-overlay"></div>
        <div className="container hero-inner">
          <div className="hero-content-premium fade-in">
            <h1 className="editorial-title">Your Professional <br /> Journey, Redefined.</h1>
            <p className="premium-subtitle">Join Xalon, the most elite network of salon owners and stylists. Elevate your brand with technology designed for luxury.</p>
            <div className="hero-cta-group">
                <a href="#join-form" className="btn-primary-luxury">Start Onboarding</a>
                <div className="trust-badge">Verified by 500+ Top Salons</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section-luxury">
        <div className="container">
          <div className="section-header">
            <span className="tagline">Why Choose Xalon?</span>
            <h2 className="section-title">An Ecosystem Built for Scale</h2>
          </div>
          <div className="benefits-grid">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="benefit-card-premium">
                <div className="benefit-icon">{benefit.icon}</div>
                <h3 className="benefit-label">{benefit.title}</h3>
                <p className="benefit-description">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Form Section with Form Card */}
      <section className="form-section-luxury" id="join-form">
        <div className="container">
          <div className="premium-glass-split">
             <div className="split-info">
                <h2 className="title-bold">Let's build your <br /> empire together.</h2>
                <p>Fill out the inquiry form. Our partner success manager will connect with you on WhatsApp within 24 hours.</p>
                
                <div className="info-points">
                   <div className="point">
                      <strong>Exclusive Access</strong>
                      <p>Get listed in our "Top Rated" sections instantly.</p>
                   </div>
                   <div className="point">
                      <strong>0% Commission</strong>
                      <p>On your first 10 app bookings.</p>
                   </div>
                </div>
             </div>
             
             <div className="split-form">
                <div className="glass-form-card">
                  <h3>Lead Interest Form</h3>
                  <p className="form-subtitle">Connect with our growth team</p>
                  
                  <form onSubmit={handleSubmit} className="premium-lead-form">
                    <div className="input-group-premium">
                      <label>Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        placeholder="John Doe" 
                        value={formData.name}
                        onChange={handleChange}
                        required 
                      />
                    </div>
                    
                    <div className="input-group-premium">
                      <label>WhatsApp Number</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        placeholder="+91 XXXX XXXX" 
                        value={formData.phone}
                        onChange={handleChange}
                        required 
                      />
                    </div>
                    
                    <div className="input-group-premium">
                      <label>Business / Experience</label>
                      <textarea 
                        name="businessDetails" 
                        placeholder="Describe your salon or your years of experience..." 
                        rows="3"
                        value={formData.businessDetails}
                        onChange={handleChange}
                        required
                      ></textarea>
                    </div>
                    
                    <button type="submit" className="btn-premium-wa">
                       Send to WhatsApp <span className="arrow">→</span>
                    </button>
                  </form>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* App Footer Section */}
      <section className="partner-app-cta">
         <div className="container">
            <div className="cta-box-premium">
               <h2>Ready to Go Live?</h2>
               <p>Already a verified partner? Download XalonHub and sync your calendar today.</p>
               <div className="app-badges">
                  <div className="badge-btn">Play Store</div>
                  <div className="badge-btn">App Store</div>
               </div>
            </div>
         </div>
      </section>
    </main>
  );
}
