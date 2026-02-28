import * as Location from 'expo-location';

/**
 * Request permission and get current GPS coordinates.
 * Returns { lat, lng, city } or null if denied.
 */
export async function getCurrentLocation() {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return null;

        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude: lat, longitude: lng } = pos.coords;

        const city = await reverseGeocode(lat, lng);
        return { lat, lng, city };
    } catch (err) {
        console.warn('getCurrentLocation error:', err);
        return null;
    }
}

/**
 * Reverse geocode lat/lng to a city string.
 */
export async function reverseGeocode(lat, lng) {
    try {
        const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (results?.length) {
            const r = results[0];
            return r.city || r.subregion || r.region || 'Unknown';
        }
        return 'Unknown';
    } catch {
        return 'Unknown';
    }
}
