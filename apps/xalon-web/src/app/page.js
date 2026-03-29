'use client';

import { useEffect, useState } from 'react';
import { getCities, getHomeLayout } from '../services/api';
import './globals.css';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [layout, setLayout] = useState(null);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [providerTab, setProviderTab] = useState('salons');
  const [showIncentive, setShowIncentive] = useState(true);

  useEffect(() => {
    // Only access localStorage in the browser after mount to prevent hydration mismatch
    const savedUser = localStorage.getItem('xalon_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }

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
    fetchData();
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchQuery)}&city=${encodeURIComponent(selectedCity)}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('xalon_user');
    setUser(null);
  };

  const LOGO_URL = "http://localhost:5001/admin/assets/logo_full.png";

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

  if (!layout) return <div className="loading"><span>Loading Xalon Ultimate...</span></div>;

  const bgImage = layout.hero?.bgImage || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200";

  return (
    <main className="main-wrapper">
      {/* 1. Hero Section & Navbar */}
      <section className="hero" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bgImage})` }}>
        <nav className="navbar">
          <div className="logo" onClick={() => router.push('/')}>
            <img src={LOGO_URL} alt="XALON" className="navbar-logo" />
          </div>
          <div className="nav-actions">
            {user ? (
              <div className="user-profile-nav">
                <span className="user-name">Hi, {user.name || 'Member'}</span>
                <button className="btn-logout" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <button className="btn-signin" onClick={() => router.push('/login')}>Sign In</button>
            )}
          </div>
        </nav>
        
        <div className="hero-content">
          <h1>{layout.hero?.title || "Bringing Salon Expertise to Your Doorstep"}</h1>
          <p>{layout.hero?.subtitle || "Book verified professionals from top-rated salons in 30 seconds."}</p>
          
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
            {layout.banners.map(banner => (
              <div key={banner.id} className="banner-card" style={{ backgroundColor: banner.color }}>
                <div className="banner-text">
                  <h3>{banner.title}</h3>
                  <p>{banner.subtitle}</p>
                  <button className="btn-mini">Book Now</button>
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
            <h2>Most Booked Services</h2>
            <span className="view-all">View All</span>
          </div>
          <div className="horizontal-scroll">
            {layout.mostBooked.map(service => (
              <div key={service.id} className="service-card-compact" onClick={() => router.push(`/search?q=${service.id}&city=${selectedCity}`)}>
                <div className="card-thumb">
                  <img src={service.image} alt={service.name} />
                  <span className="rating-badge">⭐ {service.rating}</span>
                </div>
                <h4>{service.name}</h4>
                <p className="price">₹{service.defaultPrice}</p>
              </div>
            ))}
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
            <p>On your first booking through the XALON App</p>
          </div>
          <button className="btn-secondary" style={{ padding: '0.8rem 1.5rem', width: '100%' }}>Download App</button>
        </div>
      )}

      {/* 6. Salons & Professionals Showcase */}
      <section className="bg-light section-padding">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Top Rated Salons & Professionals</h2>
              <p>Premium beauty and grooming partners near you</p>
            </div>
          </div>

          <div className="expert-tabs">
            <button 
              className={`expert-tab ${providerTab === 'salons' ? 'active' : ''}`}
              onClick={() => setProviderTab('salons')}
            >
              Salons
            </button>
            <button 
              className={`expert-tab ${providerTab === 'freelancers' ? 'active' : ''}`}
              onClick={() => setProviderTab('freelancers')}
            >
              Freelancers
            </button>
          </div>

          <div className="horizontal-scroll">
            {(providerTab === 'salons' ? (layout.featuredSalons || []) : (layout.featuredFreelancers || [])).map(stylist => {
              const getInitials = (name) => {
                if (!name) return "P";
                const parts = name.split(' ');
                if (parts.length === 1) return parts[0].substring(0, 1);
                return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
              };

              return (
                <div key={stylist.id} className="stylist-card">
                  {stylist.image ? (
                    <img src={stylist.image} alt={stylist.name} />
                  ) : (
                    <div className="initials-circle">{getInitials(stylist.name)}</div>
                  )}
                  <div className="stylist-info">
                    <h4>{stylist.name}</h4>
                    <p className="specialty">{stylist.specialty}</p>
                    <div className="stylist-meta">
                      <span className="stylist-rating">⭐ {stylist.rating}</span>
                      <span className="reviews">({stylist.reviews} Reviews)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Categorized Discovery */}
      {layout.sections?.map((section, idx) => (
        <section key={idx} className="container section-padding border-bottom">
          <div className="section-header">
            <h2>{section.title}</h2>
          </div>
          <div className="category-grid">
            {section.categories.map((cat, i) => (
              <div 
                key={i} 
                className="category-tile-photo"
                style={{ 
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url(${cat.image || getCategoryImage(cat.name)})` 
                }}
                onClick={() => router.push(`/search?category=${encodeURIComponent(cat.name)}&gender=${section.gender}&city=${selectedCity}`)}
              >
                <div className="tile-img-overlay">
                  <span>{cat.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* 8. Media & Footer */}
      <footer className="footer-premium">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-about">
              <div className="logo">
                <img src={LOGO_URL} alt="XALON" className="footer-logo" />
              </div>
              <p>Bringing premium salon expertise to your doorstep while changing the lives of service professionals.</p>
            </div>
            <div className="footer-links">
              <h4>Quick Links</h4>
              <ul>
                <li>About Us</li>
                <li>Services</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div className="footer-app">
              <h4>Download App</h4>
              <div className="store-buttons-footer">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" style={{ height: '40px', cursor: 'pointer' }} />
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" style={{ height: '40px', cursor: 'pointer' }} />
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 XalonHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
