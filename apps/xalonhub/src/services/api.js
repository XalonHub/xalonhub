import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

let API_URL = process.env.EXPO_PUBLIC_API_URL ? `${process.env.EXPO_PUBLIC_API_URL}/api` : 'http://localhost:5001/api';

if (!process.env.EXPO_PUBLIC_API_URL && Platform.OS !== 'web') {
    // For local development on physical device, use the computer's LAN IP.
    // Ensure this matches your computer's IP address (check ipconfig).
    API_URL = 'http://192.168.1.7:5001/api';
}


import { Alert } from 'react-native';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('token');
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

export const getCatalog = (gender, category, partnerType) => api.get('/catalog', { params: { gender, category, partnerType } });
export const getCatalogCategories = () => api.get('/catalog/categories');
export const getGlobalSettings = () => api.get('/catalog/settings');

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
export const getPartnerCustomers = (partnerId) => api.get(`/partners/${partnerId}/customers`);
export const createBooking = (bookingData) => api.post('/bookings', bookingData);
export const createClient = (clientData) => api.post('/clients', clientData);
export const updateBookingStatus = (bookingId, status, stylistId = null, paymentConfirmed = false) => 
    api.put(`/bookings/${bookingId}/status`, { status, stylistId, paymentConfirmed });
export const declineBooking = (bookingId, partnerId) => api.put(`/bookings/${bookingId}/decline`, { partnerId });

// Reviews
export const getPartnerReviews = (partnerId) => api.get('/reviews', { params: { partnerId } });
export const addPartnerNote = (reviewId, partnerNote) => api.put(`/reviews/${reviewId}/partner-note`, { partnerNote });
export const getBookingReview = (bookingId) => api.get(`/reviews/booking/${bookingId}`);

// Financials
export const getEarningsSummary = (partnerId, params) => api.get(`/partners/${partnerId}/earnings`, { params });
export const initiatePayout = (partnerId, amount, payoutMethod) => api.post(`/partners/${partnerId}/payout/request`, { amount, payoutMethod });
export const getPayoutHistory = (partnerId) => api.get(`/partners/${partnerId}/payout/history`);

// Notifications
export const registerPushToken = (token, deviceId) => api.post('/notifications/register-push-token', { token, deviceId });
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const clearAllNotifications = () => api.delete('/notifications/all');

export default api;
