import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, Switch, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getUserPreferences, updateUserPreferences } from '../services/api';

export default function NotificationSettingsScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState({
        whatsappTransactional: true,
        whatsappMarketing: false,
        pushNotifications: true
    });

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const res = await getUserPreferences();
            if (res.data && res.data.success) {
                setPreferences(res.data.preferences);
            }
        } catch (error) {
            console.error('[NotificationSettings] Fetch error:', error);
            Alert.alert('Error', 'Failed to load your notification settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key, value) => {
        // Optimistic update
        const oldPrefs = { ...preferences };
        setPreferences(prev => ({ ...prev, [key]: value }));

        try {
            const res = await updateUserPreferences({ [key]: value });
            if (!res.data || !res.data.success) {
                throw new Error('Update failed');
            }
        } catch (error) {
            console.error('[NotificationSettings] Update error:', error);
            setPreferences(oldPrefs);
            Alert.alert('Error', 'Failed to save preference. Please try again.');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notification Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>WhatsApp Notifications</Text>
                    <Text style={styles.sectionDesc}>
                        Receive important updates and offers directly on your WhatsApp number.
                    </Text>

                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                                    <Ionicons name="logo-whatsapp" size={20} color="#16A34A" />
                                </View>
                                <View style={styles.textGroup}>
                                    <Text style={styles.rowTitle}>Booking Updates</Text>
                                    <Text style={styles.rowSubtitle}>Confirmations, changes, and reminders</Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.whatsappTransactional}
                                onValueChange={(val) => handleToggle('whatsappTransactional', val)}
                                trackColor={{ false: '#E2E8F0', true: '#22C55E' }}
                                thumbColor="#FFF"
                            />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                                    <Ionicons name="gift-outline" size={20} color="#D97706" />
                                </View>
                                <View style={styles.textGroup}>
                                    <Text style={styles.rowTitle}>Promotions</Text>
                                    <Text style={styles.rowSubtitle}>Exclusive offers and platform news</Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.whatsappMarketing}
                                onValueChange={(val) => handleToggle('whatsappMarketing', val)}
                                trackColor={{ false: '#E2E8F0', true: '#22C55E' }}
                                thumbColor="#FFF"
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Device Notifications</Text>
                    <Text style={styles.sectionDesc}>
                        Control how you receive alerts on this device.
                    </Text>

                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                                    <Ionicons name="notifications-outline" size={20} color="#2563EB" />
                                </View>
                                <View style={styles.textGroup}>
                                    <Text style={styles.rowTitle}>Push Notifications</Text>
                                    <Text style={styles.rowSubtitle}>Alerts for new bookings and activity</Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.pushNotifications}
                                onValueChange={(val) => handleToggle('pushNotifications', val)}
                                trackColor={{ false: '#E2E8F0', true: '#22C55E' }}
                                thumbColor="#FFF"
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#64748B" />
                    <Text style={styles.infoText}>
                        System-critical alerts (like security warnings) will always be sent via email or in-app notifications.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    
    content: { flex: 1, padding: 20 },
    section: { marginBottom: 32 },
    sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
    sectionDesc: { fontSize: 14, color: '#64748B', marginBottom: 16, lineHeight: 20 },
    
    card: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: '#F1F5F9' },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    textGroup: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
    rowSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
    
    divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
    
    infoBox: { flexDirection: 'row', gap: 10, backgroundColor: '#F1F5F9', padding: 16, borderRadius: 12, marginTop: 10 },
    infoText: { flex: 1, fontSize: 13, color: '#64748B', lineHeight: 18 }
});
