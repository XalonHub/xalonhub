import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useOnboarding } from '../context/OnboardingContext';
import { uploadFile } from '../services/uploadService';
import { colors } from '../theme/colors';

// Validation & Form System
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { personalInfoSchema } from '../utils/validationSchemas';
import KeyboardAwareForm from '../components/Form/KeyboardAwareForm';
import SharedInput from '../components/Form/SharedInput';
import SharedSelect from '../components/Form/SharedSelect';
import { Controller } from 'react-hook-form';

export default function BasicInfoScreen({ navigation, route }) {
    const isEdit = route.params?.isEdit;
    const [phone, setPhone] = useState('');
    const { formData, updateFormData } = useOnboarding();

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    const user = JSON.parse(userData);
                    if (user && user.phone) setPhone(user.phone);
                }
            } catch (err) {
                console.log('Error loading user data', err);
            }
        };
        loadUserData();
    }, []);

    const methods = useForm({
        resolver: yupResolver(personalInfoSchema),
        defaultValues: {
            name: formData.personalInfo.name || '',
            dob: formData.personalInfo.dob || '',
            fatherName: formData.personalInfo.fatherName || '',
            gender: formData.personalInfo.gender || '',
            genderPreference: formData.personalInfo.genderPreference || '',
            email: formData.personalInfo.email || '',
            travel: formData.personalInfo.travel || '',
            experience: formData.personalInfo.experience?.toString() || '',
            profileImg: formData.personalInfo.profileImg || null,
            agentCode: formData.personalInfo.agentCode || '',
        },
        mode: 'onTouched',
    });

    const onSubmit = async (data) => {
        // Additional Age Validation
        const age = calculateAge(data.dob);
        if (age === null || age < 18) {
            methods.setError('dob', { type: 'manual', message: 'You must be at least 18 years old.' });
            return;
        }

        try {
            await updateFormData('personalInfo', data);
            if (isEdit) {
                navigation.goBack();
                return;
            }
            await updateFormData('lastScreen', 'LocationConfirm');
            navigation.navigate('LocationConfirm');
        } catch (error) {
            console.error("Failed to save personal info:", error);
            Alert.alert('Save Error', 'Failed to save your details to the server. Please try again.');
        }
    };

    const pickImage = async (fieldName) => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return;

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const localUri = result.assets[0].uri;
                const remoteUrl = await uploadFile(localUri);
                if (remoteUrl) {
                    methods.setValue(fieldName, remoteUrl, { shouldValidate: true, shouldDirty: true });
                }
            }
        } catch (error) {
            console.log('Error picking/uploading image: ', error);
        }
    };

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            Alert.alert("Logout", "Are you sure you want to exit onboarding and log out?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout", style: "destructive", onPress: async () => {
                        await AsyncStorage.removeItem('token');
                        await AsyncStorage.removeItem('user');
                        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                    }
                }
            ]);
        }
    };

    // Auto-dash formatting for DOB
    const formatDob = (text) => {
        let cleaned = ('' + text).replace(/\D/g, '');
        let formatted = '';
        if (cleaned.length > 0) formatted = cleaned.substring(0, 2);
        if (cleaned.length > 2) formatted += '/' + cleaned.substring(2, 4);
        if (cleaned.length > 4) formatted += '/' + cleaned.substring(4, 8);
        return formatted;
    };

    const calculateAge = (dobString) => {
        if (!dobString) return null;
        const parts = dobString.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                const birthDate = new Date(year, month, day);
                const today = new Date();
                let computedAge = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) computedAge--;
                return computedAge;
            }
        }
        return null;
    };

    // Watch DOB to render the age badge
    const watchedDob = methods.watch('dob');
    const computedAge = calculateAge(watchedDob);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.headerTitleGroup}>
                    <Text style={styles.headerTitle}>Personal Profile</Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            <KeyboardAwareForm methods={methods} contentContainerStyle={styles.scrollContent}>

                <View style={styles.profileUploadWrapper}>
                    <Controller
                        control={methods.control}
                        name="profileImg"
                        render={({ field: { value }, fieldState: { error } }) => (
                            <View style={styles.profileUploadContainer}>
                                <TouchableOpacity style={styles.profileAvatarPlaceholder} onPress={() => pickImage('profileImg')}>
                                    {value ? (
                                        <Image source={{ uri: value }} style={styles.uploadedAvatar} />
                                    ) : (
                                        <View style={styles.avatarEmpty}>
                                            <Ionicons name="camera" size={30} color="#94A3B8" />
                                            <Text style={styles.avatarLabel}>Add Photo</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                {error && <Text style={styles.errorText}>{error.message}</Text>}
                            </View>
                        )}
                    />
                    <Text style={styles.profileUploadDesc}>This photo will be shown to your customers.</Text>
                </View>

                <SharedInput
                    name="name"
                    label="Full Name"
                    placeholder="e.g. Aditi Sharma"
                    nextField="dob"
                />

                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <SharedInput
                            name="dob"
                            label="Date Of Birth"
                            placeholder="DD/MM/YYYY"
                            keyboardType="numeric"
                            maxLength={10}
                            valueTransform={formatDob}
                            iconName="calendar"
                            nextField="fatherName"
                        />
                    </View>
                    {computedAge !== null && computedAge > 0 && (
                        <View style={styles.ageBadge}>
                            <Text style={styles.ageText}>{computedAge} Yrs</Text>
                        </View>
                    )}
                </View>

                <SharedInput
                    name="fatherName"
                    label="Father Name"
                    placeholder="Father's Name"
                    nextField="email"
                />

                <View style={[styles.inputGroup, { marginTop: 8, marginBottom: 24, padding: 16, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, elevation: 1 }]}>
                    <Text style={[styles.label, { marginBottom: 12, fontSize: 14, color: '#1E293B', fontWeight: 'bold' }]}>
                        Identity & Service Preferences
                    </Text>

                    <SharedSelect
                        name="gender"
                        label="My Gender"
                        placeholder="Select Gender"
                        options={['Male', 'Female', 'Other']}
                    />

                    <View style={{ marginTop: 8 }}>
                        <SharedSelect
                            name="genderPreference"
                            label="I provide services to"
                            placeholder="Select who you provide services to"
                            options={['Everyone', 'Females Only', 'Males Only']}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mobile Number</Text>
                    <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        value={phone}
                        editable={false}
                    />
                </View>

                <SharedInput
                    name="email"
                    label="Email Address"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    nextField="experience"
                />

                <SharedInput
                    name="experience"
                    label="Years of Experience"
                    placeholder="e.g. 3"
                    keyboardType="numeric"
                />

                <SharedSelect
                    name="travel"
                    label="How Do You Travel?"
                    placeholder="Select Vehicle"
                    options={['2 Wheeler', '4 Wheeler', 'Public Services']}
                />

                <SharedInput
                    name="agentCode"
                    label="Agent Code (Optional)"
                    placeholder="e.g. AGENT123"
                    helpText="Enter an agent referral code if you have one."
                />

            </KeyboardAwareForm>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.btn, !methods.formState.isValid && styles.btnDisabled]}
                    onPress={methods.handleSubmit(onSubmit)}
                    disabled={!methods.formState.isValid}
                    activeOpacity={0.8}
                >
                    <Text style={styles.btnText}>{isEdit ? 'Update Profile' : 'Next Step →'}</Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingBottom: 10,
    },
    headerTitleGroup: { flex: 1, alignItems: 'flex-start' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', letterSpacing: -0.5 },
    backBtn: {
        width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFF',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
    },
    scrollContent: { padding: 24, paddingBottom: 40 },

    profileUploadWrapper: { alignItems: 'center', marginBottom: 24 },
    profileUploadContainer: { alignItems: 'center' },
    profileAvatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', overflow: 'hidden' },
    avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
    avatarLabel: { fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: '500' },
    uploadedAvatar: { width: '100%', height: '100%', resizeMode: 'cover' },
    profileUploadDesc: { fontSize: 13, color: '#64748B', marginTop: 12, textAlign: 'center' },
    errorText: { color: '#EF4444', fontSize: 12, marginTop: 6, fontWeight: '500' },

    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    ageBadge: { marginTop: 26, backgroundColor: colors.primaryLight, paddingHorizontal: 16, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.primary + '30' },
    ageText: { fontSize: 16, color: colors.primary, fontWeight: 'bold' },

    inputGroup: { gap: 6, marginBottom: 16 },
    label: { fontSize: 13, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        backgroundColor: '#FFF', borderRadius: 12,
        padding: 16, fontSize: 16, color: '#0F172A',
        borderWidth: 1, borderColor: '#E2E8F0'
    },
    inputDisabled: { backgroundColor: '#f1f5f9', color: '#64748B' },

    footer: { padding: 24, paddingBottom: 32, backgroundColor: '#F8FAFC' },
    btn: { backgroundColor: colors.secondary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', shadowColor: colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    btnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
    btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
