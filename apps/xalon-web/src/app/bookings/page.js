'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMyBookings } from '../../services/api';
import Header from '../../components/Header';
import Link from 'next/link';
import '../globals.css';

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('xalon_user');
    if (!savedUser) {
      router.push('/login?redirect=/bookings');
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);

    const fetchBookings = async () => {
      try {
        const data = await getMyBookings(parsedUser.customerProfileId);
        setBookings(data || []);
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (parsedUser.customerProfileId) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [router]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return {
      day: d.getDate(),
      month: d.toLocaleString('default', { month: 'short' })
    };
  };

  const getServiceSummary = (servicesJson) => {
    try {
      const services = typeof servicesJson === 'string' ? JSON.parse(servicesJson) : servicesJson;
      if (!Array.isArray(services) || services.length === 0) return 'Salon Service';
      
      const first = services[0].name;
      return services.length > 1 ? `${first} + ${services.length - 1} more` : first;
    } catch (e) {
      return 'Salon Service';
    }
  };

  if (loading) {
    return <div className="loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span>Fetching your appointments...</span>
    </div>;
  }

  return (
    <main className="bookings-page">
      <Header />
      
      <div className="bookings-container">
        <div className="bookings-header">
          <h1>My Bookings</h1>
          <button className="btn-mini" onClick={() => router.push('/')} style={{ background: '#eee', color: '#111' }}>
             Go Back
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="empty-bookings-container">
            <span className="empty-icon">📅</span>
            <h2>No bookings found</h2>
            <p>You haven't booked any services yet.</p>
            <Link href="/" className="btn-book-now-large">
              Book Your First Service
            </Link>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => {
              const { day, month } = formatDate(booking.bookingDate);
              return (
                <div key={booking.id} className="booking-card">
                  <div className="booking-main-info">
                    <div className="booking-date-badge">
                      <span className="day">{day}</span>
                      <span className="month">{month}</span>
                    </div>
                    <div className="booking-details">
                      <h3>{getServiceSummary(booking.services)}</h3>
                      <div className="booking-provider">
                        👤 {booking.partner?.name || 'Xalon Professional'}
                      </div>
                      <div className="booking-time">
                        ⏰ {booking.timeSlot || 'TBD'}
                      </div>
                    </div>
                  </div>
                  <div className="booking-meta">
                    <div className="booking-price">₹{booking.totalAmount}</div>
                    <span className={`status-pill ${booking.status?.toLowerCase() || 'requested'}`}>
                      {booking.status || 'Requested'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
