import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { professionalDetailsSchema } from '../utils/validationSchemas';
import KeyboardAwareForm from '../components/Form/KeyboardAwareForm';
import SharedInput from '../components/Form/SharedInput';

export default function ProfessionalDetailsScreen({ navigation, route }) {
    const isEdit = route.params?.isEdit;
    const { formData, updateFormData, refreshProfile } = useOnboarding();

    useEffect(() => {
        refreshProfile();
    }, []);

    const methods = useForm({
        resolver: yupResolver(professionalDetailsSchema),
        defaultValues: {
            facebook: formData.professional?.facebook || 'https://facebook.com/',
            instagram: formData.professional?.instagram || 'https://instagram.com/',
            youtube: formData.professional?.youtube || 'https://youtube.com/',
        },
        mode: 'onTouched'
    });

    // Automatically re-populate form when context data changes (e.g. after sync)
    useEffect(() => {
        methods.reset({
            facebook: formData.professional?.facebook || 'https://facebook.com/',
            instagram: formData.professional?.instagram || 'https://instagram.com/',
            youtube: formData.professional?.youtube || 'https://youtube.com/',
        });
    }, [formData.professional]);

    const onSubmit = async (data) => {
        await updateFormData('professional', data);
        if (isEdit) {
            navigation.goBack();
            return;
        }
        await updateFormData('lastScreen', 'WorkingHours');
        navigation.navigate('WorkingHours');
    };

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Professional Details</Text>
            </View>

            <KeyboardAwareForm methods={methods} contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Social Profile (Optional)</Text>
                    <Text style={styles.cardSubtitle}>Link your social media so customers can see your work.</Text>

                    <SharedInput
                        name="facebook"
                        label="Facebook Link"
                        placeholder="https://facebook.com/yourprofile"
                        keyboardType="url"
                        iconName="logo-facebook"
                        iconColor="#1877F2"
                        nextField="instagram"
                    />

                    <SharedInput
                        name="instagram"
                        label="Instagram Link"
                        placeholder="https://instagram.com/yourprofile"
                        keyboardType="url"
                        iconName="logo-instagram"
                        iconColor="#E4405F"
                        nextField="youtube"
                    />

                    <SharedInput
                        name="youtube"
                        label="YouTube Link"
                        placeholder="https://youtube.com/c/yourchannel"
                        keyboardType="url"
                        iconName="logo-youtube"
                        iconColor="#FF0000"
                    />
                </View>
            </KeyboardAwareForm>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.btn, !methods.formState.isValid && styles.btnDisabled]}
                    onPress={methods.handleSubmit(onSubmit)}
                    disabled={!methods.formState.isValid}
                >
                    <Text style={styles.btnText}>{isEdit ? 'Save Changes' : 'Next Step →'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingBottom: 10,
    },
    backBtn: { padding: 8, marginRight: 8, backgroundColor: '#FFF', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    headerTitle: { flex: 1, fontSize: 22, fontWeight: '700', color: '#1E293B', letterSpacing: -0.5 },

    scrollContent: { padding: 24, paddingBottom: 40, gap: 20 },

    card: {
        backgroundColor: '#FFF', borderRadius: 24, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2
    },
    cardTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
    cardSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 20 },

    footer: { padding: 24, paddingBottom: 32, backgroundColor: '#F8FAFC' },
    btn: { backgroundColor: colors.secondary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', shadowColor: colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    btnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
    btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' }
});
