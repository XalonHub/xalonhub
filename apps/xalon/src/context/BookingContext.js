import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';

const BookingContext = createContext(null);

const initialDraft = {
    // Location
    location: null, // { lat, lng, city }
    // Service mode
    serviceMode: 'AtHome', // 'AtHome' | 'AtSalon'
    // Category
    category: null, // 'Men' | 'Women' | 'Unisex'
    gender: null,   // 'Male' | 'Female' | 'Unisex'
    // At Salon: selected salon object
    selectedSalon: null, // { id, businessName, addressLine, area, city, lat, lng, ... }
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

            if (!exists) {
                // Check gender consistency
                const firstService = prev.selectedServices[0];
                if (firstService && firstService.gender !== service.gender) {
                    // In a real app, we use Alert.alert, but here we'll just prevent it
                    // and let the UI handle the "active" gender state
                    if (typeof Alert !== 'undefined') {
                        Alert.alert(
                            "Mixed Selection",
                            "For safety, you cannot mix services for different genders in one appointment."
                        );
                    }
                    return prev;
                }
            }

            const nextServices = exists
                ? prev.selectedServices.filter((s) => s.id !== service.id)
                : [...prev.selectedServices, service];

            return {
                ...prev,
                selectedServices: nextServices,
                // Automatically set the draft gender based on the selection
                gender: nextServices.length > 0 ? nextServices[0].gender : null
            };
        });
    };

    const totalPrice = draft.selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
    const totalDuration = draft.selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0);

    const isBookingInProgress = draft.selectedServices.length > 0;

    return (
        <BookingContext.Provider value={{
            draft,
            updateDraft,
            resetDraft,
            toggleService,
            totalPrice,
            totalDuration,
            isBookingInProgress
        }}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBooking() {
    return useContext(BookingContext);
}
