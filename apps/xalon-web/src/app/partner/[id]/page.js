'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getSalon, getSalonServices } from '../../../services/api';
import '../../globals.css';

export default function PartnerDetail({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const [partner, setPartner] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [pData, sData] = await Promise.all([
        getSalon(id),
        getSalonServices(id)
      ]);
      setPartner(pData);
      setServices(sData);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="loading"><span>Loading Experience...</span></div>;
  if (!partner) return <div className="loading"><span>Partner not found</span></div>;

  const categories = ['All', ...new Set(services.map(s => s.category))];
  const filteredServices = activeCategory === 'All' 
    ? services 
    : services.filter(s => s.category === activeCategory);

  return (
    <div className="search-page">
      <header className="search-header" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => window.history.back()} className="back-link">← Back</button>
          <div className="partner-header-info" style={{ textAlign: 'right' }}>
            <h1 style={{ margin: 0 }}>{partner.name}</h1>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{partner.area}, {partner.city}</span>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1000px' }}>
        {/* Cover Section */}
        <div className="partner-hero" style={{ 
          height: '350px', 
          borderRadius: '32px', 
          overflow: 'hidden', 
          position: 'relative',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow)'
        }}>
          <img 
            src={partner.coverImage || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200'} 
            alt={partner.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="hero-overlay" style={{ 
            position: 'absolute', 
            bottom: 0, left: 0, right: 0,
            padding: '2rem',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span className="specialty" style={{ color: 'var(--white)', opacity: 0.9 }}>{partner.partnerType.replace('_', ' ')}</span>
                <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{partner.name}</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                    ⭐ {partner.rating} ({partner.reviews} reviews)
                  </span>
                  {partner.isVerified && <span style={{ color: '#4ade80', fontWeight: 'bold' }}>✓ Verified</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
          {/* Left: Services Menu */}
          <div className="services-section">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Service Menu</h3>
            
            <div className="expert-tabs" style={{ padding: 0, marginBottom: '2rem', overflowX: 'auto' }}>
              {categories.map(cat => (
                <button 
                  key={cat} 
                  className={`expert-tab ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="service-menu-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {filteredServices.map(service => (
                <div key={service.id} className="service-menu-item" style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  border: '1px solid #f3f4f6'
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{service.name}</h4>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.8rem' }}>
                      <span>⏱️ {service.duration || 30} mins</span>
                      <span>Target: {service.gender || 'Unisex'}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '450px' }}>
                      {service.description || 'Professional service by our top experts.'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '2rem' }}>
                    <div className="price-tag" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.8rem' }}>
                      ₹{service.price || service.defaultPrice}
                    </div>
                    <button className="book-btn" style={{ padding: '0.5rem 1.5rem' }}>Add</button>
                  </div>
                </div>
              ))}
              {filteredServices.length === 0 && <p>No services found in this category.</p>}
            </div>
          </div>

          {/* Right: Info & CTA */}
          <div className="about-section">
            <div className="info-card" style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '24px', 
              boxShadow: 'var(--shadow)',
              position: 'sticky',
              top: '120px'
            }}>
              <h4>About Us</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '1rem 0' }}>
                {partner.about || 'Offering premium beauty and grooming services with a focus on hygiene and customer satisfaction.'}
              </p>
              
              <div className="location-info" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem' }}>
                  <span>📍</span>
                  <div style={{ fontSize: '0.9rem' }}>
                    <strong>Location</strong><br/>
                    {partner.addressLine}<br/>
                    {partner.area}, {partner.city}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <span>🕒</span>
                  <div style={{ fontSize: '0.9rem' }}>
                    <strong>Hours</strong><br/>
                    {partner.openTime} - {partner.closeTime}
                  </div>
                </div>
              </div>

              <button className="btn-search" style={{ width: '100%', marginTop: '2rem' }}>Proceed to Booking</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
