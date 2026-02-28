import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    StatusBar, Switch, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const LABELS = ['Home', 'Work', 'Other'];

export default function EditAddressScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { auth } = useAuth();
    const existing = route.params?.address || null;

    const [label, setLabel] = useState(existing?.label || 'Home');
    const [addressLine, setAddressLine] = useState(existing?.addressLine || '');
    const [city, setCity] = useState(existing?.city || '');
    const [pincode, setPincode] = useState(existing?.pincode || '');
    const [isDefault, setIsDefault] = useState(existing?.isDefault || false);
    const [saving, setSaving] = useState(false);

    const isEdit = !!existing;

    const handleSave = async () => {
        if (!addressLine.trim() || !city.trim()) {
            Alert.alert('Missing fields', 'Please fill in the address line and city.');
            return;
        }
        setSaving(true);
        try {
            const payload = { label, addressLine: addressLine.trim(), city: city.trim(), pincode: pincode.trim() || null, isDefault };
            if (isEdit) {
                await api.updateSavedAddress(auth.customerId, existing.id, payload);
            } else {
                await api.addSavedAddress(auth.customerId, payload);
            }
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', 'Failed to save address. Please try again.');
        } finally {
            setSaving(false);
        }
    };

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
                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput
                    style={styles.input}
                    value={addressLine}
                    onChangeText={setAddressLine}
                    placeholder="Flat, building, street…"
                    placeholderTextColor={colors.gray}
                    multiline
                />

                {/* City */}
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                    style={styles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="City"
                    placeholderTextColor={colors.gray}
                />

                {/* Pincode */}
                <Text style={styles.fieldLabel}>Pincode (optional)</Text>
                <TextInput
                    style={styles.input}
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
    input: { borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: colors.text, backgroundColor: colors.white },
    defaultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, backgroundColor: colors.white, borderRadius: 14, padding: 16 },
    defaultLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
    saveBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
    saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
