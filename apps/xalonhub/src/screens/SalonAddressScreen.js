import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, TextInput, Alert, ActivityIndicator,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import MapView, { Marker } from '../components/Map';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';
import { reverseGeocode as googleReverseGeocode } from '../services/locationService';
import { addressSchema } from '../utils/validationSchemas';
import KeyboardAwareForm from '../components/Form/KeyboardAwareForm';
import SharedInput from '../components/Form/SharedInput';

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SalonAddressScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const isEdit = route.params?.isEdit;
    const { formData, updateFormData } = useOnboarding();

    const DEFAULT_LAT = 8.7139;
    const DEFAULT_LNG = 77.7567;

    const [location, setLocation] = useState({
        latitude: formData.address?.lat || DEFAULT_LAT,
        longitude: formData.address?.lng || DEFAULT_LNG,
    });

    const [loadingMap, setLoadingMap] = useState(false);

    const methods = useForm({
        resolver: yupResolver(addressSchema),
        defaultValues: {
            address: formData.address?.address || '',
            locality: formData.address?.locality || '',
            district: formData.address?.district || '',
            city: formData.address?.city || '',
            state: formData.address?.state || '',
            pincode: formData.address?.pincode || '',
        },
        mode: 'onTouched'
    });

    // Sync form values if cloud draft arrives late
    useEffect(() => {
        if (formData.address) {
            const addr = formData.address;
            if (addr.lat && addr.lng) {
                setLocation({ latitude: addr.lat, longitude: addr.lng });
            }
            methods.reset({
                address: addr.address || '',
                locality: addr.locality || '',
                district: addr.district || '',
                city: addr.city || '',
                state: addr.state || '',
                pincode: addr.pincode || '',
            });
        }
    }, [formData.address]);

    const handleBack = () => {
        if (isEdit) {
            navigation.goBack();
            return;
        }
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
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
                // Update form fields
                methods.setValue('address', resolvedAddress.fullAddress, { shouldValidate: true });
                methods.setValue('locality', resolvedAddress.locality, { shouldValidate: true });
                methods.setValue('district', resolvedAddress.district, { shouldValidate: true });
                methods.setValue('city', resolvedAddress.city, { shouldValidate: true });
                methods.setValue('state', resolvedAddress.state, { shouldValidate: true });
                methods.setValue('pincode', resolvedAddress.pincode, { shouldValidate: true });
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
            Alert.alert('Permission Denied', 'Please enable location services in your settings to use this feature.');
            return;
        }

        try {
            setLoadingMap(true);
            let loc = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = loc.coords;
            setLocation({ latitude, longitude });
            reverseGeocode(latitude, longitude);
        } catch (error) {
            Alert.alert('Error', 'Unable to fetch location.');
        } finally {
            setLoadingMap(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            await updateFormData('address', {
                ...data,
                lat: location.latitude,
                lng: location.longitude
            });

            if (isEdit) {
                navigation.goBack();
                return;
            }

            await updateFormData('lastScreen', 'SalonWorkingHours');
            navigation.navigate('SalonWorkingHours');
        } catch (err) {
            Alert.alert('Error', 'Failed to save address details.');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Salon Location</Text>
            </View>

            <KeyboardAwareForm methods={methods} contentContainerStyle={styles.scrollContent}>
                {/* Map Section */}
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
                        <View style={styles.mapOverlay}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    )}

                    <TouchableOpacity style={styles.locateBtn} onPress={handleLocateMe}>
                        <Ionicons name="locate" size={22} color="#1E293B" />
                    </TouchableOpacity>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionSubtitle}>Drag the pin or search to find your location, then confirm details below.</Text>

                    <SharedInput
                        name="address"
                        label="Full Address"
                        placeholder="House no, Street name, Building etc."
                        multiline
                        numberOfLines={2}
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <SharedInput
                                name="locality"
                                label="Locality"
                                placeholder="Locality"
                            />
                        </View>
                        <View style={{ width: 12 }} />
                        <View style={{ flex: 1 }}>
                            <SharedInput
                                name="district"
                                label="District"
                                placeholder="District"
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <SharedInput
                                name="city"
                                label="City/Town"
                                placeholder="City"
                            />
                        </View>
                        <View style={{ width: 12 }} />
                        <View style={{ flex: 1 }}>
                            <SharedInput
                                name="state"
                                label="State"
                                placeholder="State"
                            />
                        </View>
                    </View>

                    <SharedInput
                        name="pincode"
                        label="Pincode"
                        placeholder="6-digit pincode"
                        keyboardType="number-pad"
                    />
                </View>

                <View style={{ height: 20 }} />
            </KeyboardAwareForm>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.continueBtn, !methods.formState.isValid && styles.continueBtnDisabled]}
                    onPress={methods.handleSubmit(onSubmit)}
                    disabled={!methods.formState.isValid}
                >
                    <Text style={styles.continueBtnText}>{isEdit ? 'Update & Close' : 'Save & Continue'}</Text>
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
    headerTitle: { fontSize: 19, fontWeight: '700', color: '#1E293B' },

    scrollContent: { paddingBottom: 20 },

    // Map
    mapArea: { width: '100%', height: 250, position: 'relative' },
    mapOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.4)'
    },
    locateBtn: {
        position: 'absolute', bottom: 16, right: 16,
        width: 44, height: 44, borderRadius: 8,
        backgroundColor: '#FFF',
        borderWidth: 1, borderColor: '#E2E8F0',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
    },

    // Form
    formSection: { padding: 20 },
    sectionSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 20 },
    row: { flexDirection: 'row' },

    // Footer
    footer: { padding: 0 },
    continueBtn: {
        backgroundColor: '#1E293B',
        paddingVertical: 18,
        alignItems: 'center',
    },
    continueBtnDisabled: { backgroundColor: '#94A3B8' },
    continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
