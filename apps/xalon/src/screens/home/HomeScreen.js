import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    StatusBar, RefreshControl, ActivityIndicator, Modal,
    TextInput, Alert, ImageBackground, Image, FlatList,
    Keyboard,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';
import { getCurrentLocation, geocodeAddress } from '../../services/location';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';

// ── Static data for At Home mode ─────────────────────────────────────────────

const FEATURED_PARTNERS_ATHOME = [
    { id: 'f1', name: 'Alina Rose', area: 'Bandra West', rating: 4.9, type: 'Freelancer' },
    { id: 'f2', name: 'David Smith', area: 'Andheri East', rating: 4.8, type: 'Freelancer' },
    { id: 'f3', name: 'Sarah Khan', area: 'Powai', rating: 4.7, type: 'Freelancer' },
];

const EXPLORE_CATEGORIES = [
    { id: 'e1', name: 'Hair & Styling' },
    { id: 'e2', name: 'Facial & Skin Care' },
    { id: 'e3', name: 'Massage & Wellness' },
    { id: 'e4', name: 'Manicure & Pedicure' },
    { id: 'e5', name: 'Makeup & Bridal' },
    { id: 'e6', name: 'Grooming Essentials' },
    { id: 'e7', name: 'Hair Colouring' },
];

const GENDER_CATEGORIES = [
    { id: 'Men', label: 'Men', gender: 'Male', image: 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=400&h=400&fit=crop' },
    { id: 'Women', label: 'Women', gender: 'Female', image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=400&h=400&fit=crop' },
];


// ── Helper: compute approx distance (km) ─────────────────────────────────────

function getDistanceKm(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Helper to fix image URLs
const getImageUrl = (url) => {
    const BU = api.BASE_URL || 'http://localhost:5001';
    if (!url) return null;
    if (url.startsWith('http')) {
        // Replace hardcoded IP with current BASE_URL if needed
        return url.replace(/http:\/\/192\.168\.1\.10:5000/g, BU);
    }
    return `${BU}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ── Salon Card (At Salon landing) ─────────────────────────────────────────────

function SalonCard({ salon, userLoc, onPress }) {
    const distance = getDistanceKm(
        userLoc?.lat, userLoc?.lng, salon.lat, salon.lng
    );
    const distText = distance != null
        ? distance < 1 ? `${Math.round(distance * 1000)} m away` : `${distance.toFixed(1)} km away`
        : null;

    const genderColor = salon.genderPreference === 'Male' ? { bg: '#DBEAFE', text: '#1D4ED8' }
        : salon.genderPreference === 'Female' ? { bg: '#FCE7F3', text: '#9D174D' }
            : { bg: '#F3F4F6', text: '#6B7280' };
    const genderLabel = salon.partnerType === 'Freelancer'
        ? (salon.genderPreference === 'Male' ? 'Male Professionals' : salon.genderPreference === 'Female' ? 'Female Professionals' : 'Both Male & Female')
        : (salon.genderPreference === 'Male' ? "Men's" : salon.genderPreference === 'Female' ? "Women's" : 'Unisex');

    // Show open/closed from openTime/closeTime
    const isOpenNow = (() => {
        if (!salon.openTime || !salon.closeTime) return null;
        const now = new Date();
        const [oh, om] = salon.openTime.split(':').map(Number);
        const [ch, cm] = salon.closeTime.split(':').map(Number);
        const cur = now.getHours() * 60 + now.getMinutes();
        const open = oh * 60 + om;
        const close = ch * 60 + cm;
        return cur >= open && cur < close;
    })();

    return (
        <TouchableOpacity style={styles.salonCard} onPress={onPress} activeOpacity={0.88}>
            {/* Cover image */}
            <View style={styles.salonCardImage}>
                {salon.coverImage ? (
                    <Image source={{ uri: getImageUrl(salon.coverImage) }} style={styles.salonCardImageImg} resizeMode="cover" />
                ) : (
                    <View style={styles.salonCardNoImage}>
                        <MaterialIcons name="storefront" size={36} color={colors.grayMedium} />
                    </View>
                )}
                {/* Rating chip */}
                {salon.rating && (
                    <View style={styles.ratingChip}>
                        <MaterialIcons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.ratingChipText}>{parseFloat(salon.rating).toFixed(1)}</Text>
                    </View>
                )}
                {/* Open/Closed pill */}
                {isOpenNow !== null && (
                    <View style={[styles.openPill, { backgroundColor: isOpenNow ? '#D1FAE5' : '#FEE2E2' }]}>
                        <View style={[styles.openDot, { backgroundColor: isOpenNow ? '#10B981' : '#EF4444' }]} />
                        <Text style={[styles.openPillText, { color: isOpenNow ? '#065F46' : '#991B1B' }]}>
                            {isOpenNow ? `Open · till ${salon.closeTime}` : 'Closed'}
                        </Text>
                    </View>
                )}
            </View>

            {/* Card body */}
            <View style={styles.salonCardBody}>
                {/* Name row */}
                <View style={styles.salonNameRow}>
                    <Text style={styles.salonCardName} numberOfLines={1}>{salon.businessName || salon.name}</Text>
                    {salon.isVerified && <MaterialIcons name="verified" size={16} color={colors.primary} />}
                </View>

                {/* Address + distance */}
                <View style={styles.salonMetaRow}>
                    <MaterialIcons name="location-on" size={13} color={colors.gray} />
                    <Text style={styles.salonMetaText} numberOfLines={1}>
                        {salon.area || salon.city || 'Location not set'}
                    </Text>
                    {distText && (
                        <>
                            <View style={styles.metaDot} />
                            <MaterialIcons name="near-me" size={11} color={colors.primary} />
                            <Text style={[styles.salonMetaText, { color: colors.primary, fontWeight: '700' }]}>{distText}</Text>
                        </>
                    )}
                </View>

                {/* Tags row: gender + categories */}
                <View style={styles.tagsRow}>
                    <View style={[styles.genderTag, { backgroundColor: genderColor.bg }]}>
                        <Text style={[styles.genderTagText, { color: genderColor.text }]}>{genderLabel}</Text>
                    </View>
                    {salon.partnerType === 'Freelancer' && salon.experience && (
                        <View style={[styles.catTag, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '08' }]}>
                            <Text style={[styles.catTagText, { color: colors.primary }]}>{salon.experience} yrs exp</Text>
                        </View>
                    )}
                    {(salon.categories || []).slice(0, 3).map((c, i) => (
                        <View key={i} style={styles.catTag}>
                            <Text style={styles.catTagText}>{c}</Text>
                        </View>
                    ))}
                </View>

                {/* Bottom row: service count + CTA */}
                <View style={styles.salonCardFooter}>
                    <Text style={styles.salonServiceCount}>
                        {salon.serviceCount > 0 ? `${salon.serviceCount} services` : 'View services'}
                    </Text>
                    <TouchableOpacity style={styles.bookNowBtn} onPress={onPress}>
                        <Text style={styles.bookNowText}>Book Now</Text>
                        <MaterialIcons name="arrow-forward" size={13} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function HomeScreen() {
    const navigation = useNavigation();
    const { draft, updateDraft, resetDraft, isBookingInProgress } = useBooking();
    const [locLoading, setLocLoading] = useState(false);
    const [showLocModal, setShowLocModal] = useState(false);
    const [manualCity, setManualCity] = useState('');
    const [searchText, setSearchText] = useState('');
    const [googleApiKey] = useState('AIzaSyAoqne91y9FZz6QHar7zzmxlrBEbytUAPM');
    const [refreshing, setRefreshing] = useState(false);
    const googlePlacesRef = useRef(null);

    // At Salon state
    const [salons, setSalons] = useState([]);
    const [salonsLoading, setSalonsLoading] = useState(false);
    const [salonsError, setSalonsError] = useState(null);
    const [activeCatFilter, setActiveCatFilter] = useState(null); // 'null' represents 'All'
    const [activeGenderFilter, setActiveGenderFilter] = useState(null); // 'null', 'Male', 'Female'
    const [categories, setCategories] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [proLoading, setProLoading] = useState(false);

    useEffect(() => {
        if (!draft.location) detectLocation();
        loadCategories();
    }, []);

    // Load data when mode or location changes
    useEffect(() => {
        if (draft.serviceMode === 'AtSalon') {
            loadSalons();
        } else {
            loadProfessionals();
        }
    }, [draft.serviceMode, draft.location, activeCatFilter, activeGenderFilter]);

    const loadSalons = async () => {
        try {
            setSalonsLoading(true);
            setSalonsError(null);
            const data = await api.getSalons({
                city: draft.location?.city,
                lat: draft.location?.lat,
                lng: draft.location?.lng,
                category: activeCatFilter,
                gender: activeGenderFilter,
                sort: 'rating',
                partnerType: null, // Default behavior for At Salon
            });
            setSalons(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('[HomeScreen] Salons Load Error:', err);
            setSalonsError('Could not load salons. Pull to refresh.');
        } finally {
            setSalonsLoading(false);
        }
    };

    const loadProfessionals = async () => {
        try {
            setProLoading(true);
            const data = await api.getSalons({
                city: draft.location?.city,
                lat: draft.location?.lat,
                lng: draft.location?.lng,
                partnerType: 'Freelancer',
                sort: 'rating',
            });
            setProfessionals(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('[HomeScreen] Professionals Load Error:', err);
        } finally {
            setProLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const data = await api.getCategories();
            if (Array.isArray(data)) {
                setCategories(data);
            }
        } catch (err) {
            console.error('[HomeScreen] Categories Load Error:', err);
        }
    };

    const detectLocation = async () => {
        setLocLoading(true);
        const loc = await getCurrentLocation();
        if (loc) updateDraft({ location: loc });
        setLocLoading(false);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([
            detectLocation(),
            loadCategories()
        ]);
        if (draft.serviceMode === 'AtSalon') {
            await loadSalons();
        } else {
            await loadProfessionals();
        }
        setRefreshing(false);
    }, [draft.serviceMode]);

    const handleModeToggle = (mode) => {
        if (draft.serviceMode === mode) return;
        if (isBookingInProgress) {
            Alert.alert(
                "Change Service Mode?",
                "Switching mode will reset your current selection.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Reset & Switch", onPress: () => { resetDraft(); updateDraft({ serviceMode: mode }); }, style: "destructive" }
                ]
            );
        } else {
            updateDraft({ serviceMode: mode });
        }
    };

    const handleManualLocation = async (data, details = null) => {
        try {
            if (details) {
                const lat = details.geometry?.location?.lat;
                const lng = details.geometry?.location?.lng;

                if (!lat || !lng) {
                    console.error("[HomeScreen] Missing coordinates in details");
                    return;
                }

                const cityName = details.address_components?.find(c => c.types.includes('locality'))?.long_name ||
                    details.address_components?.find(c => c.types.includes('administrative_area_level_2'))?.long_name ||
                    data?.structured_formatting?.main_text ||
                    data?.description ||
                    'Selected Location';

                updateDraft({
                    location: {
                        lat,
                        lng,
                        city: cityName
                    }
                });
                setShowLocModal(false);
                setSearchText('');
            } else {
                // Fallback for manual text entry
                const cityToGeocode = typeof data === 'string' ? data : searchText;
                if (!cityToGeocode?.trim()) return;

                setLocLoading(true);
                const coords = await geocodeAddress(cityToGeocode.trim());
                updateDraft({
                    location: {
                        lat: coords?.lat || null,
                        lng: coords?.lng || null,
                        city: cityToGeocode.trim()
                    }
                });
                setLocLoading(false);
                setSearchText('');
                setShowLocModal(false);
            }
        } catch (error) {
            console.error("[HomeScreen] handleManualLocation Error:", error);
            Alert.alert("Location Error", "Could not set this location. Please select from suggestions or try another name.");
        }
    };

    // ── HEADER (shared between both modes) ───────────────────────────────────

    const renderHeader = () => (
        <View style={styles.headerWrapper}>
            <View style={styles.brandRow}>
                <Image source={require('../../assets/brand/logo_full.png')} style={styles.logoFull} resizeMode="contain" />
                <TouchableOpacity style={styles.notifBtn}>
                    <MaterialIcons name="notifications-none" size={26} color={colors.text} />
                    <View style={styles.notifPulse} />
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.locationContainer} onPress={() => setShowLocModal(true)} activeOpacity={0.7}>
                <View style={styles.locIconContainer}>
                    <MaterialIcons name="location-on" size={16} color={colors.primary} />
                </View>
                <View style={styles.locInfo}>
                    <Text style={styles.locHeading}>CURATING NEAR</Text>
                    {locLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start' }} />
                    ) : (
                        <Text style={styles.locValue} numberOfLines={1}>{draft.location?.city || 'Detecting location…'}</Text>
                    )}
                </View>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.grayMedium} />
            </TouchableOpacity>
        </View>
    );

    const renderModeToggle = () => (
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
                            <MaterialIcons name={mode === 'AtHome' ? 'bolt' : 'storefront'} size={18} color={active ? colors.white : colors.gray} />
                            <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>
                                {mode === 'AtHome' ? 'At Home' : 'At Salon'}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    // ── AT SALON LANDING ─────────────────────────────────────────────────────

    const renderAtSalonContent = () => (
        <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
            {renderHeader()}
            {renderModeToggle()}

            {/* ── Headline */}
            <View style={styles.headlineSection}>
                <Text style={styles.headline}>
                    Book a Salon{'\n'}
                    <Text style={styles.headlineAccent}>Near You</Text>
                </Text>
                <Text style={styles.headlineSub}>
                    {draft.location?.city ? `${salons.length} salons near ${draft.location.city}` : 'Verified partner salons'}
                </Text>
            </View>

            {/* ── Featured Salon Placeholder ─ */}
            <View style={styles.featuredSection}>
                <View style={styles.featuredPlaceholder}>
                    <LinearGradient
                        colors={['#7C3AED20', '#7C3AED08']}
                        style={styles.featuredGrad}
                    >
                        <View style={styles.featuredBadge}>
                            <MaterialIcons name="stars" size={14} color={colors.primary} />
                            <Text style={styles.featuredBadgeText}>FEATURED</Text>
                        </View>
                        <Text style={styles.featuredTitle}>Promote Your Salon Here</Text>
                        <Text style={styles.featuredSubtitle}>Featured placement — coming soon</Text>
                    </LinearGradient>
                </View>
            </View>

            {/* ── Gender & Category discovery chips ─ */}
            <View style={styles.catDiscoveryContainer}>
                <Text style={styles.discoveryTitle}>Filters</Text>

                {/* Gender Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.catDiscoveryRow, { marginBottom: 16 }]}>
                    <TouchableOpacity
                        style={[styles.discoveryChip, activeGenderFilter === null && styles.discoveryChipActive]}
                        onPress={() => setActiveGenderFilter(null)}
                    >
                        <View style={[styles.discoveryIconCircle, activeGenderFilter === null && styles.discoveryIconCircleActive]}>
                            <MaterialIcons name="people" size={20} color={activeGenderFilter === null ? colors.white : colors.gray} />
                        </View>
                        <Text style={[styles.discoveryChipText, activeGenderFilter === null && styles.discoveryChipTextActive]}>All</Text>
                    </TouchableOpacity>

                    {GENDER_CATEGORIES.map(gender => {
                        const active = activeGenderFilter === gender.gender;
                        return (
                            <TouchableOpacity
                                key={gender.id}
                                style={[styles.discoveryChip, active && styles.discoveryChipActive]}
                                onPress={() => setActiveGenderFilter(active ? null : gender.gender)}
                            >
                                <View style={styles.discoveryImageWrapper}>
                                    <Image source={{ uri: gender.image }} style={styles.discoveryImage} />
                                    {active && <View style={styles.discoveryImgOverlay} />}
                                </View>
                                <Text style={[styles.discoveryChipText, active && styles.discoveryChipTextActive]}>{gender.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <Text style={styles.discoveryTitle}>Explore Categories</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catDiscoveryRow}>
                    <TouchableOpacity
                        style={[styles.discoveryChip, activeCatFilter === null && styles.discoveryChipActive]}
                        onPress={() => setActiveCatFilter(null)}
                    >
                        <View style={[styles.discoveryIconCircle, activeCatFilter === null && styles.discoveryIconCircleActive]}>
                            <MaterialIcons name="grid-view" size={20} color={activeCatFilter === null ? colors.white : colors.gray} />
                        </View>
                        <Text style={[styles.discoveryChipText, activeCatFilter === null && styles.discoveryChipTextActive]}>All Categories</Text>
                    </TouchableOpacity>

                    {categories.map(category => {
                        const active = activeCatFilter === category.name;
                        return (
                            <TouchableOpacity
                                key={category.id}
                                style={[styles.discoveryChip, active && styles.discoveryChipActive]}
                                onPress={() => setActiveCatFilter(category.name)}
                            >
                                <View style={styles.discoveryImageWrapper}>
                                    <Image source={{ uri: category.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80' }} style={styles.discoveryImage} />
                                    {active && <View style={styles.discoveryImgOverlay} />}
                                </View>
                                <Text style={[styles.discoveryChipText, active && styles.discoveryChipTextActive]}>{category.name}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── Salon list ─ */}
            <View style={styles.salonListSection}>
                {salonsLoading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.primary} size="large" />
                        <Text style={styles.loadingText}>Finding salons near you…</Text>
                    </View>
                ) : salonsError ? (
                    <View style={styles.center}>
                        <MaterialIcons name="wifi-off" size={40} color={colors.grayMedium} />
                        <Text style={styles.errorText}>{salonsError}</Text>
                    </View>
                ) : salons.length === 0 ? (
                    <View style={styles.center}>
                        <MaterialIcons name="storefront" size={56} color={colors.grayMedium} />
                        <Text style={styles.emptyTitle}>No Salons Found</Text>
                        <Text style={styles.errorText}>
                            No partner salons in {draft.location?.city || 'your area'} yet.
                        </Text>
                    </View>
                ) : (
                    salons.map(salon => (
                        <SalonCard
                            key={salon.id}
                            salon={salon}
                            userLoc={draft.location}
                            onPress={() => navigation.navigate('SalonDetails', { salon })}
                        />
                    ))
                )}
            </View>

            <View style={{ height: 32 }} />
        </ScrollView>
    );

    // ── AT HOME LANDING (unchanged) ──────────────────────────────────────────

    const renderAtHomeContent = () => (
        <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
            {renderHeader()}

            <View style={styles.headlineSection}>
                <Text style={styles.headline}>
                    Experience Premium{'\n'}
                    <Text style={styles.headlineAccent}>Beauty at Doorstep</Text>
                </Text>
            </View>

            {renderModeToggle()}

            {/* Explore Categories - Unified Style */}
            <View style={styles.catDiscoveryContainer}>
                <Text style={styles.discoveryTitle}>Curated For You</Text>

                {/* Gender Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.catDiscoveryRow, { marginBottom: 16 }]}>
                    {GENDER_CATEGORIES.map(gender => {
                        return (
                            <TouchableOpacity
                                key={gender.id}
                                style={styles.discoveryChip}
                                onPress={() => {
                                    updateDraft({ category: gender.id, gender: gender.gender });
                                    navigation.navigate('ServiceList', { category: gender.id, gender: gender.gender });
                                }}
                            >
                                <View style={styles.discoveryImageWrapper}>
                                    <Image source={{ uri: gender.image }} style={styles.discoveryImage} />
                                </View>
                                <Text style={styles.discoveryChipText}>{gender.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <Text style={styles.discoveryTitle}>Explore by Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catDiscoveryRow}>
                    <TouchableOpacity
                        style={styles.discoveryChip}
                        onPress={() => navigation.navigate('ServiceList', { category: null })}
                    >
                        <View style={styles.discoveryIconCircle}>
                            <MaterialIcons name="grid-view" size={20} color={colors.gray} />
                        </View>
                        <Text style={styles.discoveryChipText}>All</Text>
                    </TouchableOpacity>

                    {categories.map(category => {
                        return (
                            <TouchableOpacity
                                key={category.id}
                                style={styles.discoveryChip}
                                onPress={() => navigation.navigate('ServiceList', { category: category.name })}
                            >
                                <View style={styles.discoveryImageWrapper}>
                                    {category.image ? (
                                        <Image source={{ uri: category.image }} style={styles.discoveryImage} />
                                    ) : (
                                        <View style={styles.fallbackCircle}>
                                            <Text style={styles.fallbackText}>
                                                {(category.name || 'C')[0].toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.discoveryChipText}>{category.name}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Featured Professionals */}
            <View style={[styles.section, { marginBottom: 32 }]}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Top Professionals</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ServiceList', {})}>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>
                {proLoading ? (
                    <View style={{ padding: 20 }}>
                        <ActivityIndicator color={colors.primary} />
                    </View>
                ) : professionals.length === 0 ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: colors.gray }}>No professionals available in {draft.location?.city || 'this area'}.</Text>
                    </View>
                ) : (
                    professionals.map((partner) => (
                        <TouchableOpacity
                            key={partner.id}
                            style={styles.freelancerCard}
                            onPress={() => navigation.navigate('SalonDetails', { salon: partner })}
                        >
                            <View style={styles.salonImagePlaceholder}>
                                {partner.coverImage ? (
                                    <Image source={{ uri: getImageUrl(partner.coverImage) }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                                ) : (
                                    <MaterialIcons name="person" size={24} color={colors.grayMedium} />
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.freelancerName}>{partner.name}</Text>
                                <View style={styles.freelancerMeta}>
                                    <MaterialIcons name="location-on" size={12} color={colors.gray} />
                                    <Text style={styles.freelancerArea}>{partner.area || partner.city}</Text>
                                    <View style={styles.dot} />
                                    <Text style={styles.freelancerType}>
                                        {partner.genderPreference === 'Male' ? 'Male Professionals' : partner.genderPreference === 'Female' ? 'Female Professionals' : 'Both Male & Female'}
                                    </Text>
                                    {partner.experience && (
                                        <>
                                            <View style={styles.dot} />
                                            <Text style={styles.freelancerType}>{partner.experience} yrs exp</Text>
                                        </>
                                    )}
                                </View>
                            </View>
                            <View style={styles.ratingBadge}>
                                <MaterialIcons name="star" size={14} color="#F59E0B" />
                                <Text style={styles.ratingBadgeText}>{partner.rating || 'New'}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </ScrollView>
    );

    // ── RENDER ────────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            {draft.serviceMode === 'AtSalon' ? renderAtSalonContent() : renderAtHomeContent()}

            {/* Location Modal */}
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
                            <LinearGradient colors={colors.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.detectGradient}>
                                <MaterialIcons name="my-location" size={20} color={colors.white} />
                                <Text style={styles.detectBtnText}>Use Current Location</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.orText}>OR SEARCH LOCATION</Text>
                            <View style={styles.dividerLine} />
                        </View>
                        <View style={styles.autocompleteWrapper}>
                            <GooglePlacesAutocomplete
                                ref={googlePlacesRef}
                                placeholder="Search city or area..."
                                fetchDetails={true}
                                onPress={(data, details = null) => handleManualLocation(data, details)}
                                query={{
                                    key: googleApiKey,
                                    language: 'en',
                                    types: '(cities)',
                                    components: 'country:in',
                                }}
                                styles={{
                                    container: { flex: 0 },
                                    textInput: styles.cityInput,
                                    listView: styles.autocompleteList,
                                    row: styles.autocompleteRow,
                                    description: styles.autocompleteDescription,
                                    predefinedPlacesDescription: { color: colors.primary },
                                }}
                                textInputProps={{
                                    placeholderTextColor: colors.gray,
                                    clearButtonMode: 'always',
                                    onChangeText: (text) => setSearchText(text),
                                    onSubmitEditing: () => handleManualLocation(searchText),
                                    returnKeyType: 'search',
                                }}
                                enablePoweredByContainer={false}
                                minLength={2}
                                debounce={300}
                                renderLeftButton={() => (
                                    <View style={styles.searchIconInside}>
                                        <MaterialIcons name="search" size={20} color={colors.gray} />
                                    </View>
                                )}
                            />
                        </View>

                        {searchText.length > 0 && (
                            <TouchableOpacity
                                style={styles.confirmBtn}
                                onPress={() => handleManualLocation(searchText)}
                            >
                                <LinearGradient
                                    colors={[colors.text, '#4B5563']}
                                    style={styles.confirmGradient}
                                >
                                    <Text style={styles.confirmBtnText}>Confirm "{searchText}"</Text>
                                    <MaterialIcons name="chevron-right" size={20} color={colors.white} />
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.white },
    scroll: { flex: 1, backgroundColor: colors.white },

    // ── Shared Header
    headerWrapper: { backgroundColor: colors.white, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    logoFull: { width: 110, height: 38 },
    notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
    notifPulse: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, borderWidth: 1.5, borderColor: colors.white },
    locationContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 18, padding: 12, gap: 12 },
    locIconContainer: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
    locInfo: { flex: 1 },
    locHeading: { fontSize: 9, fontWeight: '900', color: colors.gray, letterSpacing: 1.2 },
    locValue: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 1 },

    // ── Mode toggle
    modeContainer: { paddingHorizontal: 20, marginTop: 20, marginBottom: 4 },
    modeToggle: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 20, padding: 6, elevation: 1 },
    modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, gap: 8 },
    modeBtnActive: { backgroundColor: colors.primary, elevation: 4, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8 },
    modeBtnText: { fontSize: 15, fontWeight: '700', color: colors.gray },
    modeBtnTextActive: { color: colors.white },

    // ── Headline
    headlineSection: { marginLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 4 },
    headline: { fontSize: 30, fontWeight: '900', color: colors.text, lineHeight: 38, letterSpacing: -1 },
    headlineAccent: { color: colors.primary },
    headlineSub: { fontSize: 13, color: colors.gray, fontWeight: '600', marginTop: 4 },

    // ── At Salon: Featured placeholder
    featuredSection: { paddingHorizontal: 20, marginTop: 20, marginBottom: 4 },
    featuredPlaceholder: { borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.primary + '40', borderStyle: 'dashed' },
    featuredGrad: { padding: 20, minHeight: 90, justifyContent: 'center', gap: 6 },
    featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
    featuredBadgeText: { fontSize: 10, fontWeight: '900', color: colors.primary, letterSpacing: 1.5 },
    featuredTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
    featuredSubtitle: { fontSize: 12, color: colors.gray, fontWeight: '500' },

    // ── At Salon: Discovery section
    catDiscoveryContainer: { marginTop: 12, paddingBottom: 16 },
    discoveryTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginLeft: 20, marginBottom: 12 },
    catDiscoveryRow: { paddingHorizontal: 20, gap: 14 },
    discoveryChip: { alignItems: 'center', gap: 6 },
    discoveryIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.grayBorder },
    discoveryIconCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    discoveryImageWrapper: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: colors.grayBorder },
    discoveryImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    discoveryImgOverlay: { position: 'absolute', inset: 0, backgroundColor: colors.primary + '40', borderWidth: 2, borderColor: colors.primary, borderRadius: 28 },
    discoveryChipText: { fontSize: 12, fontWeight: '700', color: colors.gray },
    discoveryChipTextActive: { color: colors.primary, fontWeight: '800' },

    // ── At Salon: Salon list
    salonListSection: { paddingHorizontal: 20, paddingTop: 4 },

    // Salon card
    salonCard: {
        backgroundColor: colors.white, borderRadius: 20, marginBottom: 16,
        borderWidth: 1, borderColor: colors.grayBorder,
        elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, overflow: 'hidden',
    },
    salonCardImage: { width: '100%', height: 170, backgroundColor: colors.background, position: 'relative' },
    salonCardImageImg: { width: '100%', height: '100%' },
    salonCardNoImage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    ratingChip: {
        position: 'absolute', top: 12, right: 12,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, elevation: 2,
    },
    ratingChipText: { fontSize: 13, fontWeight: '800', color: '#92400E' },
    openPill: {
        position: 'absolute', bottom: 12, left: 12,
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    },
    openDot: { width: 7, height: 7, borderRadius: 4 },
    openPillText: { fontSize: 11, fontWeight: '700' },

    salonCardBody: { padding: 14 },
    salonNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
    salonCardName: { fontSize: 18, fontWeight: '800', color: colors.text, flex: 1, letterSpacing: -0.3 },

    salonMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
    salonMetaText: { fontSize: 12, color: colors.gray, fontWeight: '500' },
    metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.grayMedium, marginHorizontal: 2 },

    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
    genderTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
    genderTagText: { fontSize: 11, fontWeight: '800' },
    catTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, backgroundColor: '#F3F4F6' },
    catTagText: { fontSize: 11, fontWeight: '600', color: colors.grayDark || colors.gray },

    salonCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    salonServiceCount: { fontSize: 12, color: colors.gray, fontWeight: '600' },
    bookNowBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: colors.primarySoft, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
    },
    bookNowText: { fontSize: 13, fontWeight: '700', color: colors.primary },

    // ── At Home sections
    section: { marginTop: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    viewAllText: { fontSize: 13, fontWeight: '700', color: colors.primary },

    catGrid: { flexDirection: 'row', gap: 16, paddingHorizontal: 20 },
    catCard: { flex: 1, height: 180, borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
    catImage: { width: '100%', height: '100%' },
    catGradient: { flex: 1, padding: 20, justifyContent: 'flex-end', gap: 4 },
    catLabel: { fontSize: 22, fontWeight: '900', color: colors.white, letterSpacing: -0.5 },
    catGo: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginTop: 8 },

    topServRow: { paddingLeft: 20, paddingRight: 8, paddingBottom: 16 },
    exploreCard: { width: 140, height: 160, borderRadius: 16, marginRight: 12, elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 },
    exploreImage: { width: '100%', height: '100%' },
    exploreGradient: { flex: 1, padding: 12, justifyContent: 'flex-end', borderRadius: 16 },
    exploreText: { fontSize: 14, fontWeight: '800', color: colors.white, lineHeight: 18 },

    freelancerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 24, padding: 16, marginBottom: 12, marginHorizontal: 20, borderWidth: 1, borderColor: colors.grayBorder, gap: 16, elevation: 2, shadowColor: colors.cardShadow, shadowOpacity: 1, shadowRadius: 10 },
    salonImagePlaceholder: { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    freelancerName: { fontSize: 16, fontWeight: '800', color: colors.text },
    freelancerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    freelancerArea: { fontSize: 12, color: colors.gray, fontWeight: '500' },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.grayMedium },
    freelancerType: { fontSize: 12, color: colors.primary, fontWeight: '600' },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
    ratingBadgeText: { fontSize: 14, fontWeight: '800', color: '#92400E' },

    // ── States
    center: { paddingVertical: 48, alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 14, color: colors.gray, fontWeight: '500' },
    errorText: { fontSize: 14, color: colors.gray, textAlign: 'center', paddingHorizontal: 24 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },

    // ── Location modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalSheet: { backgroundColor: colors.white, borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, paddingBottom: 48, minHeight: '60%' },
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
    cityInput: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingLeft: 44,
        fontSize: 16,
        color: colors.text,
        fontWeight: '600',
        height: 50,
    },
    goBtn: { backgroundColor: colors.text, borderRadius: 16, paddingHorizontal: 24, justifyContent: 'center' },
    goBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },

    autocompleteWrapper: { zIndex: 1000, elevation: 5 },
    discoveryImageWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.background,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.grayBorder
    },
    discoveryImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    fallbackCircle: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallbackText: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.primary,
    },
    autocompleteList: {
        backgroundColor: colors.white,
        borderRadius: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: colors.grayBorder,
        maxHeight: 250,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        zIndex: 5000,
    },
    autocompleteRow: { padding: 14, backgroundColor: colors.white },
    autocompleteDescription: { fontSize: 14, color: colors.text, fontWeight: '500' },

    confirmBtn: { marginTop: 16, borderRadius: 16, overflow: 'hidden' },
    confirmGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10 },
    confirmBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
});
