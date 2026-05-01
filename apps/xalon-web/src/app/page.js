'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Star, X, ArrowRight, Gift, Home as HomeIcon, Scissors, ChevronRight, Clock, Info, CheckCircle2, HelpCircle } from 'lucide-react';
import { getHomeLayout, getCatalog, getCategories, getSalons, getCities } from '../services/api';
import Footer from '../components/Footer';
import './globals.css';

const SCROLLING_WORDS = ["At-Home", "In-Salon"];

export default function Home() {
  const [layout, setLayout] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [showAppModal, setShowAppModal] = useState(false);
  const [serviceMode, setServiceMode] = useState('at-home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [activePartnerTab, setActivePartnerTab] = useState('featured'); // 'featured', 'freelancers', 'location'
  const [partnersList, setPartnersList] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');

  const servicesRef = useRef(null);
  const catalogRef = useRef(null);

  // Disable body scroll when a modal or drawer is open
  useEffect(() => {
    if (selectedService || showAppModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedService, showAppModal]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % SCROLLING_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getHomeLayout().then(setLayout).catch(console.error);
    getCategories().then(setAllCategories).catch(console.error);
    getCities().then((data) => {
      setCities(data);
      if (data.length > 0) setSelectedCity(data[0]);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    setLoadingPartners(true);
    let params = {};
    if (activePartnerTab === 'featured') params.partnerType = 'Salon';
    else if (activePartnerTab === 'freelancers') params.partnerType = 'Freelancer';
    else if (activePartnerTab === 'location' && selectedCity) params.city = selectedCity;

    getSalons(params).then(setPartnersList).catch(console.error).finally(() => setLoadingPartners(false));
  }, [activePartnerTab, selectedCity]);

  useEffect(() => {
    if (selectedCategory) {
      setLoadingServices(true);
      getCatalog({ category: selectedCategory.name, serviceMode })
        .then(setServices)
        .finally(() => setLoadingServices(false));

      setTimeout(() => {
        const yOffset = -120;
        const element = servicesRef.current;
        if (element) {
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [selectedCategory, serviceMode]);

  if (!layout) return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center font-serif italic text-2xl tracking-tight text-[#1A1A1A]">XALONHUB.</div>;

  return (
    <main className="bg-[#FAFAFA]">
      {/* 1. Single-View Vibrant Hero Section */}
      <section className="relative h-screen flex flex-col justify-between overflow-hidden bg-[#1A1A1A]">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1600')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/60 z-[1]"></div>
        <div className="h-32"></div>

        <div className="container relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2 bg-[#C5A059] rounded-full mb-8 shadow-2xl"
          >
            <Gift size={16} className="text-white" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Claim ₹200 Cashback on your first booking</span>
          </motion.div>

          <h1 className="text-5xl md:text-[7.5rem] font-serif leading-[1.1] text-white mb-8 tracking-tightest drop-shadow-2xl">
            Expert Services <br />
            <div className="h-[1.1em] overflow-hidden inline-flex relative top-1">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={SCROLLING_WORDS[wordIndex]}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[#C5A059] italic"
                >
                  {SCROLLING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </h1>

          <p className="text-lg md:text-xl text-white/90 font-light max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-lg">
            Experience the pinnacle of grooming and wellness, exclusively available on the <span className="font-bold text-white underline decoration-[#C5A059] underline-offset-8">Xalon mobile app.</span>
          </p>

          <button
            onClick={() => setShowAppModal(true)}
            className="bg-[#C5A059] text-white px-12 py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-[#1A1A1A] transition-all duration-500 shadow-floating hover:scale-105"
          >
            Download App
          </button>
        </div>

        <div className="container relative z-10 pb-12">
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-6 pt-10 border-t border-white/20">
            {[
              { label: "Verified Professionals", value: "500+" },
              { label: "Elite Salons", value: "120+" },
              { label: "Customer Satisfaction", value: "4.8/5" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="text-xl font-serif font-bold text-white">{stat.value}</div>
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#C5A059] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Editorial Collections Section */}
      <section className="pt-20 pb-10 bg-white relative z-20" id="catalog" ref={catalogRef}>
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
            <div className="text-center md:text-left">
              <span className="text-[11px] font-bold text-[#C5A059] uppercase tracking-[0.4em] block mb-2">Curated Menu</span>
              <h2 className="text-4xl md:text-6xl font-serif text-[#1A1A1A] tracking-tight">The Editorial Collections.</h2>
            </div>
          </div>

          <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 ${selectedCategory ? 'mb-16' : 'mb-0'}`}>
            {allCategories.map((cat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className={`group cursor-pointer p-4 rounded-[2rem] transition-all duration-500 ${selectedCategory?.id === cat.id ? 'bg-[#F9F9F9] shadow-inner' : 'bg-transparent'}`}
                onClick={() => setSelectedCategory(selectedCategory?.id === cat.id ? null : cat)}
              >
                <div className="aspect-[4/5] rounded-[1.5rem] overflow-hidden mb-5 shadow-premium relative bg-[#F9F9F9]">
                  <img src={cat.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={cat.name} />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                  {selectedCategory?.id === cat.id && (
                    <div className="absolute inset-0 bg-[#C5A059]/10 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#C5A059] shadow-lg">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-bold text-[#C5A059] uppercase tracking-[0.2em] block mb-2">{cat.name.split(' ')[0]}</span>
                  <h3 className="text-base font-serif text-[#1A1A1A] tracking-tight">{cat.name}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          <div ref={servicesRef} className="h-4"></div>

          <AnimatePresence mode="wait">
            {selectedCategory && (
              <motion.div
                key={selectedCategory.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="bg-[#F9F9F9] rounded-[3rem] p-10 md:p-16 shadow-inner relative"
              >
                <div className="sticky top-[80px] z-[40] -mx-10 md:-mx-16 px-10 md:px-16 py-6 bg-[#F9F9F9]/95 backdrop-blur-xl border-b border-[#1A1A1A]/5 shadow-sm mb-12">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                    <div>
                      <h3 className="text-3xl font-serif text-[#1A1A1A] tracking-tight mb-1">{selectedCategory.name} Services</h3>
                      <p className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em]">Explore our {serviceMode.replace('-', ' ')} range</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                      <div className="inline-flex bg-white p-1.5 rounded-[1.5rem] border border-[#1A1A1A]/5 relative shadow-sm">
                        <div
                          className="absolute top-1.5 bottom-1.5 bg-[#F9F9F9] rounded-[1rem] shadow-sm transition-all duration-500 ease-out z-0"
                          style={{
                            left: serviceMode === 'at-home' ? '6px' : 'calc(50% + 3px)',
                            width: 'calc(50% - 9px)'
                          }}
                        ></div>
                        <button
                          onClick={() => setServiceMode('at-home')}
                          className={`relative z-10 flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${serviceMode === 'at-home' ? 'text-[#C5A059]' : 'text-[#1A1A1A]/40'}`}
                        >
                          <HomeIcon size={14} /> At-Home
                        </button>
                        <button
                          onClick={() => setServiceMode('at-salon')}
                          className={`relative z-10 flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${serviceMode === 'at-salon' ? 'text-[#C5A059]' : 'text-[#1A1A1A]/40'}`}
                        >
                          <Scissors size={14} /> At-Salon
                        </button>
                      </div>

                      <div className="hidden md:block h-8 w-px bg-[#1A1A1A]/10 mx-2"></div>

                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 hover:text-[#1A1A1A] flex items-center gap-2"
                      >
                        <X size={14} /> Clear Selection
                      </button>
                      <button
                        onClick={() => setShowAppModal(true)}
                        className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#C5A059] transition-all shadow-lg hidden sm:block"
                      >
                        View in App
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                    {allCategories.map((cat, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedCategory(cat)}
                        className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedCategory.id === cat.id ? 'bg-[#C5A059] text-white shadow-lg' : 'bg-white text-[#1A1A1A]/40 hover:text-[#1A1A1A] border border-[#1A1A1A]/5'}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingServices ? (
                  <div className="py-24 flex justify-center">
                    <div className="w-10 h-10 border-4 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
                    {services.map((service, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-6 rounded-[2rem] shadow-subtle border border-[#1A1A1A]/5 flex flex-col justify-between group hover:border-[#C5A059]/30 transition-all hover:shadow-premium cursor-pointer"
                        onClick={() => setSelectedService(service)}
                      >
                        <div>
                          <h4 className="text-base font-serif text-[#1A1A1A] mb-2 group-hover:text-[#C5A059] transition-colors">{service.name}</h4>
                          <p className="text-[11px] text-[#8A8A8A] font-light leading-relaxed mb-5 line-clamp-2">{service.description || "Premium expert care tailored to your needs."}</p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-[#F9F9F9]">
                          <div className="text-xs font-bold text-[#1A1A1A]">₹{service.effectivePrice || service.price || '---'}</div>
                          <button className="text-[9px] font-bold uppercase tracking-widest text-[#C5A059] flex items-center gap-2 group/btn">
                            Details <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    {services.length === 0 && (
                      <div className="col-span-full py-20 text-center">
                        <Info size={40} className="mx-auto text-[#1A1A1A]/10 mb-4" />
                        <p className="text-sm text-[#8A8A8A] font-light">No services found for this category in {serviceMode.replace('-', ' ')} mode.</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 3. Service Detail Drawer */}
      <AnimatePresence>
        {selectedService && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedService(null)}
              className="fixed inset-0 bg-[#1A1A1A]/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-[120] flex flex-col"
            >
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="relative h-72 bg-[#F9F9F9]">
                  {selectedService.image ? (
                    <img src={selectedService.image} className="w-full h-full object-cover" alt={selectedService.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#C5A059]/20 font-serif italic text-4xl">XALON.</div>
                  )}
                  <button
                    onClick={() => setSelectedService(null)}
                    className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-[#1A1A1A] rounded-full transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-10 md:p-14">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.3em] block mb-3">{selectedCategory?.name}</span>
                      <h2 className="text-4xl font-serif text-[#1A1A1A] tracking-tight mb-4">{selectedService.name}</h2>
                      <div className="flex items-center gap-6 text-[#8A8A8A] text-xs font-medium">
                        <div className="flex items-center gap-2"><Clock size={14} /> {selectedService.duration || 45} mins</div>
                        <div className="flex items-center gap-2"><Star size={14} className="text-[#C5A059] fill-[#C5A059]" /> Expert Choice</div>
                      </div>
                    </div>
                    <div className="text-3xl font-serif text-[#1A1A1A]">₹{selectedService.effectivePrice || selectedService.price || '---'}</div>
                  </div>

                  <p className="text-base text-[#8A8A8A] font-light leading-relaxed mb-12 border-l-2 border-[#C5A059]/30 pl-6 italic">
                    {selectedService.description || "A premium treatment designed to rejuvenate and elevate your grooming standards using only the finest products and techniques."}
                  </p>

                  {selectedService.steps && selectedService.steps.length > 0 && (
                    <div className="mb-16">
                      <div className="flex items-center gap-3 mb-8">
                        <CheckCircle2 size={20} className="text-[#C5A059]" />
                        <h4 className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-[0.3em]">How it Works</h4>
                      </div>
                      <div className="space-y-10 relative pl-4">
                        <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-[#1A1A1A]/10"></div>
                        {selectedService.steps.map((step, i) => (
                          <div key={i} className="relative pl-10">
                            <div className="absolute left-[-5px] top-1 w-3 h-3 rounded-full bg-[#C5A059] border-4 border-white shadow-sm z-10"></div>
                            <h5 className="text-sm font-bold text-[#1A1A1A] mb-1">{step.title}</h5>
                            <p className="text-xs text-[#8A8A8A] font-light leading-relaxed">{step.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedService.faqs && selectedService.faqs.length > 0 && (
                    <div className="mb-16">
                      <div className="flex items-center gap-3 mb-8">
                        <HelpCircle size={20} className="text-[#C5A059]" />
                        <h4 className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-[0.3em]">Frequently Asked</h4>
                      </div>
                      <div className="space-y-6">
                        {selectedService.faqs.map((faq, i) => (
                          <div key={i} className="bg-[#F9F9F9] p-6 rounded-2xl">
                            <h5 className="text-xs font-bold text-[#1A1A1A] mb-3">{faq.q}</h5>
                            <p className="text-xs text-[#8A8A8A] font-light leading-relaxed">{faq.a}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-[#1A1A1A] p-8 rounded-[2rem] text-white/90">
                    <div className="flex items-center gap-3 mb-4 text-[#C5A059]">
                      <Info size={18} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Important Details</span>
                    </div>
                    <ul className="text-xs font-light space-y-3">
                      <li className="flex justify-between"><span>Service Mode</span> <span className="font-bold text-white capitalize">{serviceMode.replace('-', ' ')}</span></li>
                      <li className="flex justify-between"><span>Gender Focus</span> <span className="font-bold text-white">Unisex</span></li>
                      <li className="flex justify-between"><span>Booking Via</span> <span className="font-bold text-white">App Exclusive</span></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-[#1A1A1A]/5 bg-white">
                <button
                  onClick={() => setShowAppModal(true)}
                  className="w-full bg-[#1A1A1A] text-white py-6 rounded-2xl font-bold uppercase tracking-[0.3em] text-[11px] hover:bg-[#C5A059] transition-all shadow-floating flex items-center justify-center gap-4 group"
                >
                  <Smartphone size={18} /> Book This Service <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 4. Partner Discovery Section */}
      <section className="py-24 bg-[#1A1A1A] relative z-20 overflow-hidden">
        <div className="container relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="text-center md:text-left">
              <span className="text-[11px] font-bold text-[#C5A059] uppercase tracking-[0.4em] block mb-2">Meet Our Experts</span>
              <h2 className="text-4xl md:text-6xl font-serif text-white tracking-tight">Discover Elite Partners.</h2>
            </div>

            <div className="inline-flex bg-white/5 p-1.5 rounded-[1.5rem] border border-white/10 relative">
              <button
                onClick={() => setActivePartnerTab('featured')}
                className={`relative z-10 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-[1rem] ${activePartnerTab === 'featured' ? 'bg-[#C5A059] text-white shadow-lg scale-105' : 'text-white/40 hover:text-white'}`}
              >
                Featured Salons
              </button>
              <button
                onClick={() => setActivePartnerTab('freelancers')}
                className={`relative z-10 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-[1rem] ${activePartnerTab === 'freelancers' ? 'bg-[#C5A059] text-white shadow-lg scale-105' : 'text-white/40 hover:text-white'}`}
              >
                Top Professionals
              </button>
              <button
                onClick={() => setActivePartnerTab('location')}
                className={`relative z-10 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-[1rem] ${activePartnerTab === 'location' ? 'bg-[#C5A059] text-white shadow-lg scale-105' : 'text-white/40 hover:text-white'}`}
              >
                Near You
              </button>
            </div>
          </div>

          {activePartnerTab === 'location' && cities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-8 max-w-full"
            >
              {cities.map((city, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCity(city)}
                  className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedCity === city ? 'bg-white text-[#1A1A1A]' : 'bg-white/5 text-white/40 border border-white/10 hover:text-white hover:border-white/30'}`}
                >
                  {city}
                </button>
              ))}
            </motion.div>
          )}

          {loadingPartners ? (
            <div className="py-32 flex justify-center">
              <div className="w-12 h-12 border-4 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-8 pb-12 snap-x snap-mandatory no-scrollbar px-4 -mx-4 md:px-0 md:mx-0">
              {partnersList.length > 0 ? (
                partnersList.map((partner, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="min-w-[300px] md:min-w-[380px] bg-white/5 p-5 rounded-[2.5rem] border border-white/10 group cursor-pointer snap-start hover:bg-white/10 transition-all duration-500"
                    onClick={() => setShowAppModal(true)}
                  >
                    <div className="aspect-[3/4] rounded-[2rem] overflow-hidden mb-6 relative bg-[#1A1A1A]">
                      <img src={partner.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={partner.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                      {partner.isFeatured && (
                        <div className="absolute top-6 left-6 bg-[#C5A059] text-white text-[9px] font-bold uppercase tracking-[0.3em] px-4 py-2 rounded-full shadow-2xl backdrop-blur-md">
                          Featured
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-8 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 flex justify-center">
                        <button className="bg-white text-[#1A1A1A] px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-[#C5A059] hover:text-white transition-colors">
                          View Profile <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="px-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-2xl font-serif text-white tracking-tight mb-1">{partner.name}</h3>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{partner.address?.city || 'Selected Area'}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#C5A059] text-sm font-bold mt-2">
                          <Star size={14} className="fill-[#C5A059]" /> {partner.rating || '4.8'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="w-full py-24 text-center">
                  <Info size={48} className="mx-auto text-white/10 mb-6" />
                  <p className="text-sm text-white/40 font-light uppercase tracking-[0.3em]">No experts available in this category yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
