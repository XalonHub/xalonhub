import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    SafeAreaView, StatusBar, Alert, ActivityIndicator, ScrollView,
    Modal, FlatList
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LOCATIONS } from '../../constants/locations';

export default function CompleteProfileScreen({ navigation }) {
    const { auth, login } = useAuth();
    const [name, setName] = useState(auth?.customerProfile?.name || '');
    const [gender, setGender] = useState(auth?.customerProfile?.gender || '');

    // Address fields
    const defaultAddr = auth?.customerProfile?.addresses?.find(a => a.isDefault) || auth?.customerProfile?.addresses?.[0];
    const [label, setLabel] = useState(defaultAddr?.label || 'Home');
    const [addressLine, setAddressLine] = useState(defaultAddr?.addressLine || '');
    const [state, setState] = useState(defaultAddr?.state || '');
    const [district, setDistrict] = useState(defaultAddr?.district || '');
    const [city, setCity] = useState(defaultAddr?.city || '');
    const [pincode, setPincode] = useState(defaultAddr?.pincode || '');

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Dropdown state
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState(null); // 'state' | 'district'

    const validate = () => {
        let newErrors = {};
        if (!name.trim()) newErrors.name = 'Required';
        if (!gender) newErrors.gender = 'Required';
        if (!addressLine.trim()) newErrors.addressLine = 'Required';
        if (!state) newErrors.state = 'Required';
        if (!district) newErrors.district = 'Required';
        if (!city.trim()) newErrors.city = 'Required';
        if (pincode && !/^\d{6}$/.test(pincode)) newErrors.pincode = 'Invalid';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) {
            Alert.alert('Missing Info', 'Please fill in all mandatory fields correctly.');
            return;
        }

        setLoading(true);
        try {
            // 1. Update Profile (Name & Gender)
            const updatedProfile = await api.updateCustomerProfile(auth.customerId, {
                name: name.trim(),
                gender
            });

            if (!updatedProfile || updatedProfile.error) throw new Error('Profile update failed');

            // 2. Add or Update Address
            const addrPayload = {
                label,
                addressLine: addressLine.trim(),
                state,
                district,
                city: city.trim(),
                pincode: pincode.trim() || null,
                isDefault: true
            };

            if (defaultAddr?.id) {
                await api.updateSavedAddress(auth.customerId, defaultAddr.id, addrPayload);
            } else {
                await api.addSavedAddress(auth.customerId, addrPayload);
            }

            // 3. Refresh profile and context
            const finalProfile = await api.getCustomerProfile(auth.customerId);
            await login({
                token: auth.token,
                user: { id: auth.userId, phone: auth.phone, role: auth.role },
                customerProfile: finalProfile,
            });

            navigation.goBack();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to save details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const openPicker = (type) => {
        if (type === 'district' && !state) {
            Alert.alert('Select State', 'Please select a state first.');
            return;
        }
        setPickerType(type);
        setPickerVisible(true);
    };

    const handlePickerSelect = (val) => {
        if (pickerType === 'state') {
            setState(val);
            setDistrict(''); // Reset district when state changes
        } else {
            setDistrict(val);
        }
        setPickerVisible(false);
    };

    const genders = ['Male', 'Female'];
    const states = Object.keys(LOCATIONS);
    const districts = state ? LOCATIONS[state] : [];

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Complete Your Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.description}>We need a few more details to ensure a smooth service experience with our experts.</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Info</Text>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Full Name {errors.name && <Text style={styles.errorText}>*</Text>}</Text>
                        <TextInput
                            style={[styles.input, errors.name && styles.inputError]}
                            placeholder="Enter your name"
                            value={name}
                            onChangeText={(t) => { setName(t); setErrors({ ...errors, name: null }); }}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Gender {errors.gender && <Text style={styles.errorText}>*</Text>}</Text>
                        <View style={styles.radioGroup}>
                            {genders.map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[styles.radioOption, gender === g && styles.radioOptionSelected, errors.gender && styles.inputError]}
                                    onPress={() => { setGender(g); setErrors({ ...errors, gender: null }); }}
                                >
                                    <View style={[styles.radioCircle, gender === g && styles.radioCircleSelected]}>
                                        {gender === g && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={[styles.radioText, gender === g && styles.radioTextSelected]}>{g}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Primary Address</Text>

                    <Text style={styles.label}>Address Label</Text>
                    <View style={styles.labelRow}>
                        {['Home', 'Work', 'Other'].map((l) => (
                            <TouchableOpacity
                                key={l}
                                style={[styles.labelChip, label === l && styles.labelChipActive]}
                                onPress={() => setLabel(l)}
                            >
                                <MaterialIcons
                                    name={l === 'Home' ? 'home' : l === 'Work' ? 'work' : 'location-on'}
                                    size={16}
                                    color={label === l ? colors.white : colors.gray}
                                />
                                <Text style={[styles.labelChipText, label === l && { color: colors.white }]}>{l}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Address Line {errors.addressLine && <Text style={styles.errorText}>*</Text>}</Text>
                        <TextInput
                            style={[styles.input, errors.addressLine && styles.inputError]}
                            placeholder="Flat, Street, Building..."
                            value={addressLine}
                            onChangeText={(t) => { setAddressLine(t); setErrors({ ...errors, addressLine: null }); }}
                            multiline
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>State {errors.state && <Text style={styles.errorText}>*</Text>}</Text>
                            <TouchableOpacity
                                style={[styles.input, styles.pickerInput, errors.state && styles.inputError]}
                                onPress={() => openPicker('state')}
                            >
                                <Text style={state ? styles.inputText : styles.placeholderText}>
                                    {state || 'Select State'}
                                </Text>
                                <MaterialIcons name="arrow-drop-down" size={24} color={colors.gray} />
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>District {errors.district && <Text style={styles.errorText}>*</Text>}</Text>
                            <TouchableOpacity
                                style={[styles.input, styles.pickerInput, errors.district && styles.inputError]}
                                onPress={() => openPicker('district')}
                                disabled={!state}
                            >
                                <Text style={district ? styles.inputText : styles.placeholderText}>
                                    {district || 'Select District'}
                                </Text>
                                <MaterialIcons name="arrow-drop-down" size={24} color={colors.gray} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>City/Area {errors.city && <Text style={styles.errorText}>*</Text>}</Text>
                            <TextInput
                                style={[styles.input, errors.city && styles.inputError]}
                                placeholder="City or locality"
                                value={city}
                                onChangeText={(t) => { setCity(t); setErrors({ ...errors, city: null }); }}
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Pincode {errors.pincode && <Text style={styles.errorText}>*</Text>}</Text>
                            <TextInput
                                style={[styles.input, errors.pincode && styles.inputError]}
                                placeholder="6-digit"
                                value={pincode}
                                onChangeText={(t) => { setPincode(t); setErrors({ ...errors, pincode: null }); }}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Save & Continue</Text>}
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Picker Modal */}
            <Modal visible={pickerVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select {pickerType === 'state' ? 'State' : 'District'}</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <MaterialIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={pickerType === 'state' ? states : districts}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.pickerOption}
                                    onPress={() => handlePickerSelect(item)}
                                >
                                    <Text style={styles.pickerOptionText}>{item}</Text>
                                    {(pickerType === 'state' ? state === item : district === item) && (
                                        <MaterialIcons name="check" size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    content: { padding: 20 },
    description: { fontSize: 14, color: colors.gray, marginBottom: 24, lineHeight: 20 },
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: colors.primary, paddingLeft: 10 },
    formGroup: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: '700', color: colors.gray, textTransform: 'uppercase', marginBottom: 8 },
    input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.grayBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: colors.text },
    inputError: { borderColor: colors.error },
    errorText: { color: colors.error, fontSize: 12 },
    row: { flexDirection: 'row', gap: 12 },
    radioGroup: { flexDirection: 'row', gap: 12 },
    radioOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderWidth: 1, borderColor: colors.grayBorder, borderRadius: 12, backgroundColor: colors.white },
    radioOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.gray, justifyContent: 'center', alignItems: 'center' },
    radioCircleSelected: { borderColor: colors.primary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    radioText: { fontSize: 14, fontWeight: '600', color: colors.gray },
    radioTextSelected: { color: colors.primary },
    pickerInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    inputText: { fontSize: 15, color: colors.text },
    placeholderText: { fontSize: 15, color: colors.gray },
    saveBtn: { backgroundColor: colors.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    saveBtnDisabled: { opacity: 0.7 },
    saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: '70%' },
    modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    pickerOption: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    pickerOptionText: { fontSize: 16, color: colors.text },
});
