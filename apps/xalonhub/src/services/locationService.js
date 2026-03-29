import axios from 'axios';
import Constants from 'expo-constants';

// The key is passed via app.config.js which pulls from backend/.env
const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.android?.config?.googleMaps?.apiKey ||
    Constants.expoConfig?.ios?.config?.googleMapsApiKey ||
    Constants.expoConfig?.web?.config?.googleMaps?.apiKey ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

/**
 * Resolves latitude and longitude into a structured Indian address hierarchy.
 */
export const reverseGeocode = async (latitude, longitude) => {
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            console.warn('Google Maps API Key not found. Falling back to default results may occur if not handled.');
        }

        const response = await axios.get(GOOGLE_GEOCODE_URL, {
            params: {
                latlng: `${latitude},${longitude}`,
                key: GOOGLE_MAPS_API_KEY,
                region: 'in' // Bias results to India
            }
        });

        if (response.data.status !== 'OK') {
            throw new Error(`Google Geocoding API error: ${response.data.status}`);
        }

        const results = response.data.results;
        if (results.length === 0) return null;

        // Use the first result as the primary reference
        const result = results[0];
        const components = result.address_components;

        const getComponent = (types) => {
            const component = components.find(c => types.some(t => c.types.includes(t)));
            return component ? component.long_name : '';
        };

        // Mapping logic optimized for Indian Hierarchy
        // State -> administrative_area_level_1
        // District -> administrative_area_level_2
        // Locality -> locality OR sublocality_level_1
        // City -> Usually same as Locality or Town name

        const state = getComponent(['administrative_area_level_1']);
        const district = getComponent(['administrative_area_level_2']);
        const pincode = getComponent(['postal_code']);

        // Resolve Locality/Town
        let locality = getComponent(['locality']) || getComponent(['sublocality_level_1']) || getComponent(['sublocality']);

        // Street/House info
        const streetNumber = getComponent(['street_number']);
        const route = getComponent(['route']);
        const premise = getComponent(['premise']) || getComponent(['subpremise']);

        const street = [premise, streetNumber, route].filter(Boolean).join(', ') || getComponent(['neighborhood']) || '';

        // If locality is missing, sometimes it's in neighborood or sublocality_level_2
        if (!locality) {
            locality = getComponent(['neighborhood']) || getComponent(['sublocality_level_2']) || '';
        }

        return {
            fullAddress: result.formatted_address,
            street,
            locality,
            district,
            city: getComponent(['locality']) || district, // Fallback city to district if town is not resolved
            state,
            pincode,
            latitude,
            longitude
        };
    } catch (error) {
        console.error('Reverse Geocoding failed:', error?.message || error);
        return null;
    }
};
