import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, StatusBar, Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';
import { openMaps } from '../../utils/bookingUtils';

const PARTNER_TYPE_LABELS = {
    Freelancer: 'Freelancer',
    Male_Salon: 'Salon',
    Female_Salon: 'Salon',
    Unisex_Salon: 'Salon',
};

export default function ProviderAssignedScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { draft } = useBooking();
    const { noProvider } = route.params || {};
    const provider = draft.assignedProvider;
    const isAtSalon = draft.serviceMode === 'AtSalon';

    const openWhatsApp = () => {
        if (!provider?.whatsappPhone) return;
        const msg = encodeURIComponent('Hi, I booked via Xalon. Looking forward to my appointment!');
        Linking.openURL(`https://wa.me/91${provider.whatsappPhone}?text=${msg}`);
    };

    if (noProvider) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <MaterialIcons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.fallback}>
                    <MaterialIcons name="search-off" size={64} color={colors.gray} />
                    <Text style={styles.fallbackTitle}>No professionals available</Text>
                    <Text style={styles.fallbackSub}>No professionals available right now. Please try a different time or location.</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.retryBtnText}>Try Different Time</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── AtSalon: Salon Booking Confirmed ────────────────────────────────────
    if (isAtSalon) {
        const salon = draft.selectedSalon;
        const booking = draft.confirmedBooking;
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
                <View style={styles.header}>
                    <View style={{ width: 24 }} />
                    <Text style={styles.headerTitle}>Booking Confirmed</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Success badge */}
                <View style={styles.assignedBadge}>
                    <MaterialIcons name="check-circle" size={20} color={colors.success} />
                    <Text style={styles.assignedText}>Your salon appointment is confirmed!</Text>
                </View>

                {/* Salon card */}
                <View style={styles.providerCard}>
                    <View style={[styles.providerAvatar, { backgroundColor: '#F3E8FF' }]}>
                        <MaterialIcons name="storefront" size={36} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.providerName}>
                            {salon?.businessName || salon?.name || 'Salon'}
                        </Text>
                        <View style={styles.metaItem}>
                            <MaterialIcons name="location-on" size={13} color={colors.gray} />
                            <Text style={styles.metaText}>
                                {salon?.addressLine
                                    ? `${salon.addressLine}, `
                                    : ''}{salon?.area || salon?.city || 'Location not set'}
                            </Text>
                        </View>
                        {booking?.id && (
                            <Text style={[styles.metaText, { marginTop: 4, fontWeight: '700', color: colors.primary }]}>
                                Booking ID: #{booking.id.toString().slice(-6).toUpperCase()}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Show at counter note & Direction */}
                <View style={styles.actionRow}>
                    <View style={[styles.assignedBadge, { backgroundColor: colors.primarySoft, marginTop: 0, flex: 1, margin: 0 }]}>
                        <MaterialIcons name="confirmation-number" size={18} color={colors.primary} />
                        <Text style={[styles.assignedText, { color: colors.primary }]}>
                            Show this at the counter when you arrive.
                        </Text>
                    </View>

                    {salon?.lat && (
                        <TouchableOpacity
                            style={styles.actionDirBtn}
                            onPress={() => openMaps(salon.lat, salon.lng, salon.businessName || salon.name)}
                        >
                            <MaterialIcons name="directions" size={18} color={colors.white} />
                            <Text style={styles.actionDirText}>Direction</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ flex: 1 }} />

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={() => navigation.navigate('BookingSuccess')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.confirmBtnText}>Done</Text>
                        <MaterialIcons name="check" size={18} color={colors.white} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── AtHome: Freelancer Assigned ──────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={styles.header}>
                <View style={{ width: 24 }} />
                <Text style={styles.headerTitle}>Professional Assigned</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Assigned badge */}
            <View style={styles.assignedBadge}>
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
                <Text style={styles.assignedText}>A professional has been matched for your booking</Text>
            </View>

            {/* Provider card */}
            <View style={styles.providerCard}>
                <View style={styles.providerAvatar}>
                    <MaterialIcons name="person" size={40} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.providerName}>{provider?.name || 'Professional'}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.typeBadge}>
                            <Text style={styles.typeBadgeText}>{PARTNER_TYPE_LABELS[provider?.type] || provider?.type}</Text>
                        </View>
                        {provider?.area ? (
                            <View style={styles.metaItem}>
                                <MaterialIcons name="location-on" size={13} color={colors.gray} />
                                <Text style={styles.metaText}>{provider.area}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>
                <View style={styles.ratingBadge}>
                    <MaterialIcons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>{provider?.rating || '—'}</Text>
                </View>
            </View>

            {/* WhatsApp button */}
            {provider?.whatsappPhone && (
                <TouchableOpacity style={styles.waBtn} onPress={openWhatsApp} activeOpacity={0.85}>
                    <MaterialIcons name="chat" size={20} color="#25D366" />
                    <Text style={styles.waBtnText}>Contact on WhatsApp</Text>
                </TouchableOpacity>
            )}

            <View style={{ flex: 1 }} />

            {/* Confirm CTA */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => navigation.navigate('BookingSuccess')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.confirmBtnText}>Confirm Booking</Text>
                    <MaterialIcons name="check" size={18} color={colors.white} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
    assignedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12 },
    assignedText: { fontSize: 13, fontWeight: '600', color: colors.success, flex: 1 },
    providerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, margin: 16, marginTop: 0, borderRadius: 20, padding: 18, elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, gap: 14 },
    providerAvatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    providerName: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    typeBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    typeBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaText: { fontSize: 12, color: colors.gray },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF9C3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    ratingText: { fontSize: 14, fontWeight: '800', color: '#92400E' },
    waBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 16, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#25D366', backgroundColor: '#F0FFF4' },
    waBtnText: { fontSize: 15, fontWeight: '700', color: '#128C7E' },
    fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
    fallbackTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
    fallbackSub: { fontSize: 15, color: colors.gray, textAlign: 'center', lineHeight: 22 },
    retryBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 },
    retryBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
    footer: { padding: 16, paddingBottom: 36, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.grayBorder },
    confirmBtn: { backgroundColor: colors.success, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    confirmBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
    actionRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 16, alignItems: 'stretch' },
    actionDirBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', gap: 4 },
    actionDirText: { color: colors.white, fontSize: 12, fontWeight: '700' },
});
