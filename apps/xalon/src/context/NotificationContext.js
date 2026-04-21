import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

// Configure how notifications are handled when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export function NotificationProvider({ children }) {
    const { auth, isLoggedIn } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        if (isLoggedIn) {
            setupNotifications();
            fetchNotifications();
            
            // Listen for incoming notifications when app is foregrounded
            notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
                console.log('[Notification] Received in foreground:', notification);
                fetchNotifications(); // Refresh list to get new notification
            });

            // Listen for user interaction with notification
            responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
                console.log('[Notification] User tapped response:', response);
                // Handle navigation if needed
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
                await api.registerPushToken(token, Device.deviceName || 'Mobile Device');
                console.log('[Notification] Token registered successfully');
            }
        } catch (error) {
            console.error('[Notification] Setup failed:', error);
        }
    };

    const fetchNotifications = async () => {
        if (!isLoggedIn) return;
        setLoading(true);
        try {
            const res = await api.getNotifications();
            if (res.success) {
                setNotifications(res.notifications);
                const unread = res.notifications.filter(n => !n.isRead).length;
                setUnreadCount(unread);
                // Update app badge count
                if (Platform.OS !== 'web') {
                    Notifications.setBadgeCountAsync(unread);
                }
            }
        } catch (error) {
            console.error('[Notification] Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.markNotificationRead(id);
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (Platform.OS !== 'web') {
                Notifications.setBadgeCountAsync(Math.max(0, unreadCount - 1));
            }
        } catch (error) {
            console.error('[Notification] Mark read error:', error);
        }
    };

    const clearAll = async () => {
        try {
            await api.clearAllNotifications();
            setNotifications([]);
            setUnreadCount(0);
            if (Platform.OS !== 'web') {
                Notifications.setBadgeCountAsync(0);
            }
        } catch (error) {
            console.error('[Notification] Clear error:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            fetchNotifications,
            markAsRead,
            clearAll
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

// Helper to get token
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
            console.warn('Failed to get push token for push notification!');
            return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('[Notification] Token:', token);
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
