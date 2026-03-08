import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';

const DEFAULT_FACILITIES = [
    { id: 'ac', label: 'A/C', icon: 'snow' },
    { id: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
    { id: 'parking', label: 'Parking', icon: 'car' },
    { id: 'beverages', label: 'Beverages', icon: 'cafe' },
    { id: 'tv', label: 'TV / Entertainment', icon: 'tv' },
    { id: 'card_payment', label: 'Card Payment', icon: 'card' },
    { id: 'wheelchair', label: 'Wheelchair Accessible', icon: 'body' },
    { id: 'music', label: 'Music', icon: 'musical-notes' },
];

export default function FacilitiesScreen({ navigation }) {
    const { formData, updateFormData } = useOnboarding();
    const [selectedFacilities, setSelectedFacilities] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Initialize from context if available
        if (formData.salonInfo?.facilities) {
            setSelectedFacilities(formData.salonInfo.facilities);
        }
    }, [formData.salonInfo?.facilities]);

    const handleToggleFacility = (facilityId) => {
        setSelectedFacilities(prev => {
            if (prev.includes(facilityId)) {
                return prev.filter(id => id !== facilityId);
            } else {
                return [...prev, facilityId];
            }
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateFormData('salonInfo', {
                ...formData.salonInfo,
                facilities: selectedFacilities
            });
            Alert.alert('Success', 'Facilities updated successfully.');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Could not save facilities. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Salon Facilities</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoCard}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="information" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.infoText}>
                        Select the amenities available at your salon. These will be displayed to customers on your profile.
                    </Text>
                </View>

                {DEFAULT_FACILITIES.map(facility => {
                    const isSelected = selectedFacilities.includes(facility.id);
                    return (
                        <TouchableOpacity
                            key={facility.id}
                            style={[styles.facilityItem, isSelected && styles.facilityItemSelected]}
                            onPress={() => handleToggleFacility(facility.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.facilityLeft}>
                                <View style={[styles.facilityIconBox, isSelected && styles.facilityIconBoxSelected]}>
                                    <Ionicons
                                        name={facility.icon}
                                        size={20}
                                        color={isSelected ? colors.primary : '#64748B'}
                                    />
                                </View>
                                <Text style={[styles.facilityLabel, isSelected && styles.facilityLabelSelected]}>
                                    {facility.label}
                                </Text>
                            </View>
                            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                            </View>
                        </TouchableOpacity>
                    );
                })}

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Facilities</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14,
        backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },

    content: { padding: 20 },
    infoCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.primary + '10',
        padding: 16, borderRadius: 12, marginBottom: 24,
    },
    iconCircle: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: colors.primary + '20',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    infoText: { flex: 1, fontSize: 13, color: '#334155', lineHeight: 20 },

    facilityItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    facilityItemSelected: {
        borderColor: colors.primary, backgroundColor: '#FFF',
        shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    facilityLeft: { flexDirection: 'row', alignItems: 'center' },
    facilityIconBox: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
        marginRight: 14,
    },
    facilityIconBoxSelected: { backgroundColor: colors.primary + '15' },
    facilityLabel: { fontSize: 15, fontWeight: '600', color: '#334155' },
    facilityLabelSelected: { color: colors.primary },

    checkbox: {
        width: 24, height: 24, borderRadius: 6,
        borderWidth: 2, borderColor: '#CBD5E1',
        justifyContent: 'center', alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: colors.primary, borderColor: colors.primary,
    },

    footer: {
        padding: 20, backgroundColor: '#FFF',
        borderTopWidth: 1, borderTopColor: '#F1F5F9',
    },
    saveBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 16, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
