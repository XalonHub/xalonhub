'use client';

import { createContext, useContext, useState } from 'react';

const BookingContext = createContext();

export function BookingProvider({ children }) {
  const [partner, setPartner] = useState(null);
  const [cart, setCart] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('xalon_cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleService = (service) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === service.id);
      let newCart;
      if (exists) {
        newCart = prev.filter((item) => item.id !== service.id);
      } else {
        newCart = [...prev, service];
      }
      localStorage.setItem('xalon_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const removeService = (serviceId) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => item.id !== serviceId);
      localStorage.setItem('xalon_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('xalon_cart');
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <BookingContext.Provider
      value={{
        partner,
        setPartner,
        cart,
        toggleService,
        removeService,
        clearCart,
        selectedSlot,
        setSelectedSlot,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
