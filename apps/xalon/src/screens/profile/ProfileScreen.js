import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    StatusBar, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ProfileScreen() {
    const navigation = useNavigation();
    const { auth, isLoggedIn, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (!auth?.customerId) return;
        setLoading(true);
        try {
            const data = await api.getCustomerProfile(auth.customerId);
            if (!data.error) setProfile(data);
        } catch { }
        setLoading(false);
    }, [auth?.customerId]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProfile();
        setRefreshing(false);
    };

    const handleLogout = () => {
        Alert.alert('Log out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log out', style: 'destructive', onPress: logout },
        ]);
    };

    if (!isLoggedIn) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>
                <View style={styles.promptContainer}>
                    <View style={styles.promptIconBg}>
                        <MaterialIcons name="person-outline" size={52} color={colors.primary} />
                    </View>
                    <Text style={styles.promptTitle}>Welcome to Xalon</Text>
                    <Text style={styles.promptSub}>
                        Log in to view your profile, saved addresses, and booking history.
                    </Text>
                    <TouchableOpacity
                        style={styles.loginBtn}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <MaterialIcons name="login" size={18} color={colors.white} />
                        <Text style={styles.loginBtnText}>Login / Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <ScrollView
                style={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* User info */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatar}>
                        <MaterialIcons name="person" size={40} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.displayName}>{profile?.name || auth?.customerName || 'Xalon Customer'}</Text>
                        <Text style={styles.phone}>{auth?.phone ? `+91 ${auth.phone}` : ''}</Text>
                        {profile?.gender && (
                            <Text style={{ fontSize: 13, color: colors.gray, marginTop: 2 }}>{profile.gender}</Text>
                        )}
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={{ padding: 8 }}>
                        <MaterialIcons name="edit" size={22} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Saved addresses */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Saved Addresses</Text>
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => navigation.navigate('EditAddress', { address: null })}
                        >
                            <MaterialIcons name="add" size={16} color={colors.primary} />
                            <Text style={styles.addBtnText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                    {loading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : profile?.addresses?.length ? (
                        profile.addresses.map((addr) => (
                            <TouchableOpacity
                                key={addr.id}
                                style={styles.addressCard}
                                onPress={() => navigation.navigate('EditAddress', { address: addr })}
                                activeOpacity={0.8}
                            >
                                <View style={styles.addrIconBg}>
                                    <MaterialIcons
                                        name={addr.label === 'Home' ? 'home' : addr.label === 'Work' ? 'work' : 'location-on'}
                                        size={18} color={colors.primary}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.addrLabelRow}>
                                        <Text style={styles.addrLabel}>{addr.label}</Text>
                                        {addr.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Default</Text></View>}
                                    </View>
                                    <Text style={styles.addrLine} numberOfLines={1}>{addr.addressLine}, {addr.city}</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color={colors.gray} />
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No saved addresses yet.</Text>
                    )}
                </View>

                {/* Logout */}
                <View style={[styles.section, { marginBottom: 40 }]}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                        <MaterialIcons name="logout" size={18} color={colors.error} />
                        <Text style={styles.logoutText}>Log out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingVertical: 18, backgroundColor: colors.white },
    headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
    scroll: { flex: 1 },
    avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.white, padding: 20, marginBottom: 16 },
    avatar: { width: 70, height: 70, borderRadius: 24, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    displayName: { fontSize: 20, fontWeight: '800', color: colors.text },
    phone: { fontSize: 14, color: colors.gray, marginTop: 3 },
    section: { backgroundColor: colors.white, marginHorizontal: 16, marginBottom: 12, borderRadius: 20, padding: 18 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    addBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
    addressCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.background, borderRadius: 14, padding: 14, marginBottom: 8 },
    addrIconBg: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    addrLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
    addrLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
    defaultBadge: { backgroundColor: colors.success + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    defaultBadgeText: { fontSize: 11, fontWeight: '700', color: colors.success },
    addrLine: { fontSize: 12, color: colors.gray },
    emptyText: { color: colors.gray, fontSize: 14 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.error + '44' },
    logoutText: { color: colors.error, fontWeight: '700', fontSize: 15 },
    promptContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
    promptIconBg: { width: 100, height: 100, borderRadius: 32, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    promptTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
    promptSub: { fontSize: 14, color: colors.gray, textAlign: 'center', lineHeight: 22 },
    loginBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, marginTop: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
    loginBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
