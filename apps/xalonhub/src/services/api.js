import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Web uses localhost; Expo Go on device uses the LAN IP
let API_URL = 'http://localhost:5000';

if (Platform.OS !== 'web') {
    // Try to get the host from Expo's debugger host (works in Expo Go/Dev Client)
    // We don't import Constants to avoid extra dependency if not present, 
    // but Expo usually exposes it or we can fallback.
    try {
        const Constants = require('expo-constants').default;
        const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
        if (debuggerHost) {
            const host = debuggerHost.split(':').shift();
            API_URL = `http://${host}:5000/api`;
        }
    } catch (e) {
        // Fallback or use env variable
        if (process.env.EXPO_PUBLIC_API_URL) {
            API_URL = process.env.EXPO_PUBLIC_API_URL;
        } else {
            API_URL = 'http://localhost:5000/api';
        }
    }
} else {
    API_URL = 'http://localhost:5000/api';
}

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const sendOTP = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOTP = (phone, otp, role) => api.post('/auth/verify-otp', { phone, otp, role: 'partner' });

export const getCatalog = (gender, category) => api.get('/catalog', { params: { gender, category } });
export const getCatalogCategories = () => api.get('/catalog/categories');

export const sendVerificationEmail = (email, userId) => api.post('/auth/send-verification-email', { email, userId });

// KYC / Documents
export const updatePartnerDocuments = (partnerId, documents) => api.put(`/partners/${partnerId}/documents`, documents);
export const getPartnerProfile = (partnerId) => api.get(`/partners/${partnerId}`);

export default api;
