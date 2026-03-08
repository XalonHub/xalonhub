import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Generate next N days
function getNextDays(n = 14) {
    const days = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        days.push(d);
    }
    return days;
}

// Generate time slots 9 AM – 8 PM in 30-min increments
function getTimeSlots() {
    const slots = [];
    for (let h = 9; h < 20; h++) {
        ['00', '30'].forEach((m) => {
            const ampm = h < 12 ? 'AM' : 'PM';
            const displayH = h > 12 ? h - 12 : h;
            slots.push({ value: `${String(h).padStart(2, '0')}:${m}`, label: `${displayH}:${m} ${ampm}` });
        });
    }
    return slots;
}

const DAYS = getNextDays();
const TIME_SLOTS = getTimeSlots();

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function BookingDateTimeScreen() {
    const navigation = useNavigation();
    const { draft, updateDraft } = useBooking();
    const { auth } = useAuth();

    const [selectedDate, setSelectedDate] = useState(draft.bookingDate || null);
    const [selectedSlot, setSelectedSlot] = useState(draft.timeSlot || null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedDate) fetchSlots(selectedDate);
    }, [selectedDate]);

    const fetchSlots = async (date) => {
        try {
            setLoading(true);
            const params = {
                serviceIds: draft.selectedServices.map(s => s.id),
                serviceMode: draft.serviceMode,
                salonId: draft.serviceMode === 'AtSalon' ? draft.selectedSalon?.id : undefined,
                date,
                lat: draft.location?.lat,
                lng: draft.location?.lng,
                city: draft.location?.city
            };
            const data = await api.getAvailableSlots(params);
            setSlots(data || []);
        } catch (err) {
            console.error('Fetch Slots Error:', err);
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        if (!selectedDate || !selectedSlot) return;
        updateDraft({ bookingDate: selectedDate, timeSlot: selectedSlot });

        // LOGIN GATE
        if (!auth?.token) {
            // Need to implement return path in LoginScreen
            navigation.navigate('Login', { returnTo: 'BookingConfirm' });
            return;
        }

        navigation.navigate('BookingConfirm');
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pick Date & Time</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Date picker */}
                <Text style={styles.sectionLabel}>Select Date</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow}>
                    {DAYS.map((d) => {
                        const iso = d.toISOString().split('T')[0];
                        const active = selectedDate === iso;
                        return (
                            <TouchableOpacity
                                key={iso}
                                style={[styles.dateCard, active && styles.dateCardActive]}
                                onPress={() => setSelectedDate(iso)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.dateDayName, active && styles.dateTextActive]}>{DAY_NAMES[d.getDay()]}</Text>
                                <Text style={[styles.dateNum, active && styles.dateTextActive]}>{d.getDate()}</Text>
                                <Text style={[styles.dateMon, active && styles.dateTextActive]}>{MON_NAMES[d.getMonth()]}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Time slots */}
                <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Select Time</Text>
                {loading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                ) : slots.length > 0 ? (
                    <View style={styles.slotsGrid}>
                        {slots.map((slot) => {
                            const active = selectedSlot === slot.value;
                            return (
                                <TouchableOpacity
                                    key={slot.value}
                                    style={[styles.slotChip, active && styles.slotChipActive]}
                                    onPress={() => setSelectedSlot(slot.value)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.slotText, active && styles.slotTextActive]}>{slot.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : selectedDate ? (
                    <Text style={styles.noSlotsText}>No slots available for this date. Try another date.</Text>
                ) : (
                    <Text style={styles.noSlotsText}>Please select a date first.</Text>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.continueBtn, (!selectedDate || !selectedSlot) && styles.continueBtnDisabled]}
                    onPress={handleContinue}
                    disabled={!selectedDate || !selectedSlot}
                    activeOpacity={0.85}
                >
                    <Text style={styles.continueBtnText}>Continue</Text>
                    <MaterialIcons name="arrow-forward" size={18} color={colors.white} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.white },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
    scroll: { flex: 1, padding: 20 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.gray, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
    dateRow: { marginBottom: 4 },
    dateCard: { width: 60, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: colors.grayBorder, alignItems: 'center', marginRight: 10, gap: 4 },
    dateCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    dateDayName: { fontSize: 11, fontWeight: '700', color: colors.gray },
    dateNum: { fontSize: 22, fontWeight: '800', color: colors.text },
    dateMon: { fontSize: 11, fontWeight: '600', color: colors.gray },
    dateTextActive: { color: colors.white },
    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 24 },
    slotChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: colors.grayBorder },
    slotChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    slotText: { fontSize: 14, fontWeight: '600', color: colors.text },
    slotTextActive: { color: colors.white },
    footer: { padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: colors.grayBorder },
    continueBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    continueBtnDisabled: { backgroundColor: colors.grayBorder },
    continueBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
    noSlotsText: { fontSize: 14, color: colors.gray, textAlign: 'center', marginTop: 20 },
});
