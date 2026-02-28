import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HOURS = [];
for (let h = 0; h < 24; h++) {
    const period = h < 12 ? 'am' : 'pm';
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    HOURS.push(`${String(display).padStart(2, '0')}:00 ${period}`);
}

// ─── Time Picker Modal ────────────────────────────────────────────────────────
function TimePicker({ visible, title, value, onSelect, onClose }) {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={tm.overlay}>
                <View style={tm.sheet}>
                    <View style={tm.handle} />
                    <Text style={tm.title}>{title}</Text>
                    <ScrollView>
                        {HOURS.map((h) => (
                            <TouchableOpacity
                                key={h}
                                style={[tm.option, h === value && tm.optionActive]}
                                onPress={() => { onSelect(h); onClose(); }}
                            >
                                <Text style={[tm.optionText, h === value && tm.optionTextActive]}>{h}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={tm.cancelBtn} onPress={onClose}>
                        <Text style={tm.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const tm = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, maxHeight: '60%',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 16 },
    title: { fontSize: 18, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 12 },
    option: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    optionActive: { backgroundColor: colors.primaryLight },
    optionText: { fontSize: 16, color: '#1E293B', textAlign: 'center' },
    optionTextActive: { color: colors.primary, fontWeight: '700' },
    cancelBtn: { marginTop: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center' },
    cancelText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
});

// ─── Time Box ────────────────────────────────────────────────────────────────
function TimeBox({ value, onPress }) {
    return (
        <TouchableOpacity style={styles.timeBox} onPress={onPress}>
            <Text style={styles.timeValue}>{value}</Text>
            <Ionicons name="time-outline" size={18} color="#64748B" />
        </TouchableOpacity>
    );
}

// ─── Radio Button ─────────────────────────────────────────────────────────────
function RadioBtn({ selected, onPress, label }) {
    return (
        <TouchableOpacity style={styles.radioOption} onPress={onPress}>
            <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
                {selected && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SalonWorkingHoursScreen({ navigation, route }) {
    const { formData, updateFormData } = useOnboarding();
    const isEdit = route.params?.isEdit;
    const [openTime, setOpenTime] = useState('09:00 am');
    const [closeTime, setCloseTime] = useState('07:00 pm');
    const [selectedDays, setSelectedDays] = useState(
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    );
    const [breakEnabled, setBreakEnabled] = useState(true);
    const [breakStart, setBreakStart] = useState('01:00 pm');
    const [breakEnd, setBreakEnd] = useState('02:00 pm');

    // hydration
    useEffect(() => {
        if (formData.salonWorkingHours) {
            const swh = formData.salonWorkingHours;
            setOpenTime(swh.openTime || '09:00 am');
            setCloseTime(swh.closeTime || '07:00 pm');
            setSelectedDays(swh.days || []);
            setBreakEnabled(swh.breakEnabled);
            setBreakStart(swh.breakStart || '01:00 pm');
            setBreakEnd(swh.breakEnd || '02:00 pm');
        }
    }, [formData]);

    const handleContinue = async () => {
        const data = {
            openTime,
            closeTime,
            days: selectedDays,
            breakEnabled,
            breakStart,
            breakEnd
        };
        await updateFormData('salonWorkingHours', data);

        if (isEdit) {
            navigation.goBack();
            return;
        }

        await updateFormData('lastScreen', 'SalonServiceSetup');
        navigation.navigate('SalonServiceSetup');
    };

    // picker state
    const [openPicker, setOpenPicker] = useState(null); // 'open' | 'close' | 'bstart' | 'bend'

    const toggleDay = (day) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Business Hours</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Business Hours */}
                <Text style={styles.sectionTitle}>My Business Hours</Text>

                <View style={styles.hoursRow}>
                    <Text style={styles.openLabel}>Opening</Text>
                    <TimeBox value={openTime} onPress={() => setOpenPicker('open')} />
                    <Text style={styles.ampersand}>&</Text>
                </View>
                <View style={styles.hoursRow}>
                    <Text style={styles.closeLabel}>Closing</Text>
                    <TimeBox value={closeTime} onPress={() => setOpenPicker('close')} />
                </View>

                {/* Working Days */}
                <Text style={[styles.sectionTitle, { marginTop: 28 }]}>I am working on</Text>
                <View style={styles.daysGrid}>
                    {DAYS.map((day) => {
                        const active = selectedDays.includes(day);
                        return (
                            <TouchableOpacity
                                key={day}
                                style={[styles.dayChip, active && styles.dayChipActive]}
                                onPress={() => toggleDay(day)}
                                activeOpacity={0.8}
                            >
                                {active && <Text style={styles.dayCheck}>✓ </Text>}
                                <Text style={[styles.dayText, active && styles.dayTextActive]}>{day}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Break Time */}
                <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Add break time</Text>
                <View style={styles.radioRow}>
                    <RadioBtn
                        selected={breakEnabled}
                        onPress={() => setBreakEnabled(true)}
                        label="Yes"
                    />
                    <RadioBtn
                        selected={!breakEnabled}
                        onPress={() => setBreakEnabled(false)}
                        label="No"
                    />
                </View>

                {breakEnabled && (
                    <View>
                        <View style={styles.hoursRow}>
                            <Text style={styles.openLabel}>Start</Text>
                            <TimeBox value={breakStart} onPress={() => setOpenPicker('bstart')} />
                            <Text style={styles.ampersand}>&</Text>
                        </View>
                        <View style={styles.hoursRow}>
                            <Text style={styles.closeLabel}>End</Text>
                            <TimeBox value={breakEnd} onPress={() => setOpenPicker('bend')} />
                            <Text style={styles.timingLabel}>Timing.</Text>
                        </View>
                    </View>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>

            {/* Continue */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={handleContinue}
                >
                    <Text style={styles.continueBtnText}>{isEdit ? 'Update & Save' : 'Continue'}</Text>
                </TouchableOpacity>
            </View>

            {/* Time Pickers */}
            <TimePicker
                visible={openPicker === 'open'}
                title="Opening Time"
                value={openTime}
                onSelect={setOpenTime}
                onClose={() => setOpenPicker(null)}
            />
            <TimePicker
                visible={openPicker === 'close'}
                title="Closing Time"
                value={closeTime}
                onSelect={setCloseTime}
                onClose={() => setOpenPicker(null)}
            />
            <TimePicker
                visible={openPicker === 'bstart'}
                title="Break Start"
                value={breakStart}
                onSelect={setBreakStart}
                onClose={() => setOpenPicker(null)}
            />
            <TimePicker
                visible={openPicker === 'bend'}
                title="Break End"
                value={breakEnd}
                onSelect={setBreakEnd}
                onClose={() => setOpenPicker(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 14,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 8,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 19, fontWeight: '700', color: '#1E293B' },
    content: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 20 },

    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 16 },

    // Hours
    hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    openLabel: { width: 68, fontSize: 17, fontWeight: '700', color: '#16A34A' },  // green
    closeLabel: { width: 68, fontSize: 17, fontWeight: '700', color: '#EF4444' }, // red
    ampersand: { fontSize: 18, color: '#94A3B8', marginLeft: 4 },
    timingLabel: { fontSize: 17, color: '#1E293B', fontWeight: '500' },
    timeBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 12,
        minWidth: 140,
    },
    timeValue: { fontSize: 15, color: '#1E293B', flex: 1 },

    // Days grid – two chips per row
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    dayChip: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12, paddingHorizontal: 18,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    dayChipActive: { backgroundColor: colors.primary },
    dayCheck: { fontSize: 14, color: '#FFF', fontWeight: '700' },
    dayText: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
    dayTextActive: { color: '#FFF' },

    // Radio
    radioRow: { flexDirection: 'row', gap: 24, alignItems: 'center', marginBottom: 16 },
    radioOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    radioOuter: {
        width: 24, height: 24, borderRadius: 12,
        borderWidth: 2, borderColor: '#D1D5DB',
        justifyContent: 'center', alignItems: 'center',
    },
    radioOuterActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
    radioLabel: { fontSize: 16, color: '#1E293B' },

    // Footer
    footer: {},
    continueBtn: {
        backgroundColor: '#1E293B',
        paddingVertical: 18,
        alignItems: 'center',
    },
    continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
