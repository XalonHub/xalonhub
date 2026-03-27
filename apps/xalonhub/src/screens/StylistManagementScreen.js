import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, FlatList, Modal, TextInput,
    ActivityIndicator, Alert, ScrollView, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';
import { getStylists, addStylist, updateStylist, deleteStylist, getCatalogCategories } from '../services/api';
import { uploadFile, deleteFile } from '../services/uploadService';
import { CloudinaryResourceType } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function StylistManagementScreen() {
    const navigation = useNavigation();
    const { formData } = useOnboarding();
    const [stylists, setStylists] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentStylist, setCurrentStylist] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('Unisex');
    const [experience, setExperience] = useState('');
    const [bio, setBio] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const partnerId = await AsyncStorage.getItem('partnerId') || formData.partnerId;

            const [stylistRes, catRes] = await Promise.all([
                partnerId ? getStylists(partnerId) : Promise.resolve({ data: [] }),
                getCatalogCategories()
            ]);

            setStylists(stylistRes.data || []);
            // Merge global categories with salon specific ones to ensure they "show fully"
            const salonCats = formData.categories || [];
            // catRes.data is an array of objects { id, name, ... }, we need just the names
            const globalCats = (catRes.data || []).map(c => typeof c === 'string' ? c : c.name);
            const mergedCats = [...new Set([...salonCats, ...globalCats])];
            setAllCategories(mergedCats);
        } catch (error) {
            console.error('Error fetching initial data:', error);
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (stylist = null) => {
        if (stylist) {
            setIsEditing(true);
            setCurrentStylist(stylist);
            setName(stylist.name);
            setPhone(stylist.phone || '');
            setGender(stylist.gender || 'Unisex');
            setExperience(stylist.experience || '');
            setBio(stylist.bio || '');
            setProfileImage(stylist.profileImage || null);
            setSelectedCategories(stylist.categories || []);
        } else {
            setIsEditing(false);
            setCurrentStylist(null);
            setName('');
            setPhone('');
            setGender('Unisex');
            setExperience('');
            setBio('');
            setProfileImage(null);
            setSelectedCategories([]);
        }
        setModalVisible(true);
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Needed', 'We need access to your photos to upload a profile picture.');
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const localUri = result.assets[0].uri;
                setSaving(true);
                // If editing and there was an old image, we could delete it, 
                // but let's just upload the new one for now as per uploadService patterns
                const partnerId = await AsyncStorage.getItem('partnerId') || formData.partnerId;
                const remoteUrl = await uploadFile(
                    localUri, 
                    CloudinaryResourceType.STYLIST_PROFILE, 
                    currentStylist?.id || `new_${Date.now()}`, 
                    { partnerId }
                );
                if (remoteUrl) {
                    setProfileImage(remoteUrl);
                }

                setSaving(false);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
            setSaving(false);
        }
    };

    const toggleCategory = (cat) => {
        if (selectedCategories.includes(cat)) {
            setSelectedCategories(selectedCategories.filter(c => c !== cat));
        } else {
            setSelectedCategories([...selectedCategories, cat]);
        }
    };

    const handleSave = async () => {
        // Validation
        if (!name || name.trim().length < 2) {
            Alert.alert('Error', 'Please enter a valid stylist name');
            return;
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        if (phone.trim() && !phoneRegex.test(phone.trim())) {
            Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
            return;
        }

        if (!experience || !experience.trim()) {
            Alert.alert('Error', 'Please enter years of experience');
            return;
        }

        if (!selectedCategories || selectedCategories.length === 0) {
            Alert.alert('Error', 'Please select at least one specialization category');
            return;
        }

        if (!gender || gender === 'Unisex') { // Force a proper gender selection
            Alert.alert('Error', 'Please select stylist gender (Male, Female, or Other)');
            return;
        }

        try {
            setSaving(true);
            const partnerId = await AsyncStorage.getItem('partnerId') || formData.partnerId;
            const payload = {
                partnerId,
                name: name.trim(),
                phone: phone.trim(),
                gender,
                experience,
                bio,
                profileImage,
                categories: selectedCategories,
            };

            if (isEditing && currentStylist) {
                await updateStylist(currentStylist.id, payload);
            } else {
                await addStylist(payload);
            }

            setModalVisible(false);
            fetchInitialData();
        } catch (error) {
            console.error('Error saving stylist:', error);
            Alert.alert('Error', 'Failed to save stylist');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (stylist) => {
        Alert.alert(
            'Delete Stylist',
            `Are you sure you want to remove ${stylist.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (stylist.profileImage) await deleteFile(stylist.profileImage);
                            await deleteStylist(stylist.id);
                            fetchInitialData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete stylist');
                        }
                    }
                }
            ]
        );
    };

    const renderStylist = ({ item }) => (
        <View style={styles.premiumCard}>
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    {item.profileImage ? (
                        <Image source={{ uri: item.profileImage }} style={styles.stylistAvatar} />
                    ) : (
                        <View style={[styles.avatarFallback, { backgroundColor: item.gender === 'Female' ? '#FCE4ED' : item.gender === 'Male' ? '#DADBFA' : '#F1F5F9' }]}>
                            <Text style={[styles.avatarInitials, { color: item.gender === 'Female' ? '#D6336C' : item.gender === 'Male' ? '#4F46E5' : '#64748B' }]}>
                                {item.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <View style={[styles.statusIndicator, { backgroundColor: item.isActive ? '#10B981' : '#CBD5E1' }]} />
                </View>
                <View style={styles.headerInfo}>
                    <View style={styles.titleRow}>
                        <Text style={styles.stylistName} numberOfLines={1}>{item.name}</Text>
                        <View style={[styles.genderTag, { backgroundColor: item.gender === 'Female' ? '#FCE4ED' : item.gender === 'Male' ? '#DADBFA' : '#F1F5F9' }]}>
                            <Ionicons name={item.gender === 'Female' ? 'female' : item.gender === 'Male' ? 'male' : 'transgender'} size={12} color={item.gender === 'Female' ? '#D6336C' : item.gender === 'Male' ? '#4F46E5' : '#64748B'} />
                            <Text style={[styles.genderTagText, { color: item.gender === 'Female' ? '#D6336C' : item.gender === 'Male' ? '#4F46E5' : '#64748B' }]}>
                                {item.gender}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.metaRow}>
                        <Ionicons name="briefcase" size={14} color="#64748B" />
                        <Text style={styles.metaText}>{item.experience || 'Fresher'}</Text>
                        <View style={styles.metaDot} />
                        <Ionicons name="call" size={14} color="#64748B" />
                        <Text style={styles.metaText}>{item.phone || 'No Phone'}</Text>
                    </View>
                </View>
            </View>

            {item.bio ? (
                <Text style={styles.bioSnippet} numberOfLines={2}>{item.bio}</Text>
            ) : null}

            <View style={styles.cardFooter}>
                <View style={styles.categoryScroll}>
                    {item.categories.slice(0, 3).map((cat, idx) => (
                        <View key={idx} style={styles.refinedTag}>
                            <Text style={styles.refinedTagText}>{cat}</Text>
                        </View>
                    ))}
                    {item.categories.length > 3 && (
                        <View style={styles.moreTag}>
                            <Text style={styles.moreTagText}>+{item.categories.length - 3}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.iconCircle}>
                        <Ionicons name="pencil" size={18} color="#1E293B" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
                        <Ionicons name="trash" size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Stylist Management</Text>
                <TouchableOpacity style={styles.addNavBtn} onPress={() => handleOpenModal()}>
                    <Ionicons name="add" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={stylists}
                    keyExtractor={(item) => item.id}
                    renderItem={renderStylist}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="people" size={48} color="#CBD5E1" />
                            </View>
                            <Text style={styles.emptyTitle}>Your Team starts here</Text>
                            <Text style={styles.emptySub}>Add your professional stylists to enable customized booking options for your clients.</Text>
                            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => handleOpenModal()}>
                                <Text style={styles.emptyAddBtnText}>Add First Stylist</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalHeaderTitle}>{isEditing ? 'Edit Profile' : 'New Stylist'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {/* Profile Image Upload */}
                            <View style={styles.uploadSection}>
                                <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={saving}>
                                    {profileImage ? (
                                        <Image source={{ uri: profileImage }} style={styles.imagePreview} />
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <Ionicons name="camera" size={32} color="#94A3B8" />
                                            <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                                        </View>
                                    )}
                                    <View style={styles.editBadge}>
                                        <Ionicons name="camera" size={14} color="#FFF" />
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.uploadHint}>Professional photos build client trust</Text>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Full Name</Text>
                                <TextInput
                                    style={styles.inputStyle}
                                    placeholder="Enter full name"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Gender Specialization</Text>
                                <View style={styles.genderRow}>
                                    {['Male', 'Female', 'Other'].map((g) => (
                                        <TouchableOpacity
                                            key={g}
                                            style={[styles.genderOption, gender === g && styles.genderOptionActive]}
                                            onPress={() => setGender(g)}
                                        >
                                            <Ionicons
                                                name={g === 'Male' ? 'male' : g === 'Female' ? 'female' : 'transgender'}
                                                size={18}
                                                color={gender === g ? colors.primary : '#94A3B8'}
                                            />
                                            <Text style={[styles.genderOptionText, gender === g && styles.genderOptionTextActive]}>{g}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                                    <Text style={styles.formLabel}>Experience</Text>
                                    <TextInput
                                        style={styles.inputStyle}
                                        placeholder="e.g. 5 yrs"
                                        value={experience}
                                        onChangeText={setExperience}
                                    />
                                </View>
                                <View style={[styles.formGroup, { flex: 1.5 }]}>
                                    <Text style={styles.formLabel}>Phone (Optional)</Text>
                                    <TextInput
                                        style={styles.inputStyle}
                                        placeholder="Mobile number"
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Bio</Text>
                                <TextInput
                                    style={[styles.inputStyle, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                                    placeholder="Describe their expertise..."
                                    value={bio}
                                    onChangeText={setBio}
                                    multiline
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Specializations</Text>
                                <View style={styles.catsFlex}>
                                    {allCategories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.catChoice,
                                                selectedCategories.includes(cat) && styles.catChoiceActive
                                            ]}
                                            onPress={() => toggleCategory(cat)}
                                        >
                                            <Text style={[
                                                styles.catChoiceText,
                                                selectedCategories.includes(cat) && styles.catChoiceTextActive
                                            ]}>{cat}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                            <View style={{ height: 100 }} />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.primaryBtnText}>{isEditing ? 'Update Stylist' : 'Add Stylist'}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: '#F8FAFC' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5 },
    addNavBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: colors.primary + '15' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20, paddingBottom: 120 },

    // Premium Card Style
    premiumCard: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatarContainer: { position: 'relative', marginRight: 16 },
    stylistAvatar: { width: 60, height: 60, borderRadius: 30 },
    avatarFallback: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    avatarInitials: { fontSize: 24, fontWeight: '800' },
    statusIndicator: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#FFF' },
    headerInfo: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    stylistName: { fontSize: 18, fontWeight: '800', color: '#1E293B', flex: 1, marginRight: 8 },
    genderTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    genderTagText: { fontSize: 11, fontWeight: '700' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' },
    bioSnippet: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 16, fontStyle: 'italic' },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 16 },
    categoryScroll: { flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap', marginRight: 12 },
    refinedTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 4 },
    refinedTagText: { fontSize: 11, fontWeight: '600', color: '#475569' },
    moreTag: { backgroundColor: colors.primary + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 4 },
    moreTagText: { fontSize: 11, fontWeight: '700', color: colors.primary },
    cardActions: { flexDirection: 'row', gap: 10 },
    iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },

    // Empty State
    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
    emptySub: { fontSize: 15, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22, marginBottom: 30 },
    emptyAddBtn: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
    emptyAddBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    // Modal UI
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '92%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalHeaderTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    modalBody: { padding: 24 },
    uploadSection: { alignItems: 'center', marginBottom: 24 },
    imagePicker: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F8FAFC', borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', position: 'relative' },
    imagePreview: { width: '100%', height: '100%', borderRadius: 50 },
    imagePlaceholder: { alignItems: 'center' },
    imagePlaceholderText: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginTop: 4 },
    editBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
    uploadHint: { fontSize: 12, color: '#64748B', marginTop: 12, fontWeight: '500' },
    formGroup: { marginBottom: 20 },
    formLabel: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 10 },
    inputStyle: { backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1E293B', borderWidth: 1, borderColor: '#F1F5F9' },
    row: { flexDirection: 'row', alignItems: 'center' },
    genderRow: { flexDirection: 'row', gap: 12 },
    genderOption: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'center' },
    genderOptionActive: { backgroundColor: colors.primary + '10', borderColor: colors.primary },
    genderOptionText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    genderOptionTextActive: { color: colors.primary, fontWeight: '800' },
    catsFlex: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    catChoice: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
    catChoiceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catChoiceText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    catChoiceTextActive: { color: '#FFF' },
    modalFooter: { padding: 24, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FFF' },
    primaryBtn: { backgroundColor: colors.primary, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
    primaryBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' }
});
