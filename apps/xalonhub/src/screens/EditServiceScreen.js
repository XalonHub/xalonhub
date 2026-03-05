import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, TextInput, ScrollView, Modal, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '../constants/servicesData';
import { useOnboarding } from '../context/OnboardingContext';

export default function EditServiceScreen({ route, navigation }) {
    const { formData, updateFormData } = useOnboarding();
    const { service, gender = 'Male', isNew = false } = route.params || {};

    const [name, setName] = useState(isNew ? '' : (service?.name || ''));
    const [category, setCategory] = useState(isNew ? 'Hair & Styling' : (service?.category || 'Hair & Styling'));
    const [durationHrs, setDurationHrs] = useState(isNew ? '0' : Math.floor((service?.duration || 30) / 60).toString());
    const [durationMins, setDurationMins] = useState(isNew ? '30' : ((service?.duration || 30) % 60).toString());
    const [price, setPrice] = useState(isNew ? '' : (service?.price || service?.defaultPrice || '').toString());
    const [specialPrice, setSpecialPrice] = useState(isNew ? '' : (service?.specialPrice?.toString() || ''));
    const [maxQuantity, setMaxQuantity] = useState(isNew ? '3' : (service?.maxQuantity?.toString() || '3'));
    const [description, setDescription] = useState(isNew ? '' : (service?.description || ''));
    const [priceType, setPriceType] = useState('Fixed');

    const [showCategoryModal, setShowCategoryModal] = useState(false);

    const handleSave = async () => {
        // Safe parsing to prevent NaN crashes
        const dh = parseInt(durationHrs) || 0;
        const dm = parseInt(durationMins) || 0;
        const totalMinutes = dh * 60 + dm;

        const basePrice = parseFloat(price) || 0;
        const discPrice = specialPrice ? parseFloat(specialPrice) : null;

        if (name.trim() === '') {
            Alert.alert('Error', 'Please enter a service name.');
            return;
        }

        if (basePrice <= 0) {
            Alert.alert('Error', 'Price must be greater than 0.');
            return;
        }

        if (discPrice !== null) {
            if (discPrice >= basePrice) {
                Alert.alert('Error', 'Special price must be less than the regular price.');
                return;
            }
            if (discPrice < basePrice * 0.3) {
                Alert.alert('Error', 'Max 70% discount allowed. Special price is too low.');
                return;
            }
        }

        const payload = {
            serviceId: service?.serviceId || service?.id || `custom_${Date.now()}`,
            id: service?.id || service?.serviceId || `custom_${Date.now()}`,
            name: name.trim(),
            category,
            duration: totalMinutes,
            price: basePrice,
            specialPrice: discPrice,
            description: description.trim(),
            priceType: 'Fixed',
            maxQuantity: parseInt(maxQuantity) || 3,
            isCustom: isNew ? true : (service?.isCustom || false)
        };

        const currentServices = formData.salonServices || [];
        let newServices;

        const existingIdx = currentServices.findIndex(s =>
            (s.id && s.id === payload.id) ||
            (s.serviceId && s.serviceId === payload.serviceId)
        );

        if (existingIdx >= 0) {
            newServices = [...currentServices];
            newServices[existingIdx] = payload;
        } else {
            newServices = [...currentServices, payload];
        }

        await updateFormData('salonServices', newServices);
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isNew ? `Add ${gender} Services` : `Edit ${gender} Services`}</Text>
            </View>

            <View style={styles.indigoLine} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Service Name */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Service Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Hair Styling - (Short Hair)"
                        placeholderTextColor={colors.textLight}
                    />
                </View>

                {/* Category */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Service Category</Text>
                    <TouchableOpacity style={styles.picker} onPress={() => setShowCategoryModal(true)}>
                        <Text style={styles.pickerText}>{category}</Text>
                        <Ionicons name="swap-vertical" size={24} color={colors.textLight} />
                    </TouchableOpacity>
                </View>

                {/* Duration */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Service Duration (Hrs/Min)</Text>
                    <View style={styles.priceRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                            <View style={styles.priceInputRow}>
                                <TextInput
                                    style={styles.priceInput}
                                    value={durationHrs}
                                    onChangeText={setDurationHrs}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                                <Text style={styles.unitText}>Hr</Text>
                            </View>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                            <View style={styles.priceInputRow}>
                                <TextInput
                                    style={styles.priceInput}
                                    value={durationMins}
                                    onChangeText={setDurationMins}
                                    keyboardType="numeric"
                                    placeholder="30"
                                />
                                <Text style={styles.unitText}>Min</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Pricing */}
                <Text style={styles.sectionLabel}>Pricing</Text>

                <View style={styles.inputGroup}>
                    <View style={styles.priceInputRow}>
                        <Text style={styles.currencyPrefix}>₹</Text>
                        <TextInput
                            style={styles.priceInput}
                            value={price}
                            onChangeText={setPrice}
                            placeholder="Price"
                            placeholderTextColor={colors.textLight}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* Special Price */}
                <View style={styles.inputGroup}>
                    <View style={styles.priceInputRow}>
                        <Text style={styles.currencyPrefix}>₹</Text>
                        <TextInput
                            style={styles.priceInput}
                            value={specialPrice}
                            onChangeText={setSpecialPrice}
                            placeholder="Special Price"
                            placeholderTextColor={colors.textLight}
                            keyboardType="numeric"
                        />
                    </View>
                    <Text style={styles.note}>Note : Max 70% Special Discount Allowed.</Text>
                </View>

                {/* Max Quantity */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Max. Quantity</Text>
                    <View style={styles.priceInputRow}>
                        <TextInput
                            style={styles.priceInput}
                            value={maxQuantity}
                            onChangeText={setMaxQuantity}
                            keyboardType="numeric"
                            placeholder="3"
                        />
                    </View>
                </View>

                {/* Service Description */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Service Description</Text>
                    <View style={styles.descriptionContainer}>
                        <TextInput
                            style={styles.descriptionInput}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="e.g. Including Shampoo, Conditioner..."
                            placeholderTextColor={colors.textLight}
                            multiline
                        />
                        {description.length > 0 && (
                            <TouchableOpacity onPress={() => setDescription('')} style={styles.clearBtn}>
                                <Ionicons name="close-circle" size={20} color={colors.textLight} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                {/* Save Button */}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>Save Service</Text>
                </TouchableOpacity>
            </View>

            {/* Category Modal */}
            <PickerModal
                visible={showCategoryModal}
                title="Select Category"
                options={CATEGORIES.map(c => c.name)}
                onSelect={setCategory}
                onClose={() => setShowCategoryModal(false)}
            />
        </SafeAreaView>
    );
}

// ─── Simple Picker Modal Component ──────────────────────────────────────────────
function PickerModal({ visible, title, options, onSelect, onClose }) {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={modalStyles.overlay}>
                <View style={modalStyles.sheet}>
                    <View style={modalStyles.handle} />
                    <Text style={modalStyles.title}>{title}</Text>
                    <ScrollView>
                        {options.map((opt) => (
                            <TouchableOpacity key={opt} style={modalStyles.option} onPress={() => { onSelect(opt); onClose(); }}>
                                <Text style={modalStyles.optionText}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
                        <Text style={modalStyles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const modalStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, maxHeight: '70%',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 16 },
    title: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 12, textAlign: 'center' },
    option: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    optionText: { fontSize: 16, color: '#1E293B', textAlign: 'center' },
    cancelBtn: { marginTop: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center' },
    cancelText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingBottom: 12,
    },
    backBtn: { padding: 5, marginLeft: -5 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center', marginRight: 24 },
    indigoLine: { height: 3, backgroundColor: colors.primary },
    scrollContent: { padding: 20, gap: 15 },
    inputGroup: { marginBottom: 10 },
    label: { fontSize: 13, color: colors.textLight, marginBottom: 8, fontWeight: '500' },
    sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 5 },
    priceRow: { flexDirection: 'row', gap: 12 },
    input: {
        borderWidth: 1, borderColor: colors.grayBorder, borderRadius: 8,
        paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: colors.text
    },
    picker: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderColor: colors.grayBorder, borderRadius: 8,
        paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#FFF'
    },
    pickerText: { fontSize: 16, color: colors.text },
    priceInputRow: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: colors.grayBorder, borderRadius: 8,
        paddingHorizontal: 15, backgroundColor: '#FFF'
    },
    currencyPrefix: { fontSize: 16, color: colors.text, marginRight: 10 },
    unitText: { fontSize: 14, color: colors.textLight, marginLeft: 5 },
    priceInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.text },
    note: { fontSize: 12, color: colors.error, marginTop: 4, fontWeight: '500' },
    descriptionContainer: {
        flexDirection: 'row', borderWidth: 1, borderColor: colors.grayBorder, borderRadius: 8,
        paddingHorizontal: 15, paddingVertical: 12, minHeight: 120, alignItems: 'flex-start'
    },
    descriptionInput: { flex: 1, fontSize: 16, color: colors.text, textAlignVertical: 'top' },
    clearBtn: { padding: 2 },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.grayBorder },
    saveBtn: {
        backgroundColor: colors.black, paddingVertical: 16,
        borderRadius: 12, alignItems: 'center'
    },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});
