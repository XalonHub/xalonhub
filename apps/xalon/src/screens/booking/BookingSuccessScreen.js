import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, StatusBar, Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';

export default function BookingSuccessScreen() {
    const navigation = useNavigation();
    const { draft, resetDraft } = useBooking();
    const booking = draft.confirmedBooking;
    const provider = draft.assignedProvider;

    const openWhatsApp = () => {
        if (!provider?.whatsappPhone) return;
        const servicesText = draft.selectedServices.map((s) => s.name).join(', ');
        const msg = encodeURIComponent(`Hi! I just confirmed my Xalon booking for *${servicesText}* on ${draft.bookingDate} at ${draft.timeSlot}. Looking forward to it!`);
        Linking.openURL(`https://wa.me/91${provider.whatsappPhone}?text=${msg}`);
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
                        <Text style={[styles.rowValue, { color: colors.success }]}>Pay after service</Text>
                    </View>
                </View>

                {/* WhatsApp CTA */}
                {provider?.whatsappPhone && (
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
    footer: { padding: 16, paddingBottom: 36, gap: 10 },
    viewBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
    viewBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
    homeBtn: { backgroundColor: colors.grayLight, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
    homeBtnText: { color: colors.text, fontWeight: '700', fontSize: 16 },
});
