import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, Switch, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import api from '../services/api';

export default function NotificationSettingsScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
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
            const res = await api.getUserPreferences();
            if (res.success) {
                setPreferences(res.preferences);
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
            const res = await api.updateUserPreferences({ [key]: value });
            if (!res.success) {
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
                    <Ionicons name="arrow-back" size={24} color={colors.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notification Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>WhatsApp Notifications</Text>
                    <Text style={styles.sectionDesc}>
                        Receive updates about your bookings and exclusive offers on WhatsApp.
                    </Text>

                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                                    <Ionicons name="logo-whatsapp" size={20} color="#16A34A" />
                                </View>
                                <View style={styles.textGroup}>
                                    <Text style={styles.rowTitle}>Booking Updates</Text>
                                    <Text style={styles.rowSubtitle}>Confirmations and reminders</Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.whatsappTransactional}
                                onValueChange={(val) => handleToggle('whatsappTransactional', val)}
                                trackColor={{ false: colors.grayLight, true: '#22C55E' }}
                                thumbColor="#FFF"
                            />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                                    <Ionicons name="gift-outline" size={20} color={colors.primary} />
                                </View>
                                <View style={styles.textGroup}>
                                    <Text style={styles.rowTitle}>Promotions</Text>
                                    <Text style={styles.rowSubtitle}>Personalized offers and news</Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.whatsappMarketing}
                                onValueChange={(val) => handleToggle('whatsappMarketing', val)}
                                trackColor={{ false: colors.grayLight, true: colors.primary }}
                                thumbColor="#FFF"
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>App Notifications</Text>
                    <Text style={styles.sectionDesc}>
                        Control how the app notifies you on this device.
                    </Text>

                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                                    <Ionicons name="notifications-outline" size={20} color="#2563EB" />
                                </View>
                                <View style={styles.textGroup}>
                                    <Text style={styles.rowTitle}>Push Notifications</Text>
                                    <Text style={styles.rowSubtitle}>Alerts for your active bookings</Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.pushNotifications}
                                onValueChange={(val) => handleToggle('pushNotifications', val)}
                                trackColor={{ false: colors.grayLight, true: colors.primary }}
                                thumbColor="#FFF"
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.textLight} />
                    <Text style={styles.infoText}>
                        We will still send you essential system notifications via in-app alerts and email.
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
        paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.grayBorder
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.black },
    
    content: { flex: 1, padding: 20 },
    section: { marginBottom: 32 },
    sectionHeader: { fontSize: 16, fontWeight: '700', color: colors.black, marginBottom: 6 },
    sectionDesc: { fontSize: 14, color: colors.textLight, marginBottom: 16, lineHeight: 20 },
    
    card: { backgroundColor: colors.background, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: colors.grayBorder },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    textGroup: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: colors.black },
    rowSubtitle: { fontSize: 12, color: colors.textLight, marginTop: 2 },
    
    divider: { height: 1, backgroundColor: colors.grayBorder, marginHorizontal: 16 },
    
    infoBox: { flexDirection: 'row', gap: 10, backgroundColor: colors.grayLight, padding: 16, borderRadius: 12, marginTop: 10 },
    infoText: { flex: 1, fontSize: 13, color: colors.textLight, lineHeight: 18 }
});
