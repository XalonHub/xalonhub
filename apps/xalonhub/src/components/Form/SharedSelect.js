import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useController, useFormContext } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function SharedSelect({
    name,
    label,
    placeholder,
    options = [],
    containerStyle,
    onValueChange
}) {
    const { control } = useFormContext();
    const { field, fieldState } = useController({ name, control });
    const [showModal, setShowModal] = useState(false);

    const handleSelect = (val) => {
        field.onChange(val);
        if (onValueChange) onValueChange(val);
        setShowModal(false);
    };

    const displayValue = field.value || placeholder;

    return (
        <View style={[styles.inputGroup, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TouchableOpacity
                style={[
                    styles.inputWrapper,
                    fieldState.invalid && styles.inputWrapperError
                ]}
                activeOpacity={0.7}
                onPress={() => setShowModal(true)}
            >
                <Text style={[styles.inputText, !field.value && styles.placeholderText]}>
                    {displayValue}
                </Text>
                <Ionicons name="chevron-down" size={24} color="#94A3B8" />
            </TouchableOpacity>

            {fieldState.invalid && (
                <Text style={styles.errorText}>{fieldState.error?.message}</Text>
            )}

            <Modal visible={showModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
                        {options.map((opt, idx) => {
                            const val = typeof opt === 'string' ? opt : opt.value;
                            const lbl = typeof opt === 'string' ? opt : opt.label;
                            return (
                                <TouchableOpacity key={String(idx)} style={styles.modalOption} onPress={() => handleSelect(val)}>
                                    <Text style={[
                                        styles.modalOptionText,
                                        field.value === val && styles.modalOptionActive
                                    ]}>{lbl}</Text>
                                    {field.value === val && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            );
                        })}
                        <TouchableOpacity style={styles.modalCancel} onPress={() => setShowModal(false)}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    inputGroup: { gap: 6, marginBottom: 16 },
    label: { fontSize: 13, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
        minHeight: 52,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
        elevation: 1,
    },
    inputWrapperError: {
        borderColor: colors.error,
        backgroundColor: '#FEF2F2',
    },
    inputText: { flex: 1, fontSize: 16, color: '#0F172A' },
    placeholderText: { color: '#A0AEC0' },
    errorText: { fontSize: 12, color: colors.error, marginTop: 4, marginLeft: 4 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 16, textAlign: 'center' },
    modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalOptionText: { fontSize: 16, color: '#0F172A' },
    modalOptionActive: { color: colors.primary, fontWeight: '600' },
    modalCancel: { marginTop: 16, paddingVertical: 16 },
    modalCancelText: { fontSize: 16, color: '#EF4444', textAlign: 'center', fontWeight: 'bold' }
});
