import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.100:5000'; // Update to your local IP when running

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

const api = {
    // ─── Auth ──────────────────────────────────────────────────────────────
    sendOTP: async (phone) => {
        const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
        });
        return res.json();
    },

    verifyOTP: async (phone, otp) => {
        const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp, role: 'customer' }),
        });
        return res.json();
    },

    // ─── Catalog ───────────────────────────────────────────────────────────
    getServiceCatalog: async (category, gender) => {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (gender) params.append('gender', gender);
        const res = await fetch(`${BASE_URL}/api/catalog?${params.toString()}`, {
            headers: await headers(),
        });
        return res.json();
    },

    // ─── Auto-assign Booking ───────────────────────────────────────────────
    autoAssignBooking: async (payload) => {
        const res = await fetch(`${BASE_URL}/api/bookings/auto-assign`, {
            method: 'POST',
            headers: await headers(),
            body: JSON.stringify(payload),
        });
        return res.json();
    },

    // ─── Customer Bookings ─────────────────────────────────────────────────
    getCustomerBookings: async (customerId) => {
        const res = await fetch(`${BASE_URL}/api/bookings?customerId=${customerId}`, {
            headers: await headers(),
        });
        return res.json();
    },

    getBookingById: async (id) => {
        const res = await fetch(`${BASE_URL}/api/bookings/${id}`, {
            headers: await headers(),
        });
        return res.json();
    },

    // ─── Customer Profile ──────────────────────────────────────────────────
    getCustomerProfile: async (customerId) => {
        const res = await fetch(`${BASE_URL}/api/customers/${customerId}`, {
            headers: await headers(),
        });
        return res.json();
    },

    updateCustomerProfile: async (customerId, data) => {
        const res = await fetch(`${BASE_URL}/api/customers/${customerId}`, {
            method: 'PUT',
            headers: await headers(),
            body: JSON.stringify(data),
        });
        return res.json();
    },

    addSavedAddress: async (customerId, address) => {
        const res = await fetch(`${BASE_URL}/api/customers/${customerId}/addresses`, {
            method: 'POST',
            headers: await headers(),
            body: JSON.stringify(address),
        });
        return res.json();
    },

    updateSavedAddress: async (customerId, addrId, data) => {
        const res = await fetch(`${BASE_URL}/api/customers/${customerId}/addresses/${addrId}`, {
            method: 'PUT',
            headers: await headers(),
            body: JSON.stringify(data),
        });
        return res.json();
    },
};

export default api;
export { BASE_URL };
