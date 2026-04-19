import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../context/OnboardingContext';
import { colors } from '../theme/colors';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { bankDetailsSchema } from '../utils/validationSchemas';
import KeyboardAwareForm from '../components/Form/KeyboardAwareForm';
import SharedInput from '../components/Form/SharedInput';

export default function BankDetailsScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const isEdit = route.params?.isEdit;
    const { formData, updateFormData } = useOnboarding();
    const bank = formData.bank || {};

    const [isMasked, setIsMasked] = React.useState(true);

    const methods = useForm({
        resolver: yupResolver(bankDetailsSchema),
        defaultValues: {
            bankName: bank.bankName || '',
            accName: bank.accName || '',
            ifsc: bank.ifsc || '',
            accNum: bank.accNum || '',
            reAccNum: bank.accNum || '',
            upiId: bank.upiId || '',
        },
        mode: 'onTouched',
    });

    const onSubmit = async (data) => {
        try {
            await updateFormData('bank', {
                bankName: data.bankName,
                accName: data.accName,
                ifsc: data.ifsc,
                accNum: data.accNum,
                upiId: data.upiId,
            });
            if (isEdit) {
                Alert.alert('Saved', 'Bank details updated successfully.', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else {
                const nextScreen = route.params?.nextScreen || 'DocumentUpload';
                await updateFormData('lastScreen', nextScreen);
                navigation.navigate(nextScreen);
            }
        } catch (error) {
            console.error('Failed to save bank details:', error);
            Alert.alert('Error', 'Failed to save bank details. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (isEdit) {
                            navigation.goBack();
                        } else if (formData.workPreference === 'salon') {
                            navigation.navigate('SalonWorkingHours');
                        } else {
                            navigation.navigate('WorkingHours');
                        }
                    }}
                    style={styles.backBtn}
                >
                    <Ionicons name="chevron-back" size={28} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.headerTextBox}>
                    <Text style={styles.headerTitle}>Bank Details</Text>
                    <Text style={styles.headerSubtitle}>Your account for periodic payments</Text>
                </View>
            </View>

            {/* Form */}
            <KeyboardAwareForm methods={methods} contentContainerStyle={styles.scrollContent}>
                {/* Info Banner */}
                <View style={styles.infoBanner}>
                    <Ionicons name="shield-checkmark" size={18} color="#065F46" />
                    <Text style={styles.infoBannerText}>
                        Your bank information is encrypted and stored securely. We use it only for periodic payments.
                    </Text>
                </View>

                <SharedInput
                    name="bankName"
                    label="Bank Name"
                    placeholder="e.g. State Bank of India"
                    nextField="accName"
                />
                <SharedInput
                    name="accName"
                    label="Account Holder Name"
                    placeholder="As per bank records"
                    nextField="ifsc"
                />
                <SharedInput
                    name="ifsc"
                    label="IFSC Code"
                    placeholder="e.g. SBIN0001234"
                    valueTransform={(v) => v.toUpperCase()}
                    maxLength={11}
                    nextField="accNum"
                />
                <View style={{ position: 'relative' }}>
                    <SharedInput
                        name="accNum"
                        label="Account Number"
                        keyboardType="number-pad"
                        secureTextEntry={isMasked}
                        nextField="reAccNum"
                    />
                    <TouchableOpacity
                        style={{ position: 'absolute', right: 16, top: 44, zIndex: 10 }}
                        onPress={() => setIsMasked(!isMasked)}
                    >
                        <Ionicons name={isMasked ? "eye-off" : "eye"} size={22} color="#64748B" />
                    </TouchableOpacity>
                </View>

                <SharedInput
                    name="reAccNum"
                    label="Re-Enter Account Number"
                    keyboardType="number-pad"
                    secureTextEntry={isMasked}
                    nextField="upiId"
                />

                <View style={styles.dividerSpace} />
                
                <SharedInput
                    name="upiId"
                    label="UPI ID (Optional)"
                    placeholder="e.g. name@okaxis"
                    valueTransform={(v) => v.toLowerCase()}
                    autoCapitalize="none"
                />
            </KeyboardAwareForm>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.btn, !methods.formState.isValid && styles.btnDisabled]}
                    onPress={methods.handleSubmit(onSubmit)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.btnText}>{isEdit ? 'Update Details' : 'Next Step →'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    headerTextBox: { flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
    headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 1 },

    scrollContent: { padding: 24, gap: 4, paddingBottom: 40 },
    dividerSpace: { height: 12 },

    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#ECFDF5',
        borderRadius: 12,
        padding: 14,
        gap: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    infoBannerText: { flex: 1, fontSize: 13, color: '#065F46', lineHeight: 19 },

    footer: { padding: 24, paddingBottom: 32, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    btn: {
        backgroundColor: colors.secondary, borderRadius: 14,
        paddingVertical: 18, alignItems: 'center',
        shadowColor: colors.secondary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    btnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
