import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../context/OnboardingContext';
import { colors } from '../theme/colors';
import { Image } from 'react-native';

// ─── Business Types ───────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
    {
        id: 'unisex',
        label: 'Unisex\nSalon',
        image: require('../../assets/illustrations/unisex_salon.png'),
    },
    {
        id: 'beauty',
        label: 'Beauty\nParlour',
        image: require('../../assets/illustrations/beauty_parlour.png'),
    },
    {
        id: 'mens',
        label: "Men's\nParlour",
        image: require('../../assets/illustrations/mens_parlour.png'),
    },
];

// ─── Illustration Cluster ─────────────────────────────────────────────────────
function IllustrationCluster({ image, id }) {
    const [error, setError] = useState(false);

    return (
        <View style={illustration.container}>
            {error ? (
                <View style={illustration.errorPlaceholder}>
                    <Text style={illustration.errorText}>!</Text>
                </View>
            ) : (
                <Image
                    source={image}
                    style={illustration.image}
                    resizeMode="cover"
                    onError={(e) => {
                        console.error(`Image load error for ${id}:`, e.nativeEvent.error);
                        setError(true);
                    }}
                />
            )}
        </View>
    );
}

const illustration = StyleSheet.create({
    container: {
        width: 120,
        height: 120,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#F1F5F9', // Fallback gray
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    errorPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 24,
        fontWeight: 'bold',
    },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SalonCategoryScreen({ navigation }) {
    const { formData, updateFormData } = useOnboarding();
    const [selected, setSelected] = useState(null);

    const handleContinue = async () => {
        if (selected) {
            await updateFormData('salonInfo', { ...formData.salonInfo, businessType: selected });
            await updateFormData('lastScreen', 'SalonBasicInfo');
            navigation.navigate('SalonBasicInfo');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <View style={styles.headerAccent} />
                    <Text style={styles.headerTitle}>Category</Text>
                </View>
                <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.navigate('Login')}>
                    <Ionicons name="log-out-outline" size={20} color="#64748B" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.subtitle}>Knock knock, Choose your Business Type</Text>

                {BUSINESS_TYPES.map((item) => {
                    const isSelected = selected === item.id;
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.card, isSelected && styles.cardSelected]}
                            onPress={() => setSelected(item.id)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                                {item.label}
                            </Text>
                            <IllustrationCluster image={item.image} id={item.id} />
                            {isSelected && (
                                <View style={styles.checkBadge}>
                                    <Text style={styles.checkText}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
                    onPress={handleContinue}
                    disabled={!selected}
                >
                    <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 14,
        borderBottomWidth: 2.5,
        borderBottomColor: colors.primary,
        gap: 8,
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerAccent: { width: 4, height: 22, borderRadius: 2, backgroundColor: colors.primary },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
    exitBtn: {
        width: 36, height: 36, borderRadius: 8,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    exitIcon: { fontSize: 18, color: '#64748B' },

    // Content
    content: { padding: 20, gap: 16, paddingBottom: 40 },
    subtitle: { fontSize: 15, color: '#64748B', marginBottom: 4 },

    // Cards
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 20,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
        position: 'relative',
    },
    cardSelected: {
        borderColor: colors.primary,
        backgroundColor: '#FEF0FA',
    },
    cardLabel: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1E293B',
        lineHeight: 28,
        flex: 1,
    },
    cardLabelSelected: { color: colors.primary },
    checkBadge: {
        position: 'absolute', top: 12, right: 12,
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    checkText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

    // Footer
    footer: { padding: 20, paddingBottom: 32 },
    continueBtn: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    continueBtnDisabled: { backgroundColor: '#CBD5E1' },
    continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
