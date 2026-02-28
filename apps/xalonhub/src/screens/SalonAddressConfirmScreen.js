import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';

import { useForm, useEffect } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { addressSchema } from '../utils/validationSchemas';
import KeyboardAwareForm from '../components/Form/KeyboardAwareForm';
import SharedInput from '../components/Form/SharedInput';

export default function SalonAddressConfirmScreen({ route, navigation }) {
    const { formData, updateFormData } = useOnboarding();
    const isEdit = route.params?.isEdit;

    // Map passed params
    const passedAddress = route?.params?.address || formData.salonAddress?.address || '';
    const passedState = route?.params?.state || formData.salonAddress?.state || '';
    const passedDistrict = route?.params?.district || formData.salonAddress?.district || '';
    const passedCity = route?.params?.city || formData.salonAddress?.city || '';
    const passedPincode = route?.params?.pincode || formData.salonAddress?.pincode || '';
    const passedLat = route?.params?.lat || formData.salonAddress?.lat;
    const passedLng = route?.params?.lng || formData.salonAddress?.lng;

    const methods = useForm({
        resolver: yupResolver(addressSchema),
        defaultValues: {
            address: passedAddress,
            locality: formData.salonAddress?.locality || '',
            district: passedDistrict,
            state: passedState,
            city: passedCity,
            pincode: passedPincode,
        },
        mode: 'onTouched'
    });

    // Auto-update default values if navigating back map changes
    React.useEffect(() => {
        methods.reset({
            ...methods.getValues(),
            state: passedState,
            city: passedCity,
            pincode: passedPincode,
            address: passedAddress,
            district: passedDistrict
        });
    }, [passedState, passedCity, passedPincode, passedAddress, passedDistrict]);

    const onSubmit = (data) => {
        updateFormData('salonAddress', {
            ...data,
            lat: passedLat,
            lng: passedLng
        });
        if (isEdit) {
            navigation.goBack();
            return;
        }
        updateFormData('lastScreen', 'SalonWorkingHours');
        navigation.navigate('SalonWorkingHours');
    };

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.reset({ index: 0, routes: [{ name: 'SalonAddress' }] });
        }
    };

    // Derived states logic for UI handling
    const watchCity = methods.watch('city');
    const watchDistrict = methods.watch('district');

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Confirm Your Address</Text>
            </View>
            <View style={styles.accentLine} />

            <KeyboardAwareForm methods={methods} contentContainerStyle={styles.content}>
                <Text style={styles.subtitle}>So that we don't miss out on anything</Text>

                <SharedInput
                    name="address"
                    label="Enter Your Address"
                    placeholder="Full Address"
                    multiline
                    nextField="district"
                />

                <SharedInput
                    name="state"
                    label="State"
                    editable={false}
                />

                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <SharedInput
                            name="district"
                            label="District"
                            placeholder="District"
                            nextField="locality"
                        />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                        <SharedInput
                            name="locality"
                            label="Locality"
                            placeholder="Locality"
                        />
                    </View>
                </View>

                {watchCity !== watchDistrict && (
                    <SharedInput
                        name="city"
                        label="City/Town"
                        editable={false}
                    />
                )}

                <SharedInput
                    name="pincode"
                    label="Pincode"
                    editable={false}
                />
            </KeyboardAwareForm>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.continueBtn, !methods.formState.isValid && styles.continueBtnDisabled]}
                    onPress={methods.handleSubmit(onSubmit)}
                    disabled={!methods.formState.isValid}
                >
                    <Text style={styles.continueBtnText}>{isEdit ? 'Update Address' : 'Continue'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingBottom: 14, gap: 8,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 19, fontWeight: '700', color: '#1E293B' },
    accentLine: { height: 2.5, backgroundColor: colors.primary },

    content: { padding: 20, paddingBottom: 32 },
    subtitle: { fontSize: 16, color: '#1E293B', marginBottom: 20 },

    row: { flexDirection: 'row' },

    footer: { paddingHorizontal: 0, paddingBottom: 0 },
    continueBtn: {
        backgroundColor: '#1E293B',
        paddingVertical: 18,
        alignItems: 'center',
    },
    continueBtnDisabled: { backgroundColor: '#94A3B8' },
    continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
