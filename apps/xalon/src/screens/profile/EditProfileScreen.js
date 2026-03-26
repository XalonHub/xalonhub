import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    SafeAreaView, StatusBar, Alert, ActivityIndicator, Image,
    ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function EditProfileScreen({ route, navigation }) {
    const { auth, login } = useAuth();
    const [name, setName] = useState('');
    const [gender, setGender] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!auth?.customerId) return;
            try {
                const data = await api.getCustomerProfile(auth.customerId);
                if (data && !data.error) {
                    setName(data.name || '');
                    setGender(data.gender || '');
                    setEmail(data.email || '');
                    setDob(data.dob || '');
                    setProfileImage(data.profileImage || null);
                }
            } catch (err) { }
        };
        fetchProfile();
    }, [auth?.customerId]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to upload a profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri) => {
        setImageUploading(true);
        try {
            const response = await api.uploadFile(uri);
            if (response && response.url) {
                setProfileImage(response.url);
            } else {
                Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
            }
        } catch (err) {
            Alert.alert('Error', 'An error occurred during image upload.');
        } finally {
            setImageUploading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter your name');
            return;
        }
        if (!gender) {
            Alert.alert('Required', 'Please select your identity');
            return;
        }

        setLoading(true);
        try {
            const updateData = {
                name: name.trim(),
                gender,
                email: email.trim() || null,
                dob: dob.trim() || null,
                profileImage
            };
            const updatedProfile = await api.updateCustomerProfile(auth.customerId, updateData);
            if (updatedProfile && !updatedProfile.error) {
                // Update local auth context
                await login({
                    token: auth.token,
                    user: { id: auth.userId, phone: auth.phone, role: auth.role },
                    customerProfile: updatedProfile,
                });
                navigation.goBack();
            } else {
                Alert.alert('Error', 'Failed to update profile');
            }
        } catch (err) {
            Alert.alert('Error', 'An error occurred while saving.');
        } finally {
            setLoading(false);
        }
    };

    const genders = ['Male', 'Female'];

    const getImageUrl = (url) => {
        const BU = api.BASE_URL || 'http://localhost:5001';
        if (!url) return null;
        if (url.startsWith('http')) {
            return url.replace(/http:\/\/192\.168\.1\.10:5000/g, BU);
        }
        return `${BU}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Profile Image Section */}
                    <View style={styles.imageSection}>
                        <TouchableOpacity style={styles.imageWrapper} onPress={pickImage} disabled={imageUploading}>
                            {profileImage ? (
                                <Image source={{ uri: getImageUrl(profileImage) }} style={styles.image} />
                            ) : (
                                <View style={styles.placeholderImage}>
                                    <MaterialIcons name="person" size={50} color={colors.grayMedium} />
                                </View>
                            )}
                            <View style={styles.editIconBadge}>
                                <MaterialIcons name="camera-alt" size={16} color={colors.white} />
                            </View>
                            {imageUploading && (
                                <View style={styles.imageLoader}>
                                    <ActivityIndicator color={colors.primary} />
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.imageHint}>Tap to change profile picture</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your name"
                            placeholderTextColor={colors.gray}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email Address (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. yourname@example.com"
                            placeholderTextColor={colors.gray}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Date of Birth (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. DD/MM/YYYY"
                            placeholderTextColor={colors.gray}
                            value={dob}
                            onChangeText={setDob}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Identity</Text>
                        <View style={styles.radioGroup}>
                            {genders.map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[styles.radioOption, gender === g && styles.radioOptionSelected]}
                                    onPress={() => setGender(g)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.radioCircle, gender === g && styles.radioCircleSelected]}>
                                        {gender === g && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={[styles.radioText, gender === g && styles.radioTextSelected]}>{g}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, (!name.trim() || !gender) && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={loading || imageUploading || !name.trim() || !gender}
                        activeOpacity={0.85}
                    >
                        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    content: { padding: 20, paddingBottom: 40 },
    imageSection: { alignItems: 'center', marginBottom: 30 },
    imageWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', borderWeight: 1, borderColor: colors.border, position: 'relative' },
    image: { width: 100, height: 100, borderRadius: 50 },
    placeholderImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' },
    editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: colors.white },
    imageHint: { fontSize: 12, color: colors.gray, marginTop: 10, fontWeight: '500' },
    imageLoader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    formGroup: { marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 },
    input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.text },
    radioGroup: { flexDirection: 'row', gap: 12 },
    radioOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white },
    radioOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.gray, justifyContent: 'center', alignItems: 'center' },
    radioCircleSelected: { borderColor: colors.primary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    radioText: { fontSize: 14, fontWeight: '600', color: colors.gray },
    radioTextSelected: { color: colors.primary },
    saveBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
    saveBtnDisabled: { backgroundColor: colors.gray, opacity: 0.7 },
    saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
