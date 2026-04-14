'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getCatalog, getCategories, getSalonServices } from '../../services/api';
import { useUI } from '../../services/uiContext';
import '../globals.css';

function ServicesLayout() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get('category');
  const gender = searchParams.get('gender');
  const query = searchParams.get('q');
  const partnerId = searchParams.get('partnerId');
  const partnerName = searchParams.get('partnerName');
  const city = searchParams.get('city') || 'your area';
  const { serviceMode } = useUI();

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Categories for Sidebar
  useEffect(() => {
    async function fetchCategories() {
      const data = await getCategories();
      setCategories(data);
      // Auto-select first category only if NO category AND NO query is provided
      if (!activeCategory && !query && data.length > 0) {
        setActiveCategory(data[0].name);
      }
    }
    fetchCategories();
  }, []);

  // 2. Fetch Services when category, query or mode changes
  useEffect(() => {
    async function fetchServices() {
      if (!activeCategory && !query && !partnerId) return;
      setLoading(true);
      
      let data = [];
      if (partnerId) {
        // Fetch services for a specific partner (Salon or Freelancer)
        data = await getSalonServices(partnerId);
        // If a category filter is active, filter the partner's services further
        if (activeCategory && activeCategory !== 'All') {
          data = data.filter(s => s.category === activeCategory);
        }
      } else {
        // Global catalog fetch
        data = await getCatalog({
          category: activeCategory,
          q: query,
          gender,
          partnerType: serviceMode === 'at-home' ? 'Freelancer' : null
        });
      }
      
      setServices(data || []);
      setLoading(false);
    }
    fetchServices();
  }, [activeCategory, query, gender, serviceMode, partnerId]);


  return (
    <div className="services-dashboard">
      {/* 1. Left Sidebar: Categories */}
      <aside className="sidebar-categories">
        <div className="sidebar-header">
          <h3>Services</h3>
        </div>
        <div className="category-list-sidebar">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className={`category-item-premium ${activeCategory === cat.name ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.name)}
            >
              <div className="cat-icon-luxury">
                <img src={cat.image || 'https://via.placeholder.com/60'} alt={cat.name} />
              </div>
              <span>{cat.name}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* 2. Center: Service Feed */}
      <main className="service-feed">
        <div className="feed-header">
          {partnerName ? (
            <>
              <h1>Services by {partnerName}</h1>
              <p>{activeCategory || 'All Specialties'}</p>
            </>
          ) : (
            <>
              <h1>{query ? `Results for "${query}"` : activeCategory}</h1>
              <p>{query ? 'Search Results' : (gender || 'Everyone')}</p>
            </>
          )}
        </div>
        
        <div className="service-scroll-area">
          {loading ? (
            <div className="loading-state-premium">
               <div className="spinner"></div>
               <p>Curating best services...</p>
            </div>
          ) : services.length > 0 ? (
            <div className="service-grid-premium">
              {services.map((service) => (
                <div key={service.id} className="luxury-service-card">
                  <div className="card-media">
                    <img src={service.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&h=300'} alt={service.name} />
                    <div className="price-badge-floating">
                      ₹{service.effectivePrice || service.defaultPrice}
                    </div>
                  </div>
                  
                  <div className="card-body-premium">
                    <h4>{service.name}</h4>
                    <p>{service.description || 'Premium grooming experience with expert hands and luxury products.'}</p>
                    
                    <div className="card-footer-action">
                      <div className="btn-luxury-redirect">
                        Book via App
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-services-found">
              <img src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png" alt="Empty" />
              <p>No services available for this selection.</p>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="loading">Loading Services...</div>}>
      <ServicesLayout />
    </Suspense>
  );
}
