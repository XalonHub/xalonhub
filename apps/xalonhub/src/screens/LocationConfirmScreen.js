import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker } from '../components/Map';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';
import { reverseGeocode as googleReverseGeocode } from '../services/locationService';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPartnerProfile } from '../services/api';
import api from '../services/api';

export default function LocationConfirmScreen({ navigation }) {
    const { formData, updateFormData } = useOnboarding();

    // Default location (New Delhi) or use existing formData
    const DEFAULT_LAT = 28.6139;
    const DEFAULT_LNG = 77.2090;

    const [location, setLocation] = useState({
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG,
    });

    const [addressDetails, setAddressDetails] = useState({
        street: '',
        locality: '',
        district: '',
        city: '',
        state: '',
        pincode: '',
    });

    const [loadingMap, setLoadingMap] = useState(false);
    const [permissionModal, setPermissionModal] = useState(false);

    // Always re-populate address when screen gains focus (from Profile menu or navigation)
    useFocusEffect(
        useCallback(() => {
            const loadAddress = async () => {
                try {
                    let partnerId = await AsyncStorage.getItem('partnerId');
                    if (!partnerId && formData.partnerId) partnerId = formData.partnerId;

                    let addr = null;

                    if (partnerId) {
                        const res = await getPartnerProfile(partnerId);
                        const serverAddr = res?.data?.address;
                        if (serverAddr) {
                            addr = serverAddr;
                        }
                    }

                    // Fallback to local formData
                    if (!addr) {
                        addr = formData.address || null;
                    }

                    if (addr) {
                        // Handle both formats:
                        // 1. Flat: { street, city, state, pincode, lat, lng }  ← saved by LocationConfirmScreen
                        // 2. Nested KYC: { permanentAddress: { address, city, state }, currentAddress: {...} }
                        const isFlat = addr.city || addr.street;
                        const flatAddr = isFlat ? addr : (addr.permanentAddress || addr.serviceAddress || null);

                        if (flatAddr) {
                            setAddressDetails({
                                street: flatAddr.street || flatAddr.address || '',
                                locality: flatAddr.locality || '',
                                district: flatAddr.district || '',
                                city: flatAddr.city || '',
                                state: flatAddr.state || '',
                                pincode: flatAddr.pincode || '',
                            });
                            if (flatAddr.lat && flatAddr.lng) {
                                setLocation({ latitude: flatAddr.lat, longitude: flatAddr.lng });
                            }
                        }
                    }
                } catch (e) {
                    // Silently fall back to local formData
                    const addr = formData.address;
                    if (addr) {
                        const isFlat = addr.city || addr.street;
                        const flatAddr = isFlat ? addr : (addr.permanentAddress || null);
                        if (flatAddr) {
                            setAddressDetails({
                                street: flatAddr.street || flatAddr.address || '',
                                locality: flatAddr.locality || '',
                                district: flatAddr.district || '',
                                city: flatAddr.city || '',
                                state: flatAddr.state || '',
                                pincode: flatAddr.pincode || '',
                            });
                        }
                    }
                }
            };
            loadAddress();
        }, [formData.partnerId])
    );

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.reset({ index: 0, routes: [{ name: 'BasicInfo' }] });
        }
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            setLoadingMap(true);
            const resolvedAddress = await googleReverseGeocode(lat, lng);

            if (resolvedAddress) {
                setAddressDetails(prev => ({
                    ...prev,
                    street: resolvedAddress.street,
                    locality: resolvedAddress.locality,
                    district: resolvedAddress.district,
                    city: resolvedAddress.city,
                    state: resolvedAddress.state,
                    pincode: resolvedAddress.pincode
                }));
            }
        } catch (error) {
            console.error("Geocoding failed", error);
        } finally {
            setLoadingMap(false);
        }
    };

    const handleDragEnd = async (e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setLocation({ latitude, longitude });
        reverseGeocode(latitude, longitude);
    };

    const handleLocateMe = async () => {
        setPermissionModal(false);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Please enable location services to use this feature. You can still drag the pin manually.');
            return;
        }

        try {
            setLoadingMap(true);
            let loc = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = loc.coords;
            setLocation({ latitude, longitude });
            reverseGeocode(latitude, longitude);
        } catch (error) {
            Alert.alert('Error', 'Unable to fetch location. Please drag the pin manually.');
        } finally {
            setLoadingMap(false);
        }
    };

    const requestPermissionPrompt = () => {
        setPermissionModal(true);
    };

    const handleConfirm = async () => {
        if (!addressDetails.city || !addressDetails.state) {
            Alert.alert('Location Not Resolved', 'We could not identify the City/State for this point. Please move the pin slightly.');
            return;
        }

        if (!addressDetails.street || !addressDetails.pincode) {
            Alert.alert('Missing Details', 'Please ensure all address fields are filled.');
            return;
        }

        try {
            const addrData = {
                street: addressDetails.street,
                locality: addressDetails.locality,
                district: addressDetails.district,
                city: addressDetails.city,
                state: addressDetails.state,
                pincode: addressDetails.pincode,
                lat: location.latitude,
                lng: location.longitude
            };

            // Get partnerId explicitly — don't rely on formData which may be stale
            let partnerId = await AsyncStorage.getItem('partnerId');
            if (!partnerId && formData.partnerId) partnerId = formData.partnerId;

            console.log('[LocationConfirm] Saving address for partner:', partnerId, addrData);

            if (partnerId) {
                // Directly call API to ensure address reaches the backend
                await api.put(`/partners/${partnerId}/address`, addrData);
                console.log('[LocationConfirm] Address saved to backend successfully.');
            } else {
                console.warn('[LocationConfirm] No partnerId found — address saved locally only.');
            }

            // Also update local formData for immediate UI
            await updateFormData('address', addrData);
            await updateFormData('lastScreen', 'ProfessionalDetails');
            navigation.goBack();
        } catch (e) {
            console.error('Save address error:', e);
            Alert.alert('Error', 'Failed to save address. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Confirm Location</Text>
            </View>

            <View style={styles.mapArea}>
                <MapView
                    style={StyleSheet.absoluteFillObject}
                    region={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    }}
                >
                    <Marker
                        coordinate={location}
                        title="Drag to adjust"
                        draggable
                        onDragEnd={handleDragEnd}
                    />
                </MapView>
                {loadingMap && (
                    <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)' }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                )}
                <TouchableOpacity style={styles.locateMeBtn} onPress={requestPermissionPrompt}>
                    <Ionicons name="locate" size={24} color="#1E293B" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.formArea} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
                <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>Service Address</Text>
                    <Text style={styles.formSubtitle}>Where will you be providing services?</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>State</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: '#F1F5F9', color: '#64748B' }]}
                        value={addressDetails.state}
                        editable={false}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>District</Text>
                        <TextInput
                            style={styles.input}
                            value={addressDetails.district}
                            onChangeText={(t) => setAddressDetails(p => ({ ...p, district: t }))}
                        />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Locality</Text>
                        <TextInput
                            style={styles.input}
                            value={addressDetails.locality}
                            onChangeText={(t) => setAddressDetails(p => ({ ...p, locality: t }))}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>House No. / Flat / Building</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Flat 4B, XYZ Apartments"
                        value={addressDetails.street}
                        onChangeText={(t) => setAddressDetails(p => ({ ...p, street: t }))}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Pincode</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="number-pad"
                        value={addressDetails.pincode}
                        onChangeText={(t) => setAddressDetails(p => ({ ...p, pincode: t }))}
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.btn} onPress={handleConfirm}>
                    <Text style={styles.btnText}>Confirm Address</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={permissionModal} transparent animationType="fade">
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconCircle}>
                            <Ionicons name="location" size={40} color={colors.primary} />
                        </View>
                        <Text style={styles.modalTitle}>Enable Location</Text>
                        <Text style={styles.modalDesc}>We need your location to accurately map your service area.</Text>
                        <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleLocateMe}>
                            <Text style={styles.modalBtnTextPrimary}>Allow While Using App</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setPermissionModal(false)}>
                            <Text style={styles.modalBtnTextSecondary}>Deny</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
    backBtn: { padding: 8, marginRight: 8, backgroundColor: '#FFF', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    headerTitle: { flex: 1, fontSize: 22, fontWeight: '700', color: '#1E293B', letterSpacing: -0.5 },
    mapArea: { height: 250, backgroundColor: '#E2E8F0', position: 'relative' },
    locateMeBtn: { position: 'absolute', bottom: 16, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    formArea: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
    formContent: { padding: 24, paddingBottom: 40, gap: 16 },
    formHeader: { marginBottom: 8 },
    formTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
    formSubtitle: { fontSize: 14, color: '#64748B' },
    row: { flexDirection: 'row' },
    inputGroup: { gap: 6 },
    label: { fontSize: 12, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, fontSize: 16, color: '#0F172A', borderWidth: 1, borderColor: '#F1F5F9' },
    footer: { padding: 24, paddingBottom: 32, backgroundColor: '#FFF' },
    btn: { backgroundColor: colors.secondary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', shadowColor: colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
    modalBg: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center' },
    modalIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
    modalDesc: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    modalBtnPrimary: { backgroundColor: colors.primary, width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
    modalBtnTextPrimary: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    modalBtnSecondary: { width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    modalBtnTextSecondary: { color: '#64748B', fontSize: 16, fontWeight: '600' }
});
