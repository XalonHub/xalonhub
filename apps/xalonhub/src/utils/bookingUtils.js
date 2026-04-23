import { Platform, Linking } from 'react-native';

/**
 * Calculates the distance between two points on the Earth's surface
 * using the Haversine formula.
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Formats a distance in km to a readable string.
 */
export function formatDistance(km) {
    if (!km || km === 0) return null;
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
}

/**
 * Opens the native maps app for directions.
 */
export function openMaps(lat, lng, label = 'Location') {
    if (!lat || !lng) return;
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`
    });

    Linking.openURL(url).catch(err => {
        console.error("Failed to open maps:", err);
    });
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
    if (cleaned.length === 10) {
        cleaned = `91${cleaned}`;
    }
    
    let url = `https://wa.me/${cleaned}`;
    if (message) {
        url += `?text=${encodeURIComponent(message)}`;
    }
    return url;
}

