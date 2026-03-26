import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
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

export default api;
