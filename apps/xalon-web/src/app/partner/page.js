'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Smartphone, ShieldCheck, ArrowRight, CheckCircle2, Store, Briefcase } from 'lucide-react';
import Footer from '../../components/Footer';
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
    const whatsappUrl = `https://wa.me/918960046001?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const benefits = [
    { title: 'Global Exposure', desc: 'Reach a broad audience of premium clients actively looking for beauty professionals.', icon: <Globe size={24} className="text-[#C5A059]" /> },
    { title: 'Seamless Management', desc: 'Powerful dashboard to manage your bookings, stylists, and payments in one place.', icon: <Smartphone size={24} className="text-[#C5A059]" /> },
    { title: 'Secure Payments', desc: 'Transparent and instant payouts. Focus on your art, while we handle the rest.', icon: <ShieldCheck size={24} className="text-[#C5A059]" /> }
  ];

  return (
    <main className="bg-[#FAFAFA]">
      {/* 1. Dynamic Hero Section */}
      <section className="relative h-screen flex flex-col justify-center overflow-hidden bg-[#1A1A1A]">
        <div 
          className="absolute inset-0 z-0"
          style={{ 
            backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1600')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 z-[1]"></div>

        <div className="container relative z-10 px-6 text-center pt-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full mb-8 border border-white/10"
          >
            <CheckCircle2 size={16} className="text-[#C5A059]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Verified by 500+ Top Salons</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif text-white tracking-tight mb-6 drop-shadow-2xl"
          >
            Your Professional <br /> Journey, Redefined.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/80 font-light max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-lg"
          >
            Join Xalon, the most elite network of salon owners and stylists. Elevate your brand with technology designed for luxury.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <a 
              href="#join-form"
              className="inline-flex items-center gap-3 bg-[#C5A059] text-white px-10 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-[#1A1A1A] transition-all duration-500 shadow-floating"
            >
              Start Onboarding <ArrowRight size={16} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* 2. Benefits Section */}
      <section className="py-24 bg-white relative z-20">
        <div className="container">
          <div className="text-center mb-20">
            <span className="text-[11px] font-bold text-[#C5A059] uppercase tracking-[0.4em] block mb-2">Why Choose Xalon?</span>
            <h2 className="text-4xl md:text-5xl font-serif text-[#1A1A1A] tracking-tight">An Ecosystem Built for Scale.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#FAFAFA] p-10 rounded-[2rem] border border-[#1A1A1A]/5 hover:shadow-premium hover:border-[#C5A059]/30 transition-all duration-500 group"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-subtle mb-8 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-serif text-[#1A1A1A] mb-4">{benefit.title}</h3>
                <p className="text-sm text-[#8A8A8A] font-light leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 2.5 Who Can Join Section */}
      <section className="py-24 bg-[#1A1A1A] relative z-20">
        <div className="container max-w-5xl">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold text-[#C5A059] uppercase tracking-[0.4em] block mb-2">Partnership Models</span>
            <h2 className="text-4xl md:text-5xl font-serif text-white tracking-tight">Who Can Join XalonHub?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-[#2C2C2C] p-10 rounded-[2rem] border border-white/10 hover:border-[#C5A059]/50 transition-all duration-500"
            >
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <Store size={24} className="text-[#C5A059]" />
              </div>
              <h3 className="text-2xl font-serif text-white mb-3">Salon Owners</h3>
              <p className="text-sm text-white/70 font-light leading-relaxed mb-6">
                Digitize your established salon. Get featured on the Xalon app, manage walk-ins alongside app bookings, and easily assign appointments to your staff stylists.
              </p>
              <ul className="space-y-3 text-[11px] font-bold text-white/90 uppercase tracking-widest">
                <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-[#C5A059]" /> Full Salon Listing</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-[#C5A059]" /> Staff Management</li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-[#2C2C2C] p-10 rounded-[2rem] border border-white/10 hover:border-[#C5A059]/50 transition-all duration-500"
            >
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <Briefcase size={24} className="text-[#C5A059]" />
              </div>
              <h3 className="text-2xl font-serif text-white mb-3">Independent Freelancers</h3>
              <p className="text-sm text-white/70 font-light leading-relaxed mb-6">
                Are you a traveling beautician? Serve premium clients directly at their homes. Enjoy complete flexibility over your schedule and service radius.
              </p>
              <ul className="space-y-3 text-[11px] font-bold text-white/90 uppercase tracking-widest">
                <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-[#C5A059]" /> At-Home Services</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-[#C5A059]" /> Flexible Hours</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Form Section */}
      <section className="py-24 bg-[#FAFAFA]" id="join-form">
        <div className="container max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
             <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:w-1/2"
             >
                <span className="text-[11px] font-bold text-[#C5A059] uppercase tracking-[0.4em] block mb-2">Partner with us</span>
                <h2 className="text-4xl md:text-6xl font-serif text-[#1A1A1A] tracking-tight mb-6">Let's build your <br /> empire together.</h2>
                <p className="text-[#8A8A8A] font-light leading-relaxed mb-10 max-w-md">
                  Fill out the inquiry form. Our partner success manager will connect with you on WhatsApp within 24 hours.
                </p>
                
                <div className="space-y-8">
                   <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center shrink-0">
                         <CheckCircle2 size={20} className="text-[#C5A059]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-serif text-[#1A1A1A] mb-1">Exclusive Access</h4>
                        <p className="text-sm text-[#8A8A8A] font-light">Get listed in our "Top Rated" sections instantly upon verification.</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center shrink-0">
                         <CheckCircle2 size={20} className="text-[#C5A059]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-serif text-[#1A1A1A] mb-1">0% Commission</h4>
                        <p className="text-sm text-[#8A8A8A] font-light">Keep 100% of your earnings on your first 10 app bookings.</p>
                      </div>
                   </div>
                </div>
             </motion.div>
             
             <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:w-1/2 w-full"
             >
                <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-premium border border-[#1A1A1A]/5">
                  <h3 className="text-2xl font-serif text-[#1A1A1A] mb-2">Lead Interest Form</h3>
                  <p className="text-[11px] text-[#C5A059] font-bold uppercase tracking-[0.2em] mb-10">Connect with our growth team</p>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-widest mb-2">Full Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        placeholder="John Doe" 
                        value={formData.name}
                        onChange={handleChange}
                        required 
                        className="w-full bg-[#FAFAFA] border border-[#1A1A1A]/10 rounded-xl px-5 py-4 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-widest mb-2">WhatsApp Number</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        placeholder="+91 XXXX XXXX" 
                        value={formData.phone}
                        onChange={handleChange}
                        required 
                        className="w-full bg-[#FAFAFA] border border-[#1A1A1A]/10 rounded-xl px-5 py-4 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-widest mb-2">Business / Experience</label>
                      <textarea 
                        name="businessDetails" 
                        placeholder="Describe your salon or your years of experience..." 
                        rows="4"
                        value={formData.businessDetails}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#FAFAFA] border border-[#1A1A1A]/10 rounded-xl px-5 py-4 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] transition-colors resize-none"
                      ></textarea>
                    </div>
                    
                    <button 
                      type="submit" 
                      className="w-full bg-[#1A1A1A] text-white py-5 rounded-xl font-bold uppercase tracking-[0.3em] text-[11px] hover:bg-[#C5A059] transition-all shadow-floating flex items-center justify-center gap-3 group"
                    >
                       Send to WhatsApp <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                  </form>
                </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* 4. App Footer Section */}
      <section className="py-24 bg-[#1A1A1A] relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1600')`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
         <div className="container relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-serif text-white tracking-tight mb-6">Ready to Go Live?</h2>
            <p className="text-white/70 font-light max-w-lg mx-auto mb-10">Already a verified partner? Download XalonHub and sync your calendar today to start receiving bookings.</p>
            <div className="flex justify-center gap-6">
              <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-[#1A1A1A] transition-all">
                Play Store
              </button>
              <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-[#1A1A1A] transition-all">
                App Store
              </button>
            </div>
         </div>
      </section>

      <Footer />
    </main>
  );
}
