'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAvailableSlots } from '../../services/api';

export default function SlotPicker({ partnerId, services, serviceMode, onSlotSelect, selectedSlot, city, lat, lng }) {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate next 7 days
  const dates = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  const [selectedDate, setSelectedDate] = useState(dates[0]);

  useEffect(() => {
    async function fetchSlots() {
      if (!services || services.length === 0) return;
      
      setLoading(true);
      setError(null);
      try {
        const serviceIds = services.map(s => s.id || s.catalogId);
        // Format date to YYYY-MM-DD local time
        const offset = selectedDate.getTimezoneOffset();
        const dateStr = new Date(selectedDate.getTime() - (offset*60*1000)).toISOString().split('T')[0];
        
        const slots = await getAvailableSlots(
            serviceIds, 
            serviceMode, 
            dateStr, 
            lat, 
            lng, 
            city,
            partnerId // Send partnerId as salonId based on backend slot routes
        );
        setAvailableSlots(slots || []);
      } catch (err) {
        console.error("Error fetching slots:", err);
        setError("Failed to load slots. Please try another date.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchSlots();
  }, [selectedDate, services, serviceMode, partnerId, city, lat, lng]);

  const handleDateSelect = (d) => {
    setSelectedDate(d);
    onSlotSelect(null); // Clear selected time when date changes
  };

  const handleSlotSelect = (timeValue) => {
    onSlotSelect({
        date: selectedDate,
        time: timeValue
    });
  };

  const formatDateLabel = (d) => {
    const isToday = new Date().toDateString() === d.toDateString();
    if (isToday) return 'Today';
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="slot-picker">
      <div className="date-scroller" style={{ display: 'flex', overflowX: 'auto', gap: '1rem', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
        {dates.map((d, i) => (
          <button 
            key={i}
            className={`date-btn ${selectedDate.toDateString() === d.toDateString() ? 'active' : ''}`}
            onClick={() => handleDateSelect(d)}
            style={{
                flexShrink: 0,
                padding: '0.8rem 1.2rem',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                background: selectedDate.toDateString() === d.toDateString() ? 'var(--primary)' : 'white',
                color: selectedDate.toDateString() === d.toDateString() ? 'white' : 'inherit',
                cursor: 'pointer',
                textAlign: 'center',
                minWidth: '80px'
            }}
          >
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{d.getDate()}</div>
          </button>
        ))}
      </div>

      <div className="slots-container" style={{ marginTop: '1rem' }}>
        {loading ? (
           <div className="loader-dots" style={{ justifyContent: 'center' }}>
             <span></span><span></span><span></span>
           </div>
        ) : error ? (
           <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>
        ) : availableSlots.length === 0 ? (
           <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem 0' }}>No slots available for this date.</p>
        ) : (
           <div className="slots-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.8rem' }}>
              {availableSlots.map(slot => {
                  const isSelected = selectedSlot && 
                                     selectedSlot.time === slot.value && 
                                     selectedSlot.date.toDateString() === selectedDate.toDateString();
                  return (
                      <button
                        key={slot.value}
                        onClick={() => handleSlotSelect(slot.value)}
                        style={{
                            padding: '0.8rem 0.5rem',
                            borderRadius: '12px',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid #e5e7eb',
                            background: isSelected ? 'var(--primary-soft)' : 'white',
                            color: isSelected ? 'var(--primary)' : 'inherit',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            cursor: 'pointer'
                        }}
                      >
                         {slot.label}
                      </button>
                  );
              })}
           </div>
        )}
      </div>
    </div>
  );
}
