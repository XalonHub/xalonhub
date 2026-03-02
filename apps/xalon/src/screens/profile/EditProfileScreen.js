import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    SafeAreaView, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function EditProfileScreen({ route, navigation }) {
    const { auth, login } = useAuth();
    const [name, setName] = useState('');
    const [gender, setGender] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!auth?.customerId) return;
            try {
                const data = await api.getCustomerProfile(auth.customerId);
                if (data && !data.error) {
                    setName(data.name || '');
                    setGender(data.gender || '');
                }
            } catch (err) { }
        };
        fetchProfile();
    }, [auth?.customerId]);

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
            const updatedProfile = await api.updateCustomerProfile(auth.customerId, { name: name.trim(), gender });
            if (updatedProfile && !updatedProfile.error) {
                // Update local auth context if needed
                await login({
                    token: auth.token,
                    user: auth.user,
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

            <View style={styles.content}>
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
                    disabled={loading || !name.trim() || !gender}
                    activeOpacity={0.85}
                >
                    {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    content: { padding: 20 },
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
