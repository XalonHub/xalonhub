import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

let BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

if (!process.env.EXPO_PUBLIC_API_URL && Platform.OS !== 'web') {
    // For local development on physical device, use the computer's LAN IP.
    BASE_URL = 'http://192.168.1.10:5000';
}

const getToken = async () => {
    return await AsyncStorage.getItem('xalon_token');
};

const headers = async () => {
    const token = await getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

console.log(`[XALON API] API initialized. BASE_URL: ${BASE_URL}`);

const handleResponse = async (response, endpoint) => {
    if (!response.ok) {
        console.error(`[API ERROR] ${endpoint} failed with status ${response.status}`);
        if (response.status >= 500) {
            Alert.alert(
                'Xalon Service Alert',
                'We are experiencing a temporary service interruption. Our team has been notified. Please try again in a few moments.',
                [{ text: 'OK' }]
            );
        }
        const errorData = await response.json().catch(() => ({}));
        throw { status: response.status, ...errorData };
    }
    return response.json();
};

const api = {
    // ─── Auth ──────────────────────────────────────────────────────────────
    sendOTP: async (phone) => {
        const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
        });
        return handleResponse(res, 'sendOTP');
    },

    verifyOTP: async (phone, otp) => {
        const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp, role: 'customer' }),
        });
        return handleResponse(res, 'verifyOTP');
    },

    // ─── Catalog ───────────────────────────────────────────────────────────
    // partnerType: 'Freelancer' | 'Male_Salon' | 'Female_Salon' | 'Unisex_Salon'
    // When supplied, the backend resolves role-specific effectivePrice/effectiveSpecialPrice.
    getServiceCatalog: async (category, gender, partnerType) => {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (gender) params.append('gender', gender);
        if (partnerType) params.append('partnerType', partnerType);
        const res = await fetch(`${BASE_URL}/api/catalog?${params.toString()}`, {
            headers: await headers(),
        });
        return handleResponse(res, 'getServiceCatalog');
    },

    // ─── Slots ────────────────────────────────────────────────────────────
    getAvailableSlots: async (params) => {
        const query = new URLSearchParams();
        if (params.serviceIds) {
            params.serviceIds.forEach(id => query.append('serviceIds[]', id));
        }
        if (params.serviceMode) query.append('serviceMode', params.serviceMode);
        if (params.date) query.append('date', params.date);
        if (params.lat) query.append('lat', params.lat);
        if (params.lng) query.append('lng', params.lng);
        if (params.city) query.append('city', params.city);

        const res = await fetch(`${BASE_URL}/api/slots/available?${query.toString()}`, {
            headers: await headers(),
        });
        return handleResponse(res, 'getAvailableSlots');
    },

    // ─── Auto-assign Booking ───────────────────────────────────────────────
    autoAssignBooking: async (payload) => {
        const res = await fetch(`${BASE_URL}/api/bookings/auto-assign`, {
            method: 'POST',
            headers: await headers(),
            body: JSON.stringify(payload),
        });
        return handleResponse(res, 'autoAssignBooking');
    },

    // ─── Customer Bookings ─────────────────────────────────────────────────
    getCustomerBookings: async (customerId) => {
        const res = await fetch(`${BASE_URL}/api/bookings?customerId=${customerId}`, {
            headers: await headers(),
        });
        return handleResponse(res, 'getCustomerBookings');
    },

    getBookingById: async (id) => {
        const res = await fetch(`${BASE_URL}/api/bookings/${id}`, {
            headers: await headers(),
        });
        return handleResponse(res, 'getBookingById');
    },

    // ─── Customer Profile ──────────────────────────────────────────────────
    getCustomerProfile: async (customerId) => {
        const res = await fetch(`${BASE_URL}/api/customers/${customerId}`, {
            headers: await headers(),
        });
        return handleResponse(res, 'getCustomerProfile');
    },

    updateCustomerProfile: async (customerId, data) => {
        const res = await fetch(`${BASE_URL}/api/customers/${customerId}`, {
            method: 'PUT',
            headers: await headers(),
            body: JSON.stringify(data),
        });
        return handleResponse(res, 'updateCustomerProfile');
    },

    addSavedAddress: async (customerId, address) => {
        const res = await fetch(`${BASE_URL}/api/customers/${customerId}/addresses`, {
            method: 'POST',
            headers: await headers(),
            body: JSON.stringify(address),
        });
        return handleResponse(res, 'addSavedAddress');
    },

    updateSavedAddress: async (customerId, addrId, data) => {
        const res = await fetch(`${BASE_URL}/api/customers/${customerId}/addresses/${addrId}`, {
            method: 'PUT',
            headers: await headers(),
            body: JSON.stringify(data),
        });
        return handleResponse(res, 'updateSavedAddress');
    },

    // ─── Salons ────────────────────────────────────────────────────────────
    getSalons: async (params = {}) => {
        const query = new URLSearchParams();
        if (params.city) query.append('city', params.city);
        if (params.lat) query.append('lat', params.lat);
        if (params.lng) query.append('lng', params.lng);
        if (params.gender) query.append('gender', params.gender);
        if (params.category) query.append('category', params.category);
        if (params.sort) query.append('sort', params.sort);
        const res = await fetch(`${BASE_URL}/api/salons?${query.toString()}`, {
            headers: await headers(),
        });
        return handleResponse(res, 'getSalons');
    },

    getSalonServices: async (salonId) => {
        const res = await fetch(`${BASE_URL}/api/salons/${salonId}/services`, {
            headers: await headers(),
        });
        return handleResponse(res, 'getSalonServices');
    },
};

export default api;
export { BASE_URL };
