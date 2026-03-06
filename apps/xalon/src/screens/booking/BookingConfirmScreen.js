import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    TextInput, StatusBar, ActivityIndicator, Alert, Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Removing old inline LoginGate as we now use late-stage redirection

// ── Main confirm screen ─────────────────────────────────────────────────────

export default function BookingConfirmScreen() {
    const navigation = useNavigation();
    const { draft, updateDraft, totalPrice, resetDraft } = useBooking();
    const { auth } = useAuth();
    const [paymentMethod, setPaymentMethod] = useState('Online');
    const [loading, setLoading] = useState(false);
    const [isSomeoneElse, setIsSomeoneElse] = useState(false);
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');

    const profile = auth?.customerProfile;
    const addresses = profile?.addresses || [];
    const selectedAddress = addresses.find(a => a.isDefault) || addresses[0];

    const handleBook = async () => {
        // Validation: Address is mandatory for At Home
        if (draft.serviceMode === 'AtHome' && !selectedAddress) {
            Alert.alert(
                'Address Required',
                'Please add your service address for home visit.',
                [{ text: 'Add Address', onPress: () => navigation.navigate('EditAddress') }]
            );
            return;
        }

        if (isSomeoneElse && !recipientName.trim()) {
            Alert.alert('Recipient Name Required', 'Please provide the name of the person receiving the service.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                serviceIds: draft.selectedServices.map((s) => s.id),
                serviceMode: draft.serviceMode,
                serviceGender: draft.gender, // The gender requirement of the services
                salonId: draft.serviceMode === 'AtSalon' ? draft.selectedSalon?.id : undefined,
                beneficiaryName: isSomeoneElse ? recipientName : (profile?.name || 'Self'),
                beneficiaryPhone: isSomeoneElse ? recipientPhone : (auth?.phone || null),
                location: draft.serviceMode === 'AtHome' ? {
                    city: selectedAddress.city,
                    lat: selectedAddress.lat,
                    lng: selectedAddress.lng,
                    addressLine: selectedAddress.addressLine
                } : {
                    city: draft.selectedSalon?.city || draft.location?.city,
                    lat: draft.selectedSalon?.lat || draft.location?.lat,
                    lng: draft.selectedSalon?.lng || draft.location?.lng,
                    addressLine: draft.selectedSalon?.addressLine || '',
                },
                bookingDate: draft.bookingDate,
                timeSlot: draft.timeSlot,
                customerId: auth?.customerId,
                paymentMethod
            };

            // 1. Auto-assign and Create Booking
            const result = await api.autoAssignBooking(payload);

            if (result.error === 'NO_PROVIDERS') {
                navigation.navigate('ProviderAssigned', { noProvider: true });
                return;
            }

            // 2. Initiate Payment
            const payRes = await api.initiatePayment({
                bookingId: result.booking.id,
                paymentMethod
            });

            if (paymentMethod === 'Online') {
                // For V0, we assume success or open a link
                // navigation.navigate('PaytmPage', { params: payRes.paytmParams });
                Alert.alert('Payment Initiated', 'Directing to Paytm UPI...');
            }

            updateDraft({ assignedProvider: result.assignedProvider, confirmedBooking: result.booking });
            navigation.navigate('ProviderAssigned', { noProvider: false });
        } catch (err) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleRow}>
                    <Image
                        source={require('../../assets/brand/logo_icon.png')}
                        style={styles.headerIcon}
                        resizeMode="contain"
                    />
                    <Text style={styles.headerTitle}>Confirm Booking</Text>
                </View>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Services summary */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Services</Text>
                    {draft.selectedServices.map((s) => (
                        <View key={s.id} style={styles.serviceRow}>
                            <Text style={styles.serviceName}>{s.name}</Text>
                            <Text style={styles.servicePrice}>₹{s.price}</Text>
                        </View>
                    ))}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalPrice}>₹{totalPrice}</Text>
                    </View>
                </View>

                {/* Date & time */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Date & Time</Text>
                    <View style={styles.dtRow}>
                        <MaterialIcons name="calendar-today" size={16} color={colors.primary} />
                        <Text style={styles.dtText}>{formatDate(draft.bookingDate)}</Text>
                        <MaterialIcons name="schedule" size={16} color={colors.primary} style={{ marginLeft: 16 }} />
                        <Text style={styles.dtText}>{draft.timeSlot}</Text>
                    </View>
                </View>

                {/* Mode */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Service Mode</Text>
                    <View style={styles.dtRow}>
                        <MaterialIcons name={draft.serviceMode === 'AtHome' ? 'home' : 'storefront'} size={16} color={colors.primary} />
                        <Text style={styles.dtText}>{draft.serviceMode === 'AtHome' ? 'At Home – Freelancer will visit you' : 'At Salon – Visit the salon'}</Text>
                    </View>
                </View>

                {/* Address Handling */}
                {draft.serviceMode === 'AtHome' ? (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Service Address</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('AddressList')}>
                                <Text style={styles.changeText}>Change</Text>
                            </TouchableOpacity>
                        </View>
                        {selectedAddress ? (
                            <View style={styles.addressBox}>
                                <MaterialIcons name="location-on" size={20} color={colors.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                                    <Text style={styles.addressText}>{selectedAddress.addressLine}, {selectedAddress.city}</Text>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.addAddrBtn} onPress={() => navigation.navigate('EditAddress')}>
                                <MaterialIcons name="add-location" size={20} color={colors.primary} />
                                <Text style={styles.addAddrText}>Add Address</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Salon Address</Text>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text style={styles.changeText}>Change Salon</Text>
                            </TouchableOpacity>
                        </View>
                        {draft.selectedSalon ? (
                            <View style={styles.addressBox}>
                                <MaterialIcons name="storefront" size={20} color={colors.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.addressLabel}>
                                        {draft.selectedSalon.businessName || draft.selectedSalon.name}
                                    </Text>
                                    <Text style={styles.addressText}>
                                        {draft.selectedSalon.addressLine
                                            ? `${draft.selectedSalon.addressLine}, `
                                            : ''}{draft.selectedSalon.area || draft.selectedSalon.city || 'Location not set'}
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.addressBox}>
                                <MaterialIcons name="storefront" size={20} color={colors.gray} />
                                <Text style={[styles.addressText, { color: colors.gray }]}>Using Salon's verified location</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Payment Selection */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Payment Method</Text>
                    <View style={styles.paymentOptions}>
                        <TouchableOpacity
                            style={[styles.payOption, paymentMethod === 'Online' && styles.payOptionActive]}
                            onPress={() => setPaymentMethod('Online')}
                        >
                            <MaterialIcons name="qr-code-2" size={24} color={paymentMethod === 'Online' ? colors.primary : colors.gray} />
                            <Text style={[styles.payText, paymentMethod === 'Online' && styles.payTextActive]}>UPI / Online</Text>
                            {paymentMethod === 'Online' && <MaterialIcons name="check-circle" size={18} color={colors.primary} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.payOption, paymentMethod === 'Cash' && styles.payOptionActive]}
                            onPress={() => setPaymentMethod('Cash')}
                        >
                            <MaterialIcons name="payments" size={24} color={paymentMethod === 'Cash' ? colors.primary : colors.gray} />
                            <Text style={[styles.payText, paymentMethod === 'Cash' && styles.payTextActive]}>Cash After Service</Text>
                            {paymentMethod === 'Cash' && <MaterialIcons name="check-circle" size={18} color={colors.primary} />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recipient info */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Service Recipient</Text>
                    <View style={styles.recipientToggle}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, !isSomeoneElse && styles.toggleBtnActive]}
                            onPress={() => setIsSomeoneElse(false)}
                        >
                            <Text style={[styles.toggleBtnText, !isSomeoneElse && styles.toggleBtnTextActive]}>Myself</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, isSomeoneElse && styles.toggleBtnActive]}
                            onPress={() => setIsSomeoneElse(true)}
                        >
                            <Text style={[styles.toggleBtnText, isSomeoneElse && styles.toggleBtnTextActive]}>Someone else</Text>
                        </TouchableOpacity>
                    </View>

                    {isSomeoneElse ? (
                        <View style={styles.recipientForm}>
                            <TextInput
                                style={styles.recipientInput}
                                placeholder="Recipient Name"
                                value={recipientName}
                                onChangeText={setRecipientName}
                            />
                            <TextInput
                                style={styles.recipientInput}
                                placeholder="Recipient Phone (Optional)"
                                value={recipientPhone}
                                onChangeText={setRecipientPhone}
                                keyboardType="phone-pad"
                            />
                        </View>
                    ) : (
                        <View style={styles.dtRow}>
                            <MaterialIcons name="person-outline" size={18} color={colors.gray} />
                            <Text style={styles.dtText}>{profile?.name || 'Guest User'}</Text>
                            <Text style={styles.dot}>•</Text>
                            <Text style={styles.dtText}>{profile?.gender || 'Gender Not Set'}</Text>
                        </View>
                    )}
                </View>

                {/* Identity Note */}
                <View style={[styles.card, { backgroundColor: colors.primarySoft, borderLeftWidth: 4, borderLeftColor: colors.primary }]}>
                    <View style={styles.dtRow}>
                        <MaterialIcons name="security" size={18} color={colors.primary} />
                        <Text style={[styles.dtText, { color: colors.primary, fontWeight: '700' }]}>
                            {draft.gender} Professional Required
                        </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 4 }}>
                        A {draft.gender === 'Female' ? 'female' : 'male'} professional will be assigned to serve the recipient.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.assignNote}>
                    <MaterialIcons name="verified" size={16} color={colors.primary} />
                    <Text style={styles.assignNoteText}>Top-rated professional will be auto-assigned for your slot.</Text>
                </View>
                <TouchableOpacity
                    style={[styles.bookBtn, loading && { opacity: 0.7 }]}
                    onPress={handleBook}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <>
                            <ActivityIndicator color={colors.white} />
                            <Text style={styles.bookBtnText}>Confirming Booking…</Text>
                        </>
                    ) : (
                        <>
                            <MaterialIcons name="check-circle" size={18} color={colors.white} />
                            <Text style={styles.bookBtnText}>Confirm & Pay – ₹{totalPrice}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerIcon: { width: 24, height: 24 },
    headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
    scroll: { flex: 1 },
    card: { backgroundColor: colors.white, margin: 16, marginBottom: 0, borderRadius: 16, padding: 18, elevation: 1 },
    cardTitle: { fontSize: 13, fontWeight: '700', color: colors.gray, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
    serviceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    serviceName: { fontSize: 15, color: colors.text, fontWeight: '500' },
    servicePrice: { fontSize: 15, color: colors.text, fontWeight: '700' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.grayBorder, paddingTop: 10, marginTop: 4 },
    totalLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
    totalPrice: { fontSize: 16, fontWeight: '800', color: colors.primary },
    dtRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dtText: { fontSize: 15, color: colors.text, fontWeight: '500' },
    nameInput: { borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, marginBottom: 8 },
    phoneNote: { fontSize: 13, color: colors.gray },
    footer: { padding: 16, paddingBottom: 32, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.grayBorder, gap: 10 },
    assignNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryLight, padding: 10, borderRadius: 10 },
    assignNoteText: { fontSize: 12, color: colors.primary, fontWeight: '600', flex: 1 },
    bookBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    bookBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    changeText: { fontSize: 13, color: colors.primary, fontWeight: '700' },
    addressBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.background, padding: 12, borderRadius: 12 },
    addressLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
    addressText: { fontSize: 13, color: colors.textLight, marginTop: 2 },
    addAddrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.primary, borderRadius: 12 },
    addAddrText: { color: colors.primary, fontWeight: '700' },
    paymentOptions: { gap: 10 },
    payOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.grayBorder },
    payOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    payText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.gray },
    payTextActive: { color: colors.text, fontWeight: '700' },
    dot: { marginHorizontal: 6, color: colors.gray },
    editText: { marginLeft: 10, color: colors.primary, fontWeight: '700', fontSize: 13 },

    recipientToggle: { flexDirection: 'row', backgroundColor: colors.grayBorder, borderRadius: 12, padding: 4, marginBottom: 12 },
    toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    toggleBtnActive: { backgroundColor: colors.white, elevation: 2 },
    toggleBtnText: { fontSize: 13, fontWeight: '600', color: colors.gray },
    toggleBtnTextActive: { color: colors.text, fontWeight: '700' },
    recipientForm: { gap: 8 },
    recipientInput: { backgroundColor: colors.background, borderRadius: 10, padding: 12, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.grayBorder },
});
