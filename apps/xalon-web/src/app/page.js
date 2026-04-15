'use client';

import { useEffect, useState } from 'react';
import { getCities, getHomeLayout } from '../services/api';
import { useUI } from '../services/uiContext';
import './globals.css';

import { useRouter } from 'next/navigation';
import Footer from '../components/Footer';

function LoadMoreTrigger({ onVisible }) {
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        onVisible();
      }
    }, { threshold: 0.1, rootMargin: '100px' });
    
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, onVisible]);

  return (
    <div 
      ref={setRef}
      id="load-more-trigger"
      style={{ height: '50px', margin: '2rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <div className="loader-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [layout, setLayout] = useState(null);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('Female');
  const [visiblePartnersCount, setVisiblePartnersCount] = useState(5);
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');
  const [showIncentive, setShowIncentive] = useState(true);
  const [user, setUser] = useState(null);
  const { serviceMode } = useUI();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [layoutData, citiesData] = await Promise.all([
          getHomeLayout(),
          getCities()
        ]);
        setLayout(layoutData);
        setCities(citiesData || []);
        if (citiesData?.length > 0) setSelectedCity(citiesData[0]);
      } catch (err) {
        console.error("Home initialization failed:", err);
      }
    };
    const loadUser = () => {
      const savedUser = localStorage.getItem('xalon_user');
      if (savedUser) setUser(JSON.parse(savedUser));
    };

    fetchData();
    loadUser();
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    router.push(`/services?q=${encodeURIComponent(searchQuery)}&city=${encodeURIComponent(selectedCity)}&mode=${serviceMode}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('xalon_user');
    setUser(null);
  };

  const LOGO_URL = "/admin/assets/logo_full.svg";
  const BACKEND_LOGO = "http://localhost:5001/admin/assets/logo_full.svg";

  const getCategoryImage = (cat) => {
    const map = {
      'hair': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&h=400',
      'styling': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&h=400',
      'grooming': 'https://images.unsplash.com/photo-1599351431247-f10b21ce5634?auto=format&fit=crop&w=400&h=400',
      'facial': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&h=400',
      'skin': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&h=400',
      'waxing': 'https://images.unsplash.com/photo-1598124832483-fb40539121a2?auto=format&fit=crop&w=400&h=400',
      'removal': 'https://images.unsplash.com/photo-1598124832483-fb40539121a2?auto=format&fit=crop&w=400&h=400',
      'threading': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=400&h=400',
      'manicure': 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=400&h=400',
      'pedicure': 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=400&h=400',
      'colouring': 'https://images.unsplash.com/photo-1605497745244-093bb6978107?auto=format&fit=crop&w=400&h=400',
      'treatments': 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=400&h=400',
      'massage': 'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?auto=format&fit=crop&w=400&h=400',
      'wellness': 'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?auto=format&fit=crop&w=400&h=400',
      'makeup': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&h=400',
      'bridal': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&h=400',
      'packages': 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&h=400'
    };
    const c = cat.toLowerCase();
    const key = Object.keys(map).find(k => c.includes(k));
    return map[key] || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600';
  };

  if (!layout) return <div className="loading"><span>Loading XalonHub Ultimate...</span></div>;
 
  const homeHeroBg = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1200";
  const salonHeroBg = "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200";
  const bgImage = serviceMode === 'at-home' ? homeHeroBg : salonHeroBg;

  return (
    <main className="main-wrapper">
      {/* 1. Hero Section */}
      <section className="hero" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bgImage})` }}>
        
        
        <div className="hero-content">

          <h1 className={serviceMode === 'at-salon' ? 'mode-at-salon' : 'mode-at-home'}>
            {serviceMode === 'at-home' 
              ? "Expert Salon Services at Your Doorstep" 
              : "Book Top-Rated Salons for Your Next Look"}
          </h1>
          <p>
            {serviceMode === 'at-home'
              ? "Premium beauty and grooming from verified professionals today."
              : "Skip the queue and book instant appointments at the best salons near you."}
          </p>
          
          <form className="search-box" onSubmit={handleSearch}>
            <div className="city-picker">
              <span className="icon">📍</span>
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                {cities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <input 
              type="text" 
              placeholder="Search for 'Haircut', 'Facial'..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn-search">Search</button>
          </form>
        </div>
      </section>

      {/* 2. Achievement Bar */}
      {layout.achievements && (
        <section className="achievements-bar container">
          <div className="achievements-inner">
            {layout.achievements.map((stat, i) => (
              <div key={i} className="stat-item">
                <span className="stat-icon">{stat.icon}</span>
                <div className="stat-info">
                  <h3>{stat.value}</h3>
                  <p>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Promotional Banners */}
      {layout.banners && (
        <section className="banners-section container">
          <div className="banners-grid horizontal-scroll">
            {layout.banners.filter(b => serviceMode === 'at-home' ? b.id === 2 : b.id === 1).map(banner => (
              <div key={banner.id} className="banner-card" style={{ backgroundColor: banner.color, flex: 1, minWidth: '100%' }}>
                <div className="banner-text">
                  <h3>{serviceMode === 'at-home' ? "Professional Services at Home" : banner.title}</h3>
                  <p>{serviceMode === 'at-home' ? "Relax and get pampered in your own space" : banner.subtitle}</p>
                  <button className="btn-mini">{serviceMode === 'at-home' ? "Explore Professionals" : "Book Salon"}</button>
                </div>
                <img src={banner.image} alt={banner.title} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Most Booked Services */}
      {layout.mostBooked && (
        <section className="container section-padding">
          <div className="section-header">
            <h2>{serviceMode === 'at-home' ? 'Most Booked Home Services' : 'Trending Salon Services'}</h2>
            <span className="view-all">View All</span>
          </div>
          <div className="horizontal-scroll">
            {layout.mostBooked.map(service => {
              // Calculate mode-specific price
              let displayPrice = service.defaultPrice;
              if (serviceMode === 'at-home' && service.pricingByRole?.Freelancer) {
                displayPrice = service.pricingByRole.Freelancer.defaultPrice ?? service.defaultPrice;
              }

              return (
                <div key={service.id} className="service-card-compact" onClick={() => router.push(`/services?q=${encodeURIComponent(service.name)}&city=${selectedCity}&mode=${serviceMode}`)}>
                  <div className="card-thumb">
                    <img src={service.image} alt={service.name} />
                    <span className="rating-badge">⭐ {service.rating}</span>
                  </div>
                  <h4>{service.name}</h4>
                  <p className="price">₹{displayPrice}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. App Incentive Pop-up */}
      {showIncentive && (
        <div className="incentive-popup">
          <button className="btn-close-popup" onClick={() => setShowIncentive(false)}>&times;</button>
          <div className="incentive-text-popup">
            <span>🎁 NEW USER OFFER</span>
            <h2>Get ₹200 Cashback</h2>
            <p>On your first booking through the XalonHub App</p>
          </div>
          <button 
            className="btn-secondary" 
            style={{ padding: '0.8rem 1.5rem', width: '100%' }}
            onClick={() => window.location.href = '#download'}
          >
            Download App
          </button>
        </div>
      )}

      {/* 6. Professional Postcard Stream (Infinite Scroll) */}
      <section className="container section-padding">
        <div className="section-header-stack" style={{ textAlign: 'left', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{serviceMode === 'at-home' ? 'Top Rated Professionals' : 'Elite Partner Salons'}</h2>
          <p style={{ fontSize: '1.05rem', opacity: 0.8, marginTop: '0.5rem' }}>{serviceMode === 'at-home' ? 'Verified independent experts for doorstep services' : 'Premium destinations for your beauty needs'}</p>
        </div>

        <div className="postcard-stream">
          {(serviceMode === 'at-home' ? (layout.featuredFreelancers || []) : (layout.featuredSalons || [])).slice(0, visiblePartnersCount).map((partner, idx) => (
            <div 
              key={partner.id || idx} 
              className="postcard-item"
              onClick={() => router.push(`/services?category=${encodeURIComponent(partner.specialty || 'Hair & Styling')}&partnerId=${partner.id}&partnerName=${encodeURIComponent(partner.name)}&city=${selectedCity}&mode=${serviceMode}`)}
            >
              {partner.image ? (
                <img 
                  src={partner.image} 
                  alt={partner.name} 
                  className="postcard-img" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) {
                      e.target.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div 
                className="initials-placeholder" 
                style={{ 
                  display: partner.image ? 'none' : 'flex',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #f3e8ff, #e0f2fe)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                  fontWeight: 900,
                  color: 'var(--primary)'
                }}
              >
                {(partner.name || "P").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              
              {/* Logo / Profile badge — rendered last so it stacks above image and vignette */}
              {/* Logo / Profile badge with initials fallback */}
              <div style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', zIndex: 30, width: 56, height: 56, borderRadius: 28, overflow: 'hidden', border: '3px solid white', backgroundColor: '#8b5cf6', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '1.3rem', position: 'absolute', zIndex: 1 }}>
                  {(partner.name || "P").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </span>
                {partner.logo && (
                  <img 
                    src={partner.logo} 
                    alt="Logo" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', zIndex: 2 }} 
                    onError={(e) => { e.target.style.display = 'none'; }} 
                  />
                )}
              </div>

              <div className="postcard-basic-info">
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{partner.name}</h3>
                <span style={{ fontWeight: 700, opacity: 0.9 }}>⭐ {partner.rating} Excellence</span>
              </div>

              <div className="vignette-reveal">
                <div className="postcard-meta-top">
                  <h3>{partner.name}</h3>
                  <span className="postcard-category">
                    {serviceMode === 'at-home' ? partner.category || 'Beauty Expert' : 'Premier Salon'}
                  </span>
                </div>

                <div className="postcard-stats">
                  <div className="stat-item">
                    <span className="stat-value">{partner.rating}</span>
                    <span className="stat-label">Rating</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{partner.reviews}</span>
                    <span className="stat-label">Reviews</span>
                  </div>
                  {partner.experience && (
                    <div className="stat-item">
                      <span className="stat-value">{partner.experience}+ Yrs</span>
                      <span className="stat-label">Experience</span>
                    </div>
                  )}
                </div>

                <button className="postcard-btn">
                  View Menu
                </button>
              </div>
            </div>
          ))}
          
          {/* Intersection Observer Trigger */}
          {visiblePartnersCount < (serviceMode === 'at-home' ? (layout.featuredFreelancers?.length || 0) : (layout.featuredSalons?.length || 0)) && (
            <LoadMoreTrigger onVisible={() => setVisiblePartnersCount(prev => prev + 3)} />
          )}
        </div>
      </section>


      {/* 7. Signature Categories Navigator */}
      <section className="container section-padding category-section">
        <div className="category-header-wrap">
          <div className="category-header-text">
            <h2>{serviceMode === 'at-home' ? 'Signature Home Collections' : 'Premium Salon Categories'}</h2>
            <p>Curated beauty experiences for every style</p>
          </div>
          <div className="gender-pills-wrap">
            {['Female', 'Male'].map(g => (
              <button 
                key={g} 
                className={`gender-pill ${selectedGender === g ? 'active' : ''}`}
                onClick={() => setSelectedGender(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="category-grid-portrait" key={selectedGender}>
          {(layout.sections?.find(s => s.gender === (selectedGender === 'Both' ? 'Female' : selectedGender))?.categories || []).map((cat, i) => (
            <div 
              key={i} 
              className="category-tile-portrait" 
              onClick={() => router.push(`/services?category=${encodeURIComponent(cat.name)}&gender=${selectedGender}&city=${selectedCity}&mode=${serviceMode}`)}
            >
              <img src={cat.image} alt={cat.name} className="portrait-img" />
              <div className="portrait-overlay">
                <span className="portrait-tag">{cat.name.split(' ')[0]}</span>
                <span className="portrait-label">{cat.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Media & Footer */}
      <Footer />
    </main>
  );
}
