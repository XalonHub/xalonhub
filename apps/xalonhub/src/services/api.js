import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

let API_URL = process.env.EXPO_PUBLIC_API_URL ? `${process.env.EXPO_PUBLIC_API_URL}/api` : 'http://localhost:5000/api';

if (!process.env.EXPO_PUBLIC_API_URL && Platform.OS !== 'web') {
    // For local development on physical device, use the computer's LAN IP.
    API_URL = 'http://192.168.1.10:5000/api';
}

console.log(`[XALONHUB API] API initialized. API_URL: ${API_URL}`);

import { Alert } from 'react-native';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status >= 500) {
            Alert.alert(
                'XalonHub Service Alert',
                'The system is experiencing a temporary issue. Our engineers are investigating. Please try again in a few moments.',
                [{ text: 'OK' }]
            );
        }
        return Promise.reject(error);
    }
);

export const sendOTP = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOTP = (phone, otp, role) => api.post('/auth/verify-otp', { phone, otp, role: 'partner' });

export const getCatalog = (gender, category) => api.get('/catalog', { params: { gender, category } });
export const getCatalogCategories = () => api.get('/catalog/categories');

export const sendVerificationEmail = (email, userId) => api.post('/auth/send-verification-email', { email, userId });

// KYC / Documents
export const updatePartnerDocuments = (partnerId, documents) => api.put(`/partners/${partnerId}/documents`, documents);
export const getPartnerProfile = (partnerId) => api.get(`/partners/${partnerId}`);
export const updatePartnerStatus = (partnerId, isOnline) => api.put(`/partners/${partnerId}/status`, { isOnline });

// Stylists
export const getStylists = (partnerId) => api.get(`/stylists/${partnerId}`);
export const addStylist = (stylistData) => api.post('/stylists', stylistData);
export const updateStylist = (id, stylistData) => api.put(`/stylists/${id}`, stylistData);
export const deleteStylist = (id) => api.delete(`/stylists/${id}`);

// Bookings
export const getBookings = (params) => api.get('/bookings', { params });

export default api;
