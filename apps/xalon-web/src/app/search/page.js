'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSalons } from '../../services/api';
import '../globals.css';

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const city = searchParams.get('city');
  const category = searchParams.get('category');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      const data = await getSalons({
        city,
        category,
        q: query,
        sort: 'rating'
      });
      setResults(data);
      setLoading(false);
    }
    fetchResults();
  }, [query, city, category]);

  return (
    <div className="search-page">
      <header className="search-header">
        <div className="container">
          <button onClick={() => window.history.back()} className="back-link">← Back</button>
          <h1>Results for "{query || category || 'Services'}" in {city || 'your area'}</h1>
        </div>
      </header>

      <main className="container main-content">
        <aside className="filters">
          <h3>Filters</h3>
          {/* Add basic filters here later */}
          <div className="filter-group">
            <label>Provider Type</label>
            <select>
              <option>All</option>
              <option>Salon</option>
              <option>Freelancer</option>
            </select>
          </div>
        </aside>

        <section className="results-list">
          {loading ? (
            <div className="loading-state">Finding the best stylists for you...</div>
          ) : results.length > 0 ? (
            <div className="results-grid">
              {results.map((salon) => (
                <div key={salon.id} className="result-card">
                  <div className="card-image">
                    {salon.coverImage ? (
                      <img src={salon.coverImage} alt={salon.businessName} />
                    ) : (
                      <div className="no-image">📍</div>
                    )}
                    <span className="rating">⭐ {parseFloat(salon.rating || 0).toFixed(1)}</span>
                  </div>
                  <div className="card-info">
                    <div className="title-row">
                      <h4>{salon.businessName || salon.name}</h4>
                      {salon.isVerified && <span className="verified-badge">✓</span>}
                    </div>
                    <p className="area">{salon.area || salon.city}</p>
                    <div className="tags">
                      <span className="tag type-tag">{salon.partnerType}</span>
                      <span className="tag gender-tag">{salon.genderPreference}</span>
                    </div>
                    <div className="footer-row">
                      <span className="price">
                        {salon.relevantPrice 
                          ? `₹${salon.relevantPrice}${salon.relevantPrice === 299 ? ' (Admin Price)' : ''}` 
                          : 'Starting from ₹299'}
                      </span>
                      <button className="book-btn">Book Now</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <h3>No professionals found</h3>
              <p>Try searching for a different service or city.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
