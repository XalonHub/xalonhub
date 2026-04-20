import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});


export const getCategories = async () => {
  try {
    const response = await api.get('/catalog/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const getCities = async () => {
  try {
    const response = await api.get('/salons/cities');
    return response.data;
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
};

export const getCustomerProfile = async (id) => {
  try {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return null;
  }
};

export const getHomeLayout = async () => {
  try {
    const response = await api.get('/catalog/home');
    return response.data;
  } catch (error) {
    console.error('Error fetching home layout:', error);
    return null;
  }
};

export const getSalons = async (params) => {
  try {
    const response = await api.get('/salons', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching salons:', error);
    return [];
  }
};

export const getCatalog = async (params) => {
  try {
    const response = await api.get('/catalog', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return [];
  }
};

export const getSalon = async (id) => {
  try {
    const response = await api.get(`/salons/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching salon:', error);
    return null;
  }
};

export const getSalonServices = async (id) => {
  try {
    const response = await api.get(`/salons/${id}/services`);
    return response.data;
  } catch (error) {
    console.error('Error fetching salon services:', error);
    return [];
  }
};

export const sendOtp = async (phone) => {
  try {
    const response = await api.post('/auth/send-otp', { phone });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const verifyOtp = async (phone, otp) => {
  try {
    const response = await api.post('/auth/verify-otp', { phone, otp, role: 'customer' });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAvailableSlots = async (serviceIds, serviceMode, date, lat, lng, city, salonId) => {
  try {
    const params = new URLSearchParams();
    if (serviceIds) serviceIds.forEach(id => params.append('serviceIds[]', id));
    if (serviceMode) params.append('serviceMode', serviceMode);
    if (date) params.append('date', date);
    if (lat) params.append('lat', lat);
    if (lng) params.append('lng', lng);
    if (city) params.append('city', city);
    if (salonId) params.append('salonId', salonId);

    const response = await api.get(`/slots/available?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching slots:', error);
    return [];
  }
};

export const createBooking = async (payload) => {
  try {
    const response = await api.post('/bookings/auto-assign', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSettings = async () => {
  try {
    const response = await api.get('/catalog/settings');
    return response.data;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { platformFee: 10 }; // Safe fallback
  }
};

export const getSalonStylists = async (partnerId) => {
  try {
    const response = await api.get(`/stylists/${partnerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stylists:', error);
    return [];
  }
};

export const getMyBookings = async (customerId) => {
  try {
    const response = await api.get(`/bookings`, { params: { customerId } });
    return response.data;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }
};

export default api;
