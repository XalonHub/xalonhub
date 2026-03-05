import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';

import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { salonBasicInfoSchema } from '../utils/validationSchemas';
import KeyboardAwareForm from '../components/Form/KeyboardAwareForm';
import SharedInput from '../components/Form/SharedInput';
import SharedSelect from '../components/Form/SharedSelect';

// ─── Field Label (My X is) ────────────────────────────────────────────────────
function FieldLabel({ prefix, highlight, suffix = 'is' }) {
    return (
        <Text style={fieldLabel.text}>
            {prefix}{' '}
            <Text style={fieldLabel.highlight}>{highlight}</Text>
            {` ${suffix}`}
        </Text>
    );
}

const fieldLabel = StyleSheet.create({
    text: { fontSize: 16, color: '#1E293B', fontWeight: '500', marginBottom: 8 },
    highlight: { color: colors.primary, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SalonBasicInfoScreen({ navigation, route }) {
    const isEdit = route.params?.isEdit;
    const { formData, updateFormData } = useOnboarding();

    const [gstModal, setGstModal] = useState(false);
    const [gstConfirmed, setGstConfirmed] = useState(false);

    const methods = useForm({
        resolver: yupResolver(salonBasicInfoSchema),
        defaultValues: {
            name: formData.salonInfo?.name || '',
            businessName: formData.salonInfo?.businessName || '',
            email: formData.salonInfo?.email || '',
            panCard: formData.salonInfo?.panCard || '',
            establishmentDate: formData.salonInfo?.establishmentDate || '',
            gstNumber: formData.salonInfo?.gstNumber || '',
            agentCode: formData.salonInfo?.agentCode || '',
        },
        mode: 'onTouched',
    });

    const currentGst = methods.watch('gstNumber');

    const handleGstBlur = () => {
        if (currentGst?.trim().length > 0 && !gstConfirmed) {
            setGstModal(true);
        }
    };

    const handleGstConfirm = () => {
        setGstConfirmed(true);
        setGstModal(false);
    };

    const handleGstCancel = () => {
        methods.setValue('gstNumber', '');
        setGstConfirmed(false);
        setGstModal(false);
    };

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.replace('SalonCategory');
        }
    };

    const formatTextDate = (text) => {
        let cleaned = ('' + text).replace(/\D/g, '');
        let formatted = '';
        if (cleaned.length > 0) formatted = cleaned.substring(0, 2);
        if (cleaned.length > 2) formatted += '/' + cleaned.substring(2, 4);
        if (cleaned.length > 4) formatted += '/' + cleaned.substring(4, 8);
        return formatted;
    };

    const onSubmit = (data) => {
        updateFormData('salonInfo', data);
        if (isEdit) {
            navigation.goBack();
            return;
        }
        updateFormData('lastScreen', 'ServiceAgreement');
        navigation.navigate('ServiceAgreement');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={28} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <View style={styles.headerAccent} />
                    <Text style={styles.headerTitle}>My Basic Info</Text>
                </View>
                <TouchableOpacity style={styles.exitBtn} onPress={handleBack}>
                    <Ionicons name="log-out" size={18} color="#64748B" />
                </TouchableOpacity>
            </View>

            <KeyboardAwareForm methods={methods} contentContainerStyle={styles.scrollContent}>

                <View style={styles.fieldGroup}>
                    <FieldLabel prefix="My" highlight="Good Name" />
                    <SharedInput name="name" placeholder="Name Here..." nextField="businessName" />
                </View>

                <View style={styles.fieldGroup}>
                    <FieldLabel prefix="My" highlight="Business Name" />
                    <SharedInput name="businessName" placeholder="Salon Name Here..." nextField="email" />
                </View>

                <View style={styles.fieldGroup}>
                    <FieldLabel prefix="My" highlight="Business Email" />
                    <SharedInput name="email" placeholder="Email Here..." keyboardType="email-address" nextField="establishmentDate" />
                </View>

                <View style={styles.fieldGroup}>
                    <FieldLabel prefix="Shop" highlight="Establishment Date" suffix="is" />
                    <SharedInput
                        name="establishmentDate"
                        placeholder="DD/MM/YYYY"
                        keyboardType="number-pad"
                        valueTransform={formatTextDate}
                        maxLength={10}
                        nextField="panCard"
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <FieldLabel prefix="My" highlight="Pan Card" />
                    <SharedInput name="panCard" placeholder="Pan Card Number (optional)" valueTransform={(v) => v.toUpperCase()} maxLength={10} nextField="gstNumber" />
                </View>

                <View style={styles.fieldGroup}>
                    <FieldLabel prefix="My" highlight="GST Number" />
                    <SharedInput name="gstNumber" placeholder="GST Number (optional)" valueTransform={(v) => v.toUpperCase()} maxLength={15} onBlur={handleGstBlur} />
                </View>

                <View style={styles.fieldGroup}>
                    <FieldLabel prefix="My" highlight="Agent Code" suffix="(Optional)" />
                    <SharedInput name="agentCode" placeholder="Enter Agent Code" valueTransform={(v) => v.toUpperCase()} />
                </View>

            </KeyboardAwareForm>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.continueBtn, !methods.formState.isValid && styles.continueBtnDisabled]}
                    onPress={methods.handleSubmit(onSubmit)}
                    disabled={!methods.formState.isValid}
                >
                    <Text style={styles.continueBtnText}>{isEdit ? 'Update Profile' : 'Continue'}</Text>
                </TouchableOpacity>
            </View>

            {/* GST Confirmation Modal */}
            <Modal visible={gstModal} transparent animationType="slide">
                <View style={gstModalStyles.overlay}>
                    <View style={gstModalStyles.sheet}>
                        <TouchableOpacity style={gstModalStyles.closeBtn} onPress={handleGstCancel}>
                            <Ionicons name="close" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                        <Text style={gstModalStyles.title}>Confirmation</Text>
                        <Text style={gstModalStyles.body}>
                            You are enabling GST for your store{'\n'}
                            Please enter service prices inclusive of GST{'\n'}
                            Once your GST details are approved, all prices will be displayed as GST-inclusive
                        </Text>
                        <View style={gstModalStyles.actions}>
                            <TouchableOpacity style={gstModalStyles.cancelBtn} onPress={handleGstCancel}>
                                <Text style={gstModalStyles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={gstModalStyles.submitBtn} onPress={handleGstConfirm}>
                                <Text style={gstModalStyles.submitText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const gstModalStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 28, paddingBottom: 40,
    },
    closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
    title: { fontSize: 22, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 16 },
    body: {
        fontSize: 15, color: '#64748B', lineHeight: 24,
        textAlign: 'center', marginBottom: 28,
    },
    actions: { flexDirection: 'row', gap: 12 },
    cancelBtn: {
        flex: 1, paddingVertical: 15, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#E2E8F0',
        alignItems: 'center', backgroundColor: '#FFF',
    },
    cancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
    submitBtn: {
        flex: 1, paddingVertical: 15, borderRadius: 12,
        backgroundColor: '#1E293B', alignItems: 'center',
    },
    submitText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 14,
        borderBottomWidth: 2.5,
        borderBottomColor: colors.primary,
        gap: 8,
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerAccent: { width: 4, height: 22, borderRadius: 2, backgroundColor: colors.primary },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
    exitBtn: {
        width: 36, height: 36, borderRadius: 8,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1, borderColor: '#E2E8F0',
    },

    scrollContent: { padding: 20, paddingBottom: 40 },

    fieldGroup: { marginBottom: 12 },

    agentQuestion: { fontSize: 15, color: '#1E293B', fontWeight: '500', marginBottom: 12 },
    radioRow: { flexDirection: 'row', gap: 24, marginBottom: 12 },
    radioOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    radioCircle: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: '#D1D5DB',
        justifyContent: 'center', alignItems: 'center',
    },
    radioCircleActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
    radioLabel: { fontSize: 16, color: '#1E293B' },

    agentCodeBox: {
        borderWidth: 1.5,
        borderColor: colors.primary,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingTop: 12,
        marginTop: 8,
        backgroundColor: colors.primary + '0A'
    },
    agentCodeLabel: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase'
    },

    footer: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12, backgroundColor: '#FFF' },
    continueBtn: {
        backgroundColor: '#1E293B',
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
    },
    continueBtnDisabled: { backgroundColor: '#94A3B8' },
    continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
