import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    StatusBar, RefreshControl, ActivityIndicator, Modal,
    TextInput, Alert, ImageBackground, Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';
import { getCurrentLocation } from '../../services/location';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Static curated data ─────────────────────────────────────────────────────

const FEATURED_PARTNERS = {
    AtHome: [
        { id: 'f1', name: 'Alina Rose', area: 'Bandra West', rating: 4.9, type: 'Freelancer', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
        { id: 'f2', name: 'David Smith', area: 'Andheri East', rating: 4.8, type: 'Freelancer', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' },
        { id: 'f3', name: 'Sarah Khan', area: 'Powai', rating: 4.7, type: 'Freelancer', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop' },
    ],
    AtSalon: [
        { id: 's1', name: 'Glam Studio', area: 'Bandra West', rating: 4.8, type: 'Salon', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop' },
        { id: 's2', name: 'The Luxe Lounge', area: 'Andheri East', rating: 4.7, type: 'Salon', image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=200&h=200&fit=crop' },
        { id: 's3', name: 'Kings Cut', area: 'Powai', rating: 4.6, type: 'Salon', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&h=200&fit=crop' },
    ]
};

const EXPLORE_CATEGORIES = [
    { id: 'e1', name: 'Hair & Styling', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80' },
    { id: 'e2', name: 'Facial & Skin Care', image: 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=500&q=80' },
    { id: 'e3', name: 'Massage & Wellness', image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=500&q=80' },
    { id: 'e4', name: 'Manicure & Pedicure', image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&q=80' },
    { id: 'e5', name: 'Makeup & Bridal', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&q=80' },
    { id: 'e6', name: 'Grooming Essentials', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&q=80' },
];

const CATEGORIES = [
    {
        id: 'Men',
        label: 'Men',
        icon: 'man',
        gender: 'Male',
        color: '#1E40AF',
        image: 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=400&h=400&fit=crop'
    },
    {
        id: 'Women',
        label: 'Women',
        icon: 'woman',
        gender: 'Female',
        color: '#9D174D',
        image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=400&h=400&fit=crop'
    },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
    const navigation = useNavigation();
    const { draft, updateDraft, resetDraft, isBookingInProgress } = useBooking();
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

    const handleModeToggle = (mode) => {
        if (draft.serviceMode === mode) return;

        if (isBookingInProgress) {
            Alert.alert(
                "Change Service Mode?",
                "Switching mode will reset your current service selection. Do you want to continue?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Reset & Switch",
                        onPress: () => {
                            resetDraft();
                            updateDraft({ serviceMode: mode });
                        },
                        style: "destructive"
                    }
                ]
            );
        } else {
            updateDraft({ serviceMode: mode });
        }
    };

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

    const partners = FEATURED_PARTNERS[draft.serviceMode] || FEATURED_PARTNERS.AtHome;

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* ── Unified Header ───────────────────────────── */}
                <View style={styles.headerWrapper}>
                    {/* Brand Row */}
                    <View style={styles.brandRow}>
                        <Image
                            source={require('../../assets/brand/logo_full.png')}
                            style={styles.logoFull}
                            resizeMode="contain"
                        />
                        <TouchableOpacity style={styles.notifBtn}>
                            <MaterialIcons name="notifications-none" size={26} color={colors.text} />
                            <View style={styles.notifPulse} />
                        </TouchableOpacity>
                    </View>

                    {/* Location Bar */}
                    <TouchableOpacity
                        style={styles.locationContainer}
                        onPress={() => setShowLocModal(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.locIconContainer}>
                            <MaterialIcons name="location-on" size={16} color={colors.primary} />
                        </View>
                        <View style={styles.locInfo}>
                            <Text style={styles.locHeading}>CURATING NEAR</Text>
                            {locLoading ? (
                                <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start' }} />
                            ) : (
                                <Text style={styles.locValue} numberOfLines={1}>
                                    {draft.location?.city || 'Detecting location…'}
                                </Text>
                            )}
                        </View>
                        <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.grayMedium} />
                    </TouchableOpacity>
                </View>

                <View style={styles.headlineSection}>
                    <Text style={styles.headline}>
                        Experience Premium{'\n'}
                        <Text style={styles.headlineAccent}>
                            {draft.serviceMode === 'AtHome' ? 'Beauty at Doorstep' : 'Salon Services'}
                        </Text>
                    </Text>
                </View>

                {/* ── Service Mode Toggle ─────────────────── */}
                <View style={styles.modeContainer}>
                    <View style={styles.modeToggle}>
                        {['AtHome', 'AtSalon'].map((mode) => {
                            const active = draft.serviceMode === mode;
                            return (
                                <TouchableOpacity
                                    key={mode}
                                    style={[styles.modeBtn, active && styles.modeBtnActive]}
                                    onPress={() => handleModeToggle(mode)}
                                    activeOpacity={0.9}
                                >
                                    <MaterialIcons
                                        name={mode === 'AtHome' ? 'bolt' : 'storefront'}
                                        size={18}
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
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Curated For You</Text>
                    </View>
                    <View style={styles.catGrid}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={styles.catCard}
                                onPress={() => handleCategoryPress(cat)}
                                activeOpacity={0.9}
                            >
                                <ImageBackground
                                    source={{ uri: cat.image }}
                                    style={styles.catImage}
                                    imageStyle={{ borderRadius: 24 }}
                                >
                                    <LinearGradient
                                        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
                                        style={styles.catGradient}
                                    >
                                        <Text style={styles.catLabel}>{cat.label}</Text>
                                        <View style={styles.catGo}>
                                            <MaterialIcons name="chevron-right" size={20} color={colors.white} />
                                        </View>
                                    </LinearGradient>
                                </ImageBackground>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── Explore Categories ────────────────────────── */}
                <View style={[styles.section, { paddingRight: 0 }]}>
                    <Text style={[styles.sectionTitle, { marginLeft: 20, marginBottom: 12 }]}>Explore Categories</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topServRow}>
                        {EXPLORE_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={styles.exploreCard}
                                onPress={() => navigation.navigate('ServiceList', { category: cat.name })}
                                activeOpacity={0.9}
                            >
                                <ImageBackground
                                    source={{ uri: cat.image }}
                                    style={styles.exploreImage}
                                    imageStyle={{ borderRadius: 16 }}
                                >
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                                        style={styles.exploreGradient}
                                    >
                                        <Text style={styles.exploreText}>{cat.name}</Text>
                                    </LinearGradient>
                                </ImageBackground>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* ── Featured Partners ─────────────────────── */}
                <View style={[styles.section, { marginBottom: 32 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {draft.serviceMode === 'AtHome' ? 'Top Professionals' : 'Verified Partner Salons'}
                        </Text>
                        <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
                    </View>
                    {partners.map((partner) => (
                        <TouchableOpacity key={partner.id} style={styles.salonCard} activeOpacity={0.9}>
                            <View style={styles.salonImagePlaceholder}>
                                <MaterialIcons name="image" size={24} color={colors.grayMedium} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.salonName}>{partner.name}</Text>
                                <View style={styles.salonMeta}>
                                    <MaterialIcons name="location-on" size={12} color={colors.gray} />
                                    <Text style={styles.salonArea}>{partner.area}</Text>
                                    <View style={styles.dot} />
                                    <Text style={styles.salonType}>{partner.type}</Text>
                                </View>
                            </View>
                            <View style={styles.ratingBadge}>
                                <MaterialIcons name="star" size={14} color="#F59E0B" />
                                <Text style={styles.ratingText}>{partner.rating}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* ── Location Modal ──────────────────────────── */}
            <Modal visible={showLocModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Set Your Location</Text>
                            <TouchableOpacity onPress={() => setShowLocModal(false)}>
                                <MaterialIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.detectBtn} onPress={() => { setShowLocModal(false); detectLocation(); }}>
                            <LinearGradient
                                colors={colors.primaryGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.detectGradient}
                            >
                                <MaterialIcons name="my-location" size={20} color={colors.white} />
                                <Text style={styles.detectBtnText}>Use Current Location</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.orText}>OR SEARCH CITY</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.inputRow}>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="search" size={20} color={colors.gray} />
                                <TextInput
                                    style={styles.cityInput}
                                    placeholder="e.g. Mumbai, Pune…"
                                    value={manualCity}
                                    onChangeText={setManualCity}
                                    placeholderTextColor={colors.gray}
                                />
                            </View>
                            <TouchableOpacity style={styles.goBtn} onPress={handleManualLocation}>
                                <Text style={styles.goBtnText}>GO</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.white },
    scroll: { flex: 1, backgroundColor: colors.white },
    headerWrapper: {
        backgroundColor: colors.white,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    brandRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoFull: {
        width: 110,
        height: 38,
    },
    notifBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifPulse: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        borderWidth: 1.5,
        borderColor: colors.white,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 18,
        padding: 12,
        gap: 12,
    },
    locIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    locInfo: {
        flex: 1,
    },
    locHeading: {
        fontSize: 9,
        fontWeight: '900',
        color: colors.gray,
        letterSpacing: 1.2,
    },
    locValue: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        marginTop: 1,
    },

    // Mode toggle
    modeContainer: { paddingHorizontal: 20, marginTop: 24 },
    modeToggle: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 20, padding: 6, elevation: 1 },
    modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, gap: 8 },
    modeBtnActive: { backgroundColor: colors.primary, elevation: 4, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8 },
    modeBtnText: { fontSize: 15, fontWeight: '700', color: colors.gray },
    modeBtnTextActive: { color: colors.white },

    // Header
    headlineSection: { marginLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 8 },
    headline: { fontSize: 32, fontWeight: '900', color: colors.text, lineHeight: 38, letterSpacing: -1.2 },
    headlineAccent: { color: colors.primary },

    // Sections
    section: { marginTop: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    viewAllText: { fontSize: 13, fontWeight: '700', color: colors.primary },

    // Category grid
    catGrid: { flexDirection: 'row', gap: 16, paddingHorizontal: 20 },
    catCard: { flex: 1, height: 180, borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
    catImage: { width: '100%', height: '100%' },
    catGradient: { flex: 1, padding: 20, justifyContent: 'flex-end', gap: 4 },
    catLabel: { fontSize: 22, fontWeight: '900', color: colors.white, letterSpacing: -0.5 },
    catGo: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginTop: 8 },

    // Explore Categories
    topServRow: { paddingLeft: 20, paddingRight: 8, paddingBottom: 16 },
    exploreCard: { width: 140, height: 160, borderRadius: 16, marginRight: 12, elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 },
    exploreImage: { width: '100%', height: '100%' },
    exploreGradient: { flex: 1, padding: 12, justifyContent: 'flex-end', borderRadius: 16 },
    exploreText: { fontSize: 14, fontWeight: '800', color: colors.white, lineHeight: 18 },

    // Salon cards
    salonCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 24, padding: 16, marginBottom: 12, marginHorizontal: 20, borderWidth: 1, borderColor: colors.grayBorder, gap: 16, elevation: 2, shadowColor: colors.cardShadow, shadowOpacity: 1, shadowRadius: 10 },
    salonImagePlaceholder: { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    salonName: { fontSize: 16, fontWeight: '800', color: colors.text },
    salonMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    salonArea: { fontSize: 12, color: colors.gray, fontWeight: '500' },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.grayMedium },
    salonType: { fontSize: 12, color: colors.primary, fontWeight: '600' },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
    ratingText: { fontSize: 14, fontWeight: '800', color: '#92400E' },

    // Location modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalSheet: { backgroundColor: colors.white, borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, paddingBottom: 48 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
    detectBtn: { borderRadius: 18, overflow: 'hidden', marginBottom: 24 },
    detectGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10 },
    detectBtnText: { fontSize: 16, fontWeight: '800', color: colors.white },

    divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.grayBorder },
    orText: { fontSize: 11, fontWeight: '800', color: colors.grayMedium },

    inputRow: { flexDirection: 'row', gap: 12 },
    inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 16, gap: 10 },
    cityInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.text, fontWeight: '600' },
    goBtn: { backgroundColor: colors.text, borderRadius: 16, paddingHorizontal: 24, justifyContent: 'center' },
    goBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
