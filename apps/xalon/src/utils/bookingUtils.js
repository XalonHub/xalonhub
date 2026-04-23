import { Linking, Platform } from 'react-native';

/**
 * Helper to combine bookingDate (ISO) and timeSlot ("HH:mm") into a single Date object.
 */
export function parseBookingTime(bookingDate, timeSlot) {
    if (!bookingDate) return null;
    const date = new Date(bookingDate);
    if (timeSlot && timeSlot.includes(':')) {
        const [hours, minutes] = timeSlot.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
    }
    return date;
}

/**
 * Calculates human-readable time remaining.
 * Returns: "In 30 mins", "In 2 hours", "In 1 day", or null if past/invalid.
 */
export function getTimeRemaining(bookingDate, timeSlot) {
    const target = parseBookingTime(bookingDate, timeSlot);
    if (!target) return null;

    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) return null; // Already started or past

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
        return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
    if (diffHours > 0) {
        return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    }
    if (diffMins > 0) {
        return `In ${diffMins} min${diffMins > 1 ? 's' : ''}`;
    }

    return 'Starting soon';
}

/**
 * Haversine distance in km.
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Formats distance for display.
 */
export function formatDistance(km) {
    if (km === null || km === undefined) return null;
    if (km < 1) {
        return `${Math.round(km * 1000)}m away`;
    }
    return `${km.toFixed(1)}km away`;
}

/**
 * Opens Google Maps with coordinates.
 */
export function openMaps(lat, lng, label = 'Salon') {
    if (!lat || !lng) return;
    const url = Platform.select({
        ios: `maps:0,0?q=${label}@${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}(${label})`,
        web: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    }) || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    Linking.openURL(url);
}

/**
 * Formats a phone number for WhatsApp wa.me links.
 * Normalizes input to international format without special characters or leading zeros.
 */
export function formatWhatsAppUrl(phone, message = '') {
    if (!phone) return null;
    
    // 1. Remove all non-digits
    let cleaned = phone.toString().replace(/\D/g, '');
    
    // 2. Handle leading zeros (common in some local formats)
    while (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    
    // 3. Prepend 91 if it's 10 digits (India)
    // If it's already 12 digits starting with 91, it's correct.
    // If it's something else, we assume it's already in international format.
    if (cleaned.length === 10) {
        cleaned = `91${cleaned}`;
    }
    
    let url = `https://wa.me/${cleaned}`;
    if (message) {
        url += `?text=${encodeURIComponent(message)}`;
    }
    return url;
}

