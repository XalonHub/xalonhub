import {
    View, Text, TouchableOpacity, StyleSheet, StatusBar, Linking, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';
import { openMaps, formatWhatsAppUrl } from '../../utils/bookingUtils';
import api from '../../services/api';

const PARTNER_TYPE_LABELS = {
    Freelancer: 'Freelancer',
    Male_Salon: 'Salon',
    Female_Salon: 'Salon',
    Unisex_Salon: 'Salon',
};

// Helper for image URLs
const getImageUrl = (url) => {
    const BU = api.BASE_URL || 'http://localhost:5001';
    if (!url) return null;
    if (url.startsWith('http')) {
        return url.replace(/http:\/\/192\.168\.1\.10:5000\/g/, BU);
    }
    return `${BU}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function BookingSuccessScreen() {
    const navigation = useNavigation();
    const { draft, resetDraft } = useBooking();
    const booking = draft.confirmedBooking;
    const provider = draft.assignedProvider;

    const openWhatsApp = () => {
        const phone = provider?.whatsappPhone || provider?.user?.phone || provider?.phone || provider?.basicInfo?.phone;
        if (!phone) return;
        const servicesText = draft.selectedServices.map((s) => s.name).join(', ');
        const msg = `Hi! I just confirmed my Xalon booking for *${servicesText}* on ${draft.bookingDate} at ${draft.timeSlot}. Looking forward to it!`;
        const url = formatWhatsAppUrl(phone, msg);
        if (url) {
            Linking.openURL(url).catch(err => {
                console.error("WhatsApp error:", err);
                Alert.alert("Error", "Could not open WhatsApp.");
            });
        }
    };

    const goHome = () => {
        resetDraft();
        navigation.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] })
        );
    };

    const viewBooking = () => {
        resetDraft();
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'MainTabs', params: { screen: 'Bookings' } }],
            })
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <View style={styles.container}>
                {/* Success icon */}
                <View style={styles.successCircle}>
                    <MaterialIcons name="check" size={52} color={colors.white} />
                </View>
                <Text style={styles.title}>Booking Confirmed!</Text>
                <Text style={styles.sub}>
                    Your booking has been placed. Your professional will be confirmed shortly.
                </Text>

                {/* Provider/Salon Card */}
                {draft.serviceMode === 'AtSalon' ? (
                    draft.selectedSalon && (
                        <View style={styles.providerCard}>
                            <View style={[styles.providerAvatar, { backgroundColor: '#F3E8FF' }]}>
                                {draft.selectedSalon.logoImage ? (
                                    <Image source={{ uri: getImageUrl(draft.selectedSalon.logoImage) }} style={styles.providerAvatarImg} />
                                ) : (
                                    <MaterialIcons name="storefront" size={32} color={colors.primary} />
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.providerName}>{draft.selectedSalon.businessName || draft.selectedSalon.name}</Text>
                                <View style={styles.metaItem}>
                                    <MaterialIcons name="location-on" size={13} color={colors.gray} />
                                    <Text style={styles.metaText} numberOfLines={2}>
                                        {draft.selectedSalon.addressLine ? `${draft.selectedSalon.addressLine}, ` : ''}
                                        {draft.selectedSalon.area || draft.selectedSalon.city}
                                    </Text>
                                </View>
                            </View>
                            {draft.selectedSalon.lat && (
                                <TouchableOpacity
                                    style={styles.dirBtnSmall}
                                    onPress={() => openMaps(draft.selectedSalon.lat, draft.selectedSalon.lng, draft.selectedSalon.businessName || draft.selectedSalon.name)}
                                >
                                    <MaterialIcons name="directions" size={18} color={colors.white} />
                                    <Text style={styles.dirBtnText}>Direction</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )
                ) : (
                    provider && (
                        <View style={styles.providerCard}>
                            <View style={styles.providerAvatar}>
                                {provider.coverImage ? (
                                    <Image source={{ uri: getImageUrl(provider.coverImage) }} style={styles.providerAvatarImg} />
                                ) : (
                                    <MaterialIcons name="person" size={32} color={colors.primary} />
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.providerName}>{provider.name || 'Professional'}</Text>
                                <View style={styles.typeBadge}>
                                    <Text style={styles.typeBadgeText}>{PARTNER_TYPE_LABELS[provider.type] || provider.type}</Text>
                                </View>
                            </View>
                            <View style={styles.ratingBadge}>
                                <MaterialIcons name="star" size={14} color="#F59E0B" />
                                <Text style={styles.ratingText}>{provider.rating || '—'}</Text>
                            </View>
                        </View>
                    )
                )}

                {/* Booking summary card */}
                <View style={styles.summaryCard}>
                    {booking?.id && (
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Booking ID</Text>
                            <Text style={styles.rowValue}>#{booking.id.split('-')[0].toUpperCase()}</Text>
                        </View>
                    )}
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Date</Text>
                        <Text style={styles.rowValue}>{draft.bookingDate || '—'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Time</Text>
                        <Text style={styles.rowValue}>{draft.timeSlot || '—'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Mode</Text>
                        <Text style={styles.rowValue}>{draft.serviceMode === 'AtHome' ? 'At Home' : 'At Salon'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Total</Text>
                        <Text style={[styles.rowValue, { color: colors.primary }]}>₹{booking?.totalAmount || draft.selectedServices.reduce((s, x) => s + x.price, 0)}</Text>
                    </View>
                    <View style={[styles.row, { marginTop: 4 }]}>
                        <Text style={styles.rowLabel}>Payment</Text>
                        <Text style={[styles.rowValue, { color: (booking?.paymentStatus === 'Paid' || draft.confirmedBooking?.paymentStatus === 'Paid') ? colors.success : colors.gold }]}>
                            {booking?.paymentMethod === 'Online' || draft.confirmedBooking?.paymentMethod === 'Online'
                                ? 'Paid Online'
                                : 'Pay after service'}
                        </Text>
                    </View>
                </View>

                {/* AtSalon specific note */}
                {draft.serviceMode === 'AtSalon' && (
                    <View style={styles.salonNote}>
                        <MaterialIcons name="confirmation-number" size={20} color={colors.primary} />
                        <Text style={styles.salonNoteText}>
                            Show this at the counter when you arrive.
                        </Text>
                    </View>
                )}

                {/* WhatsApp CTA */}
                {provider?.whatsappPhone && provider?.type === 'Freelancer' && (
                    <TouchableOpacity style={styles.waBtn} onPress={openWhatsApp} activeOpacity={0.85}>
                        <MaterialIcons name="chat" size={18} color="#25D366" />
                        <Text style={styles.waBtnText}>Send WhatsApp Confirmation</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Bottom CTAs */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.viewBtn} onPress={viewBooking} activeOpacity={0.85}>
                    <Text style={styles.viewBtnText}>View Booking</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.homeBtn} onPress={goHome} activeOpacity={0.85}>
                    <Text style={styles.homeBtnText}>Back to Home</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, alignItems: 'center', paddingTop: 40, paddingHorizontal: 24, gap: 16 },
    successCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 8, shadowColor: colors.success, shadowOpacity: 0.4, shadowRadius: 16 },
    title: { fontSize: 26, fontWeight: '900', color: colors.text },
    sub: { fontSize: 14, color: colors.gray, textAlign: 'center', lineHeight: 21 },
    summaryCard: { backgroundColor: colors.white, borderRadius: 20, padding: 20, width: '100%', elevation: 2, gap: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowLabel: { fontSize: 13, color: colors.gray, fontWeight: '600' },
    rowValue: { fontSize: 14, color: colors.text, fontWeight: '700' },
    waBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#25D366', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#F0FFF4', width: '100%', justifyContent: 'center' },
    waBtnText: { fontSize: 15, fontWeight: '700', color: '#128C7E' },
    providerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 20, padding: 16, width: '100%', elevation: 2, gap: 12, borderLeftWidth: 4, borderLeftColor: colors.primary },
    providerAvatar: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    providerAvatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    providerName: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaText: { fontSize: 12, color: colors.gray, flex: 1 },
    dirBtnSmall: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center', gap: 2 },
    dirBtnText: { color: colors.white, fontSize: 10, fontWeight: '700' },
    typeBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
    typeBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF9C3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    ratingText: { fontSize: 13, fontWeight: '800', color: '#92400E' },
    salonNote: { backgroundColor: colors.primarySoft || '#E3F2FD', padding: 16, borderRadius: 16, width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 },
    salonNoteText: { flex: 1, fontSize: 14, color: colors.primary, fontWeight: '700' },
    footer: { padding: 16, paddingBottom: 36, gap: 10 },
    viewBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
    viewBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
    homeBtn: { backgroundColor: colors.grayLight, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
    homeBtnText: { color: colors.text, fontWeight: '700', fontSize: 16 },
});
