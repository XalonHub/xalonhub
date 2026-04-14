'use client';

import { useState, useEffect } from 'react';
import { useBooking } from '../../services/bookingContext';
import SlotPicker from './SlotPicker';
import { createBooking, getSettings, getSalonStylists, getCustomerProfile } from '../../services/api';

export default function BookingDrawer() {
  const { isDrawerOpen, closeDrawer, cart, partner, clearCart, selectedSlot, setSelectedSlot } = useBooking();
  const [step, setStep] = useState(1); // 1: Slot, 2: Details & Payment, 2.5: Sandbox, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Economics State
  const [convenienceFee, setConvenienceFee] = useState(0);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Forced Cash on Web
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // AtSalon Stylist Preferences
  const [stylists, setStylists] = useState([]);
  const [stylistPreference, setStylistPreference] = useState('Any'); // 'Any' or 'Specific'
  const [selectedStylistId, setSelectedStylistId] = useState(null);

  const serviceMode = partner?.partnerType === 'Freelancer' ? 'AtHome' : 'AtSalon';

  // Load backend settings for fees
  useEffect(() => {
    async function loadSettings() {
      const config = await getSettings();
      setConvenienceFee(config.platformFee || 0);
    }
    loadSettings();
  }, []);

  // Fetch stylists if it's a Salon
  useEffect(() => {
    async function fetchStylists() {
      if (serviceMode === 'AtSalon' && partner?.id && isDrawerOpen) {
        const list = await getSalonStylists(partner.id);
        setStylists(list || []);
      }
    }
    fetchStylists();
  }, [serviceMode, partner?.id, isDrawerOpen]);

  // Read user from localStorage if available and fetch latest profile + address
  useEffect(() => {
    async function loadUserData() {
      if (isDrawerOpen && step === 1) {
        try {
          const uStr = localStorage.getItem('xalon_user');
          if (!uStr) return;
          const u = JSON.parse(uStr);
          
          // Initial optimistic update from localStorage
          if (u) {
            if (u.name && u.name !== 'User') setName(u.name);
            if (u.phone) setPhone(u.phone);
          }

          // Fetch latest profile including addresses
          if (u && u.customerProfileId) {
             const profile = await getCustomerProfile(u.customerProfileId);
             if (profile) {
                if (profile.name && profile.name !== 'User') {
                   // Only update name if it wasn't typed manually or is empty/User
                   u.name = profile.name;
                   localStorage.setItem('xalon_user', JSON.stringify(u));
                   if (u.name && u.name !== 'User') setName(profile.name);
                }
                if (serviceMode === 'AtHome' && profile.addresses?.length > 0) {
                   const defaultAddr = profile.addresses.find(a => a.isDefault) || profile.addresses[0];
                   setAddress(`${defaultAddr.addressLine}, ${defaultAddr.city}`);
                }
             }
          }
        } catch(e) {
           console.error("Failed to load user profile in booking drawer", e);
        }
      }
    }
    loadUserData();
  }, [isDrawerOpen, step, serviceMode]);

  // removed recipientType clear inputs logic

  if (!isDrawerOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + (item.price || item.defaultPrice || 0), 0);
  const totalAmount = subtotal + convenienceFee;

  const handleNextStep = () => {
    if (step === 1 && !selectedSlot) {
      setError("Please select a date and time slot first.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handlePreConfirm = () => {
    if (!name || !phone) {
        setError("Name and Phone are required.");
        return;
    }
    if (serviceMode === 'AtHome' && !address) {
        setError("Service Address is required for home visits.");
        return;
    }
    if (serviceMode === 'AtSalon' && stylistPreference === 'Specific' && !selectedStylistId) {
        setError("Please select a specific professional.");
        return;
    }

    processBooking(); // Direct Cash flow
  };

  const processBooking = async () => {
    setLoading(true);
    setError(null);

    let customerId = null;
    try {
      const u = JSON.parse(localStorage.getItem('xalon_user'));
      if (u && u.customerProfileId) customerId = u.customerProfileId;
    } catch(e) {}

    try {
      const payload = {
        serviceIds: cart.map(s => s.id || s.catalogId),
        serviceMode: serviceMode,
        salonId: partner.id, 
        bookingDate: selectedSlot.date.toISOString(),
        timeSlot: selectedSlot.time,
        beneficiaryName: name,
        beneficiaryPhone: phone,
        guestName: name, // for manual walkin fallback flow
        customerId: customerId, // Ties the booking to the logged in user natively
        paymentMethod: paymentMethod,
        stylistId: stylistPreference === 'Specific' ? selectedStylistId : null,
        location: serviceMode === 'AtHome' ? {
           city: partner.city || 'Home',
           addressLine: address,
           lat: 0, 
           lng: 0
        } : {
           city: partner.city,
           addressLine: partner.addressLine || '',
           lat: partner.lat,
           lng: partner.lng
        }
      };

      const res = await createBooking(payload);
      setConfirmedBooking(res.booking);
      setStep(3);
      clearCart();

    } catch (err) {
       console.error("Booking failed:", err);
       setError(err.message || "Failed to confirm booking. Please try again.");
       setStep(2); // Kick back to checkout details
    } finally {
       setLoading(false);
    }
  };

  const resetDrawer = () => {
      setStep(1);
      setError(null);
      setSelectedSlot(null);
      setConfirmedBooking(null);
      setStylistPreference('Any');
      setSelectedStylistId(null);
      closeDrawer();
  };

  return (
    <div className="drawer-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', justifyContent: 'flex-end'
    }}>
      <div className="drawer-content" style={{
        width: '100%', maxWidth: '450px', backgroundColor: 'white',
        height: '100%', display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
        animation: 'slideIn 0.3s ease-out',
        position: 'relative'
      }}>
        

        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <h2 style={{ fontSize: '1.3rem', margin: 0 }}>
             {step === 1 ? 'Select Time Slot' : step >= 2 && step !== 3 ? 'Checkout & Pay' : 'Booking Confirmed'}
           </h2>
           {step !== 3 && step !== 2.5 && (
             <button onClick={closeDrawer} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
           )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
           {error && <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

           {step === 1 && (
             <div>
                <SlotPicker 
                   partnerId={partner?.id}
                   services={cart}
                   serviceMode={serviceMode}
                   onSlotSelect={setSelectedSlot}
                   selectedSlot={selectedSlot}
                   city={partner?.city}
                />
             </div>
           )}

           {step === 2 && (
             <div className="checkout-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* 1. Services Summary & Economics */}
                <div className="summary-card" style={{ background: '#f9fafb', padding: '1.2rem', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                   <h4 style={{ margin: '0 0 1rem 0', display: 'flex', justifyContent: 'space-between' }}>
                      Booking Summary
                      <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#6b7280' }}>
                         {selectedSlot.date.toDateString()} at {selectedSlot.time}
                      </span>
                   </h4>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span>Item Subtotal ({cart.length} items)</span>
                      <span>₹{subtotal}</span>
                   </div>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.9rem', color: '#6b7280' }}>
                      <span>Convenience Fee</span>
                      <span>₹{convenienceFee}</span>
                   </div>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #d1d5db', paddingTop: '0.8rem', fontWeight: 'bold' }}>
                      <span>Total Payable</span>
                      <span style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>₹{totalAmount}</span>
                   </div>
                </div>

                {/* 2. Contact Info */}
                <div>
                   <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Contact Information</label>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                     <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} placeholder="Contact Name" />
                     <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} placeholder="10 Digit Phone Number" />
                   </div>
                </div>

                {/* 3. Address or Salon Location */}
                {serviceMode === 'AtHome' ? (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Service Address</label>
                    <textarea value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', minHeight: '80px', fontFamily: 'inherit' }} placeholder="Enter full address for the home visit..."></textarea>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Salon Location</label>
                    <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', color: '#4b5563' }}>
                        📍 {partner?.addressLine}, {partner?.area}, {partner?.city}
                    </div>
                  </div>
                )}

                {/* 4. Stylist Preference (At Salon Only) */}
                {serviceMode === 'AtSalon' && stylists.length > 0 && (
                   <div>
                       <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Professional Preference</label>
                       <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                          <button 
                             onClick={() => setStylistPreference('Any')}
                             style={{ flex: 1, padding: '0.6rem', borderRadius: '24px', border: stylistPreference === 'Any' ? '2px solid var(--primary)' : '1px solid #d1d5db', background: stylistPreference === 'Any' ? 'var(--primary-soft)' : 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                          >Any available</button>
                          <button 
                             onClick={() => setStylistPreference('Specific')}
                             style={{ flex: 1, padding: '0.6rem', borderRadius: '24px', border: stylistPreference === 'Specific' ? '2px solid var(--primary)' : '1px solid #d1d5db', background: stylistPreference === 'Specific' ? 'var(--primary-soft)' : 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                          >I have a preference</button>
                       </div>

                       {stylistPreference === 'Specific' && (
                           <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                               {stylists.map(stylist => (
                                   <div 
                                      key={stylist.id} 
                                      onClick={() => setSelectedStylistId(stylist.id)}
                                      style={{ minWidth: '90px', textAlign: 'center', cursor: 'pointer' }}
                                   >
                                      <img 
                                        src={stylist.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(stylist.name)}`} 
                                        alt={stylist.name} 
                                        style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: selectedStylistId === stylist.id ? '3px solid var(--primary)' : '2px solid transparent', padding: '2px' }}
                                      />
                                      <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: selectedStylistId === stylist.id ? 'bold' : 'normal', color: selectedStylistId === stylist.id ? 'var(--primary)' : 'inherit' }}>
                                        {stylist.name.split(' ')[0]}
                                      </p>
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
                )}

                {/* 5. Payment Method */}
                <div>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Payment Method</label>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <div 
                         style={{ padding: '1rem', border: '1px solid #d1d5db', borderRadius: '12px', background: '#f9fafb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                         <span style={{ fontSize: '1.5rem' }}>💵</span>
                         <div>
                            <div style={{ fontWeight: 'bold' }}>{serviceMode === 'AtSalon' ? 'Pay at Salon' : 'Cash After Service'}</div>
                            <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '0.2rem' }}>Pay directly after your service.</div>
                            <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.2rem' }}>Manage and pay online securely via the Xalon App.</div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {step === 3 && (
             <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2.5rem', color: '#16a34a' }}>
                  ✓
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Booking Successful!</h3>
                <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
                  Your appointment with {partner?.name} has been confirmed.
                </p>
                <div style={{ background: '#f9fafb', border: '2px solid var(--primary)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', marginBottom: '2rem' }}>
                   <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.2rem' }}>Download the Xalon App</h4>
                   <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#4b5563' }}>Manage this booking, cancel, or securely pay online using our mobile app.</p>
                   <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                      <button className="btn-secondary" style={{ padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>Apple Store</button>
                      <button className="btn-secondary" style={{ padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>Google Play</button>
                   </div>
                </div>
                <button onClick={resetDrawer} className="btn-search" style={{ width: '100%', padding: '1rem' }}>Finish</button>
             </div>
           )}
        </div>

        {step !== 3 && step !== 2.5 && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid #f3f4f6', background: 'white' }}>
            <button 
               className="btn-search" 
               style={{ width: '100%', padding: '1rem', opacity: loading ? 0.7 : 1 }}
               onClick={step === 1 ? handleNextStep : handlePreConfirm}
               disabled={loading}
            >
               {loading ? 'Processing...' : step === 1 ? 'Proceed to Details' : 'Confirm Bookings'}
            </button>
            {step === 2 && !loading && (
              <button 
                onClick={() => setStep(1)} 
                style={{ width: '100%', padding: '1rem', background: 'none', border: 'none', color: '#6b7280', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}
              >
                Go Back
              </button>
            )}
          </div>
        )}

      </div>
      
      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
