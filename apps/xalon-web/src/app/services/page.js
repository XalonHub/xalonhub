'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getCatalog } from '../../services/api';
import '../globals.css';

function ServiceList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get('category');
  const gender = searchParams.get('gender');
  const city = searchParams.get('city') || 'your area';

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      const data = await getCatalog({
        category,
        gender
      });
      setServices(data);
      setLoading(false);
    }
    fetchServices();
  }, [category, gender]);

  const handleServiceClick = (service) => {
    // Navigate to search with this service as the query
    router.push(`/search?q=${encodeURIComponent(service.name)}&city=${encodeURIComponent(city)}`);
  };

  return (
    <div className="search-page">
      <header className="search-header">
        <div className="container">
          <button onClick={() => window.history.back()} className="back-link">← Back</button>
          <h1>{category} Services for {gender || 'Everyone'}</h1>
        </div>
      </header>

      <main className="container main-content">
        <section className="results-list" style={{ width: '100%' }}>
          {loading ? (
            <div className="loading-state">Fetching our finest services...</div>
          ) : services.length > 0 ? (
            <div className="category-grid">
              {services.map((service) => (
                <div 
                  key={service.id} 
                  className="service-card-compact"
                  style={{ minWidth: 'unset', width: '100%' }}
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="card-thumb">
                    <img 
                      src={service.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&h=400'} 
                      alt={service.name} 
                    />
                    {service.isFeatured && <span className="rating-badge">✨ Featured</span>}
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{service.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 1rem 0', height: '2.5rem', overflow: 'hidden' }}>
                      {service.description || 'Premium grooming experience with expert hands.'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="price">Starting from ₹{service.effectivePrice || service.defaultPrice}</span>
                      <button className="btn-mini" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>Select</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <h3>No services found in this category</h3>
              <p>Try exploring another category or check back later.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="loading">Loading Services...</div>}>
      <ServiceList />
    </Suspense>
  );
}
