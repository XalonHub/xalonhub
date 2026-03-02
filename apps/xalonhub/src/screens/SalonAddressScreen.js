import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import MapView, { Marker } from '../components/Map';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';
import { reverseGeocode as googleReverseGeocode } from '../services/locationService';

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SalonAddressScreen({ navigation, route }) {
    const isEdit = route.params?.isEdit;
    const { formData } = useOnboarding();

    const DEFAULT_LAT = 28.6139;
    const DEFAULT_LNG = 77.2090;

    const [location, setLocation] = useState({
        latitude: formData.salonAddress?.lat || DEFAULT_LAT,
        longitude: formData.salonAddress?.lng || DEFAULT_LNG,
    });

    const [addressDetails, setAddressDetails] = useState({
        fullAddress: formData.salonAddress?.address || '',
        locality: formData.salonAddress?.locality || '',
        district: formData.salonAddress?.district || '',
        city: formData.salonAddress?.city || '',
        state: formData.salonAddress?.state || '',
        pincode: formData.salonAddress?.pincode || '',
    });

    const [loadingMap, setLoadingMap] = useState(false);

    // REMOVED: Initial reverse geocode to prevent permission errors on mount

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            // If we can't go back (stack reset), we navigate to the previous logic step
            navigation.reset({
                index: 0,
                routes: [{ name: 'SalonBasicInfo' }],
            });
        }
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            setLoadingMap(true);
            const resolvedAddress = await googleReverseGeocode(lat, lng);

            if (resolvedAddress) {
                setAddressDetails(prev => ({
                    ...prev,
                    fullAddress: resolvedAddress.fullAddress,
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
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Please enable location services in your settings to use this feature. You can still drag the pin manually.');
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

    const handleContinue = () => {
        // Strict mapping check: city and state must be resolved
        if (!addressDetails.city || !addressDetails.state) {
            Alert.alert('Location Not Resolved', 'We could not identify the City/State for this point. Please move the pin slightly or allow location access.');
            return;
        }

        if (!addressDetails.fullAddress || addressDetails.fullAddress.trim() === '') {
            Alert.alert('Missing Address', 'Please provide an address.');
            return;
        }

        navigation.navigate('SalonAddressConfirm', {
            address: addressDetails.fullAddress,
            locality: addressDetails.locality,
            district: addressDetails.district,
            city: addressDetails.city,
            state: addressDetails.state,
            pincode: addressDetails.pincode,
            lat: location.latitude,
            lng: location.longitude,
            isEdit
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Address</Text>
            </View>

            {/* Map */}
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

                {/* Crosshair / locate-me button */}
                <TouchableOpacity style={styles.locateBtn} onPress={handleLocateMe}>
                    <Ionicons name="locate" size={22} color="#1E293B" />
                </TouchableOpacity>
            </View>

            {/* Address Input + Continue */}
            <View style={styles.bottomPanel}>
                <View style={styles.inputBox}>
                    <Text style={styles.inputLabel}>Enter your address</Text>
                    <TextInput
                        style={styles.addressInput}
                        value={addressDetails.fullAddress}
                        onChangeText={(t) => setAddressDetails(p => ({ ...p, fullAddress: t }))}
                        multiline
                        numberOfLines={2}
                        placeholderTextColor="#94A3B8"
                    />
                </View>

                <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
                    <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 14,
        backgroundColor: '#FFF',
        borderBottomWidth: 2.5,
        borderBottomColor: colors.primary,
        gap: 8,
    },
    backBtn: { padding: 4 },
    backIcon: { fontSize: 28, color: '#1E293B', lineHeight: 32 },
    headerTitle: { fontSize: 19, fontWeight: '700', color: '#1E293B' },

    // Map
    mapArea: { flex: 1, position: 'relative' },
    locateBtn: {
        position: 'absolute', bottom: 20, right: 16,
        width: 44, height: 44, borderRadius: 8,
        backgroundColor: '#FFF',
        borderWidth: 1, borderColor: '#E2E8F0',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
    },
    locateIcon: { fontSize: 22, color: '#1E293B' },

    // Bottom panel
    bottomPanel: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    inputBox: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 12,
        marginBottom: 12,
    },
    inputLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
    addressInput: { fontSize: 15, color: '#1E293B', lineHeight: 22 },

    continueBtn: {
        backgroundColor: '#1E293B',
        borderRadius: 0,
        paddingVertical: 18,
        alignItems: 'center',
        marginHorizontal: -16,
        marginBottom: -24,
    },
    continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
