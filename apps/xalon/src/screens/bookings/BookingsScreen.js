import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    StatusBar, RefreshControl, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import api from '../../services/api';
import { getTimeRemaining, haversineKm, formatDistance, openMaps } from '../../utils/bookingUtils';

const STATUS_CONFIG = {
    Requested: { label: 'Requested', color: '#F59E0B', bg: '#FEF9C3', icon: 'schedule' },
    Confirmed: { label: 'Confirmed', color: '#3B82F6', bg: '#DBEAFE', icon: 'check-circle' },
    Completed: { label: 'Completed', color: colors.success, bg: '#D1FAE5', icon: 'task-alt' },
    Cancelled: { label: 'Cancelled', color: colors.error, bg: '#FEE2E2', icon: 'cancel' },
};

const PARTNER_TYPE_LABELS = {
    Freelancer: 'Freelancer', Male_Salon: 'Salon', Female_Salon: 'Salon', Unisex_Salon: 'Salon',
};

const MODE_CHIPS = [
    { label: 'All', value: 'all', icon: 'list' },
    { label: 'At Salon', value: 'AtSalon', icon: 'storefront' },
    { label: 'At Home', value: 'AtHome', icon: 'home' },
];

function BookingCard({ item, userLocation, onRebook }) {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Requested;
    const services = Array.isArray(item.services) ? item.services : [];
    const firstService = services[0]?.serviceName || 'Booking';
    const partnerName = item.partner?.basicInfo?.salonName || item.partner?.basicInfo?.name || 'Professional';
    const partnerType = PARTNER_TYPE_LABELS[item.partner?.partnerType] || '';
    const isAtHome = item.serviceMode === 'AtHome';
    const dateStr = item.bookingDate
        ? new Date(item.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';

    // Distance calculation
    const partnerAddr = item.partner?.address || {};
    const distance = haversineKm(
        userLocation?.lat, userLocation?.lng,
        partnerAddr.lat, partnerAddr.lng
    );
    const distanceStr = formatDistance(distance);

    // Time remaining
    const timeRemaining = (item.status === 'Requested' || item.status === 'Confirmed')
        ? getTimeRemaining(item.bookingDate, item.timeSlot)
        : null;

    // Recipient info
    const recipient = item.beneficiaryName || item.guestName;
    const isSelf = !recipient || recipient.toLowerCase() === 'self';

    const providerPhone = item.partner?.basicInfo?.phone || item.partner?.basicInfo?.ownerPhone;

    return (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName} numberOfLines={1}>{firstService}{services.length > 1 ? ` +${services.length - 1} more` : ''}</Text>
                    <Text style={styles.providerName}>{partnerName}{partnerType ? ` · ${partnerType}` : ''}</Text>
                    {!isAtHome && (
                        <Text style={styles.stylistName}>
                            Stylist: <Text style={{ fontWeight: '600', color: colors.primary }}>{item.stylist?.name || 'Any available'}</Text>
                        </Text>
                    )}
                </View>
                <View style={[styles.statusChip, { backgroundColor: cfg.bg }]}>
                    <MaterialIcons name={cfg.icon} size={12} color={cfg.color} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
            </View>

            {isAtHome && (
                <View style={styles.freelancerSection}>
                    <View style={styles.freelancerInfo}>
                        <View style={styles.experienceBadge}>
                            <MaterialIcons name="workspace-premium" size={14} color={colors.primary} />
                            <Text style={styles.experienceText}>
                                {item.partner?.basicInfo?.experience || 'Professional'} Experienced
                            </Text>
                        </View>
                        <View style={styles.verifiedBadge}>
                            <MaterialIcons name="verified" size={14} color="#0EA5E9" />
                            <Text style={styles.verifiedText}>Certified</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Distance and Time Row */}
            {(distanceStr || timeRemaining) && (
                <View style={styles.infoRow}>
                    {distanceStr && !isAtHome && (
                        <View style={styles.infoBadge}>
                            <MaterialIcons name="near-me" size={12} color={colors.primary} />
                            <Text style={styles.infoBadgeText}>{distanceStr}</Text>
                        </View>
                    )}
                    {timeRemaining && (
                        <View style={[styles.infoBadge, { backgroundColor: '#FFFBEB' }]}>
                            <MaterialIcons name="timer" size={12} color="#D97706" />
                            <Text style={[styles.infoBadgeText, { color: '#D97706' }]}>{timeRemaining}</Text>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.cardMeta}>
                <MaterialIcons name="calendar-today" size={13} color={colors.gray} />
                <Text style={styles.metaText}>{dateStr}</Text>
                {item.timeSlot ? (
                    <>
                        <MaterialIcons name="schedule" size={13} color={colors.gray} style={{ marginLeft: 8 }} />
                        <Text style={styles.metaText}>{item.timeSlot}</Text>
                    </>
                ) : null}
                <Text style={styles.totalText}>₹{item.totalAmount}</Text>
            </View>

            {/* Recipient info & Actions */}
            <View style={styles.bottomActions}>
                <View style={styles.recipientInfo}>
                    <MaterialIcons name="person" size={14} color={colors.gray} />
                    <Text style={styles.recipientText}>
                        {isSelf ? 'Self Booking' : `For: ${recipient}`}
                    </Text>
                </View>

                <View style={{ flex: 1 }} />

                {(item.status === 'Requested' || item.status === 'Confirmed') && (
                    <>
                        {isAtHome ? (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                                onPress={() => {
                                    const whatsappUrl = `whatsapp://send?phone=${providerPhone || ''}`;
                                    require('react-native').Linking.openURL(whatsappUrl).catch(() => {
                                        Alert.alert('Error', 'WhatsApp is not installed on your device');
                                    });
                                }}
                            >
                                <MaterialIcons name="chat" size={16} color={colors.white} />
                                <Text style={styles.actionBtnText}>WhatsApp</Text>
                            </TouchableOpacity>
                        ) : (
                            partnerAddr.lat && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                                    onPress={() => openMaps(partnerAddr.lat, partnerAddr.lng, partnerName)}
                                >
                                    <MaterialIcons name="directions" size={16} color={colors.white} />
                                    <Text style={styles.actionBtnText}>Direction</Text>
                                </TouchableOpacity>
                            )
                        )}
                    </>
                )}
            </View>

            {item.status === 'Completed' && (
                <TouchableOpacity style={styles.rebookBtn} onPress={() => onRebook(item)}>
                    <MaterialIcons name="refresh" size={14} color={colors.primary} />
                    <Text style={styles.rebookText}>Rebook</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

export default function BookingsScreen() {
    const navigation = useNavigation();
    const { auth, isLoggedIn } = useAuth();
    const { draft, updateDraft } = useBooking();
    const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'past'
    const [modeFilter, setModeFilter] = useState('all'); // 'all' | 'AtSalon' | 'AtHome'
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookings = useCallback(async () => {
        if (!auth?.customerId) return;
        setLoading(true);
        try {
            const data = await api.getCustomerBookings(auth.customerId);
            setBookings(Array.isArray(data) ? data : []);
        } catch { }
        setLoading(false);
    }, [auth?.customerId]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBookings();
        setRefreshing(false);
    };

    const upcoming = bookings.filter((b) => ['Requested', 'Confirmed'].includes(b.status));
    const past = bookings.filter((b) => ['Completed', 'Cancelled'].includes(b.status));
    let list = tab === 'upcoming' ? upcoming : past;

    // Apply mode filter
    if (modeFilter !== 'all') {
        list = list.filter(b => b.serviceMode === modeFilter);
    }

    const handleRebook = (booking) => {
        const services = (booking.services || []).map((s) => ({
            id: s.catalogId,
            name: s.serviceName,
            price: s.priceAtBooking,
            duration: 30,
        }));
        updateDraft({ selectedServices: services, serviceMode: booking.serviceMode || 'AtHome' });
        navigation.navigate('Home', { screen: 'ServiceList', params: {} });
    };

    if (!isLoggedIn) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.loginPrompt}>
                    <MaterialIcons name="calendar-today" size={56} color={colors.gray} />
                    <Text style={styles.loginPromptTitle}>Your bookings</Text>
                    <Text style={styles.loginPromptSub}>Login to see your upcoming and past bookings.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Bookings</Text>
            </View>

            {/* Sub-tabs */}
            <View style={styles.subTabRow}>
                {['upcoming', 'past'].map((t) => (
                    <TouchableOpacity key={t} style={[styles.subTab, tab === t && styles.subTabActive]} onPress={() => setTab(t)}>
                        <Text style={[styles.subTabText, tab === t && styles.subTabTextActive]}>{t === 'upcoming' ? 'Upcoming' : 'Past'}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Mode Filters */}
            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    data={MODE_CHIPS}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item.value}
                    contentContainerStyle={styles.filterList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.filterChip, modeFilter === item.value && styles.filterChipActive]}
                            onPress={() => setModeFilter(item.value)}
                        >
                            <MaterialIcons
                                name={item.icon}
                                size={14}
                                color={modeFilter === item.value ? colors.white : colors.gray}
                            />
                            <Text style={[styles.filterChipText, modeFilter === item.value && styles.filterChipTextActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {loading ? (
                <ActivityIndicator style={{ flex: 1 }} color={colors.primary} size="large" />
            ) : (
                <FlatList
                    data={list}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <BookingCard item={item} userLocation={draft.location} onRebook={handleRebook} />}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialIcons name="event-busy" size={48} color={colors.gray} />
                            <Text style={styles.emptyText}>No {tab} bookings</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingVertical: 18, backgroundColor: colors.white },
    headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
    subTabRow: { flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    subTab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    subTabActive: { borderBottomColor: colors.primary },
    subTabText: { fontSize: 14, fontWeight: '600', color: colors.gray },
    subTabTextActive: { color: colors.primary },
    listContent: { padding: 16, gap: 12 },
    card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    serviceName: { fontSize: 16, fontWeight: '700', color: colors.text },
    providerName: { fontSize: 13, color: colors.gray, marginTop: 3 },
    stylistName: { fontSize: 12, color: colors.gray, marginTop: 4 },
    statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: '700' },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: colors.gray, marginRight: 4 },
    totalText: { marginLeft: 'auto', fontSize: 15, fontWeight: '800', color: colors.text },
    rebookBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, borderTopWidth: 1, borderTopColor: colors.grayBorder, paddingTop: 10 },
    rebookText: { fontSize: 14, fontWeight: '700', color: colors.primary },
    empty: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyText: { color: colors.gray, fontSize: 15, fontWeight: '500' },
    loginPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
    loginPromptTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
    loginPromptSub: { fontSize: 14, color: colors.gray, textAlign: 'center' },
    infoRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    infoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    infoBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
    bottomActions: { flexDirection: 'row', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: colors.grayBorder, paddingTop: 12 },
    recipientInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    recipientText: { fontSize: 12, color: colors.gray, fontWeight: '600' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    actionBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },
    filterContainer: { backgroundColor: colors.white, paddingVertical: 12 },
    filterList: { paddingHorizontal: 16, gap: 8 },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        gap: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterChipText: { fontSize: 13, fontWeight: '600', color: colors.gray },
    filterChipTextActive: { color: colors.white },
    freelancerSection: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    freelancerInfo: { flexDirection: 'row', gap: 8 },
    experienceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    experienceText: { fontSize: 11, fontWeight: '700', color: '#059669' },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    verifiedText: { fontSize: 11, fontWeight: '700', color: '#0EA5E9' },
});
