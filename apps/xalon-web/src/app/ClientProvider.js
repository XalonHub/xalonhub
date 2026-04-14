'use client';

import { BookingProvider } from '../services/bookingContext';

export default function ClientProvider({ children }) {
  return (
    <BookingProvider>
      {children}
    </BookingProvider>
  );
}
