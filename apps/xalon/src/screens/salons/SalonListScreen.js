import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    StatusBar, ActivityIndicator, TextInput, Image,
    RefreshControl
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';
import api from '../../services/api';

// ── Gender filter chip ───────────────────────────────────────────────────────

const GENDER_FILTERS = [
    { label: 'All', value: null },
    { label: 'Men', value: 'Male' },
    { label: 'Women', value: 'Female' },
    { label: 'Unisex', value: 'Unisex' },
];

// ── Sort options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
    { label: 'Top Rated', value: 'rating' },
    { label: 'Nearest', value: 'distance' },
    { label: 'Popular', value: 'popular' },
];

// ── Salon Card ───────────────────────────────────────────────────────────────

function SalonCard({ salon, onPress }) {
    const hasImages = salon.coverImage || (salon.images && salon.images.length > 0);
    const imageUri = salon.coverImage || (salon.images?.[0]) || null;

    return (
        <TouchableOpacity style={styles.salonCard} onPress={onPress} activeOpacity={0.9}>
            {/* Cover Image */}
            <View style={styles.cardCover}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.coverImage} resizeMode="cover" />
                ) : (
                    <View style={styles.coverPlaceholder}>
                        <MaterialIcons name="storefront" size={40} color={colors.grayMedium} />
                    </View>
                )}
                {/* Gender badge */}
                {salon.genderPreference && (
                    <View style={[styles.genderBadge, {
                        backgroundColor: salon.genderPreference === 'Male' ? '#DBEAFE'
                            : salon.genderPreference === 'Female' ? '#FCE7F3'
                                : '#F3F4F6'
                    }]}>
                        <MaterialIcons
                            name={salon.genderPreference === 'Male' ? 'man' : salon.genderPreference === 'Female' ? 'woman' : 'people'}
                            size={12}
                            color={salon.genderPreference === 'Male' ? '#1D4ED8' : salon.genderPreference === 'Female' ? '#9D174D' : colors.gray}
                        />
                        <Text style={[styles.genderBadgeText, {
                            color: salon.genderPreference === 'Male' ? '#1D4ED8' : salon.genderPreference === 'Female' ? '#9D174D' : colors.gray
                        }]}>
                            {salon.genderPreference === 'Male' ? "Men's" : salon.genderPreference === 'Female' ? "Women's" : 'Unisex'}
                        </Text>
                    </View>
                )}
                {/* Rating badge */}
                {salon.rating && !((salon.isOnline === false) && (new Date().toDateString() === new Date(salon.lastStatusUpdate || salon.updatedAt).toDateString())) && (
                    <View style={styles.ratingBadge}>
                        <MaterialIcons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.ratingText}>{parseFloat(salon.rating).toFixed(1)}</Text>
                    </View>
                )}
                {/* Offline badge */}
                {(salon.isOnline === false) && (new Date().toDateString() === new Date(salon.lastStatusUpdate || salon.updatedAt).toDateString()) && (
                    <View style={[styles.ratingBadge, { backgroundColor: colors.error }]}>
                        <Text style={{ fontSize: 10, fontWeight: '900', color: colors.white }}>OFFLINE</Text>
                    </View>
                )}
            </View>

            {/* Card body */}
            <View style={styles.cardBody}>
                <View style={styles.nameRow}>
                    <Text style={styles.salonName} numberOfLines={1}>{salon.businessName || salon.name}</Text>
                    {salon.isVerified && (
                        <MaterialIcons name="verified" size={16} color={colors.primary} />
                    )}
                </View>

                <View style={styles.metaRow}>
                    <MaterialIcons name="location-on" size={13} color={colors.gray} />
                    <Text style={styles.metaText} numberOfLines={1}>
                        {salon.area || salon.city || 'Location not set'}
                    </Text>
                </View>

                {salon.serviceCount > 0 && (
                    <Text style={styles.serviceCount}>{salon.serviceCount} services available</Text>
                )}

                <TouchableOpacity style={styles.viewBtn} onPress={onPress}>
                    <Text style={styles.viewBtnText}>View & Book</Text>
                    <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function SalonListScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { category, gender: initialGender } = route.params || {};
    const { draft } = useBooking();

    const [salons, setSalons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeGender, setActiveGender] = useState(initialGender || null);
    const [activeSort, setActiveSort] = useState('rating');

    const loadSalons = useCallback(async () => {
        try {
            setError(null);
            const data = await api.getSalons({
                city: draft.location?.city,
                lat: draft.location?.lat,
                lng: draft.location?.lng,
                gender: activeGender,
                category,
                sort: activeSort,
            });
            setSalons(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('[SalonListScreen] Load Error:', err);
            setError('Failed to load salons. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [draft.location, activeGender, category, activeSort]);

    useEffect(() => {
        setLoading(true);
        loadSalons();
    }, [loadSalons]);

    const onRefresh = () => {
        setRefreshing(true);
        loadSalons();
    };

    const filtered = salons.filter(s =>
        (s.businessName || s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSalonPress = (salon) => {
        navigation.navigate('SalonDetails', { salon });
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={18} color={colors.gray} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search salons..."
                        placeholderTextColor={colors.gray}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialIcons name="close" size={18} color={colors.gray} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Title row */}
            <View style={styles.titleRow}>
                <View>
                    <Text style={styles.screenTitle}>
                        {category ? `${category} Salons` : 'Partner Salons'}
                    </Text>
                    <Text style={styles.screenSubtitle}>
                        {draft.location?.city ? `Near ${draft.location.city}` : 'Showing all salons'}
                    </Text>
                </View>
                <View style={styles.resultCount}>
                    <Text style={styles.resultCountText}>{filtered.length}</Text>
                </View>
            </View>

            {/* Gender filter chips */}
            <View style={styles.filterRow}>
                {GENDER_FILTERS.map(f => (
                    <TouchableOpacity
                        key={String(f.value)}
                        style={[styles.filterChip, activeGender === f.value && styles.filterChipActive]}
                        onPress={() => setActiveGender(f.value)}
                    >
                        <Text style={[styles.filterChipText, activeGender === f.value && styles.filterChipTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Sort bar */}
            <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>Sort by:</Text>
                {SORT_OPTIONS.map(s => (
                    <TouchableOpacity
                        key={s.value}
                        style={[styles.sortChip, activeSort === s.value && styles.sortChipActive]}
                        onPress={() => setActiveSort(s.value)}
                    >
                        <Text style={[styles.sortChipText, activeSort === s.value && styles.sortChipTextActive]}>
                            {s.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} size="large" />
                    <Text style={styles.loadingText}>Finding salons near you…</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <MaterialIcons name="error-outline" size={48} color={colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={loadSalons}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => (
                        <SalonCard salon={item} onPress={() => handleSalonPress(item)} />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="store" size={64} color={colors.grayMedium} />
                            <Text style={styles.emptyTitle}>No Salons Found</Text>
                            <Text style={styles.emptyText}>
                                {searchQuery ? `No salons matching "${searchQuery}".` : 'No partner salons found in your area. Try a different filter.'}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.white },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12, gap: 12,
        borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.background,
        justifyContent: 'center', alignItems: 'center',
    },
    searchContainer: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.background, borderRadius: 16,
        paddingHorizontal: 14, paddingVertical: 10, gap: 10,
    },
    searchInput: {
        flex: 1, fontSize: 15, color: colors.text, fontWeight: '500',
    },

    titleRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    },
    screenTitle: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
    screenSubtitle: { fontSize: 13, color: colors.gray, fontWeight: '500', marginTop: 2 },
    resultCount: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center',
    },
    resultCountText: { fontSize: 14, fontWeight: '800', color: colors.primary },

    filterRow: {
        flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 8,
    },
    filterChip: {
        paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
        backgroundColor: colors.background, borderWidth: 1, borderColor: colors.grayBorder,
    },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterChipText: { fontSize: 13, fontWeight: '700', color: colors.gray },
    filterChipTextActive: { color: colors.white },

    sortRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 20, paddingBottom: 12,
    },
    sortLabel: { fontSize: 12, fontWeight: '700', color: colors.grayMedium, marginRight: 4 },
    sortChip: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
        backgroundColor: colors.background,
    },
    sortChipActive: { backgroundColor: '#EDE9FE' },
    sortChipText: { fontSize: 12, fontWeight: '600', color: colors.gray },
    sortChipTextActive: { color: colors.primary, fontWeight: '700' },

    list: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32 },

    // Salon Card
    salonCard: {
        backgroundColor: colors.white, borderRadius: 20, marginBottom: 16,
        borderWidth: 1, borderColor: colors.grayBorder,
        elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, overflow: 'hidden',
    },
    cardCover: { width: '100%', height: 160, backgroundColor: colors.background, position: 'relative' },
    coverImage: { width: '100%', height: '100%' },
    coverPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    genderBadge: {
        position: 'absolute', top: 12, left: 12,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    },
    genderBadgeText: { fontSize: 11, fontWeight: '800' },
    ratingBadge: {
        position: 'absolute', top: 12, right: 12,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, elevation: 2,
    },
    ratingText: { fontSize: 13, fontWeight: '800', color: '#92400E' },

    cardBody: { padding: 16 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    salonName: { fontSize: 18, fontWeight: '800', color: colors.text, flex: 1, letterSpacing: -0.3 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    metaText: { fontSize: 13, color: colors.gray, fontWeight: '500', flex: 1 },
    serviceCount: { fontSize: 12, color: colors.primary, fontWeight: '700', marginBottom: 12 },
    viewBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: colors.primarySoft, paddingVertical: 10, borderRadius: 12,
    },
    viewBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingText: { fontSize: 14, color: colors.gray, fontWeight: '500' },
    errorText: { fontSize: 15, color: colors.gray, textAlign: 'center', paddingHorizontal: 32 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.primary },
    retryText: { color: colors.white, fontWeight: '700' },
    emptyContainer: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 16 },
    emptyText: { color: colors.gray, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
