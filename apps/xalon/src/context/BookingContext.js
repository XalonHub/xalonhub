import React, { createContext, useContext, useState } from 'react';

const BookingContext = createContext(null);

const initialDraft = {
    // Location
    location: null, // { lat, lng, city }
    // Service mode
    serviceMode: 'AtHome', // 'AtHome' | 'AtSalon'
    // Category
    category: null, // 'Men' | 'Women' | 'Unisex'
    gender: null,   // 'Male' | 'Female' | 'Unisex'
    // Selected services
    selectedServices: [], // [ { id, name, price, duration } ]
    // Date & Time
    bookingDate: null, // ISO string
    timeSlot: null,    // "10:00"
    // Post-assignment
    assignedProvider: null, // { id, name, type, area, rating, whatsappPhone }
    confirmedBooking: null, // the full booking object after creation
};

export function BookingProvider({ children }) {
    const [draft, setDraft] = useState(initialDraft);

    const updateDraft = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

    const resetDraft = () => setDraft(initialDraft);

    const toggleService = (service) => {
        setDraft((prev) => {
            const exists = prev.selectedServices.find((s) => s.id === service.id);
            return {
                ...prev,
                selectedServices: exists
                    ? prev.selectedServices.filter((s) => s.id !== service.id)
                    : [...prev.selectedServices, service],
            };
        });
    };

    const totalPrice = draft.selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);

    return (
        <BookingContext.Provider value={{ draft, updateDraft, resetDraft, toggleService, totalPrice }}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBooking() {
    return useContext(BookingContext);
}
