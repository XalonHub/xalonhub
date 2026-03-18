import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';
import { uploadFile, deleteFile } from '../services/uploadService';

import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { documentUploadSchema } from '../utils/validationSchemas';
import KeyboardAwareForm from '../components/Form/KeyboardAwareForm';
import SharedInput from '../components/Form/SharedInput';

export default function DocumentUploadScreen({ navigation, route }) {
    const { formData, updateFormData } = useOnboarding();
    const isVerified = formData.kycStatus === 'approved';
    const isRejected = formData.kycStatus === 'rejected';

    const methods = useForm({
        resolver: yupResolver(documentUploadSchema),
        context: { workPreference: formData.workPreference },
        defaultValues: {
            showcaseImages: formData.kyc.documents?.showcaseImages || [],
            aadhaarFront: formData.kyc.documents?.aadhaarFront || null,
            aadhaarBack: formData.kyc.documents?.aadhaarBack || null,
            aadhaarNum: formData.kyc.documents?.aadhaarNum || '',
            licenseNum: formData.kyc.documents?.licenseNum || '',
            licenseImg: formData.kyc.documents?.licenseImg || null,
            hasPoliceCert: formData.kyc.documents?.hasPoliceCert || false,
            policeNum: formData.kyc.documents?.policeNum || '',
            policeImg: formData.kyc.documents?.policeImg || null,
            regCertificateNum: formData.kyc.documents?.regCertificateNum || '',
            regCertificateImg: formData.kyc.documents?.regCertificateImg || null,
        },
        mode: 'onTouched'
    });

    useEffect(() => {
        if (formData.kyc?.documents) {
            const docs = formData.kyc.documents;
            const formatAadhaar = (val) => {
                if (!val) return '';
                return val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
            };

            methods.reset({
                showcaseImages: Array.isArray(docs.showcaseImages) ? docs.showcaseImages : [],
                aadhaarFront: docs.aadhaarFront || null,
                aadhaarBack: docs.aadhaarBack || null,
                aadhaarNum: formatAadhaar(docs.aadhaarNum),
                licenseNum: docs.licenseNum || '',
                licenseImg: docs.licenseImg || null,
                hasPoliceCert: docs.hasPoliceCert === 'Yes' || docs.hasPoliceCert === true,
                policeNum: docs.policeNum || '',
                policeImg: docs.policeImg || null,
                regCertificateNum: docs.regCertificateNum || '',
                regCertificateImg: docs.regCertificateImg || null,
            });
        }
    }, [formData.kyc?.documents]);

    const hasPoliceCert = methods.watch('hasPoliceCert');
    const isSalon = formData.workPreference === 'salon';

    const pickImage = async (fieldName) => {
        if (isVerified) return;
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
                // Delete the old file from the server before uploading the new one
                const oldUrl = methods.getValues(fieldName);
                if (oldUrl) await deleteFile(oldUrl);

                // Upload the new file
                const remoteUrl = await uploadFile(localUri);
                if (remoteUrl) {
                    methods.setValue(fieldName, remoteUrl, { shouldValidate: true, shouldDirty: true });
                }
            }
        } catch (error) {
            console.log('Error picking/uploading image: ', error);
        }
    };

    const pickMultiImages = async (fieldName, limit) => {
        if (isVerified) return;
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return;

            const existingImages = methods.getValues(fieldName) || [];
            if (existingImages.length >= limit) {
                Alert.alert('Limit Reached', `You can upload a maximum of ${limit} photos.`);
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                selectionLimit: limit - existingImages.length,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const currentImages = [...existingImages];
                for (let i = 0; i < result.assets.length; i++) {
                    const localUri = result.assets[i].uri;
                    const remoteUrl = await uploadFile(localUri);
                    if (remoteUrl) currentImages.push(remoteUrl);
                }
                methods.setValue(fieldName, currentImages, { shouldValidate: true, shouldDirty: true });
            }
        } catch (error) {
            console.log(`Error picking/uploading images for ${fieldName}: `, error);
        }
    };

    const removeMultiImage = (fieldName, indexToRemove) => {
        if (isVerified) return;
        const currentImages = methods.getValues(fieldName) || [];
        // Delete the removed image from the server
        deleteFile(currentImages[indexToRemove]);
        const newImages = currentImages.filter((_, idx) => idx !== indexToRemove);
        methods.setValue(fieldName, newImages, { shouldValidate: true, shouldDirty: true });
    };

    const isEdit = route?.params?.isEdit;
    const onSubmit = (data) => {
        if (isVerified) return;
        updateFormData('kyc', { documents: data });
        if (isEdit) {
            Alert.alert('Saved', 'KYC Verification details updated successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
            return;
        }
        if (isSalon) {
            updateFormData('lastScreen', 'SalonRegistrationSuccess');
            navigation.navigate('SalonRegistrationSuccess');
        } else {
            updateFormData('lastScreen', 'RegistrationSuccess');
            navigation.navigate('RegistrationSuccess');
        }
    };

    // Helper component for Error text under image pickers
    const ImageError = ({ name }) => (
        <Controller
            control={methods.control}
            name={name}
            render={({ fieldState: { error } }) => error ? <Text style={styles.errorText}>{error.message}</Text> : null}
        />
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={30} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>KYC Verification</Text>
            </View>

            <KeyboardAwareForm methods={methods} contentContainerStyle={styles.scrollContent}>
                {isVerified && (
                    <View style={styles.verifiedBanner}>
                        <Ionicons name="checkmark-circle" size={20} color="#065F46" />
                        <Text style={styles.verifiedBannerText}>This information is verified and cannot be edited.</Text>
                    </View>
                )}

                {isRejected && (
                    <View style={styles.rejectionBanner}>
                        <Ionicons name="alert-circle" size={24} color="#991B1B" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rejectionBannerTitle}>Application Rejected</Text>
                            <Text style={styles.rejectionBannerText}>{formData.kycRejectedReason || 'No reason provided. Please review your documents and resubmit.'}</Text>
                        </View>
                    </View>
                )}

                {/* Aadhaar Verification */}
                <View style={styles.card}>
                    <Text style={styles.cardBadge}>Required</Text>
                    <Text style={styles.cardTitle}>Aadhaar Verification</Text>
                    <Text style={styles.cardSubtitle}>We need this to verify your identity securely.</Text>

                    <View style={styles.aadhaarRow}>
                        <Controller control={methods.control} name="aadhaarFront" render={({ field: { value } }) => (
                            <TouchableOpacity
                                style={[styles.docUploadBox, isVerified && { opacity: 0.8 }]}
                                onPress={() => pickImage('aadhaarFront')}
                                disabled={isVerified}
                            >
                                {value ? <Image source={{ uri: value }} style={styles.uploadedDocCover} /> : (
                                    <>
                                        <Ionicons name="camera" size={24} color="#64748B" style={{ marginBottom: 8 }} />
                                        <Text style={styles.docUploadLabel}>Front Side</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )} />

                        <Controller control={methods.control} name="aadhaarBack" render={({ field: { value } }) => (
                            <TouchableOpacity
                                style={[styles.docUploadBox, isVerified && { opacity: 0.8 }]}
                                onPress={() => pickImage('aadhaarBack')}
                                disabled={isVerified}
                            >
                                {value ? <Image source={{ uri: value }} style={styles.uploadedDocCover} /> : (
                                    <>
                                        <Ionicons name="camera" size={24} color="#64748B" style={{ marginBottom: 8 }} />
                                        <Text style={styles.docUploadLabel}>Back Side</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )} />
                    </View>
                    <ImageError name="aadhaarFront" />
                    <ImageError name="aadhaarBack" />

                    <View style={styles.inputGroupTopSpace}>
                        <Text style={styles.label}>Aadhaar Number</Text>
                        <SharedInput
                            name="aadhaarNum"
                            placeholder="0000 0000 0000"
                            keyboardType="number-pad"
                            valueTransform={(v) => v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()}
                            maxLength={14}
                            editable={!isVerified}
                        />
                    </View>
                </View>

                {/* Driving License - Freelancer Only */}
                {!isSalon && (
                    <View style={styles.card}>
                        <Text style={styles.cardBadge}>Required</Text>
                        <Text style={styles.cardTitle}>Driving License</Text>
                        <Text style={styles.cardSubtitle}>Please provide your license details.</Text>

                        <SharedInput name="licenseNum" label="License Number" placeholder="e.g. DL-1420110012345" editable={!isVerified} />
                        <Controller control={methods.control} name="licenseImg" render={({ field: { value } }) => (
                            <TouchableOpacity
                                style={[styles.docUploadBoxWide, { marginTop: 8 }, isVerified && { opacity: 0.8 }]}
                                onPress={() => pickImage('licenseImg')}
                                disabled={isVerified}
                            >
                                {value ? <Image source={{ uri: value }} style={styles.uploadedDocCover} /> : (
                                    <>
                                        <Ionicons name="camera" size={24} color="#64748B" style={{ marginBottom: 8 }} />
                                        <Text style={styles.docUploadLabel}>Upload License Photo</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )} />
                        <ImageError name="licenseImg" />
                    </View>
                )}

                {/* Additional Documents */}
                <View style={styles.card}>
                    <Text style={styles.cardBadgeOptional}>Optional</Text>
                    <Text style={styles.cardTitle}>Additional Documents</Text>

                    {/* Police Cert Toggle */}
                    <View style={styles.radioGroup}>
                        <Text style={styles.radioQuestion}>Have Police Verification Certificate?</Text>
                        <Controller control={methods.control} name="hasPoliceCert" render={({ field: { onChange, value } }) => (
                            <View style={styles.radioOptions}>
                                <TouchableOpacity
                                    style={[styles.radioBtn, value && styles.radioBtnActive, isVerified && { opacity: 0.8 }]}
                                    onPress={() => onChange(true)}
                                    disabled={isVerified}
                                >
                                    <Text style={[styles.radioText, value && styles.radioTextActive]}>Yes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.radioBtn, !value && styles.radioBtnActive, isVerified && { opacity: 0.8 }]}
                                    onPress={() => {
                                        onChange(false);
                                        methods.setValue('policeNum', '');
                                        // Delete the police cert image from the server before clearing it
                                        const img = methods.getValues('policeImg');
                                        if (img) deleteFile(img);
                                        methods.setValue('policeImg', null);
                                    }}
                                    disabled={isVerified}
                                >
                                    <Text style={[styles.radioText, !value && styles.radioTextActive]}>No</Text>
                                </TouchableOpacity>
                            </View>
                        )} />
                    </View>

                    {hasPoliceCert && (
                        <View style={styles.expandedSection}>
                            <SharedInput name="policeNum" label="Certificate Number" placeholder="Certificate No." editable={!isVerified} />
                            <Controller control={methods.control} name="policeImg" render={({ field: { value } }) => (
                                <TouchableOpacity
                                    style={[styles.docUploadBoxWide, { marginTop: 8 }, isVerified && { opacity: 0.8 }]}
                                    onPress={() => pickImage('policeImg')}
                                    disabled={isVerified}
                                >
                                    {value ? <Image source={{ uri: value }} style={styles.uploadedDocCover} /> : (
                                        <>
                                            <Ionicons name="camera" size={24} color="#64748B" style={{ marginBottom: 8 }} />
                                            <Text style={styles.docUploadLabel}>Upload Certificate Photo</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )} />
                            <ImageError name="policeImg" />
                        </View>
                    )}
                </View>

                {/* Showcase Portfolio (Freelancer Only) */}
                {!isSalon && (
                    <View style={styles.card}>
                        <Text style={styles.cardBadgeOptional}>Optional</Text>
                        <Text style={styles.cardTitle}>Showcase Portfolio</Text>
                        <Text style={[styles.cardSubtitle, { paddingRight: 0 }]}>
                            Add 3-5 photos of your best work to show customers what you can do.
                        </Text>

                        <Controller
                            control={methods.control}
                            name="showcaseImages"
                            render={({ field: { value } }) => {
                                const images = value || [];
                                return (
                                    <View>
                                        <View style={styles.showcaseGrid}>
                                            {images.map((imgUrl, idx) => (
                                                <View key={idx} style={styles.showcaseItem}>
                                                    <Image source={{ uri: imgUrl }} style={styles.showcaseImg} />
                                                    {!isVerified && (
                                                        <TouchableOpacity style={styles.showcaseRemoveBtn} onPress={() => removeMultiImage('showcaseImages', idx)}>
                                                            <Ionicons name="close-circle" size={24} color="#FFF" />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            ))}
                                            {images.length < 5 && !isVerified && (
                                                <TouchableOpacity style={styles.showcaseAddPlaceholder} onPress={() => pickMultiImages('showcaseImages', 5)}>
                                                    <Ionicons name="add" size={32} color="#94A3B8" />
                                                    <Text style={styles.showcaseAddLabel}>Add</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            }}
                        />
                        <ImageError name="showcaseImages" />
                    </View>
                )}

                {/* Shop Registration Certificate (Salon Only) */}
                {isSalon && (
                    <View style={styles.card}>
                        <Text style={styles.cardBadge}>Required</Text>
                        <Text style={styles.cardTitle}>Business Registration</Text>
                        <Text style={styles.cardSubtitle}>Upload your Shop & Establishment certificate or any other legal registration document.</Text>

                        <SharedInput name="regCertificateNum" label="Certificate Number" placeholder="Enter Registration No." editable={!isVerified} />
                        <Controller control={methods.control} name="regCertificateImg" render={({ field: { value } }) => (
                            <TouchableOpacity
                                style={[styles.docUploadBoxWide, { marginTop: 8 }, isVerified && { opacity: 0.8 }]}
                                onPress={() => pickImage('regCertificateImg')}
                                disabled={isVerified}
                            >
                                {value ? <Image source={{ uri: value }} style={styles.uploadedDocCover} /> : (
                                    <>
                                        <Ionicons name="camera" size={24} color="#64748B" style={{ marginBottom: 8 }} />
                                        <Text style={styles.docUploadLabel}>Upload Certificate Image</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )} />
                        <ImageError name="regCertificateImg" />
                    </View>
                )}

            </KeyboardAwareForm>

            <View style={styles.footer}>
                {!isVerified ? (
                    <TouchableOpacity
                        style={[styles.btn, !methods.formState.isValid && styles.btnDisabled]}
                        onPress={methods.handleSubmit(onSubmit)}
                        disabled={!methods.formState.isValid}
                    >
                        <Text style={styles.btnText}>Submit Application</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.btn, { backgroundColor: '#D1FAE5', shadowOpacity: 0 }]}>
                        <Text style={[styles.btnText, { color: '#065F46' }]}>Verified ✅</Text>
                    </View>
                )}
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
    verifiedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    verifiedBannerText: {
        color: '#065F46',
        fontSize: 14,
        fontWeight: '500',
    },
    rejectionBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    rejectionBannerTitle: {
        color: '#991B1B',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    rejectionBannerText: {
        color: '#B91C1C',
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 18,
    },

    scrollContent: { padding: 24, paddingBottom: 40, gap: 20 },

    card: {
        backgroundColor: '#FFF', borderRadius: 24, padding: 24, position: 'relative',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2
    },
    cardBadge: { position: 'absolute', top: 24, right: 24, backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
    cardBadgeOptional: { position: 'absolute', top: 24, right: 24, backgroundColor: '#F1F5F9', color: '#64748B', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
    cardTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
    cardSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 20, paddingRight: 60 },

    cardSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 20, paddingRight: 60 },

    showcaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    showcaseItem: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    showcaseImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    showcaseRemoveBtn: { position: 'absolute', top: 4, right: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4 },
    showcaseAddPlaceholder: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    showcaseAddLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 4 },

    aadhaarRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    docUploadBox: { flex: 1, height: 100, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    docUploadBoxWide: { height: 100, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    docUploadLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    uploadedDocCover: { width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 16 },

    inputGroupTopSpace: { marginTop: 16 },
    label: { fontSize: 13, color: '#1E293B', fontWeight: '600', marginBottom: 8 },

    radioGroup: { marginVertical: 8 },
    radioQuestion: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 12 },
    radioOptions: { flexDirection: 'row', gap: 12 },
    radioBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    radioBtnActive: { backgroundColor: '#F0F9FF', borderColor: '#0EA5E9' },
    radioText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    radioTextActive: { color: '#0EA5E9' },

    expandedSection: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 24 },

    errorText: { color: '#EF4444', fontSize: 13, marginTop: 4 },

    footer: { padding: 24, paddingBottom: 32, backgroundColor: '#F8FAFC' },
    btn: { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 18, alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    btnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
    btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
