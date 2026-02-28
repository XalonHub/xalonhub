import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    StatusBar, RefreshControl, ActivityIndicator, Modal,
    TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';
import { getCurrentLocation } from '../../services/location';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Static curated data ─────────────────────────────────────────────────────

const FEATURED_SALONS = [
    { id: '1', name: 'Glam Studio', area: 'Bandra West', rating: 4.8, type: 'Unisex' },
    { id: '2', name: 'The Luxe Lounge', area: 'Andheri East', rating: 4.7, type: 'Female' },
    { id: '3', name: 'Kings Cut', area: 'Powai', rating: 4.6, type: 'Male' },
];

const TOP_SERVICES = [
    { id: 't1', name: 'Haircut', icon: 'content-cut' },
    { id: 't2', name: 'Facial', icon: 'face' },
    { id: 't3', name: 'Waxing', icon: 'spa' },
    { id: 't4', name: 'Manicure', icon: 'back-hand' },
    { id: 't5', name: 'Blowout', icon: 'air' },
];

const CATEGORIES = [
    { id: 'Men', label: 'Men', icon: 'man', gender: 'Male', color: '#3B82F6' },
    { id: 'Women', label: 'Women', icon: 'woman', gender: 'Female', color: '#EC4899' },
    { id: 'Unisex', label: 'Unisex', icon: 'people', gender: 'Unisex', color: '#7C3AED' },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
    const navigation = useNavigation();
    const { draft, updateDraft } = useBooking();
    const [locLoading, setLocLoading] = useState(false);
    const [showLocModal, setShowLocModal] = useState(false);
    const [manualCity, setManualCity] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Auto-detect location on first mount
    useEffect(() => {
        if (!draft.location) detectLocation();
    }, []);

    const detectLocation = async () => {
        setLocLoading(true);
        const loc = await getCurrentLocation();
        if (loc) updateDraft({ location: loc });
        setLocLoading(false);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await detectLocation();
        setRefreshing(false);
    }, []);

    const handleModeToggle = (mode) => updateDraft({ serviceMode: mode });

    const handleCategoryPress = (cat) => {
        updateDraft({ category: cat.id, gender: cat.gender });
        navigation.navigate('ServiceList', { category: cat.id, gender: cat.gender });
    };

    const handleManualLocation = () => {
        if (manualCity.trim()) {
            updateDraft({ location: { lat: null, lng: null, city: manualCity.trim() } });
            setManualCity('');
            setShowLocModal(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* ── Location Bar ───────────────────────────── */}
                <View style={styles.locBar}>
                    <MaterialIcons name="location-on" size={20} color={colors.primary} />
                    <TouchableOpacity onPress={() => setShowLocModal(true)} style={{ flex: 1 }}>
                        {locLoading ? (
                            <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />
                        ) : (
                            <Text style={styles.locText} numberOfLines={1}>
                                {draft.location?.city || 'Detecting location…'}
                            </Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowLocModal(true)}>
                        <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.gray} />
                    </TouchableOpacity>
                </View>

                {/* ── Header greeting ──────────────────────── */}
                <View style={styles.header}>
                    <Text style={styles.headline}>Book your next{'\n'}<Text style={styles.headlineAccent}>beauty service</Text></Text>
                </View>

                {/* ── Service Mode Toggle ─────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Service Mode</Text>
                    <View style={styles.modeToggle}>
                        {['AtHome', 'AtSalon'].map((mode) => {
                            const active = draft.serviceMode === mode;
                            return (
                                <TouchableOpacity
                                    key={mode}
                                    style={[styles.modeBtn, active && styles.modeBtnActive]}
                                    onPress={() => handleModeToggle(mode)}
                                    activeOpacity={0.8}
                                >
                                    <MaterialIcons
                                        name={mode === 'AtHome' ? 'home' : 'storefront'}
                                        size={16}
                                        color={active ? colors.white : colors.gray}
                                    />
                                    <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>
                                        {mode === 'AtHome' ? 'At Home' : 'At Salon'}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* ── Category Grid ───────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>What are you looking for?</Text>
                    <View style={styles.catGrid}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.catCard, { borderColor: cat.color + '33' }]}
                                onPress={() => handleCategoryPress(cat)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.catIconBg, { backgroundColor: cat.color + '18' }]}>
                                    <MaterialIcons name={cat.icon} size={32} color={cat.color} />
                                </View>
                                <Text style={styles.catLabel}>{cat.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── Top Services ────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Popular Services</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topServRow}>
                        {TOP_SERVICES.map((s) => (
                            <TouchableOpacity
                                key={s.id}
                                style={styles.topServChip}
                                onPress={() => navigation.navigate('ServiceList', { serviceName: s.name })}
                            >
                                <MaterialIcons name={s.icon} size={18} color={colors.primary} />
                                <Text style={styles.topServText}>{s.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* ── Featured Salons ─────────────────────── */}
                <View style={[styles.section, { marginBottom: 32 }]}>
                    <Text style={styles.sectionLabel}>Featured Salons</Text>
                    {FEATURED_SALONS.map((salon) => (
                        <View key={salon.id} style={styles.salonCard}>
                            <View style={styles.salonIconBg}>
                                <MaterialIcons name="storefront" size={28} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.salonName}>{salon.name}</Text>
                                <Text style={styles.salonArea}>
                                    <MaterialIcons name="location-on" size={12} color={colors.gray} /> {salon.area}
                                </Text>
                            </View>
                            <View style={styles.ratingBadge}>
                                <MaterialIcons name="star" size={13} color="#F59E0B" />
                                <Text style={styles.ratingText}>{salon.rating}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* ── Location Modal ──────────────────────────── */}
            <Modal visible={showLocModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>Choose Location</Text>
                        <TouchableOpacity style={styles.detectBtn} onPress={() => { setShowLocModal(false); detectLocation(); }}>
                            <MaterialIcons name="my-location" size={18} color={colors.primary} />
                            <Text style={styles.detectBtnText}>Use Current Location</Text>
                        </TouchableOpacity>
                        <Text style={styles.orText}>or enter city / area</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.cityInput}
                                placeholder="e.g. Mumbai, Pune…"
                                value={manualCity}
                                onChangeText={setManualCity}
                                placeholderTextColor={colors.gray}
                            />
                            <TouchableOpacity style={styles.goBtn} onPress={handleManualLocation}>
                                <Text style={styles.goBtnText}>Go</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLocModal(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.white },
    scroll: { flex: 1, backgroundColor: colors.background },

    // Location bar
    locBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.white, gap: 6 },
    locText: { fontSize: 15, fontWeight: '600', color: colors.text, marginLeft: 4 },

    // Header
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    headline: { fontSize: 26, fontWeight: '800', color: colors.text, lineHeight: 34 },
    headlineAccent: { color: colors.primary },

    // Sections
    section: { paddingHorizontal: 20, marginTop: 24 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.gray, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

    // Mode toggle
    modeToggle: { flexDirection: 'row', backgroundColor: colors.grayLight, borderRadius: 14, padding: 4 },
    modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
    modeBtnActive: { backgroundColor: colors.primary },
    modeBtnText: { fontSize: 14, fontWeight: '600', color: colors.gray },
    modeBtnTextActive: { color: colors.white },

    // Category grid
    catGrid: { flexDirection: 'row', gap: 12 },
    catCard: { flex: 1, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1.5, paddingVertical: 20, alignItems: 'center', gap: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
    catIconBg: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    catLabel: { fontSize: 13, fontWeight: '700', color: colors.text },

    // Top services
    topServRow: { paddingVertical: 4 },
    topServChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
    topServText: { fontSize: 13, fontWeight: '600', color: colors.primary },

    // Featured salons
    salonCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, gap: 12 },
    salonIconBg: { width: 50, height: 50, borderRadius: 14, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    salonName: { fontSize: 15, fontWeight: '700', color: colors.text },
    salonArea: { fontSize: 12, color: colors.gray, marginTop: 3 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF9C3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 3 },
    ratingText: { fontSize: 13, fontWeight: '700', color: '#92400E' },

    // Location modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 20 },
    detectBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: colors.primaryLight, borderRadius: 12, gap: 10 },
    detectBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },
    orText: { textAlign: 'center', color: colors.gray, marginVertical: 16, fontSize: 13 },
    inputRow: { flexDirection: 'row', gap: 10 },
    cityInput: { flex: 1, borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text },
    goBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
    goBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
    cancelBtn: { marginTop: 16, alignItems: 'center' },
    cancelBtnText: { color: colors.gray, fontSize: 15 },
});
