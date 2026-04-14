'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getSalon, getSalonServices } from '../../../services/api';
import { useBooking } from '../../../services/bookingContext';
import BookingDrawer from '../../../components/booking/BookingDrawer';
import '../../globals.css';

export default function PartnerDetail({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const [localPartner, setLocalPartner] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  const { partner, setPartner, cart, toggleService, clearCart, openDrawer } = useBooking();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [pData, sData] = await Promise.all([
        getSalon(id),
        getSalonServices(id)
      ]);
      setLocalPartner(pData);
      setServices(sData);
      
      // Clear cart if viewing a different partner than before
      if (partner?.id !== id) {
         clearCart();
      }
      setPartner(pData);
      
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="loading"><span>Loading Experience...</span></div>;
  if (!localPartner) return <div className="loading"><span>Partner not found</span></div>;

  const categories = ['All', ...new Set(services.map(s => s.category))];
  const filteredServices = activeCategory === 'All' 
    ? services 
    : services.filter(s => s.category === activeCategory);

  const totalAmount = cart.reduce((sum, item) => sum + (item.price || item.defaultPrice || 0), 0);

  return (
    <div className="search-page">
      <header className="search-header" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => window.history.back()} className="back-link">← Back</button>
          <div className="partner-header-info" style={{ textAlign: 'right' }}>
            <h1 style={{ margin: 0 }}>{localPartner.name}</h1>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{localPartner.area}, {localPartner.city}</span>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px' }}>
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
            src={localPartner.coverImage || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200'} 
            alt={localPartner.name}
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
                <span className="specialty" style={{ color: 'var(--white)', opacity: 0.9 }}>{localPartner.partnerType.replace('_', ' ')}</span>
                <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{localPartner.name}</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                    ⭐ {localPartner.rating} ({localPartner.reviews} reviews)
                  </span>
                  {localPartner.isVerified && <span style={{ color: '#4ade80', fontWeight: 'bold' }}>✓ Verified</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: cart.length > 0 ? '1fr 350px' : '1fr 320px', gap: '2rem', transition: 'grid-template-columns 0.3s ease' }}>
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
              {filteredServices.map(service => {
                const isSelected = cart.find(c => c.id === service.id);
                return (
                 <div key={service.id} className={`service-menu-item ${isSelected ? 'selected' : ''}`} style={{
                  background: isSelected ? 'var(--primary-soft)' : 'white',
                  padding: '1.5rem',
                  borderRadius: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid #f3f4f6',
                  transition: 'all 0.2s ease'
                 }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: isSelected ? 'var(--primary)' : 'inherit' }}>{service.name}</h4>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.8rem' }}>
                      <span>⏱️ {service.duration || 30} mins</span>
                      <span>Target: {service.gender || 'Unisex'}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '450px' }}>
                      {service.description || 'Professional service by our experts.'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div className="price-tag" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{service.price || service.defaultPrice}
                    </div>
                    <button 
                       className={isSelected ? "btn-secondary" : "book-btn"} 
                       style={{ padding: '0.5rem 1.5rem', width: '100px' }}
                       onClick={() => toggleService(service)}
                    >
                       {isSelected ? 'Remove' : 'Add'}
                    </button>
                  </div>
                 </div>
                );
              })}
              {filteredServices.length === 0 && <p>No services found in this category.</p>}
            </div>
          </div>

          {/* Right: Info & Dynamic Cart CTA */}
          <div className="about-section">
            <div className="info-card" style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '24px', 
              boxShadow: 'var(--shadow)',
              position: 'sticky',
              top: '120px',
              border: cart.length > 0 ? '1px solid var(--primary)' : 'none'
            }}>
              {cart.length > 0 ? (
                // Selected Services Panel
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--primary)' }}>Selected Services</h4>
                    <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{cart.length}</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                        <span style={{ fontWeight: '500', flex: 1, paddingRight: '0.5rem' }}>{item.name}</span>
                        <span style={{ fontWeight: '600' }}>₹{item.price || item.defaultPrice}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                    <strong>Total Amount</strong>
                    <strong style={{ color: 'var(--primary)' }}>₹{totalAmount}</strong>
                  </div>

                  <button className="btn-search" style={{ width: '100%' }} onClick={openDrawer}>Pick a Slot & Book</button>
                </div>
              ) : (
                // Default About Panel
                <div>
                  <h4>About Us</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '1rem 0' }}>
                    {localPartner.about || 'Offering premium beauty and grooming services with a focus on hygiene and customer satisfaction.'}
                  </p>
                  
                  <div className="location-info" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem' }}>
                      <span>📍</span>
                      <div style={{ fontSize: '0.9rem' }}>
                        <strong>Location</strong><br/>
                        {localPartner.addressLine}<br/>
                        {localPartner.area}, {localPartner.city}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                      <span>🕒</span>
                      <div style={{ fontSize: '0.9rem' }}>
                        <strong>Hours</strong><br/>
                        {localPartner.openTime} - {localPartner.closeTime}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <BookingDrawer />
    </div>
  );
}
