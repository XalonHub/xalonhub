import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { 
    registerPushToken, 
    getNotifications, 
    markNotificationRead, 
    clearAllNotifications 
} from '../services/api';

const NotificationContext = createContext(null);

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    const notificationListener = useRef();
    const responseListener = useRef();

    // Monitor login status via SecureStore token
    useEffect(() => {
        const checkAuth = async () => {
            const token = await SecureStore.getItemAsync('token');
            setIsLoggedIn(!!token);
        };
        checkAuth();
        
        // Polling auth status isn't ideal, but since OnboardingProvider doesn't expose it easily,
        // we'll run this check whenever this provider mounts or periodically if needed.
        // For now, let's just trigger it on mount.
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            setupNotifications();
            fetchNotifications();
            
            notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
                console.log('[XalonHub Notification] Received:', notification);
                fetchNotifications();
            });

            responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
                console.log('[XalonHub Notification] Response:', response);
            });

            return () => {
                if (notificationListener.current) {
                    Notifications.removeNotificationSubscription(notificationListener.current);
                }
                if (responseListener.current) {
                    Notifications.removeNotificationSubscription(responseListener.current);
                }
            };
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isLoggedIn]);

    const setupNotifications = async () => {
        try {
            const token = await registerForPushNotificationsAsync();
            if (token) {
                await registerPushToken(token, Device.deviceName || 'Partner Device');
                console.log('[XalonHub Notification] Token registered');
            }
        } catch (error) {
            console.error('[XalonHub Notification] Setup failed:', error);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await getNotifications();
            // XalonHub uses axios, response is in res.data
            if (res.data && res.data.success) {
                const list = res.data.notifications;
                setNotifications(list);
                const unread = list.filter(n => !n.isRead).length;
                setUnreadCount(unread);
                if (Platform.OS !== 'web') {
                    Notifications.setBadgeCountAsync(unread);
                }
            }
        } catch (error) {
            console.error('[XalonHub Notification] Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (Platform.OS !== 'web') {
                Notifications.setBadgeCountAsync(Math.max(0, unreadCount - 1));
            }
        } catch (error) {
            console.error('[XalonHub Notification] Mark read error:', error);
        }
    };

    const clearAll = async () => {
        try {
            await clearAllNotifications();
            setNotifications([]);
            setUnreadCount(0);
            if (Platform.OS !== 'web') {
                Notifications.setBadgeCountAsync(0);
            }
        } catch (error) {
            console.error('[XalonHub Notification] Clear error:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            fetchNotifications,
            markAsRead,
            clearAll,
            refreshAuth: () => {
                SecureStore.getItemAsync('token').then(t => setIsLoggedIn(!!t));
            }
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.warn('Failed to get push token!');
            return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return token;
}
