import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, ScrollView, Image, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';
import { uploadFile, deleteFile } from '../services/uploadService';
import { CloudinaryResourceType } from '../utils/constants';


import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { salonCoverSchema } from '../utils/validationSchemas';

// ─── Bullet Point ─────────────────────────────────────────────────────────────
function Bullet({ text }) {
    return (
        <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{text}</Text>
        </View>
    );
}

const RULES = [
    'Image Should be clear visible about your brand.',
    'Inside Image should not have any phone number.',
    'Outside Image should show the salon signboard clearly.',
    'Images must be in JPG or PNG format, max 5MB each.',
    'You can upload up to 3 images for each section.',
];

export default function SalonCoverUploadScreen({ navigation, route }) {
    const isEdit = route.params?.isEdit;
    const { formData, updateFormData } = useOnboarding();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const methods = useForm({
        resolver: yupResolver(salonCoverSchema),
        defaultValues: {
            logo: formData.salonCover?.logo || null,
            banner: formData.salonCover?.banner || null,
            inside: formData.salonCover?.inside || [],
            outside: formData.salonCover?.outside || [],
        },
        mode: 'onTouched'
    });

    React.useEffect(() => {
        if (formData.salonCover) {
            methods.reset({
                logo: formData.salonCover.logo || null,
                banner: formData.salonCover.banner || null,
                inside: formData.salonCover.inside || [],
                outside: formData.salonCover.outside || [],
            });
        }
    }, [formData.salonCover]);

    const watchInside = methods.watch('inside') || [];
    const watchOutside = methods.watch('outside') || [];
    const watchLogo = methods.watch('logo');
    const watchBanner = methods.watch('banner');
    const hasAnyImage = watchInside.length > 0 || watchOutside.length > 0 || !!watchLogo || !!watchBanner;

    const pickImage = async (fieldName) => {
        const isArrayField = fieldName === 'inside' || fieldName === 'outside';
        const currentValue = methods.getValues(fieldName);

        if (isArrayField && currentValue?.length >= 3) {
            Alert.alert('Limit Reached', 'You can only upload up to 3 images for this section.');
            return;
        }

        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'We need camera roll permissions to upload images.');
                return;
            }

            let aspect = [4, 3];
            if (fieldName === 'logo') aspect = [1, 1];
            if (fieldName === 'banner') aspect = [16, 9];

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: aspect,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const localUri = result.assets[0].uri;
                setIsSubmitting(true);
                
                let resourceType = CloudinaryResourceType.SALON_COVER;
                let uploadOptions = { type: fieldName };

                if (isArrayField) {
                    resourceType = CloudinaryResourceType.SALON_GALLERY;
                    uploadOptions = { index: currentValue?.length || 0 };
                }

                const remoteUrl = await uploadFile(
                    localUri, 
                    resourceType, 
                    formData.partnerId, 
                    uploadOptions
                );
                
                setIsSubmitting(false);
                if (remoteUrl) {
                    if (isArrayField) {
                        const currentImages = currentValue || [];
                        methods.setValue(fieldName, [...currentImages, remoteUrl], { shouldValidate: true, shouldDirty: true });
                    } else {
                        methods.setValue(fieldName, remoteUrl, { shouldValidate: true, shouldDirty: true });
                    }
                }
            }

        } catch (error) {
            console.log('Error picking/uploading image: ', error);
            setIsSubmitting(false);
            Alert.alert('Upload Failed', 'There was an error uploading your image. Please try again.');
        }
    };

    const removeImage = (fieldName, index) => {
        const currentImages = methods.getValues(fieldName) || [];
        // Delete the removed image from the server
        deleteFile(currentImages[index]);
        const newImages = currentImages.filter((_, i) => i !== index);
        methods.setValue(fieldName, newImages, { shouldValidate: true, shouldDirty: true });
    };

    const submitApplication = async (data) => {
        setIsSubmitting(true);
        try {
            await updateFormData('salonCover', data);
            if (isEdit) {
                Alert.alert('Saved', 'Gallery and brand images updated successfully.', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
                return;
            }
            await updateFormData('lastScreen', 'DocumentUpload');
            navigation.navigate('DocumentUpload');
        } catch (error) {
            console.error("Save cover error:", error);
            Alert.alert("Error", "Failed to save cover images. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = async () => {
        await submitApplication({ logo: null, banner: null, inside: [], outside: [] });
    };

    const MultiUploadArea = ({ name, label }) => {
        const images = methods.watch(name) || [];
        return (
            <View style={styles.uploadSection}>
                <Text style={styles.sectionLabel}>{label}</Text>
                <View style={styles.imageGrid}>
                    {images.map((uri, idx) => (
                        <View key={idx} style={styles.imageWrapper}>
                            <Image source={{ uri }} style={styles.imagePreview} />
                            <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(name, idx)}>
                                <Ionicons name="close" size={16} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    {images.length < 3 && (
                        <TouchableOpacity style={styles.addBtn} onPress={() => pickImage(name)}>
                            <Ionicons name="camera-outline" size={28} color="#64748B" />
                            <Text style={styles.addText}>Add</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.countIndicator}>
                    <Text style={styles.countText}>{images.length}/3 images uploaded</Text>
                </View>
            </View>
        );
    };

    const SingleUploadArea = ({ name, label, subtext, aspect = "1:1" }) => {
        const value = methods.watch(name);
        return (
            <View style={styles.uploadSection}>
                <Text style={styles.sectionLabel}>{label}</Text>
                <TouchableOpacity
                    style={[
                        name === 'logo' ? styles.logoPlaceholder : styles.bannerPlaceholder,
                        value && (name === 'logo' ? styles.logoUploaded : styles.bannerUploaded)
                    ]}
                    onPress={() => pickImage(name)}
                    onLongPress={() => {
                        if (value) {
                            deleteFile(value);
                            methods.setValue(name, null, { shouldValidate: true, shouldDirty: true });
                        }
                    }}
                >
                    {value ? (
                        <Image source={{ uri: value }} style={name === 'logo' ? styles.logoImage : styles.bannerImage} />
                    ) : (
                        <>
                            <Ionicons name="image-outline" size={name === 'logo' ? 40 : 50} color="#94A3B8" />
                            <Text style={styles.addText}>Add {name === 'logo' ? 'Logo' : 'Banner'}</Text>
                        </>
                    )}
                </TouchableOpacity>
                <Text style={styles.countText}>{subtext}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtnWrapper}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={28} color="#1E293B" style={{ marginRight: 8 }} />
                    <Text style={styles.headerTitle}>Studio Gallery</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.accentLine} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <SingleUploadArea
                    name="logo"
                    label="1. Studio Logo"
                    subtext="This will be your salon's main thumbnail (Square)."
                />

                <SingleUploadArea
                    name="banner"
                    label="2. Banner / Cover Image"
                    subtext="Large image shown at the top of your profile."
                />

                <MultiUploadArea name="inside" label="3. Studio Inside Images" />
                <MultiUploadArea name="outside" label="4. Studio Outside Images" />

                <View style={styles.rulesCard}>
                    <Text style={styles.rulesTitle}>Rules &amp; Instruction:</Text>
                    {RULES.map((rule, idx) => (
                        <Bullet key={idx} text={rule} />
                    ))}
                </View>

                <View style={{ height: 32 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitBtn, !hasAnyImage && styles.submitBtnDisabled]}
                    onPress={isSubmitting || !hasAnyImage ? null : methods.handleSubmit(submitApplication)}
                    disabled={isSubmitting || !hasAnyImage}
                >
                    <Text style={styles.submitBtnText}>
                        {isSubmitting ? 'Processing...' : 'Complete Registration'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, backgroundColor: '#FFF'
    },
    backBtnWrapper: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 19, fontWeight: '700', color: '#1E293B' },
    supportIconWrapper: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#E11D48',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#E11D48', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4
    },
    accentLine: { height: 2, backgroundColor: colors.primary },

    content: { padding: 24 },

    uploadSection: { marginBottom: 32 },
    sectionLabel: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 16 },
    imageGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
    imageWrapper: { width: 100, height: 100, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
    removeBtn: {
        position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
    },
    addBtn: {
        width: 100, height: 100, borderRadius: 12, backgroundColor: '#F1F5F9',
        borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed',
        justifyContent: 'center', alignItems: 'center'
    },
    addText: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 4 },
    countIndicator: { marginTop: 12 },
    countText: { fontSize: 13, color: '#64748B', fontWeight: '500' },

    logoPlaceholder: {
        width: 120, height: 120, borderRadius: 60, backgroundColor: '#F1F5F9',
        borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed',
        justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden'
    },
    logoUploaded: { borderStyle: 'solid' },
    logoImage: { width: '100%', height: '100%', resizeMode: 'cover' },

    bannerPlaceholder: {
        width: '100%', height: 160, borderRadius: 16, backgroundColor: '#F1F5F9',
        borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed',
        justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden'
    },
    bannerUploaded: { borderStyle: 'solid' },
    bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },

    rulesCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginTop: 12 },
    rulesTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
    bulletRow: { flexDirection: 'row', marginBottom: 10, paddingRight: 10 },
    bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 7, marginRight: 10 },
    bulletText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 20 },

    footer: { padding: 24, paddingBottom: 36, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    submitBtn: {
        backgroundColor: '#1E293B', borderRadius: 14, paddingVertical: 18, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
    },
    submitBtnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0, elevation: 0 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
