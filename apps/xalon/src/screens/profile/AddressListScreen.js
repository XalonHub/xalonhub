import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, StatusBar, ActivityIndicator, ScrollView,
    Alert
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';

const LABELS = ['Home', 'Work', 'Other'];

export default function AddressListScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { auth, login } = useAuth();
    const { draft, updateDraft } = useBooking();
    const [addresses, setAddresses] = useState(auth?.customerProfile?.addresses || []);
    const [loading, setLoading] = useState(false);

    const fetchAddresses = useCallback(async () => {
        if (!auth?.customerId) return;
        setLoading(true);
        try {
            const profile = await api.getCustomerProfile(auth.customerId);
            if (profile && !profile.error) {
                setAddresses(profile.addresses || []);
                // Sync context
                await login({
                    token: auth.token,
                    user: { id: auth.userId, phone: auth.phone, role: auth.role },
                    customerProfile: profile,
                });
            }
        } catch (err) {
            console.error('Fetch addresses error:', err);
        } finally {
            setLoading(false);
        }
    }, [auth]);

    useFocusEffect(
        useCallback(() => {
            fetchAddresses();
        }, [fetchAddresses])
    );

    const handleSetDefault = async (addr) => {
        try {
            setLoading(true);
            await api.updateSavedAddress(auth.customerId, addr.id, { ...addr, isDefault: true });
            await fetchAddresses();
        } catch (err) {
            Alert.alert('Error', 'Failed to set as default');
        } finally {
            setLoading(false);
        }
    };

    const renderCategory = (label) => {
        const addr = addresses.find(a => a.label === label);

        return (
            <View key={label} style={styles.categoryContainer}>
                <View style={styles.categoryHeader}>
                    <View style={styles.labelRow}>
                        <MaterialIcons
                            name={label === 'Home' ? 'home' : label === 'Work' ? 'work' : 'location-on'}
                            size={20}
                            color={addr?.isDefault ? colors.primary : colors.gray}
                        />
                        <Text style={[styles.categoryTitle, addr?.isDefault && { color: colors.primary }]}>{label}</Text>
                        {addr?.isDefault && (
                            <View style={styles.defaultBadge}>
                                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                            </View>
                        )}
                    </View>
                    {addr && (
                        <TouchableOpacity onPress={() => navigation.navigate('EditAddress', { address: addr })}>
                            <Text style={styles.editLink}>Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {addr ? (
                    <TouchableOpacity
                        style={[styles.addrCard, (addr.id === draft.selectedAddressId || addr.isDefault) && styles.addrCardActive]}
                        onPress={() => {
                            if (route.params?.mode === 'select') {
                                updateDraft({ selectedAddressId: addr.id });
                                navigation.goBack();
                            } else {
                                navigation.navigate('EditAddress', { address: addr });
                            }
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.addrText}>{addr.addressLine}</Text>
                        <Text style={styles.addrSubText}>{addr.city}, {addr.district}, {addr.state} - {addr.pincode}</Text>

                        {!addr.isDefault && (
                            <TouchableOpacity
                                style={styles.setDefaultBtn}
                                onPress={(e) => {
                                    handleSetDefault(addr);
                                }}
                            >
                                <Text style={styles.setDefaultText}>Set as Default</Text>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.emptyCard}
                        onPress={() => navigation.navigate('EditAddress', { address: { label } })}
                        activeOpacity={0.6}
                    >
                        <MaterialIcons name="add-location" size={24} color={colors.primary} />
                        <Text style={styles.emptyCardText}>Add {label} Address</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Addresses</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.introText}>Manage your delivery locations by category.</Text>
                {loading && addresses.length === 0 ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    LABELS.map(label => renderCategory(label))
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', flex: 1 },
    content: { padding: 16 },
    introText: { fontSize: 14, color: colors.gray, marginBottom: 20, textAlign: 'center' },
    categoryContainer: { marginBottom: 24 },
    categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    categoryTitle: { fontSize: 15, fontWeight: '800', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
    editLink: { fontSize: 14, color: colors.primary, fontWeight: '700' },
    defaultBadge: { backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    defaultBadgeText: { fontSize: 9, fontWeight: '900', color: colors.primary },
    addrCard: { backgroundColor: colors.white, borderRadius: 18, padding: 18, borderWidth: 1.5, borderColor: 'transparent', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6 },
    addrCardActive: { borderColor: colors.primary, elevation: 5, shadowOpacity: 0.12 },
    addrText: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 },
    addrSubText: { fontSize: 13, color: colors.gray, lineHeight: 20 },
    setDefaultBtn: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.grayBorder },
    setDefaultText: { fontSize: 14, color: colors.primary, fontWeight: '700', textAlign: 'center' },
    emptyCard: { backgroundColor: colors.grayLight, borderRadius: 18, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 10, borderStyle: 'dashed', borderWidth: 2, borderColor: colors.grayBorder },
    emptyCardText: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
