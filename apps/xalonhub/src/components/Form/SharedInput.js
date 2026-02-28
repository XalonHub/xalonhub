import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useController, useFormContext } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function SharedInput({
    name, // The field name mapping to the Yup schema
    label,
    placeholder,
    keyboardType = 'default',
    secureTextEntry = false,
    maxLength,
    multiline = false,
    iconName,
    onIconPress,
    containerStyle,
    returnKeyType,
    nextField, // The name of the field to focus when 'Next' is pressed
    editable = true,
    valueTransform = (v) => v // Optional transform for formatting (e.g., date DD/MM/YYYY)
}) {
    const { control, setFocus } = useFormContext();
    const { field, fieldState } = useController({ name, control });

    const handleSubmitEditing = () => {
        if (nextField) {
            setFocus(nextField);
        }
    };

    const handleChangeText = (text) => {
        // Strip leading whitespace by default for robustness
        const cleaned = text.replace(/^\s+/, '');
        field.onChange(valueTransform(cleaned));
    };

    return (
        <View style={[styles.inputGroup, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[
                styles.inputWrapper,
                fieldState.invalid && styles.inputWrapperError,
                !editable && styles.inputWrapperDisabled
            ]}>
                <TextInput
                    ref={field.ref}
                    style={[styles.input, !editable && styles.inputDisabled]}
                    value={field.value}
                    onChangeText={handleChangeText}
                    onBlur={field.onBlur}
                    placeholder={placeholder}
                    placeholderTextColor="#A0AEC0"
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry}
                    maxLength={maxLength}
                    multiline={multiline}
                    returnKeyType={returnKeyType || (nextField ? 'next' : 'done')}
                    onSubmitEditing={handleSubmitEditing}
                    blurOnSubmit={!nextField}
                    editable={editable}
                />
                {iconName && (
                    <TouchableOpacity
                        onPress={onIconPress}
                        style={styles.iconBtn}
                        disabled={!onIconPress}
                        activeOpacity={onIconPress ? 0.7 : 1}
                    >
                        <Ionicons name={iconName} size={20} color="#94A3B8" />
                    </TouchableOpacity>
                )}
            </View>
            {fieldState.invalid && (
                <Text style={styles.errorText}>{fieldState.error?.message}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    inputGroup: { gap: 6, marginBottom: 16 },
    label: { fontSize: 13, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
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
    inputWrapperDisabled: {
        backgroundColor: '#f1f5f9',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A',
        paddingVertical: 12, // Necessary for multiline inputs
    },
    inputDisabled: {
        color: '#64748B'
    },
    iconBtn: { padding: 4, marginLeft: 8 },
    errorText: { fontSize: 12, color: colors.error, marginTop: 4, marginLeft: 4 },
});
