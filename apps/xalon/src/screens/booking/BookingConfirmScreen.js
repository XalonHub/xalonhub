import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    TextInput, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Mini login gate shown inline when user is not authenticated ---
function LoginGate({ onSuccess }) {
    const { login } = useAuth();
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('phone'); // 'phone' | 'otp'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const requestOTP = async () => {
        if (phone.length !== 10) { setError('Enter a valid 10-digit number'); return; }
        setLoading(true); setError('');
        const res = await api.sendOTP(phone);
        setLoading(false);
        if (res.success) { setStep('otp'); } else { setError(res.message || 'Failed to send OTP'); }
    };

    const verifyOTP = async () => {
        if (otp.length !== 4) { setError('Enter the 4-digit OTP'); return; }
        setLoading(true); setError('');
        const res = await api.verifyOTP(phone, otp);
        setLoading(false);
        if (res.success) {
            await login({ token: res.token, user: res.user, customerProfile: res.customerProfile });
            onSuccess();
        } else {
            setError(res.message || 'Invalid OTP');
        }
    };

    return (
        <View style={gStyles.gate}>
            <MaterialIcons name="lock" size={32} color={colors.primary} />
            <Text style={gStyles.title}>Login to continue</Text>
            <Text style={gStyles.sub}>Quick login with your phone number</Text>
            {step === 'phone' ? (
                <>
                    <View style={gStyles.inputRow}>
                        <Text style={gStyles.flag}>🇮🇳 +91</Text>
                        <TextInput style={gStyles.input} placeholder="10-digit mobile" keyboardType="phone-pad" maxLength={10} value={phone} onChangeText={setPhone} placeholderTextColor={colors.gray} />
                    </View>
                    {error ? <Text style={gStyles.err}>{error}</Text> : null}
                    <TouchableOpacity style={gStyles.btn} onPress={requestOTP} disabled={loading} activeOpacity={0.85}>
                        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={gStyles.btnText}>Send OTP</Text>}
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <Text style={gStyles.otpLabel}>Enter OTP sent to +91 {phone}</Text>
                    <TextInput style={[gStyles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 10, marginBottom: 8 }]} placeholder="••••" keyboardType="number-pad" maxLength={4} value={otp} onChangeText={setOtp} placeholderTextColor={colors.gray} />
                    {error ? <Text style={gStyles.err}>{error}</Text> : null}
                    <TouchableOpacity style={gStyles.btn} onPress={verifyOTP} disabled={loading} activeOpacity={0.85}>
                        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={gStyles.btnText}>Verify OTP</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setStep('phone'); setOtp(''); }} style={{ marginTop: 10 }}>
                        <Text style={{ color: colors.primary, fontWeight: '600', textAlign: 'center' }}>Change number</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

const gStyles = StyleSheet.create({
    gate: { padding: 24, alignItems: 'center', borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: 20, gap: 10, margin: 16, backgroundColor: colors.white },
    title: { fontSize: 18, fontWeight: '800', color: colors.text },
    sub: { fontSize: 13, color: colors.gray },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: 12, paddingHorizontal: 14, width: '100%' },
    flag: { fontSize: 15, marginRight: 8 },
    input: { flex: 1, fontSize: 16, paddingVertical: 12, color: colors.text },
    otpLabel: { fontSize: 13, color: colors.gray },
    err: { color: colors.error, fontSize: 13, fontWeight: '600' },
    btn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, width: '100%', alignItems: 'center' },
    btnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});

// ── Main confirm screen ─────────────────────────────────────────────────────

export default function BookingConfirmScreen() {
    const navigation = useNavigation();
    const { draft, updateDraft, totalPrice, resetDraft } = useBooking();
    const { auth, isLoggedIn } = useAuth();
    const [name, setName] = useState(auth?.customerName || '');
    const [loading, setLoading] = useState(false);

    // If just logged in via gate, refresh name
    const handleLoginSuccess = () => {
        if (auth?.customerName) setName(auth.customerName);
    };

    const handleBook = async () => {
        // Validation: Ensure customer has a gender set
        if (!auth?.customerProfile?.gender) {
            Alert.alert(
                'Profile Incomplete',
                'Please set your identity in your profile before booking.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Set Now', onPress: () => navigation.navigate('EditProfile') }
                ]
            );
            return;
        }

        setLoading(true);
        try {
            const payload = {
                serviceIds: draft.selectedServices.map((s) => s.id),
                serviceMode: draft.serviceMode,
                location: draft.location,
                bookingDate: draft.bookingDate,
                timeSlot: draft.timeSlot,
                customerId: auth?.customerId || null,
                guestName: name || null,
                customerPhone: auth?.phone || null,
            };
            const result = await api.autoAssignBooking(payload);

            if (result.error === 'NO_PROVIDERS') {
                navigation.navigate('ProviderAssigned', { noProvider: true });
                return;
            }
            if (result.error) {
                Alert.alert('Booking failed', result.message || 'Please try again.');
                return;
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
                <Text style={styles.headerTitle}>Confirm Booking</Text>
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

                {/* Payment note */}
                <View style={[styles.card, { backgroundColor: '#F0FDF4' }]}>
                    <View style={styles.dtRow}>
                        <MaterialIcons name="payments" size={18} color={colors.success} />
                        <Text style={[styles.dtText, { color: colors.success, fontWeight: '700' }]}>Pay after service</Text>
                    </View>
                </View>

                {/* Auth gate OR name input */}
                {!isLoggedIn ? (
                    <LoginGate onSuccess={handleLoginSuccess} />
                ) : (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Your Name</Text>
                        <TextInput
                            style={styles.nameInput}
                            value={name}
                            onChangeText={setName}
                            placeholder="Your name"
                            placeholderTextColor={colors.gray}
                        />
                        <Text style={styles.phoneNote}>
                            <MaterialIcons name="phone" size={13} color={colors.gray} /> {auth?.phone}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {isLoggedIn && (
                <View style={styles.footer}>
                    <View style={styles.assignNote}>
                        <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
                        <Text style={styles.assignNoteText}>We'll assign the best available professional near you.</Text>
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
                                <Text style={styles.bookBtnText}>Finding professional…</Text>
                            </>
                        ) : (
                            <>
                                <MaterialIcons name="flash-on" size={18} color={colors.white} />
                                <Text style={styles.bookBtnText}>Book Now – ₹{totalPrice}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
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
});
