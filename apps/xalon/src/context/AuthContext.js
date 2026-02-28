import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

const STORAGE_KEY = 'xalon_auth';

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(null); // null = loading, {} = not logged in
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) setAuth(JSON.parse(stored));
                else setAuth({});
            } catch {
                setAuth({});
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = async ({ token, user, customerProfile }) => {
        const authData = {
            token,
            userId: user.id,
            phone: user.phone,
            role: user.role,
            customerId: customerProfile?.id || null,
            customerName: customerProfile?.name || null,
        };
        setAuth(authData);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
        await AsyncStorage.setItem('xalon_token', token);
    };

    const updateName = (name) => {
        setAuth((prev) => {
            const next = { ...prev, customerName: name };
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    };

    const logout = async () => {
        await AsyncStorage.multiRemove([STORAGE_KEY, 'xalon_token']);
        setAuth({});
    };

    const isLoggedIn = !!(auth?.token);

    return (
        <AuthContext.Provider value={{ auth, isLoggedIn, loading, login, logout, updateName }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
