import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    StatusBar, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const RELATIONSHIPS = [
    'Wife', 'Husband', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Friend', 'Other'
];

export default function AddEditGuestScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { auth } = useAuth();
    const guest = route.params?.guest;

    const [name, setName] = useState(guest?.name || '');
    const [mobileNumber, setMobileNumber] = useState(guest?.mobileNumber || '');
    const [relationship, setRelationship] = useState(guest?.relationship || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter guest name.');
            return;
        }

        setLoading(true);
        try {
            if (guest) {
                await api.updateGuest(auth.customerId, guest.id, { name, mobileNumber, relationship });
            } else {
                await api.addGuest(auth.customerId, { name, mobileNumber, relationship });
            }
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', 'Failed to save guest profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{guest ? 'Edit Guest' : 'Add New Guest'}</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                        <Text style={styles.saveText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Jane Doe"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mobile Number (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="10-digit mobile number"
                        value={mobileNumber}
                        onChangeText={setMobileNumber}
                        keyboardType="phone-pad"
                        maxLength={10}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Relationship (Optional)</Text>
                    <View style={styles.chipsRow}>
                        {RELATIONSHIPS.map((rel) => (
                            <TouchableOpacity
                                key={rel}
                                style={[
                                    styles.chip,
                                    relationship === rel && styles.chipActive
                                ]}
                                onPress={() => setRelationship(rel)}
                            >
                                <Text style={[
                                    styles.chipText,
                                    relationship === rel && styles.chipTextActive
                                ]}>{rel}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.white },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
    saveText: { fontSize: 16, fontWeight: '700', color: colors.primary },
    scroll: { flex: 1 },
    content: { padding: 20 },
    inputGroup: { marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '700', color: colors.gray, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.text, borderWidth: 1.5, borderColor: colors.grayBorder },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.grayBorder },
    chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    chipText: { fontSize: 14, fontWeight: '600', color: colors.gray },
    chipTextActive: { color: colors.primary, fontWeight: '700' },
});
