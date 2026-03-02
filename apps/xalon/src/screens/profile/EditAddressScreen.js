import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    StatusBar, Switch, Alert, ActivityIndicator, ScrollView,
    Modal, FlatList
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { LOCATIONS } from '../../constants/locations';

const LABELS = ['Home', 'Work', 'Other'];

export default function EditAddressScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { auth, login } = useAuth();
    const existing = route.params?.address || null;

    const [label, setLabel] = useState(existing?.label || 'Home');
    const [addressLine, setAddressLine] = useState(existing?.addressLine || '');
    const [state, setState] = useState(existing?.state || '');
    const [district, setDistrict] = useState(existing?.district || '');
    const [city, setCity] = useState(existing?.city || '');
    const [pincode, setPincode] = useState(existing?.pincode || '');
    const [isDefault, setIsDefault] = useState(existing?.isDefault || false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // Dropdown state
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState(null); // 'state' | 'district'

    const isEdit = !!existing;

    const validate = () => {
        let newErrors = {};
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
            Alert.alert('Missing Info', 'Please fill in all mandatory fields.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                label,
                addressLine: addressLine.trim(),
                state,
                district,
                city: city.trim(),
                pincode: pincode.trim() || null,
                isDefault
            };
            if (isEdit) {
                await api.updateSavedAddress(auth.customerId, existing.id, payload);
            } else {
                await api.addSavedAddress(auth.customerId, payload);
            }

            // Refresh profile in context to show new address immediately
            const updatedProfile = await api.getCustomerProfile(auth.customerId);
            await login({
                token: auth.token,
                user: { id: auth.userId, phone: auth.phone, role: auth.role },
                customerProfile: updatedProfile,
            });

            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', 'Failed to save address. Please try again.');
        } finally {
            setSaving(false);
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
            setDistrict('');
        } else {
            setDistrict(val);
        }
        setPickerVisible(false);
    };

    const states = Object.keys(LOCATIONS);
    const districts = state ? LOCATIONS[state] : [];

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? 'Edit Address' : 'Add Address'}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Label picker */}
                <Text style={styles.fieldLabel}>Label</Text>
                <View style={styles.labelRow}>
                    {LABELS.map((l) => (
                        <TouchableOpacity
                            key={l}
                            style={[styles.labelChip, label === l && styles.labelChipActive]}
                            onPress={() => setLabel(l)}
                            activeOpacity={0.8}
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

                {/* Address line */}
                <Text style={styles.fieldLabel}>Address {errors.addressLine && <Text style={styles.errorText}>*</Text>}</Text>
                <TextInput
                    style={[styles.input, errors.addressLine && styles.inputError]}
                    value={addressLine}
                    onChangeText={setAddressLine}
                    placeholder="Flat, building, street…"
                    placeholderTextColor={colors.gray}
                    multiline
                />

                {/* State Dropdown */}
                <Text style={styles.fieldLabel}>State {errors.state && <Text style={styles.errorText}>*</Text>}</Text>
                <TouchableOpacity
                    style={[styles.input, styles.pickerInput, errors.state && styles.inputError]}
                    onPress={() => openPicker('state')}
                >
                    <Text style={state ? styles.inputText : styles.placeholderText}>
                        {state || 'Select State'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color={colors.gray} />
                </TouchableOpacity>

                {/* District Dropdown */}
                <Text style={styles.fieldLabel}>District {errors.district && <Text style={styles.errorText}>*</Text>}</Text>
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

                {/* City */}
                <Text style={styles.fieldLabel}>City/Area {errors.city && <Text style={styles.errorText}>*</Text>}</Text>
                <TextInput
                    style={[styles.input, errors.city && styles.inputError]}
                    value={city}
                    onChangeText={setCity}
                    placeholder="City or locality"
                    placeholderTextColor={colors.gray}
                />

                {/* Pincode */}
                <Text style={styles.fieldLabel}>Pincode {errors.pincode && <Text style={styles.errorText}>*</Text>}</Text>
                <TextInput
                    style={[styles.input, errors.pincode && styles.inputError]}
                    value={pincode}
                    onChangeText={setPincode}
                    placeholder="6-digit pincode"
                    placeholderTextColor={colors.gray}
                    keyboardType="number-pad"
                    maxLength={6}
                />

                {/* Default toggle */}
                <View style={styles.defaultRow}>
                    <Text style={styles.defaultLabel}>Set as default address</Text>
                    <Switch
                        value={isDefault}
                        onValueChange={setIsDefault}
                        trackColor={{ true: colors.primary, false: colors.grayBorder }}
                        thumbColor={colors.white}
                    />
                </View>

                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                    {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Add Address'}</Text>}
                </TouchableOpacity>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
    scroll: { flex: 1, padding: 20 },
    fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.gray, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
    labelRow: { flexDirection: 'row', gap: 10 },
    labelChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: colors.grayBorder },
    labelChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    labelChipText: { fontSize: 13, fontWeight: '700', color: colors.gray },
    input: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: colors.text },
    inputError: { borderColor: colors.error },
    errorText: { color: colors.error, fontSize: 12 },
    pickerInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    inputText: { fontSize: 15, color: colors.text },
    placeholderText: { fontSize: 15, color: colors.gray },
    defaultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, backgroundColor: colors.white, borderRadius: 14, padding: 16 },
    defaultLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
    saveBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
    saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: '70%' },
    modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    pickerOption: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    pickerOptionText: { fontSize: 16, color: colors.text },
});
